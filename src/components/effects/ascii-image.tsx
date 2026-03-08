import { cn } from '@/lib/cn'
import { useEffect, useRef } from 'react'

// --- Types ---

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
  /** Tailwind classes for main/final text (e.g. "text-foreground font-semibold") */
  textClassName?: string
  /** Tailwind classes for messy letters that will become spaces (not used for positions that will show text) */
  messyClassName?: string
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
  /** Fraction of pixels to change each interval, image mode only (0-1, default: 0.01) */
  imageChangeFraction?: number
  /** Milliseconds between changes (default: 2000) */
  interval?: number
  /** Fade spawned chars in/out with opacity (text mode only, default: false) */
  fade?: boolean
}

export interface AsciiImageOptions {
  display?: DisplayOptions
  imageProcessing?: ImageProcessingOptions
  animation?: AnimationOptions
  idle?: IdleAnimationOptions
}

interface AsciiImageProps {
  imageUrl?: string
  text?: string
  options?: AsciiImageOptions
  className?: string
}

// --- Constants ---

const DEFAULT_CHARSET = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~i!lI;:,"^`\'. '
const SYMBOL_ASPECT_RATIO = 5 / 3 // chars are wider than tall
const TEXT_IDLE_MIN_LIFETIME_MS = 400
const TEXT_IDLE_MAX_LIFETIME_MS = 1200
const TEXT_IDLE_FADE_DURATION_MS = 80

// --- Helpers ---

/** Trims only leading/trailing newlines; preserves spaces for ASCII art alignment. */
function trimNewlines(text: string): string {
  return text.replace(/^\n+/, '').replace(/\n+$/, '')
}

function textToAsciiGrid(text: string): string[][] {
  return text.split('\n').map((line) => [...line])
}

/** Builds a grid filled with fillChar, with the text centered inside it. */
function createCenteredTextGrid(text: string, cols: number, rows: number, fillChar: string = ' '): string[][] {
  const textLines = trimNewlines(text).split('\n')
  const grid: string[][] = []
  for (let y = 0; y < rows; y++) {
    grid[y] = []
    for (let x = 0; x < cols; x++) {
      grid[y][x] = fillChar
    }
  }
  const startRow = Math.max(0, Math.floor((rows - textLines.length) / 2))
  for (let i = 0; i < textLines.length && startRow + i < rows; i++) {
    const line = textLines[i]
    const startCol = Math.max(0, Math.floor((cols - line.length) / 2))
    for (let j = 0; j < line.length && startCol + j < cols; j++) {
      grid[startRow + i][startCol + j] = line[j]
    }
  }
  return grid
}

export default function AsciiImage({ imageUrl, text, options = {}, className }: AsciiImageProps) {
  const { scale = 1, cols, rows, fontSize = 12, textClassName = 'text-foreground', messyClassName = 'text-pale font-light', charset = DEFAULT_CHARSET } = options.display ?? {}
  const { contrast = 1, sharpness = 1 } = options.imageProcessing ?? {}
  const { animated = false, duration: animationDuration = 3000, speedFunction: revealSpeedFunction, revealMode = 'messy', messinessThreshold = 0.3 } = options.animation ?? {}
  const { enabled: idleAnimation = false, imageChangeFraction: idleImageChangeFraction = 0.01, interval: idleInterval = 2000, fade: idleFade = false } = options.idle ?? {}

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
  const idleSpawnDataRef = useRef<Map<string, { spawnAt: number; expiresAt: number; char: string }>>(new Map())
  const idleAnimationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // --- Setup ---
    let cancelled = false

    const hasImage = Boolean(imageUrl)
    const hasText = Boolean(text && trimNewlines(text).length > 0)
    if (!containerRef.current || (hasImage && hasText) || (!hasImage && !hasText)) return

    const charSet = charset

    const getRandomChar = () => charSet[Math.floor(Math.random() * charSet.length)]

    // Ease-out curve so the reveal feels natural (fast start, slow finish)
    const defaultRevealSpeed = (progress: number) => {
      return 1 - Math.pow(1 - progress, 3)
    }

    const getRevealProgress = (elapsed: number): number => {
      const progress = Math.min(elapsed / animationDuration, 1)
      return revealSpeedFunction ? revealSpeedFunction(progress) : defaultRevealSpeed(progress)
    }

    // Picks a char with similar brightness for the "messy" effect – wrong char, same visual weight
    const getSimilarBrightnessChar = (targetBrightness: number, charSet: string, threshold: number): string => {
      const targetIndex = Math.floor(targetBrightness * (charSet.length - 1))

      if (threshold === 0) {
        return charSet[targetIndex]
      }

      if (threshold >= 1) return charSet[Math.floor(Math.random() * charSet.length)]

      // Pick from a range around the target – lower threshold = closer to correct
      const maxRange = charSet.length / 2
      const range = Math.max(1, Math.floor(maxRange * threshold))

      const minIndex = Math.max(0, targetIndex - range)
      const maxIndex = Math.min(charSet.length - 1, targetIndex + range)
      const randomIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex

      return charSet[randomIndex]
    }

    const applyContrast = (value: number, contrastValue: number) => Math.max(0, Math.min(1, (value - 0.5) * contrastValue + 0.5))

    const applySharpness = (value: number, neighbors: number[], sharpnessValue: number): number => {
      if (sharpnessValue === 1 || neighbors.length === 0) return value

      const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length
      const diff = value - avg

      return Math.max(0, Math.min(1, value + diff * (sharpnessValue - 1)))
    }

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

          if (a === 0) {
            ascii[y][x] = ' '
            messy[y][x] = ' '
            brightness[y][x] = 0
            continue
          }

          let gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255

          // Neighbors for sharpness
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

          gray = applySharpness(gray, neighbors, sharpnessValue)
          gray = applyContrast(gray, contrastValue)
          brightness[y][x] = gray

          // Map brightness → char
          const charIndex = Math.floor(gray * (charSet.length - 1))
          const char = charSet[charIndex]
          ascii[y][x] = char
          const messyChar = getSimilarBrightnessChar(gray, charSet, messinessValue)
          messy[y][x] = messyChar
        }
      }

      return { ascii, messy, brightness }
    }

    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const escapeAttr = (s: string) => s.replace(/"/g, '&quot;')

    const renderAscii = (progress: number, useCurrentDisplay = false) => {
      if (!preRef.current || asciiDataRef.current.length === 0) return

      let output = ''

      for (let y = 0; y < asciiDataRef.current.length; y++) {
        for (let x = 0; x < asciiDataRef.current[y].length; x++) {
          let char: string

          if (useCurrentDisplay && currentDisplayRef.current[y]?.[x]) {
            char = currentDisplayRef.current[y][x]
          } else {
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

    // Image mode idle: subtly mutate random pixels to similar chars
    const startIdleAnimation = (charSet: string) => {
      if (!idleAnimation) return

      idleIntervalRef.current = window.setInterval(() => {
        if (!preRef.current || asciiDataRef.current.length === 0) return

        const totalPixels = asciiDataRef.current.length * asciiDataRef.current[0].length
        const pixelsToChange = Math.max(1, Math.floor(totalPixels * idleImageChangeFraction))

        const positions: Array<{ x: number; y: number }> = []
        for (let y = 0; y < asciiDataRef.current.length; y++) {
          for (let x = 0; x < asciiDataRef.current[y].length; x++) {
            const brightness = brightnessDataRef.current[y]?.[x]
            if (brightness !== undefined && brightness > 0 && brightness < 0.95) {
              positions.push({ x, y })
            }
          }
        }

        for (let i = 0; i < pixelsToChange && positions.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * positions.length)
          const { x, y } = positions.splice(randomIndex, 1)[0]

          const brightness = brightnessDataRef.current[y][x]
          const similarChar = getSimilarBrightnessChar(brightness, charSet, 0.15)
          currentDisplayRef.current[y][x] = similarChar
        }

        renderAscii(1, true)
      }, idleInterval)
    }

    // Text mode idle: spawn one char in a random space, keep it for a bit, then remove it
    const startIdleAnimationText = () => {
      if (!idleAnimation) return

      idleSpawnDataRef.current.clear()
      const ascii = asciiDataRef.current
      const spacePositions: string[] = []
      for (let y = 0; y < ascii.length; y++) {
        for (let x = 0; x < ascii[y].length; x++) {
          if (ascii[y]?.[x] === ' ') spacePositions.push(`${y},${x}`)
        }
      }
      if (spacePositions.length === 0) return

      const spawnData = idleSpawnDataRef.current

      const doRender = (now: number) => {
        if (!preRef.current || asciiDataRef.current.length === 0) return
        if (idleFade) {
          for (const [pos, { expiresAt }] of spawnData) {
            if (now >= expiresAt) spawnData.delete(pos)
          }
        }
        const fadeOpts = idleFade ? { now, fadeInDuration: TEXT_IDLE_FADE_DURATION_MS, fadeOutDuration: TEXT_IDLE_FADE_DURATION_MS } : undefined
        renderAsciiText(1, false, spawnData, fadeOpts)
      }

      idleIntervalRef.current = window.setInterval(() => {
        if (!preRef.current || asciiDataRef.current.length === 0) return

        const now = performance.now()

        if (!idleFade) {
          for (const [pos, { expiresAt }] of spawnData) {
            if (now >= expiresAt) spawnData.delete(pos)
          }
        }

        const available = spacePositions.filter((p) => !spawnData.has(p))
        if (available.length > 0) {
          const idx = Math.floor(Math.random() * available.length)
          const pos = available[idx]
          const lifetime = TEXT_IDLE_MIN_LIFETIME_MS + Math.random() * (TEXT_IDLE_MAX_LIFETIME_MS - TEXT_IDLE_MIN_LIFETIME_MS)
          spawnData.set(pos, { spawnAt: now, expiresAt: now + lifetime, char: getRandomChar() })
        }

        if (!idleFade) doRender(now)
      }, idleInterval)

      if (idleFade) {
        const FADE_RENDER_INTERVAL_MS = 80
        let lastRender = 0
        const rafLoop = (now: number) => {
          if (now - lastRender >= FADE_RENDER_INTERVAL_MS) {
            lastRender = now
            doRender(now)
          }
          idleAnimationFrameRef.current = requestAnimationFrame(rafLoop)
        }
        idleAnimationFrameRef.current = requestAnimationFrame(rafLoop)
      }
    }

    // Renders text mode. idleSpawnData = twinkling chars in space slots; idleFadeOpts = opacity fade in/out
    const renderAsciiText = (progress: number, shuffleRandom: boolean, idleSpawnData?: Map<string, { spawnAt: number; expiresAt: number; char: string }>, idleFadeOpts?: { now: number; fadeInDuration: number; fadeOutDuration: number }) => {
      if (!preRef.current || asciiDataRef.current.length === 0) return

      const ascii = asciiDataRef.current
      const revealTimes = revealTimesRef.current
      const spawnData = idleSpawnData ?? null

      const getSpawnOpacity = (pos: string): number | null => {
        if (!spawnData || !idleFadeOpts) return null
        const data = spawnData.get(pos)
        if (!data) return null
        const { now, fadeInDuration, fadeOutDuration } = idleFadeOpts
        const { spawnAt, expiresAt } = data
        if (now < spawnAt) return 0
        if (now >= expiresAt) return 0
        if (now < spawnAt + fadeInDuration) return (now - spawnAt) / fadeInDuration
        if (now > expiresAt - fadeOutDuration) return (expiresAt - now) / fadeOutDuration
        return 1
      }

      const spanFor = (char: string, cls: string, pos: string) => {
        const opacity = getSpawnOpacity(pos)
        const style = opacity !== null && opacity < 1 ? ` style="opacity:${opacity}"` : ''
        return `<span class="${escapeAttr(cls)}"${style}>${escapeHtml(char)}</span>`
      }

      if (revealMode === 'empty') {
        let html = ''
        for (let y = 0; y < ascii.length; y++) {
          for (let x = 0; x < ascii[y].length; x++) {
            const correctChar = ascii[y]?.[x] ?? ' '
            const revealTime = revealTimes[y]?.[x] ?? 1
            const isRevealed = progress >= revealTime
            let char: string
            let cls: string
            if (spawnData) {
              const entry = spawnData.get(`${y},${x}`)
              char = correctChar !== ' ' ? correctChar : entry ? entry.char : ' '
              cls = correctChar !== ' ' ? textClassName : messyClassName
            } else {
              char = isRevealed ? correctChar : shuffleRandom ? getRandomChar() : ' '
              cls = isRevealed ? textClassName : messyClassName
            }
            html += spanFor(char, cls, `${y},${x}`)
          }
          html += '\n'
        }
        preRef.current.innerHTML = html
      } else {
        const fillEnd = 0.15 // first 15% of progress = fill phase
        const revealProgress = progress <= fillEnd ? 0 : (progress - fillEnd) / (1 - fillEnd)
        const messyChar = (y: number, x: number) => initialMessyDataRef.current[y]?.[x] ?? ' '

        let html = ''
        for (let y = 0; y < ascii.length; y++) {
          for (let x = 0; x < ascii[y].length; x++) {
            const correctChar = ascii[y]?.[x] ?? ' '
            const revealTime = revealTimes[y]?.[x] ?? 1
            const isRevealed = revealProgress >= revealTime
            let char: string
            let cls: string
            if (spawnData) {
              const entry = spawnData.get(`${y},${x}`)
              char = correctChar !== ' ' ? correctChar : entry ? entry.char : ' '
              cls = correctChar !== ' ' ? textClassName : messyClassName
            } else {
              char = isRevealed ? correctChar : messyChar(y, x)
              cls = correctChar !== ' ' ? textClassName : isRevealed ? textClassName : messyClassName
            }
            html += spanFor(char, cls, `${y},${x}`)
          }
          html += '\n'
        }
        preRef.current.innerHTML = html
      }
    }

    // --- Text mode ---
    if (hasText) {
      const runTextAnimation = (ascii: string[][]) => {
        asciiDataRef.current = ascii
        currentDisplayRef.current = ascii.map((row) => [...row])
        initialMessyDataRef.current = ascii.map((row) => row.map(() => getRandomChar()))
        brightnessDataRef.current = ascii.map((row) => row.map((ch) => (ch === ' ' ? 0 : Math.min(1, ch.charCodeAt(0) / 255))))
        revealTimesRef.current = ascii.map((row) => row.map(() => Math.random()))

        if (preRef.current) {
          preRef.current.style.fontSize = `${fontSize}px`
          preRef.current.style.fontFamily = 'var(--font-ibm-mono), monospace'
          preRef.current.style.lineHeight = '1em'
          preRef.current.style.margin = '0'
          preRef.current.style.padding = '0'
          preRef.current.style.whiteSpace = 'pre'
          preRef.current.style.letterSpacing = '0'
        }

        const animateText = (startTime: number) => {
          const elapsed = performance.now() - startTime
          const progress = getRevealProgress(elapsed)
          renderAsciiText(progress, true)

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(() => animateText(startTime))
          } else {
            renderAsciiText(1, false)
            if (idleAnimation) startIdleAnimationText()
          }
        }

        if (animated) {
          renderAsciiText(0, true)
          animateText(performance.now())
        } else {
          renderAsciiText(1, false)
          if (idleAnimation) startIdleAnimationText()
        }
      }

      if (revealMode === 'messy') {
        const el = containerRef.current
        const charWidth = fontSize * 0.6
        const charHeight = fontSize

        const measureAndRun = () => {
          const w = el.offsetWidth
          const h = el.offsetHeight
          if (w <= 0 || h <= 0) return false
          const textLines = trimNewlines(text!).split('\n')
          const minCols = Math.max(...textLines.map((l) => l.length), 1)
          const minRows = textLines.length
          const containerCols = Math.max(1, Math.floor(w / charWidth))
          const containerRows = Math.max(1, Math.floor(h / charHeight))
          const cols = Math.max(minCols, containerCols)
          const rows = Math.max(minRows, containerRows)
          const ascii = createCenteredTextGrid(trimNewlines(text!), cols, rows, ' ')
          runTextAnimation(ascii)
          return true
        }

        if (measureAndRun()) {
          return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (idleAnimationFrameRef.current) cancelAnimationFrame(idleAnimationFrameRef.current)
            if (idleIntervalRef.current) clearInterval(idleIntervalRef.current)
          }
        }

        const ro = new ResizeObserver(() => {
          if (measureAndRun()) ro.disconnect()
        })
        ro.observe(el)

        const fallback = setTimeout(() => {
          if (el.offsetWidth <= 0 || el.offsetHeight <= 0) {
            const ascii = textToAsciiGrid(trimNewlines(text!))
            if (ascii.length > 0) {
              const cols = Math.max(...ascii.map((r) => r.length), 1)
              runTextAnimation(createCenteredTextGrid(trimNewlines(text!), cols, ascii.length))
            }
          }
        }, 100)

        return () => {
          clearTimeout(fallback)
          ro.disconnect()
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
          if (idleAnimationFrameRef.current) cancelAnimationFrame(idleAnimationFrameRef.current)
          if (idleIntervalRef.current) clearInterval(idleIntervalRef.current)
        }
      }

      // Empty mode: grid matches text size
      const ascii = textToAsciiGrid(trimNewlines(text!))
      if (ascii.length === 0) return

      runTextAnimation(ascii)

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (idleAnimationFrameRef.current) cancelAnimationFrame(idleAnimationFrameRef.current)
        if (idleIntervalRef.current) clearInterval(idleIntervalRef.current)
      }
    }

    // --- Image mode ---
    if (!imageUrl) return

    const animate = (startTime: number) => {
      const elapsed = performance.now() - startTime
      const progress = getRevealProgress(elapsed)

      renderAscii(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(() => animate(startTime))
      } else {
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
      if (cancelled) return
      const imageAspectRatio = img.width / img.height

      let targetCols: number
      let targetRows: number

      if (cols !== undefined && rows !== undefined) {
        targetCols = cols
        targetRows = rows
      } else if (cols !== undefined) {
        targetCols = cols
        targetRows = Math.round(cols / imageAspectRatio / SYMBOL_ASPECT_RATIO)
      } else if (rows !== undefined) {
        targetRows = rows
        targetCols = Math.round(rows * imageAspectRatio * SYMBOL_ASPECT_RATIO)
      } else {
        targetCols = Math.round(img.width)
        targetRows = Math.round(img.height * SYMBOL_ASPECT_RATIO)
      }

      targetCols = Math.round(targetCols * scale)
      targetRows = Math.round(targetRows * scale)

      if (preRef.current) {
        preRef.current.style.fontSize = `${fontSize}px`
        preRef.current.style.fontFamily = 'var(--font-ibm-mono), monospace'
        preRef.current.style.lineHeight = '1em'
        preRef.current.style.margin = '0'
        preRef.current.style.padding = '0'
        preRef.current.style.whiteSpace = 'pre'
        preRef.current.style.letterSpacing = '0'
      }

      const { ascii, messy, brightness } = convertToAscii(img, targetCols, targetRows, charset, contrast, sharpness, messinessThreshold)
      asciiDataRef.current = ascii
      initialMessyDataRef.current = messy
      brightnessDataRef.current = brightness

      currentDisplayRef.current = ascii.map((row) => [...row])

      // Random reveal order per pixel
      revealTimesRef.current = []
      for (let y = 0; y < ascii.length; y++) {
        revealTimesRef.current[y] = []
        for (let x = 0; x < ascii[y].length; x++) {
          revealTimesRef.current[y][x] = Math.random()
        }
      }

      if (ascii.length > 0) {
        if (animated) {
          renderAscii(0)
          const startTime = performance.now()
          animate(startTime)
        } else {
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

    return () => {
      cancelled = true
      img.src = ''
      img.onload = null
      img.onerror = null
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (idleAnimationFrameRef.current) cancelAnimationFrame(idleAnimationFrameRef.current)
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current)
    }
  }, [
    imageUrl,
    text,
    cols,
    rows,
    scale,
    fontSize,
    textClassName,
    messyClassName,
    charset,
    contrast,
    sharpness,
    animated,
    animationDuration,
    revealSpeedFunction,
    revealMode,
    messinessThreshold,
    idleAnimation,
    idleImageChangeFraction,
    idleInterval,
    idleFade,
  ])

  return (
    <div ref={containerRef} className={cn('flex items-center justify-center overflow-hidden', className ?? 'inline-block max-w-full')}>
      <pre
        ref={preRef}
        className={cn(textClassName, 'overflow-hidden')}
        style={{
          margin: 0,
          padding: 0,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
