'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

// Analytics configuration
const ANALYTICS_CONFIG = {
  googleAnalytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: process.env.NODE_ENV === 'production'
  },
  hotjar: {
    hjid: process.env.NEXT_PUBLIC_HOTJAR_ID || '0000000',
    enabled: process.env.NODE_ENV === 'production'
  },
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    enabled: process.env.NODE_ENV === 'production'
  }
}

// Enhanced event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag && ANALYTICS_CONFIG.googleAnalytics.enabled) {
    window.gtag('event', eventName, {
      custom_parameter_1: properties?.category || 'general',
      custom_parameter_2: properties?.label || '',
      value: properties?.value || 0,
      ...properties
    })
  }

  // Mixpanel
  if (typeof window !== 'undefined' && window.mixpanel && ANALYTICS_CONFIG.mixpanel.enabled) {
    window.mixpanel.track(eventName, {
      page_url: window.location.href,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      ...properties
    })
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, properties)
  }
}

// Conversion tracking
export const trackConversion = (conversionType: string, value?: number, currency = 'USD') => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: currency,
    category: 'conversion'
  })

  // Google Ads conversion tracking
  if (typeof window !== 'undefined' && window.gtag && ANALYTICS_CONFIG.googleAnalytics.enabled) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion ID
      value: value,
      currency: currency,
      transaction_id: `conv_${Date.now()}`
    })
  }
}

// A/B testing utilities
export const getVariant = (testName: string, variants: string[]): string => {
  if (typeof window === 'undefined') return variants[0]
  
  const stored = localStorage.getItem(`ab_test_${testName}`)
  if (stored && variants.includes(stored)) return stored
  
  const variant = variants[Math.floor(Math.random() * variants.length)]
  localStorage.setItem(`ab_test_${testName}`, variant)
  
  trackEvent('ab_test_assignment', {
    test_name: testName,
    variant: variant,
    category: 'ab_testing'
  })
  
  return variant
}

// Form tracking
export const trackFormInteraction = (formName: string, action: 'start' | 'step' | 'complete' | 'abandon', step?: string) => {
  trackEvent('form_interaction', {
    form_name: formName,
    action: action,
    step: step,
    category: 'form'
  })
}

// Button/CTA tracking
export const trackCTAClick = (ctaText: string, location: string, destination?: string) => {
  trackEvent('cta_click', {
    cta_text: ctaText,
    location: location,
    destination: destination,
    category: 'cta'
  })
}

// Demo tracking
export const trackDemoInteraction = (action: string, demoType: string, step?: string) => {
  trackEvent('demo_interaction', {
    action: action,
    demo_type: demoType,
    step: step,
    category: 'demo'
  })
}

// Lead scoring
export const trackLeadAction = (action: string, score: number, details?: Record<string, any>) => {
  trackEvent('lead_action', {
    action: action,
    score: score,
    category: 'lead_scoring',
    ...details
  })
}

interface TrackingProviderProps {
  children: React.ReactNode
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    if (ANALYTICS_CONFIG.googleAnalytics.enabled) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', ANALYTICS_CONFIG.googleAnalytics.measurementId, {
          page_location: window.location.href,
          page_title: document.title
        })
      }
    }
  }, [pathname, searchParams])

  // Track UTM parameters and referrers
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const utmSource = searchParams.get('utm_source')
      const utmMedium = searchParams.get('utm_medium')
      const utmCampaign = searchParams.get('utm_campaign')
      const utmContent = searchParams.get('utm_content')
      const utmTerm = searchParams.get('utm_term')
      
      if (utmSource || utmMedium || utmCampaign) {
        trackEvent('utm_tracking', {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          referrer: document.referrer,
          category: 'traffic_source'
        })
      }
    }
  }, [searchParams])

  return (
    <>
      {/* Google Analytics */}
      {ANALYTICS_CONFIG.googleAnalytics.enabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.googleAnalytics.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ANALYTICS_CONFIG.googleAnalytics.measurementId}', {
                page_title: document.title,
                page_location: window.location.href,
                anonymize_ip: true,
                allow_enhanced_conversions: true
              });
            `}
          </Script>
        </>
      )}

      {/* Hotjar */}
      {ANALYTICS_CONFIG.hotjar.enabled && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${ANALYTICS_CONFIG.hotjar.hjid},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* Mixpanel */}
      {ANALYTICS_CONFIG.mixpanel.enabled && ANALYTICS_CONFIG.mixpanel.token && (
        <Script id="mixpanel" strategy="afterInteractive">
          {`
            (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
            mixpanel.init("${ANALYTICS_CONFIG.mixpanel.token}", {
              debug: ${process.env.NODE_ENV === 'development'},
              track_pageview: true,
              persistence: 'localStorage'
            });
          `}
        </Script>
      )}

      {/* Enhanced tracking for single-page app navigation */}
      <Script id="spa-tracking" strategy="afterInteractive">
        {`
          // Track scroll depth
          let maxScrollDepth = 0;
          window.addEventListener('scroll', function() {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollDepth > maxScrollDepth) {
              maxScrollDepth = scrollDepth;
              if (maxScrollDepth % 25 === 0 && maxScrollDepth > 0) {
                if (window.gtag) {
                  window.gtag('event', 'scroll_depth', {
                    custom_parameter_1: 'engagement',
                    value: maxScrollDepth
                  });
                }
              }
            }
          });

          // Track time on page
          let startTime = Date.now();
          window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            if (timeOnPage > 10 && window.gtag) {
              window.gtag('event', 'time_on_page', {
                custom_parameter_1: 'engagement',
                value: timeOnPage
              });
            }
          });
        `}
      </Script>

      {children}
    </>
  )
}

// Global type extensions
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    mixpanel: any
    hj: (...args: any[]) => void
  }
}