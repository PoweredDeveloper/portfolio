import { useRef, useEffect } from 'react'

interface BackgroundNoiseProps {
  /** Opacity of the noise layer (0–255). Lower = subtler. */
  opacity?: number
  /** Size of the noise tile in pixels. Smaller = finer grain (e.g. 32), larger = chunkier (e.g. 128). */
  tileSize?: number
  /** Each noise pixel covers NxN screen pixels. 1 = native, 3 = each grain is 3x3 px. */
  pixelSize?: number
  /** Animate like TV static. If false, noise is static. */
  animated?: boolean
  /** When animated: only redraw every N frames. Higher = less CPU (e.g. 2 = 30fps). */
  frameSkip?: number
}

const DEFAULT_TILE_SIZE = 64

const BackgroundNoise = ({ opacity = 18, tileSize = DEFAULT_TILE_SIZE, pixelSize = 3, animated = true, frameSkip = 2 }: BackgroundNoiseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const tile = document.createElement('canvas')
    tile.width = tileSize
    tile.height = tileSize
    const tileCtx = tile.getContext('2d')
    if (!tileCtx) return

    const tileImageData = tileCtx.createImageData(tileSize, tileSize)
    const buf = tileImageData.data

    const generateNoise = () => {
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 170 + 43) | 0
        buf[i] = v
        buf[i + 1] = v
        buf[i + 2] = v
        buf[i + 3] = opacity
      }
      tileCtx.putImageData(tileImageData, 0, 0)
    }

    const resize = () => {
      const scale = Math.max(1, Math.round(pixelSize))
      canvas.width = Math.ceil(window.innerWidth / scale)
      canvas.height = Math.ceil(window.innerHeight / scale)
    }

    const draw = () => {
      if (animated) generateNoise()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const pattern = ctx.createPattern(tile, 'repeat')
      if (!pattern) return
      ctx.save()
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    resize()
    generateNoise()
    draw()

    let rafId: number
    let frame = 0

    if (animated) {
      const loop = () => {
        if (frame % frameSkip === 0) draw()
        frame++
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    }

    const onResize = () => {
      resize()
      if (!animated) draw()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (animated) cancelAnimationFrame(rafId)
    }
  }, [opacity, tileSize, pixelSize, animated, frameSkip])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-screen w-screen" style={{ imageRendering: 'pixelated' }} />
}

export default BackgroundNoise
