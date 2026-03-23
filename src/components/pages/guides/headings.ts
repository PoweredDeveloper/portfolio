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

export const HeadingsContext = React.createContext<HeadingsContextValue | null>(null)

export function useHeadings() {
  const ctx = React.useContext(HeadingsContext)
  return ctx ?? { headings: [], register: () => {} }
}
