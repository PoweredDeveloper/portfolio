import AsciiImage from '@/components/AsciiImage'
import ThemeToggle from '@/components/ThemeSwitcher'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: Portfolio,
})

const IMAGES = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function Portfolio() {
  const [image, setImage] = useState<string>('1.jpeg')

  useEffect(() => {
    setInterval(() => {
      setImage(`${IMAGES[Math.round(Math.random() * (IMAGES.length - 1))]}.jpeg`)
    }, 5000)
  }, [])

  return (
    <>
      <div className="flex h-screen w-full">
        <nav className="flex h-screen w-min flex-col items-center justify-between py-12 text-2xl font-black">
          <div className="flex h-2/3 w-min flex-col items-center justify-around gap-6">
            <Link className="rotate-90" to={'/portfolio'}>
              PORTFOLIO
            </Link>
            <Link className="rotate-90" to={'/'}>
              PROJECTS
            </Link>
            <Link className="rotate-90" to={'/'}>
              MUSIC
            </Link>
          </div>
          <ThemeToggle />
        </nav>
        <main className="grow">
          <AsciiImage
            imageUrl={image}
            options={{
              display: {
                rows: 128,
                fontSize: 6,
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
        </main>
      </div>
    </>
  )
}
