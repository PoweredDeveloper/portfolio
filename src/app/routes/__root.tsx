import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import BackgroundNoise from '@/components/BackgroundNoise'

const RootLayout = () => {
  const location = useLocation()
  const isPortfolio = location.pathname === '/portfolio'

  if (isPortfolio) {
    return (
      <>
        <Outlet />
      </>
    )
  }

  return (
    <>
      <BackgroundNoise pixelSize={1} opacity={18} frameSkip={3} />
      <Outlet />
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
