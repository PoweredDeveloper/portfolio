import { useState } from 'react'

// Icons
import { LuSun } from 'react-icons/lu'
import { LuMoon } from 'react-icons/lu'

const STORAGE_THEME_KEY = 'theme'

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_THEME_KEY)
  if (stored !== null) return JSON.parse(stored)
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme)

  const handleThemeChange = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(next))
  }

  return (
    <button onClick={handleThemeChange} className="bg-surface hover:bg-surface-2 cursor-pointer rounded-full p-2">
      {isDark ? <LuSun className="size-7" /> : <LuMoon className="size-7" />}
    </button>
  )
}
