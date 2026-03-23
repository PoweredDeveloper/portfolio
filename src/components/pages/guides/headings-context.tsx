import * as React from 'react'
import { HeadingsContext } from './headings'
import type { TocItem } from './headings'

export function HeadingsProvider({ children }: { children: React.ReactNode }) {
  const [headings, setHeadings] = React.useState<TocItem[]>([])
  const register = React.useCallback((item: TocItem) => {
    setHeadings((prev) => {
      if (prev.some((h) => h.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])
  const value = React.useMemo(() => ({ headings, register }), [headings, register])
  return <HeadingsContext.Provider value={value}>{children}</HeadingsContext.Provider>
}
