import { LandingHeader } from './header'
import { LandingFooter } from './footer'
import { FloatingCTA } from './floating-cta'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
      <FloatingCTA />
    </div>
  )
}