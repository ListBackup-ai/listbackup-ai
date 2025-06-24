'use client'

import { createContext, useContext, useEffect, ReactNode, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void
  trackPageView: (pageName?: string) => void
  identifyUser: (userId: string, traits?: Record<string, any>) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
}

function AnalyticsProviderInner({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views automatically
  useEffect(() => {
    trackPageView()
  }, [pathname, searchParams])

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, properties)
      return
    }

    // In production, send to your analytics service
    // Examples: Google Analytics, Mixpanel, Amplitude, etc.
    
    // Google Analytics 4 example
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        ...properties,
        page_path: pathname,
      })
    }

    // Custom analytics endpoint example
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...properties,
            page: pathname,
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            referrer: document.referrer,
          }
        })
      }).catch(console.error)
    }
  }

  const trackPageView = (pageName?: string) => {
    const page = pageName || pathname
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 Page View:', page)
      return
    }

    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: document.title,
        page_location: window.location.href,
        page_path: page,
      })
    }

    trackEvent('page_view', {
      page_title: typeof document !== 'undefined' ? document.title : '',
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_path: page,
    })
  }

  const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 User Identified:', userId, traits)
      return
    }

    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        user_id: userId,
        custom_map: traits,
      })
    }

    trackEvent('user_identified', {
      user_id: userId,
      ...traits,
    })
  }

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackPageView, identifyUser }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </Suspense>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Pre-built tracking functions for common events
export const analyticsEvents = {
  // Landing page events
  heroCtaClicked: (cta: string) => ({
    event: 'hero_cta_clicked',
    properties: { cta_text: cta, section: 'hero' }
  }),

  demoRequested: (source: string) => ({
    event: 'demo_requested',
    properties: { source, lead_type: 'demo' }
  }),

  pricingViewed: (plan?: string) => ({
    event: 'pricing_viewed',
    properties: { plan_focused: plan }
  }),

  integrationViewed: (integration: string) => ({
    event: 'integration_viewed',
    properties: { integration_name: integration }
  }),

  // Conversion events
  signupStarted: (source: string) => ({
    event: 'signup_started',
    properties: { source, funnel_step: 'registration' }
  }),

  signupCompleted: (method: string) => ({
    event: 'signup_completed',
    properties: { registration_method: method, funnel_step: 'complete' }
  }),

  trialStarted: (plan: string) => ({
    event: 'trial_started',
    properties: { plan_type: plan, trial_length: '14_days' }
  }),

  subscriptionCreated: (plan: string, amount: number) => ({
    event: 'subscription_created',
    properties: { plan_type: plan, amount, currency: 'USD' }
  }),

  // Product events
  integrationConnected: (platform: string) => ({
    event: 'integration_connected',
    properties: { platform, integration_type: 'oauth' }
  }),

  backupInitiated: (source: string, type: string) => ({
    event: 'backup_initiated',
    properties: { source_platform: source, backup_type: type }
  }),

  dataExported: (format: string, records: number) => ({
    event: 'data_exported',
    properties: { export_format: format, record_count: records }
  }),

  // Engagement events
  blogPostViewed: (title: string) => ({
    event: 'blog_post_viewed',
    properties: { post_title: title, content_type: 'blog' }
  }),

  helpArticleViewed: (article: string) => ({
    event: 'help_article_viewed',
    properties: { article_title: article, content_type: 'help' }
  }),

  newsletterSubscribed: (source: string) => ({
    event: 'newsletter_subscribed',
    properties: { subscription_source: source }
  }),

  // Support events
  supportTicketCreated: (category: string) => ({
    event: 'support_ticket_created',
    properties: { ticket_category: category }
  }),

  chatStarted: (source: string) => ({
    event: 'chat_started',
    properties: { chat_source: source }
  }),
}