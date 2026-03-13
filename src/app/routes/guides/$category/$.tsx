import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { useEffect } from 'react'
import { getSubcategoryAtPath, getGuideByPath, getGuideBySlug, type SubcategoryMeta } from '@/lib/guides'
import { mdxComponents } from '@/components/pages/guides/mdx-components'
import { cn } from '@/lib/cn'
import { HeadingsProvider } from '@/components/pages/guides/headings-context'
import { GuideBreadcrumb } from '@/components/pages/guides/guide-breadcrumb'
import { GuideToc } from '@/components/pages/guides/guide-toc'

interface GuideModule {
  default: React.ComponentType
  frontmatter?: { title?: string; description?: string; date?: string }
}
const guideModules = import.meta.glob<GuideModule>('/src/content/guides/**/*.mdx')

function getLoaderForPath(modules: Record<string, () => Promise<GuideModule>>, category: string, pathSegments: string[], slug: string) {
  const path = [category, ...pathSegments, slug].join('/')
  const suffix = `${path}.mdx`
  const key = Object.keys(modules).find((k) => k.endsWith(suffix))
  return key ? modules[key] : undefined
}

export const Route = createFileRoute('/guides/$category/$')({
  component: PathPage,
})

function PathPage() {
  const { category } = Route.useParams()
  const params = Route.useParams() as { _splat?: string; ''?: string }
  const splat = params._splat ?? params[''] ?? ''
  const segments = splat ? splat.split('/').filter(Boolean) : []

  if (segments.length === 0) {
    return null
  }

  const pathSegments = segments.slice(0, -1)
  const last = segments[segments.length - 1]!

  const sub = getSubcategoryAtPath(category, segments)
  const guideFromSub = getGuideByPath(category, pathSegments, last)
  const guideFromCategory = pathSegments.length === 0 ? getGuideBySlug(category, last) : undefined
  const guide = guideFromSub ?? guideFromCategory

  const loader = getLoaderForPath(guideModules, category, pathSegments, last)

  if (sub) {
    return <SubcategoryIndex category={category} basePath={segments.join('/')} sub={sub} />
  }

  if (guide && loader) {
    const pathKey = [category, ...pathSegments, last].join('/')
    return <GuideContent loader={loader} pathKey={pathKey} category={category} pathSegments={pathSegments} pageTitle={guide.title} />
  }

  return (
    <div className="py-12">
      <p className="text-pale">Page not found.</p>
    </div>
  )
}

function SubcategoryIndex({ category, basePath, sub }: { category: string; basePath: string; sub: SubcategoryMeta }) {
  return (
    <div className="font-ibm-mono mx-auto px-8">
      <h1 className="mb-6 text-2xl font-light">{sub.title}</h1>
      <ul className="space-y-3">
        {sub.subcategories.map((nested) => (
          <li key={nested.slug}>
            <Link to="/guides/$category/$" params={{ category, _splat: basePath ? `${basePath}/${nested.slug}` : nested.slug }} className="hover:text-foreground text-pale hover:underline">
              {nested.title}
            </Link>
          </li>
        ))}
        {sub.guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              to="/guides/$category/$"
              params={{
                category,
                _splat: basePath ? `${basePath}/${guide.slug}` : guide.slug,
              }}
              className="hover:text-foreground text-pale hover:underline"
            >
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function GuideContent({ loader, pathKey, category, pathSegments, pageTitle }: { loader: () => Promise<GuideModule>; pathKey: string; category: string; pathSegments: string[]; pageTitle: string }) {
  const [mod, setMod] = React.useState<GuideModule | null>(null)

  useEffect(() => {
    setMod(null)
    let cancelled = false
    loader().then((m) => {
      if (!cancelled) setMod(m)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey])

  useEffect(() => {
    if (mod?.frontmatter?.title) document.title = `${mod.frontmatter.title} | Mikis`
    return () => {
      document.title = 'Mikis'
    }
  }, [mod?.frontmatter?.title])

  if (!mod) {
    return (
      <div className="py-12">
        <p className="text-pale">Loading...</p>
      </div>
    )
  }

  const { default: Component } = mod
  const title = mod.frontmatter?.title ?? pageTitle
  const date = mod.frontmatter?.date

  return (
    <HeadingsProvider>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1">
          <GuideBreadcrumb category={category} pathSegments={pathSegments} pageTitle={title} />
          <h1 className={cn('text-foreground text-3xl font-light', date ? 'mb-1' : 'mb-6')}>{title}</h1>
          {date && <p className="text-pale mb-6 text-sm">Last updated {formatDate(date)}</p>}
          <MDXProvider components={mdxComponents}>
            <article className="prose prose-neutral dark:prose-invert font-ibm-mono prose-headings:font-light prose-code:font-mono prose-table:border prose-table:border-(--pale)/20 prose-th:border prose-th:border-(--pale)/20 prose-td:border prose-td:border-(--pale)/20 prose-th:bg-(--pale)/5 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 max-w-none">
              <Component />
            </article>
          </MDXProvider>
        </div>
        <GuideToc className="w-48 shrink-0" />
      </div>
    </HeadingsProvider>
  )
}
