'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoMain } from '@/components/logo/logo-main'
import { cn } from '@listbackup/shared/utils'
import { Menu, X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function LandingHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled 
        ? "bg-background/80 backdrop-blur-lg border-b shadow-sm" 
        : "bg-transparent"
    )}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="transform transition-transform duration-300 group-hover:scale-105">
                <LogoMain />
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative text-sm font-medium transition-all duration-300',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                  'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300',
                  pathname === item.href && 'after:w-full',
                  'hover:after:w-full'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <Button 
              variant="ghost" 
              className="relative overflow-hidden group"
              asChild
            >
              <Link href="/login">
                <span className="relative z-10">Log in</span>
                <div className="absolute inset-0 bg-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
            <Button 
              className="relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
              asChild
            >
              <Link href="/signup">
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial 
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen 
            ? "max-h-96 opacity-100" 
            : "max-h-0 opacity-0 overflow-hidden"
        )}>
          <div className="space-y-1 pb-3 pt-2 bg-background/95 backdrop-blur-lg rounded-b-lg">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 space-y-2 px-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80" asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}