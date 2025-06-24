'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px down
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (isDismissed || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="relative">
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Main CTA */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg hover:shadow-xl p-4 text-white max-w-sm transition-all duration-300 hover:scale-105">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">
                Ready to protect your data?
              </div>
              <div className="text-xs text-white/90">
                Start your free trial today
              </div>
            </div>
            <Button size="sm" variant="secondary" className="bg-white text-primary hover:bg-white/90 flex-shrink-0" asChild>
              <Link href="/signup">
                Try Free
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}