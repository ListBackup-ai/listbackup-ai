'use client'

import { useEffect, useState, ReactNode } from 'react'
import { trackEvent } from './tracking-provider'

interface ABTestConfig {
  testName: string
  variants: {
    [key: string]: {
      weight: number
      component: ReactNode
    }
  }
  targetingRules?: {
    includeParams?: string[]
    excludeParams?: string[]
    includeUrls?: RegExp[]
    excludeUrls?: RegExp[]
    includeCookies?: { [key: string]: string }
    includeUserAgent?: RegExp[]
  }
  startDate?: Date
  endDate?: Date
  enabled?: boolean
}

interface ABTestProviderProps {
  config: ABTestConfig
  children?: ReactNode
  fallback?: ReactNode
}

// Utility to check if user qualifies for test
function qualifiesForTest(config: ABTestConfig): boolean {
  const { targetingRules, startDate, endDate, enabled = true } = config
  
  if (!enabled) return false
  
  // Check date range
  const now = new Date()
  if (startDate && now < startDate) return false
  if (endDate && now > endDate) return false
  
  if (!targetingRules) return true
  
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
  
  // Check URL targeting
  if (targetingRules.includeUrls?.length) {
    const matches = targetingRules.includeUrls.some(regex => regex.test(url))
    if (!matches) return false
  }
  
  if (targetingRules.excludeUrls?.length) {
    const matches = targetingRules.excludeUrls.some(regex => regex.test(url))
    if (matches) return false
  }
  
  // Check URL parameters
  if (targetingRules.includeParams?.length && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const hasParam = targetingRules.includeParams.some(param => urlParams.has(param))
    if (!hasParam) return false
  }
  
  if (targetingRules.excludeParams?.length && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const hasParam = targetingRules.excludeParams.some(param => urlParams.has(param))
    if (hasParam) return false
  }
  
  // Check cookies
  if (targetingRules.includeCookies && typeof document !== 'undefined') {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as { [key: string]: string })
    
    const matchesCookie = Object.entries(targetingRules.includeCookies).every(
      ([key, value]) => cookies[key] === value
    )
    if (!matchesCookie) return false
  }
  
  // Check user agent
  if (targetingRules.includeUserAgent?.length) {
    const matches = targetingRules.includeUserAgent.some(regex => regex.test(userAgent))
    if (!matches) return false
  }
  
  return true
}

// Weighted random selection
function selectVariant(variants: ABTestConfig['variants']): string {
  const variantNames = Object.keys(variants)
  const weights = variantNames.map(name => variants[name].weight)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < variantNames.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return variantNames[i]
    }
  }
  
  return variantNames[0] // Fallback
}

// Hook for A/B testing
export function useABTest(config: ABTestConfig) {
  const [variant, setVariant] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (!qualifiesForTest(config)) {
      setIsLoading(false)
      return
    }
    
    const { testName, variants } = config
    const storageKey = `ab_test_${testName}`
    
    // Check if user already has a variant assigned
    const existingVariant = localStorage.getItem(storageKey)
    if (existingVariant && variants[existingVariant]) {
      setVariant(existingVariant)
      setIsLoading(false)
      return
    }
    
    // Assign new variant
    const selectedVariant = selectVariant(variants)
    localStorage.setItem(storageKey, selectedVariant)
    setVariant(selectedVariant)
    setIsLoading(false)
    
    // Track assignment
    trackEvent('ab_test_assigned', {
      test_name: testName,
      variant: selectedVariant,
      category: 'ab_testing'
    })
  }, [config])
  
  const trackConversion = (conversionType: string, value?: number) => {
    if (variant) {
      trackEvent('ab_test_conversion', {
        test_name: config.testName,
        variant: variant,
        conversion_type: conversionType,
        value: value,
        category: 'ab_testing'
      })
    }
  }
  
  return {
    variant,
    isLoading,
    trackConversion,
    isQualified: variant !== null
  }
}

// Component for A/B testing
export function ABTest({ config, children, fallback }: ABTestProviderProps) {
  const { variant, isLoading, isQualified } = useABTest(config)
  
  if (isLoading) {
    return <>{fallback || children}</>
  }
  
  if (!isQualified || !variant) {
    return <>{fallback || children}</>
  }
  
  return <>{config.variants[variant]?.component || fallback || children}</>
}

// Pre-built A/B test configurations
export const AB_TESTS = {
  heroHeadline: {
    testName: 'hero_headline_v1',
    variants: {
      original: {
        weight: 50,
        component: (
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Data, Backed Up Intelligently
          </h1>
        )
      },
      variant_a: {
        weight: 25,
        component: (
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Never Lose Business Data Again
          </h1>
        )
      },
      variant_b: {
        weight: 25,
        component: (
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Enterprise Data Protection Made Simple
          </h1>
        )
      }
    },
    enabled: true
  },
  
  ctaButton: {
    testName: 'cta_button_v1',
    variants: {
      original: {
        weight: 50,
        component: "Start Free Trial"
      },
      variant_a: {
        weight: 25,
        component: "Protect My Data Now"
      },
      variant_b: {
        weight: 25,
        component: "Get Started Free"
      }
    },
    enabled: true
  },
  
  pricingDisplay: {
    testName: 'pricing_display_v1',
    variants: {
      monthly: {
        weight: 50,
        component: (
          <div className="text-center">
            <div className="text-3xl font-bold">$99/month</div>
            <div className="text-sm text-muted-foreground">per account</div>
          </div>
        )
      },
      yearly: {
        weight: 50,
        component: (
          <div className="text-center">
            <div className="text-3xl font-bold">$999/year</div>
            <div className="text-sm text-green-600">Save 2 months!</div>
          </div>
        )
      }
    },
    enabled: true
  },
  
  testimonialStyle: {
    testName: 'testimonial_style_v1',
    variants: {
      cards: {
        weight: 50,
        component: "card" // This would be handled by the testimonial component
      },
      carousel: {
        weight: 50,
        component: "carousel"
      }
    },
    enabled: true
  }
} as const

// Analytics dashboard component for viewing A/B test results
export function ABTestDashboard() {
  const [testResults, setTestResults] = useState<any[]>([])
  
  useEffect(() => {
    // In a real implementation, this would fetch from your analytics API
    const mockResults = Object.keys(AB_TESTS).map(testName => ({
      testName,
      variants: ['original', 'variant_a', 'variant_b'],
      results: {
        original: { visitors: 1000, conversions: 50, rate: 5.0 },
        variant_a: { visitors: 500, conversions: 30, rate: 6.0 },
        variant_b: { visitors: 500, conversions: 35, rate: 7.0 }
      },
      confidence: 0.95,
      winner: 'variant_b'
    }))
    
    setTestResults(mockResults)
  }, [])
  
  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold mb-2">A/B Test Results</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {testResults.map((test) => (
          <div key={test.testName} className="text-sm">
            <div className="font-medium">{test.testName}</div>
            {Object.entries(test.results).map(([variant, data]: [string, any]) => (
              <div key={variant} className="ml-2 text-xs">
                {variant}: {data.rate}% ({data.conversions}/{data.visitors})
                {test.winner === variant && <span className="text-green-600 ml-1">👑</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}