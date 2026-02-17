import { useRef, useEffect, useCallback } from 'react'

interface BackgroundNoiseProps {
  /** Opacity of the noise layer (0–255). Lower = subtler. */
  opacity?: number
  /** Only redraw every N frames. Higher = less CPU usage. */
  frameSkip?: number
  /** Each noise pixel covers NxN screen pixels. 1 = native, 3 = each grain is 3x3 px. */
  pixelSize?: number
}

const BackgroundNoise = ({ opacity = 18, frameSkip = 3, pixelSize = 3 }: BackgroundNoiseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = ctx.canvas
      const imageData = ctx.createImageData(width, height)
      const buf = imageData.data
      const len = buf.length

      for (let i = 0; i < len; i += 4) {
        const v = (Math.random() * 255) | 0
        buf[i] = v
        buf[i + 1] = v
        buf[i + 2] = v
        buf[i + 3] = opacity
      }

      ctx.putImageData(imageData, 0, 0)
    },
    [opacity],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const scale = Math.max(1, Math.round(pixelSize))
      canvas.width = Math.ceil(window.innerWidth / scale)
      canvas.height = Math.ceil(window.innerHeight / scale)
    }

    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    let rafId: number

    const loop = () => {
      if (frame % frameSkip === 0) draw(ctx)
      frame++
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [draw, frameSkip, pixelSize])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-screen w-screen" style={{ imageRendering: 'pixelated' }} />
}

export default BackgroundNoise
