import clsx from 'clsx'
import { useState } from 'react'

const STORAGE_THEME_KEY = 'theme'

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_THEME_KEY)
  if (stored !== null) return JSON.parse(stored)
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme)

  const handleThemeChange = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(next))
  }

  return (
    <button onClick={handleThemeChange} className={clsx('group cursor-pointer text-white', className)}>
      [<span className="text-pale group-hover:text-white">{isDark ? 'L' : 'D'}</span>]
    </button>
  )
}
