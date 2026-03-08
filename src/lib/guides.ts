export interface GuideMeta {
  slug: string
  title: string
  description?: string
}

export interface SubcategoryMeta {
  slug: string
  title: string
  guides: GuideMeta[]
  subcategories: SubcategoryMeta[]
}

export interface CategoryConfig {
  guides: GuideMeta[]
  subcategories: SubcategoryMeta[]
}

/** Format slug to display title (e.g. "docker-compose" → "Docker Compose") */
export function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const guidePaths = Object.keys(
  import.meta.glob('/src/content/guides/**/*.mdx'),
)

function parseGuidesFromGlob(): Record<string, CategoryConfig> {
  const result: Record<string, CategoryConfig> = {}
  type Node = { guides: GuideMeta[]; subcategories: Record<string, Node> }
  const subcategoryData: Record<string, Record<string, Node>> = {}

  for (const path of guidePaths) {
    const parts = path.match(/\/guides\/([^/]+)\/(.+?)\.mdx$/)
    if (!parts) continue

    const category = parts[1]
    const rest = parts[2]
    const segments = rest.split('/')

    if (!result[category]) result[category] = { guides: [], subcategories: [] }

    if (segments.length === 1) {
      const slug = segments[0]
      if (!subcategoryData[category]?.[slug]) {
        result[category].guides.push({ slug, title: formatSlugToTitle(slug), description: undefined })
      }
      continue
    }

    const slug = segments.pop()!
    const subcategoryPath = segments

    if (!subcategoryData[category]) subcategoryData[category] = {}

    let current = subcategoryData[category]
    for (let i = 0; i < subcategoryPath.length; i++) {
      const seg = subcategoryPath[i]
      if (!current[seg]) current[seg] = { guides: [], subcategories: {} }
      if (i < subcategoryPath.length - 1) {
        current = current[seg].subcategories
      } else {
        current[seg].guides.push({ slug, title: formatSlugToTitle(slug), description: undefined })
      }
    }
  }

  function buildSubcategories(data: Record<string, Node>): SubcategoryMeta[] {
    return Object.entries(data)
      .filter(([, v]) => v.guides.length > 0 || Object.keys(v.subcategories).length > 0)
      .map(([slug, v]) => ({
        slug,
        title: formatSlugToTitle(slug),
        guides: v.guides,
        subcategories: buildSubcategories(v.subcategories),
      }))
  }

  for (const category of Object.keys(subcategoryData)) {
    result[category].subcategories = buildSubcategories(subcategoryData[category] as Record<string, Node>)
  }

  return result
}

export const guidesConfig = parseGuidesFromGlob()

export type GuideCategory = keyof typeof guidesConfig

export function getGuidesForCategory(category: string): GuideMeta[] {
  return guidesConfig[category]?.guides ?? []
}

export function getSubcategoriesForCategory(category: string): SubcategoryMeta[] {
  return guidesConfig[category]?.subcategories ?? []
}

export function getGuideBySlug(category: string, slug: string): GuideMeta | undefined {
  const config = guidesConfig[category]
  if (!config) return undefined
  return config.guides.find((g) => g.slug === slug)
}

export function getSubcategoryAtPath(category: string, pathSegments: string[]): SubcategoryMeta | undefined {
  let current = guidesConfig[category]?.subcategories ?? []
  for (const seg of pathSegments) {
    const sub = current.find((s) => s.slug === seg)
    if (!sub) return undefined
    if (pathSegments[pathSegments.length - 1] === seg) return sub
    current = sub.subcategories
  }
  return undefined
}

export function getGuideInSubcategory(category: string, subcategory: string, slug: string): GuideMeta | undefined {
  const sub = getSubcategoryAtPath(category, [subcategory])
  return sub?.guides.find((g) => g.slug === slug)
}

export function getGuideByPath(category: string, pathSegments: string[], slug: string): GuideMeta | undefined {
  const sub = getSubcategoryAtPath(category, pathSegments)
  return sub?.guides.find((g) => g.slug === slug)
}
