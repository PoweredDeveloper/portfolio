// import Footer from '@/components/shared/footer'
import Navbar from '@/components/shared/navbar'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import BackgroundNoise from '@/components/effects/background-noise'

const RootLayout = () => {
  const location = useLocation()
  const isPortfolio = location.pathname === '/portfolio'

  if (isPortfolio) return <Outlet />

  return (
    <div className="flex h-screen flex-col">
      <BackgroundNoise pixelSize={1} opacity={18} frameSkip={3} tileSize={128} />
      <Navbar className="flex-0" />
      <main className="font-ibm-mono min-h-0 flex-1">
        <Outlet />
      </main>
      {/* <Footer /> */}
      {/* Guest Book? */}
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
