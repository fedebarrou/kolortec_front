import { Component } from 'react'

/**
 * SectionErrorBoundary — aísla el crash de UNA sección de la landing para que no
 * tumbe TODO el árbol React (pantalla blanca). Si una sección lanza, se loguea a
 * consola y se rendea el fallback (por defecto: nada) mientras el resto de la web
 * sigue viva.
 *
 * Uso: <SectionErrorBoundary name="Hero"><HeroSection .../></SectionErrorBoundary>
 */
class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(`[landing] sección "${this.props.name || '?'}" falló y se aisló:`, error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

export default SectionErrorBoundary
