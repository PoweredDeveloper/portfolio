import * as React from 'react'

export interface TocItem {
  level: number
  text: string
  id: string
}

interface HeadingsContextValue {
  headings: TocItem[]
  register: (item: TocItem) => void
}

const HeadingsContext = React.createContext<HeadingsContextValue | null>(null)

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

export function useHeadings() {
  const ctx = React.useContext(HeadingsContext)
  return ctx ?? { headings: [], register: () => {} }
}
