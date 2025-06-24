'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Cookie, Settings, Check, X } from 'lucide-react'
import Link from 'next/link'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const COOKIE_CONSENT_KEY = 'listbackup-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'listbackup-cookie-preferences'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
    
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    
    setPreferences(allAccepted)
    saveCookieConsent(allAccepted)
    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    }
    
    setPreferences(necessaryOnly)
    saveCookieConsent(necessaryOnly)
    setShowBanner(false)
    setShowSettings(false)
  }

  const savePreferences = () => {
    saveCookieConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const saveCookieConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    
    // Initialize analytics based on preferences
    if (prefs.analytics && typeof window !== 'undefined') {
      // Enable Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'granted'
        })
      }
    }
    
    if (prefs.marketing && typeof window !== 'undefined') {
      // Enable marketing cookies
      if ((window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          ad_storage: 'granted'
        })
      }
    }
  }

  const cookieTypes = [
    {
      id: 'necessary' as keyof CookiePreferences,
      title: 'Necessary Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      required: true,
    },
    {
      id: 'functional' as keyof CookiePreferences,
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization, such as remembering your preferences.',
      required: false,
    },
    {
      id: 'analytics' as keyof CookiePreferences,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website to improve performance.',
      required: false,
    },
    {
      id: 'marketing' as keyof CookiePreferences,
      title: 'Marketing Cookies',
      description: 'Used to track visitors and display relevant ads and marketing content.',
      required: false,
    },
  ]

  if (!showBanner) return null

  return (
    <>
      {/* Main Banner */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t animate-fade-in-up">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {/* Icon and content */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Cookie className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        🍪 We use cookies to enhance your experience
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We use cookies to provide you with the best possible experience, analyze site performance, 
                        and personalize content. By clicking "Accept All", you consent to our use of cookies.{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Learn more
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="w-full sm:w-auto"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={acceptNecessary}
                      className="w-full sm:w-auto"
                    >
                      Essential Only
                    </Button>
                    <Button
                      size="sm"
                      onClick={acceptAll}
                      className="w-full sm:w-auto"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Cookie Preferences</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose which cookies you'd like to accept. You can change these settings at any time.
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {cookieTypes.map((cookieType) => (
                  <div key={cookieType.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{cookieType.title}</h3>
                        {cookieType.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[cookieType.id]}
                          disabled={cookieType.required}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              [cookieType.id]: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cookieType.description}
                    </p>
                  </div>
                ))}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={acceptNecessary}
                    className="flex-1"
                  >
                    Accept Essential Only
                  </Button>
                  <Button onClick={savePreferences} className="flex-1">
                    Save Preferences
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    For more information about how we use cookies, please read our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}