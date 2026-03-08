import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { GrFormNextLink } from 'react-icons/gr'
import { useState } from 'react'
import { guidesConfig, getGuidesForCategory, getSubcategoriesForCategory, formatSlugToTitle, type SubcategoryMeta } from '@/lib/guides'

function isPathUnderSub(sub: SubcategoryMeta, path: string): boolean {
  return path === sub.slug || path.startsWith(sub.slug + '/')
}

function SubcategoryNode({
  category,
  sub,
  basePath,
  currentCategory,
  currentPath,
  expanded,
  collapsed,
  onToggle,
}: {
  category: string
  sub: SubcategoryMeta
  basePath: string
  currentCategory: string | null
  currentPath: string
  expanded: Set<string>
  collapsed: Set<string>
  onToggle: (key: string) => void
}) {
  const key = `${category}:${basePath}`
  const isPathActive = (path: string) => currentCategory === category && (currentPath === path || (currentPath.startsWith(path + '/') && path.length > 0))
  const hasChildren = sub.guides.length > 0 || sub.subcategories.length > 0
  const isExpanded = hasChildren && (expanded.has(key) || isPathActive(basePath) || isPathUnderSub(sub, currentPath)) && !collapsed.has(key)

  return (
    <li>
      {hasChildren ? (
        <>
          <div className="flex items-center justify-between gap-0.5" onClick={() => onToggle(key)}>
            <Link to="/guides/$category/$" params={{ category, _splat: basePath }} className="text-foreground hover:text-foreground min-w-0 flex-1 truncate text-sm hover:underline" activeProps={{ className: 'text-foreground font-normal' }}>
              {sub.title}
            </Link>
            <button type="button" className="hover:text-foreground shrink-0 p-0.5" aria-expanded={isExpanded}>
              <span className="inline-block cursor-pointer select-none">{isExpanded ? 'v' : '>'}</span>
            </button>
          </div>
          {isExpanded && (
            <ul className="mt-1 ml-1 space-y-1 border-l border-(--pale)/20 pl-3">
              {sub.subcategories.map((nested) => (
                <SubcategoryNode
                  key={nested.slug}
                  category={category}
                  sub={nested}
                  basePath={`${basePath}/${nested.slug}`}
                  currentCategory={currentCategory}
                  currentPath={currentPath}
                  expanded={expanded}
                  collapsed={collapsed}
                  onToggle={onToggle}
                />
              ))}
              {sub.guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    to="/guides/$category/$"
                    params={{ category, _splat: `${basePath}/${guide.slug}` }}
                    className="text-pale hover:text-foreground block truncate text-sm hover:underline"
                    activeProps={{ className: 'text-foreground font-normal' }}
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Link to="/guides/$category/$" params={{ category, _splat: basePath }} className="text-pale hover:text-foreground block truncate text-sm hover:underline" activeProps={{ className: 'text-foreground font-normal' }}>
          {sub.title}
        </Link>
      )}
    </li>
  )
}

export default function GuidesSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const match = pathname.match(/^\/guides\/([^/]+)(?:\/(.*))?$/)
  const currentCategory = match ? match[1] : null
  const currentPath = match?.[2] ?? ''

  const categories = Object.keys(guidesConfig)
  const selectedCategory = currentCategory && categories.includes(currentCategory) ? currentCategory : categories[0]

  const guides = getGuidesForCategory(selectedCategory)
  const subcategories = getSubcategoriesForCategory(selectedCategory)

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (expanded.has(key)) next.add(key)
      else next.delete(key)
      return next
    })
    setExpanded((prev) => {
      const next = new Set(prev)
      if (expanded.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value
    navigate({ to: '/guides/$category', params: { category } })
  }

  return (
    <aside className="my-8 hidden w-48 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1">
        <Link to="/guides" className="text-pale hover:text-foreground mb-2 block flex items-center text-sm hover:underline">
          <GrFormNextLink className="mr-1 rotate-180" /> All Guides
        </Link>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="bg-background text-foreground mb-4 w-full cursor-pointer rounded border border-(--pale)/30 px-2 py-1.5 text-xs focus:ring-1 focus:ring-(--pale)/50 focus:outline-none"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {formatSlugToTitle(cat)}
            </option>
          ))}
        </select>
        <ul className="space-y-1">
          {subcategories.map((sub) => (
            <SubcategoryNode key={sub.slug} category={selectedCategory} sub={sub} basePath={sub.slug} currentCategory={currentCategory} currentPath={currentPath} expanded={expanded} collapsed={collapsed} onToggle={toggle} />
          ))}
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                to="/guides/$category/$"
                params={{ category: selectedCategory, _splat: guide.slug }}
                className="text-pale hover:text-foreground block truncate text-sm hover:underline"
                activeProps={{ className: 'text-foreground font-normal' }}
              >
                {guide.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
