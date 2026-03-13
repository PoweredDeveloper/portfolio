import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import GuidesSidebar from '@/components/pages/guides/guides-sidebar'

export const Route = createFileRoute('/guides')({
  component: GuidesLayout,
})

function GuidesLayout() {
  const { pathname } = useLocation()
  const isIndex = pathname === '/guides' || pathname === '/guides/'

  if (isIndex) {
    return <Outlet />
  }

  return (
    <div className="font-ibm-mono mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <GuidesSidebar />
      <article className="min-w-0 flex-1">
        <Outlet />
      </article>
    </div>
  )
}
