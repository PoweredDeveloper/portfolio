import { createFileRoute, Link } from '@tanstack/react-router'
import { guidesConfig, getGuidesForCategory, getSubcategoriesForCategory, formatSlugToTitle } from '@/lib/guides'
import AsciiImage from '@/components/effects/ascii-image'

export const Route = createFileRoute('/guides/')({
  component: GuidesIndex,
})

const guidesText = `
  _____       _     _           
 / ____|     (_)   | |          
| |  __ _   _ _  __| | ___  ___ 
| | |_ | | | | |/ _\` |/ _ \\/ __|
| |__| | |_| | | (_| |  __/\\__ \\
 \\_____|\\__,_|_|\\__,_|\\___||___/
                                 
`

function GuidesIndex() {
  return (
    <div className="mx-auto lg:max-w-3xl lg:flex-row lg:gap-0 xl:max-w-5xl">
      <div className="mb-8 text-center text-2xl font-semibold lg:flex-row lg:gap-0">
        <AsciiImage
          text={guidesText}
          className="h-[250px] w-full"
          options={{
            display: {
              fontSize: 16,
              textClassName: 'text-foreground font-semibold',
              messyClassName: 'text-pale font-extralight',
            },
            animation: {
              animated: true,
              revealMode: 'messy',
              duration: 1000,
              messinessThreshold: 0.2,
            },
            idle: {
              enabled: true,
              interval: 150,
              fade: true,
            },
          }}
        />
      </div>
      {/* List of guides categories */}
      <div className="grid grid-cols-1 gap-8 px-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Object.keys(guidesConfig).map((category) => {
          const guides = getGuidesForCategory(category)
          const subcategories = getSubcategoriesForCategory(category)
          return (
            <section key={category}>
              <h2 className="mb-4 text-lg">
                <Link to="/guides/$category" params={{ category }} className="hover:text-foreground text-foreground hover:underline">
                  {formatSlugToTitle(category)}
                </Link>
              </h2>
              <ul className="space-y-2">
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
            </section>
          )
        })}
      </div>
    </div>
  )
}
