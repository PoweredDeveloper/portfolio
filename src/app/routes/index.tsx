import AsciiImage from '@/components/effects/ascii-image'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: Portfolio,
})

const IMAGES = [1, 3, 4, 5]

export default function Portfolio() {
  const [image, setImage] = useState<string>('1.jpeg')

  useEffect(() => {
    const id = setInterval(() => {
      setImage(`${IMAGES[Math.round(Math.random() * (IMAGES.length - 1))]}.jpeg`)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-full items-center justify-center">
      <AsciiImage
        imageUrl={image}
        options={{
          display: {
            rows: 128,
            fontSize: 6,
            messyClassName: 'text-pale font-extralight',
          },
          animation: {
            animated: true,
            revealMode: 'empty',
            duration: 4000,
          },
          imageProcessing: {
            contrast: 1.5,
            sharpness: 1,
          },
        }}
      />
    </div>
  )
}
