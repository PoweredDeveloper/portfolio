import { Link } from '@tanstack/react-router'
import { Fragment, useEffect, useState } from 'react'
import { GrFormNextLink } from 'react-icons/gr'
import ThemeToggle from '../ui/theme-switcher'

const routes: { path: string; label: string; external?: boolean }[] = [
  {
    path: '/',
    label: 'Home Page',
  },
  {
    path: '/music',
    label: 'Music',
  },
  {
    path: '/portfolio',
    label: 'Portfolio',
    external: true,
  },
]

export default function Navbar() {
  const [time, setTime] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <nav className="font-ibm-mono w-full px-8 py-8 font-light select-none lg:py-14">
      <div className="mx-auto flex flex-col items-center justify-between gap-6 md:gap-4 lg:max-w-3xl lg:flex-row lg:gap-0 xl:max-w-5xl">
        {/* Title and time */}
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-3 gap-1">
              <span className="bg-foreground w-0.5 opacity-33" />
              <span className="bg-foreground w-1 opacity-66" />
              <span className="bg-foreground w-2 opacity-100" />
            </div>
            <Link to="/" className="font-normal">
              Mikyss
            </Link>
          </div>
          <span className="text-pale">//</span>
          <span className="text-foreground flex gap-1">
            [<span className="text-pale font-normal">{new Date(time).toLocaleTimeString()}</span>]
          </span>
        </div>
        {/* Theme Switcher */}
        <ThemeToggle className="hidden lg:block" />
        {/* Links Desktop */}
        <div className="hidden items-center gap-8 lg:flex">
          {routes.map((route, index) => (
            <Fragment key={index}>
              <Link className="navbar-link" to={route.path}>
                {route.label}
                {route.external && <GrFormNextLink />}
              </Link>
              {routes.length - 1 !== index && <span className="text-pale link-selection">'</span>}
            </Fragment>
          ))}
        </div>
        {/* Links Mobile */}
        <div className="flex w-full items-center justify-center lg:hidden">
          <Link to="/portfolio" className="navbar-link flex items-center gap-1">
            Portfolio
            <GrFormNextLink />
          </Link>
        </div>
      </div>
    </nav>
  )
}
