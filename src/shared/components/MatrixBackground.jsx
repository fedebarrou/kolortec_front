import { useEffect, useRef } from 'react'

function MatrixBackground() {
  const canvasRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const layer = layerRef.current

    if (!canvas || !layer) {
      return undefined
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = canvas.getContext('2d', { alpha: true })

    if (!ctx) {
      return undefined
    }

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    let width = 0
    let height = 0
    let animationId = 0

    let particles = []

    const logoImage = new Image()
    let logoLoaded = false

    logoImage.src = '/assets/logo_minimal.png'
    logoImage.onload = () => {
      logoLoaded = true
    }

    const randomParticle = () => {
      const angle = Math.random() * Math.PI * 2
      const speed = prefersReducedMotion
        ? 0.06 + Math.random() * 0.12
        : 0.18 + Math.random() * 0.42
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 28,
        alpha: 0.16 + Math.random() * 0.42,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.01
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(80, Math.floor((width * height) / 11000))
      particles = new Array(count).fill(0).map(randomParticle)
    }

    const render = () => {
      ctx.fillStyle = 'rgba(5,5,5,0.18)'
      ctx.fillRect(0, 0, width, height)

      if (logoLoaded) {
        for (let i = 0; i < particles.length; i += 1) {
          const particle = particles[i]
          particle.x += particle.vx
          particle.y += particle.vy
          particle.rotation += particle.spin

          if (particle.x < -particle.size) particle.x = width + particle.size
          if (particle.x > width + particle.size) particle.x = -particle.size
          if (particle.y < -particle.size) particle.y = height + particle.size
          if (particle.y > height + particle.size) particle.y = -particle.size

          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.globalAlpha = particle.alpha
          ctx.drawImage(
            logoImage,
            -particle.size * 0.5,
            -particle.size * 0.5,
            particle.size,
            particle.size
          )
          ctx.restore()
        }
      }

      ctx.globalAlpha = 1
      animationId = window.requestAnimationFrame(render)
    }

    const updateMaskPosition = (clientX, clientY) => {
      layer.style.setProperty('--mouse-x', `${clientX}px`)
      layer.style.setProperty('--mouse-y', `${clientY}px`)
    }

    const handlePointerMove = (event) => {
      updateMaskPosition(event.clientX, event.clientY)
    }

    const handleTouchMove = (event) => {
      if (event.touches.length === 0) {
        return
      }

      const touch = event.touches[0]
      updateMaskPosition(touch.clientX, touch.clientY)
    }

    resize()
    updateMaskPosition(width * 0.5, height * 0.5)
    animationId = window.requestAnimationFrame(render)

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div ref={layerRef} aria-hidden="true" className="kt-matrix-bg-layer">
      <canvas ref={canvasRef} className="kt-matrix-bg-canvas" />
    </div>
  )
}

export default MatrixBackground
