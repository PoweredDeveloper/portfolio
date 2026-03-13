import type React from 'react'
import { useMDXComponents as useBaseComponents } from '@mdx-js/react'
import { Pre, Code, Ul } from './mdx-styled-components'
import { mdxHeadingComponents } from './mdx-headings'
import AsciiImage from '@/components/effects/ascii-image'

export const mdxComponents = {
  pre: Pre,
  code: Code,
  ul: Ul,
  ...mdxHeadingComponents,
  AsciiImage,
}

export function useMDXComponents(components?: Record<string, React.ComponentType>) {
  const base = useBaseComponents(components)
  return { ...base, pre: Pre, code: Code, ul: Ul, ...mdxHeadingComponents }
}
