import Home from '@/components/pages/home'
import Navbar from '@/components/shared/navbar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Portfolio,
})

function Portfolio() {
  return (
    <>
      <div className="flex h-screen w-full flex-col">
        <Navbar />
        <Home />
      </div>
    </>
  )
}
