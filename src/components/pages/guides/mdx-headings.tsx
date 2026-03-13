import * as React from 'react'
import { useHeadings } from './headings-context'

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const

function createHeading(level: 2 | 3 | 4 | 5 | 6) {
  const tag = headingTags[level]
  return function MdxHeading({ children, id, ...props }: React.ComponentProps<'h2'> & { id?: string }) {
    const { register } = useHeadings()
    const ref = React.useRef<HTMLHeadingElement>(null)

    React.useEffect(() => {
      if (!id || !ref.current) return
      const text = ref.current.textContent?.trim() ?? ''
      if (text) register({ level, text, id })
    }, [id, register])

    return React.createElement(tag, { ref, id, ...props }, children)
  }
}

export const mdxHeadingComponents = {
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
}
