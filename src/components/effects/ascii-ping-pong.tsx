import { useEffect, useRef, useState } from 'react'

type AsciiPingPongProps = {
  width?: number
  speed?: number
  bounce?: boolean
  symbolSet?: string
  className?: string
}

export default function AsciiPingPong({ width = 5, speed = 120, bounce = true, symbolSet = '[*-]', className = '' }: AsciiPingPongProps) {
  const [position, setPosition] = useState(0)
  const directionRef = useRef(1)

  const left = symbolSet[0] ?? '['
  const active = symbolSet[1] ?? '*'
  const inactive = symbolSet[2] ?? '-'
  const right = symbolSet[3] ?? ']'

  useEffect(() => {
    const id = setInterval(() => {
      setPosition((prev) => {
        if (!bounce) {
          return (prev + 1) % width
        }

        let next = prev + directionRef.current

        if (next >= width) {
          directionRef.current = -1
          next = width - 2
        } else if (next < 0) {
          directionRef.current = 1
          next = 1
        }

        return next
      })
    }, speed)

    return () => clearInterval(id)
  }, [width, speed, bounce])

  const content = Array.from({ length: width })
    .map((_, i) => (i === position ? active : inactive))
    .join('')

  return (
    <span className={className}>
      {left}
      {content}
      {right}
    </span>
  )
}
