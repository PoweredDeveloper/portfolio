import { Link } from '@tanstack/react-router'
import { formatSlugToTitle } from '@/lib/guides'

interface GuideBreadcrumbProps {
  category: string
  pathSegments: string[]
  pageTitle: string
}

export function GuideBreadcrumb({ category, pathSegments, pageTitle }: GuideBreadcrumbProps) {
  const items: { label: string; href?: string }[] = [
    { label: 'Guides', href: '/guides' },
    { label: formatSlugToTitle(category), href: `/guides/${category}` },
  ]

  let basePath = category
  for (const seg of pathSegments) {
    basePath += `/${seg}`
    items.push({ label: formatSlugToTitle(seg), href: `/guides/${basePath}` })
  }
  items.push({ label: pageTitle.toLowerCase().replaceAll(' ', '-') })

  return (
    <nav className="text-pale mb-4 text-sm" aria-label="Breadcrumb">
      {'~/'}
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="text-pale">/</span>}
          {item.href ? (
            <Link to={item.href} className="hover:text-foreground hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
      {'.mdx'}
    </nav>
  )
}
