import { useEffect, useRef } from 'react'

// Sonido de "encendido de equipo de iluminación" sintetizado con Web Audio (sin assets):
// click de relé (ruido corto) + hum ascendente (osciladores con batido) + blip agudo. Dura <1s, volumen bajo.
// La autoplay policy exige un gesto previo del usuario (pointerdown/keydown) para que el
// AudioContext quede "running"; sin gesto, play() no suena pero jamás bloquea ni tira error.
export function useLightRigChime() {
  const hasGestureRef = useRef(false)
  const ctxRef = useRef(null)

  useEffect(() => {
    const markGesture = () => {
      hasGestureRef.current = true
      window.removeEventListener('pointerdown', markGesture, true)
      window.removeEventListener('keydown', markGesture, true)
    }
    window.addEventListener('pointerdown', markGesture, { capture: true, passive: true })
    window.addEventListener('keydown', markGesture, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', markGesture, true)
      window.removeEventListener('keydown', markGesture, true)
      if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  const play = async () => {
    if (!hasGestureRef.current) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = ctxRef.current && ctxRef.current.state !== 'closed' ? ctxRef.current : (ctxRef.current = new Ctx())
      if (ctx.state !== 'running') await ctx.resume()
      if (ctx.state !== 'running') return

      const now = ctx.currentTime
      const master = ctx.createGain()
      master.gain.value = 0.15
      master.connect(ctx.destination)

      // 1) Click de relé: ráfaga de ruido blanco de ~12ms filtrada en agudos.
      const clickLen = Math.max(1, Math.floor(ctx.sampleRate * 0.012))
      const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate)
      const clickData = clickBuf.getChannelData(0)
      for (let i = 0; i < clickLen; i++) clickData[i] = Math.random() * 2 - 1
      const click = ctx.createBufferSource()
      click.buffer = clickBuf
      const clickHp = ctx.createBiquadFilter()
      clickHp.type = 'highpass'
      clickHp.frequency.value = 1800
      const clickGain = ctx.createGain()
      clickGain.gain.setValueAtTime(0.9, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      click.connect(clickHp).connect(clickGain).connect(master)
      click.start(now)

      // 2) Hum ascendente: dos senos casi al unísono (batido) que "abren" con un lowpass.
      const oscA = ctx.createOscillator()
      const oscB = ctx.createOscillator()
      oscA.type = 'sine'
      oscB.type = 'sine'
      oscA.frequency.value = 110
      oscB.frequency.value = 112
      const humLp = ctx.createBiquadFilter()
      humLp.type = 'lowpass'
      humLp.frequency.setValueAtTime(200, now + 0.05)
      humLp.frequency.linearRampToValueAtTime(1400, now + 0.55)
      const humGain = ctx.createGain()
      humGain.gain.setValueAtTime(0, now)
      humGain.gain.linearRampToValueAtTime(0.5, now + 0.35)
      humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
      oscA.connect(humLp)
      oscB.connect(humLp)
      humLp.connect(humGain).connect(master)
      oscA.start(now)
      oscB.start(now)

      // 3) Blip de confirmación: subida rápida de octava, bien corta.
      const blip = ctx.createOscillator()
      blip.type = 'sine'
      blip.frequency.setValueAtTime(880, now + 0.4)
      blip.frequency.exponentialRampToValueAtTime(1760, now + 0.5)
      const blipGain = ctx.createGain()
      blipGain.gain.setValueAtTime(0, now + 0.4)
      blipGain.gain.linearRampToValueAtTime(0.08, now + 0.43)
      blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      blip.connect(blipGain).connect(master)
      blip.start(now + 0.4)

      const end = now + 1.0
      click.stop(end)
      oscA.stop(end)
      oscB.stop(end)
      blip.stop(end)
      // Suena una sola vez por sesión: liberamos el contexto al terminar.
      oscA.onended = () => {
        if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close().catch(() => {})
        ctxRef.current = null
      }
    } catch {
      // El audio nunca debe romper la UI.
    }
  }

  return play
}

export default useLightRigChime
