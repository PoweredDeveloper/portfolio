import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { useHeadings } from './headings'

export type { TocItem } from './headings'

interface GuideTocProps {
  className?: string
}

export function GuideToc({ className }: GuideTocProps) {
  const { headings: items } = useHeadings()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    const ids = items.map((i) => i.id)
    const updateActive = () => {
      const scrollY = window.scrollY + 120
      let active: string | null = null
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top + window.scrollY <= scrollY) {
          active = ids[i]
          break
        }
      }
      if (!active && ids.length > 0) active = ids[0]
      setActiveId(active)
    }
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    return () => window.removeEventListener('scroll', updateActive)
  }, [items])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <aside className={cn('my-8 shrink-0', className)}>
      <nav className="sticky top-24 space-y-3" aria-label="On this page">
        <h2 className="text-foreground text-sm font-medium">On this page</h2>
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12 + 8}px` }} className={cn('border-l-2 border-transparent', activeId === item.id ? 'border-foreground text-foreground' : '')}>
              <a href={`#${item.id}`} className={cn('hover:text-foreground block py-0.5', activeId === item.id ? 'text-foreground' : 'text-pale hover:underline')}>
                {item.text}
              </a>
            </li>
          ))}
        </ul>
        <div className="border-pale/20 mt-4 border-t pt-3">
          <button type="button" onClick={scrollToTop} className="text-pale hover:text-foreground flex cursor-pointer items-center gap-1.5 text-xs hover:underline">
            Scroll to top
          </button>
        </div>
      </nav>
    </aside>
  )
}
