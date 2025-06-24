'use client'

import { LandingLayout } from '@/components/landing/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <LandingLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-primary/20 mb-4 animate-fade-in">
                404
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary/50 mx-auto rounded animate-fade-in animation-delay-200"></div>
            </div>

            {/* Main Content */}
            <div className="animate-fade-in-up animation-delay-400">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Page Not Found
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have mistyped the URL.
              </p>
            </div>

            {/* Actions */}
            <Card className="animate-fade-in-up animation-delay-600">
              <CardContent className="p-8">
                <h2 className="font-semibold mb-6">What would you like to do?</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Button asChild className="h-12">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="h-12">
                    <Link href="/integrations">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Integrations
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" asChild className="h-12">
                    <Link href="/help">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Get Help
                    </Link>
                  </Button>
                  
                  <Button variant="outline" onClick={() => window.history.back()} className="h-12">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Links */}
            <div className="mt-12 animate-fade-in-up animation-delay-800">
              <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { name: 'Features', href: '/features' },
                  { name: 'Pricing', href: '/pricing' },
                  { name: 'Keap Integration', href: '/platforms/keap' },
                  { name: 'Stripe Integration', href: '/platforms/stripe' },
                  { name: 'Contact', href: '/contact' }
                ].map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}