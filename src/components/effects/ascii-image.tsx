import { useEffect, useRef } from 'react'

export type RevealMode = 'messy' | 'empty'

export interface DisplayOptions {
  /** Scale factor for the final output (default: 1) */
  scale?: number
  /** Number of columns (optional, will calculate rows based on image aspect ratio) */
  cols?: number
  /** Number of rows (optional, will calculate cols based on image aspect ratio) */
  rows?: number
  /** Font size in pixels (default: 12) */
  fontSize?: number
  /** Character set for ASCII conversion (default: reversed standard charset) */
  charset?: string
}

export interface ImageProcessingOptions {
  /** Contrast adjustment (default: 1) */
  contrast?: number
  /** Sharpness adjustment (default: 1) */
  sharpness?: number
}

export interface AnimationOptions {
  /** Enable reveal animation (default: false). If false, shows final result immediately */
  animated?: boolean
  /** Duration of reveal animation in milliseconds (default: 3000) */
  duration?: number
  /** Custom function to control reveal speed curve (0-1 progress -> 0-1 output) */
  speedFunction?: (progress: number) => number
  /** Reveal mode: 'messy' (starts with messy chars) or 'empty' (starts empty) (default: 'messy') */
  revealMode?: RevealMode
  /** Messiness threshold: 0 = no mess, 1 = complete mess (default: 0.3) */
  messinessThreshold?: number
}

export interface IdleAnimationOptions {
  /** Enable idle animation after main animation completes (default: false) */
  enabled?: boolean
  /** Percentage of symbols to change each interval (0-1, default: 0.01 = 1%) */
  changeAmount?: number
  /** Milliseconds between changes (default: 2000) */
  interval?: number
}

export interface AsciiImageOptions {
  display?: DisplayOptions
  imageProcessing?: ImageProcessingOptions
  animation?: AnimationOptions
  idle?: IdleAnimationOptions
}

interface AsciiImageProps {
  imageUrl: string
  options?: AsciiImageOptions
}

const DEFAULT_CHARSET = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~i!lI;:,"^`\'. '

const SYMBOL_ASPECT_RATIO = 5 / 3 // Characters are wider than they are tall

export default function AsciiImage({ imageUrl, options = {} }: AsciiImageProps) {
  // Extract and set defaults for all options
  const { scale = 1, cols, rows, fontSize = 12, charset = DEFAULT_CHARSET } = options.display ?? {}
  const { contrast = 1, sharpness = 1 } = options.imageProcessing ?? {}
  const { animated = false, duration: animationDuration = 3000, speedFunction: revealSpeedFunction, revealMode = 'messy', messinessThreshold = 0.3 } = options.animation ?? {}
  const { enabled: idleAnimation = false, changeAmount: idleChangeAmount = 0.01, interval: idleInterval = 2000 } = options.idle ?? {}

  // Refs for DOM elements and state
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const idleIntervalRef = useRef<number | null>(null)

  // Data storage refs
  const asciiDataRef = useRef<string[][]>([])
  const initialMessyDataRef = useRef<string[][]>([])
  const revealTimesRef = useRef<number[][]>([])
  const currentDisplayRef = useRef<string[][]>([])
  const brightnessDataRef = useRef<number[][]>([])

  useEffect(() => {
    if (!containerRef.current || !imageUrl) return

    // Smooth easing function for reveal animation
    const defaultRevealSpeed = (progress: number) => {
      return 1 - Math.pow(1 - progress, 3)
    }

    const getRevealProgress = (elapsed: number): number => {
      const progress = Math.min(elapsed / animationDuration, 1)
      return revealSpeedFunction ? revealSpeedFunction(progress) : defaultRevealSpeed(progress)
    }

    // Pick a random character that's similar in brightness to the target
    // This creates the "messy" effect - characters look wrong but have similar visual weight
    const getSimilarBrightnessChar = (targetBrightness: number, charSet: string, threshold: number): string => {
      const targetIndex = Math.floor(targetBrightness * (charSet.length - 1))

      if (threshold === 0) {
        return charSet[targetIndex]
      }

      if (threshold >= 1) {
        // Complete randomness - pick from anywhere in the charset
        return charSet[Math.floor(Math.random() * charSet.length)]
      }

      // Pick from a range around the target based on threshold
      // Lower threshold = characters closer to correct
      // Higher threshold = more variation allowed
      const maxRange = charSet.length / 2
      const range = Math.max(1, Math.floor(maxRange * threshold))

      const minIndex = Math.max(0, targetIndex - range)
      const maxIndex = Math.min(charSet.length - 1, targetIndex + range)
      const randomIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex

      return charSet[randomIndex]
    }

    const applyContrast = (value: number, contrastValue: number): number => {
      return Math.max(0, Math.min(1, (value - 0.5) * contrastValue + 0.5))
    }

    // Enhance edges by comparing pixel to its neighbors
    const applySharpness = (value: number, neighbors: number[], sharpnessValue: number): number => {
      if (sharpnessValue === 1 || neighbors.length === 0) return value

      const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length
      const diff = value - avg

      return Math.max(0, Math.min(1, value + diff * (sharpnessValue - 1)))
    }

    // Convert the image to ASCII art
    const convertToAscii = (
      image: HTMLImageElement,
      targetCols: number,
      targetRows: number,
      charSet: string,
      contrastValue: number,
      sharpnessValue: number,
      messinessValue: number,
    ): { ascii: string[][]; messy: string[][]; brightness: number[][] } => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return { ascii: [], messy: [], brightness: [] }

      canvas.width = targetCols
      canvas.height = targetRows
      ctx.drawImage(image, 0, 0, targetCols, targetRows)

      const imageData = ctx.getImageData(0, 0, targetCols, targetRows)
      const data = imageData.data

      const ascii: string[][] = []
      const messy: string[][] = []
      const brightness: number[][] = []

      // Process each pixel and convert to ASCII character
      for (let y = 0; y < targetRows; y++) {
        ascii[y] = []
        messy[y] = []
        brightness[y] = []

        for (let x = 0; x < targetCols; x++) {
          const pixelIndex = (y * targetCols + x) * 4
          const r = data[pixelIndex]
          const g = data[pixelIndex + 1]
          const b = data[pixelIndex + 2]
          const a = data[pixelIndex + 3]

          // Skip transparent pixels
          if (a === 0) {
            ascii[y][x] = ' '
            messy[y][x] = ' '
            brightness[y][x] = 0
            continue
          }

          // Convert RGB to grayscale (using standard luminance weights)
          let gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255

          // Collect neighboring pixels for sharpness calculation
          const neighbors: number[] = []
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue

              const nx = x + dx
              const ny = y + dy

              if (nx >= 0 && nx < targetCols && ny >= 0 && ny < targetRows) {
                const neighborIndex = (ny * targetCols + nx) * 4
                const neighborGray = (0.3 * data[neighborIndex] + 0.6 * data[neighborIndex + 1] + 0.1 * data[neighborIndex + 2]) / 255
                neighbors.push(neighborGray)
              }
            }
          }

          // Apply image processing
          gray = applySharpness(gray, neighbors, sharpnessValue)
          gray = applyContrast(gray, contrastValue)

          // Store brightness for later use (idle animation)
          brightness[y][x] = gray

          // Map brightness to character in charset
          const charIndex = Math.floor(gray * (charSet.length - 1))
          const char = charSet[charIndex]
          ascii[y][x] = char

          // Generate a "messy" version for animation reveal
          const messyChar = getSimilarBrightnessChar(gray, charSet, messinessValue)
          messy[y][x] = messyChar
        }
      }

      return { ascii, messy, brightness }
    }

    // Render the ASCII art to the pre element
    const renderAscii = (progress: number, useCurrentDisplay = false) => {
      if (!preRef.current || asciiDataRef.current.length === 0) return

      let output = ''

      for (let y = 0; y < asciiDataRef.current.length; y++) {
        for (let x = 0; x < asciiDataRef.current[y].length; x++) {
          let char: string

          if (useCurrentDisplay && currentDisplayRef.current[y]?.[x]) {
            // Use the current display state (for idle animation)
            char = currentDisplayRef.current[y][x]
          } else {
            // Use reveal animation logic
            const correctChar = asciiDataRef.current[y]?.[x] || ' '
            const messyChar = initialMessyDataRef.current[y]?.[x] || ' '
            const revealTime = revealTimesRef.current[y]?.[x] ?? 1

            if (revealMode === 'empty') {
              char = progress >= revealTime ? correctChar : ' '
            } else {
              char = progress >= revealTime ? correctChar : messyChar
            }

            // Keep track of what's currently displayed
            if (!currentDisplayRef.current[y]) {
              currentDisplayRef.current[y] = []
            }
            currentDisplayRef.current[y][x] = char
          }

          output += char
        }
        output += '\n'
      }

      preRef.current.textContent = output
    }

    // Start the idle animation that slowly changes random characters
    const startIdleAnimation = (charSet: string) => {
      if (!idleAnimation) return

      idleIntervalRef.current = window.setInterval(() => {
        if (!preRef.current || asciiDataRef.current.length === 0) return

        const totalPixels = asciiDataRef.current.length * asciiDataRef.current[0].length
        const pixelsToChange = Math.max(1, Math.floor(totalPixels * idleChangeAmount))

        // Collect all eligible pixel positions (not empty, not too bright)
        const positions: Array<{ x: number; y: number }> = []
        for (let y = 0; y < asciiDataRef.current.length; y++) {
          for (let x = 0; x < asciiDataRef.current[y].length; x++) {
            const brightness = brightnessDataRef.current[y]?.[x]
            // Skip empty pixels and very bright ones (they stay static)
            if (brightness !== undefined && brightness > 0 && brightness < 0.95) {
              positions.push({ x, y })
            }
          }
        }

        // Randomly pick pixels to change
        for (let i = 0; i < pixelsToChange && positions.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * positions.length)
          const { x, y } = positions.splice(randomIndex, 1)[0]

          const brightness = brightnessDataRef.current[y][x]
          // Change to a similar character (subtle variation)
          const similarChar = getSimilarBrightnessChar(brightness, charSet, 0.15)
          currentDisplayRef.current[y][x] = similarChar
        }

        renderAscii(1, true)
      }, idleInterval)
    }

    // Main animation loop for reveal effect
    const animate = (startTime: number) => {
      const elapsed = performance.now() - startTime
      const progress = getRevealProgress(elapsed)

      renderAscii(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(() => animate(startTime))
      } else {
        // Animation complete - show final state
        renderAscii(1)
        if (idleAnimation) {
          startIdleAnimation(charset)
        }
      }
    }

    // Load the image
    const img = new Image()
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous'
    }

    img.onload = () => {
      const imageAspectRatio = img.width / img.height
      const symbolAspectRatio = SYMBOL_ASPECT_RATIO

      // Calculate target dimensions based on provided options
      let targetCols: number
      let targetRows: number

      if (cols !== undefined && rows !== undefined) {
        targetCols = cols
        targetRows = rows
      } else if (cols !== undefined) {
        // Calculate rows to maintain image aspect ratio
        targetCols = cols
        targetRows = Math.round(cols / imageAspectRatio / symbolAspectRatio)
      } else if (rows !== undefined) {
        // Calculate cols to maintain image aspect ratio
        targetRows = rows
        targetCols = Math.round(rows * imageAspectRatio * symbolAspectRatio)
      } else {
        // Use image dimensions as base
        targetCols = Math.round(img.width)
        targetRows = Math.round(img.height * symbolAspectRatio)
      }

      // Apply scale
      targetCols = Math.round(targetCols * scale)
      targetRows = Math.round(targetRows * scale)

      // Set up the display element
      if (preRef.current) {
        preRef.current.style.fontSize = `${fontSize}px`
        preRef.current.style.fontFamily = 'var(--font-ibm-mono), monospace'
        preRef.current.style.lineHeight = '1em'
        preRef.current.style.margin = '0'
        preRef.current.style.padding = '0'
        preRef.current.style.whiteSpace = 'pre'
        preRef.current.style.letterSpacing = '0'
      }

      // Convert image to ASCII
      const { ascii, messy, brightness } = convertToAscii(img, targetCols, targetRows, charset, contrast, sharpness, messinessThreshold)
      asciiDataRef.current = ascii
      initialMessyDataRef.current = messy
      brightnessDataRef.current = brightness

      // Initialize display with correct characters
      currentDisplayRef.current = ascii.map((row) => [...row])

      // Generate random reveal times for each pixel
      // This creates the random reveal effect
      revealTimesRef.current = []
      for (let y = 0; y < ascii.length; y++) {
        revealTimesRef.current[y] = []
        for (let x = 0; x < ascii[y].length; x++) {
          revealTimesRef.current[y][x] = Math.random()
        }
      }

      // Start rendering
      if (ascii.length > 0) {
        if (animated) {
          renderAscii(0)
          const startTime = performance.now()
          animate(startTime)
        } else {
          // Static mode - show final result immediately
          renderAscii(1)
          if (idleAnimation) {
            startIdleAnimation(charset)
          }
        }
      }
    }

    img.onerror = (error) => {
      console.error('Failed to load image:', imageUrl, error)
      if (preRef.current) {
        preRef.current.textContent = 'Failed to load image ' + imageUrl
      }
    }

    img.src = imageUrl
    imageRef.current = img

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current)
      }
    }
  }, [imageUrl, cols, rows, scale, fontSize, charset, contrast, sharpness, animated, animationDuration, revealSpeedFunction, revealMode, messinessThreshold, idleAnimation, idleChangeAmount, idleInterval])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <pre
        ref={preRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          padding: 0,
          userSelect: 'none',
          pointerEvents: 'none',
          color: 'inherit',
        }}
      />
    </div>
  )
}
