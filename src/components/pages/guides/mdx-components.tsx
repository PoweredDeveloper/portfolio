import type React from 'react'
import { useMDXComponents as useBaseComponents } from '@mdx-js/react'
import { Pre, Code, Ul } from './mdx-styled-components'
import AsciiImage from '@/components/effects/ascii-image'

export const mdxComponents = {
  pre: Pre,
  code: Code,
  ul: Ul,
  AsciiImage,
}

export function useMDXComponents(components?: Record<string, React.ComponentType>) {
  const base = useBaseComponents(components)
  return { ...base, pre: Pre, code: Code, ul: Ul }
}
