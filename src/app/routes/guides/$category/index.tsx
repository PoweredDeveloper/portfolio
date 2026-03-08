import { createFileRoute, Link } from '@tanstack/react-router'
import { getGuidesForCategory, getSubcategoriesForCategory, formatSlugToTitle } from '@/lib/guides'

export const Route = createFileRoute('/guides/$category/')({
  component: CategoryIndex,
})

function CategoryIndex() {
  const { category } = Route.useParams()
  const guides = getGuidesForCategory(category)
  const subcategories = getSubcategoriesForCategory(category)
  const label = formatSlugToTitle(category)

  return (
    <div className="font-ibm-mono mx-auto px-8">
      <h1 className="mb-6 text-2xl font-light">{label}</h1>
      <ul className="space-y-3">
        {subcategories.map((sub) => (
          <li key={sub.slug}>
            <Link to="/guides/$category/$" params={{ category, _splat: sub.slug }} className="hover:text-foreground text-pale hover:underline">
              {sub.title}
            </Link>
          </li>
        ))}
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link to="/guides/$category/$" params={{ category, _splat: guide.slug }} className="hover:text-foreground text-pale hover:underline">
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
