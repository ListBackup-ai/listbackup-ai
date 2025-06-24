'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface BrandingData {
  domain?: {
    domainId: string
    domainName: string
    brandingId?: string
  }
  branding?: {
    brandingId: string
    name: string
    logos: {
      light: {
        full?: string
        compact?: string
        square?: string
      }
      dark: {
        full?: string
        compact?: string
        square?: string
      }
    }
    colors?: {
      primary: string
      secondary: string
      accent: string
      background: string
      foreground: string
      text?: string
      textMuted?: string
      success?: string
      warning?: string
      error?: string
      info?: string
    }
    fonts?: {
      heading: string
      body: string
      monospace?: string
      size?: 'small' | 'medium' | 'large'
    }
    customCss?: string
  }
  default: boolean
}

export function BrandingLoader() {
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    async function loadBranding() {
      try {
        // Get current domain
        const currentDomain = window.location.hostname
        
        // Skip if localhost or development
        if (currentDomain === 'localhost' || currentDomain.includes('127.0.0.1')) {
          setIsLoading(false)
          return
        }

        // Check if this is a system domain
        const systemDomains = [
          'listbackup.ai',
          'app.listbackup.ai',
          'dashboard.listbackup.ai',
          'api.listbackup.ai'
        ]
        
        if (systemDomains.some(domain => currentDomain === domain || currentDomain.endsWith(`.${domain}`))) {
          // Use default branding for system domains
          setIsLoading(false)
          return
        }

        // Fetch branding for custom domain
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/branding?domain=${encodeURIComponent(currentDomain)}`)
        
        if (!response.ok) {
          console.error('Failed to load branding:', response.statusText)
          setIsLoading(false)
          return
        }

        const data: BrandingData = await response.json()
        setBranding(data)
        
        // Apply branding if not default
        if (!data.default && data.branding) {
          applyBranding(data.branding, currentTheme || 'light')
        }
      } catch (error) {
        console.error('Error loading branding:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBranding()
  }, [])

  // Re-apply branding when theme changes
  useEffect(() => {
    if (!isLoading && branding && !branding.default && branding.branding) {
      applyBranding(branding.branding, currentTheme || 'light')
    }
  }, [currentTheme, branding, isLoading])

  function applyBranding(brandingData: BrandingData['branding'], theme: string) {
    if (!brandingData) return

    // Update logos
    if (brandingData.logos) {
      const logos = theme === 'dark' ? brandingData.logos.dark : brandingData.logos.light
      
      // Update favicon
      if (logos.square) {
        updateFavicon(logos.square)
      }
      
      // Store logos in localStorage for use by other components
      localStorage.setItem('custom-branding-logos', JSON.stringify(logos))
      
      // Dispatch event so other components can update
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: { logos, theme } }))
    }

    // Apply colors
    if (brandingData.colors) {
      const root = document.documentElement
      
      // Convert hex colors to HSL for CSS variables
      Object.entries(brandingData.colors).forEach(([key, value]) => {
        if (value) {
          const hsl = hexToHSL(value)
          root.style.setProperty(`--${key}`, hsl)
        }
      })
    }

    // Apply fonts
    if (brandingData.fonts) {
      const root = document.documentElement
      
      if (brandingData.fonts.heading) {
        root.style.setProperty('--font-heading', brandingData.fonts.heading)
      }
      if (brandingData.fonts.body) {
        root.style.setProperty('--font-body', brandingData.fonts.body)
      }
    }

    // Apply custom CSS
    if (brandingData.customCss) {
      let styleEl = document.getElementById('custom-branding-styles')
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'custom-branding-styles'
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = brandingData.customCss
    }

    // Update document title
    if (brandingData.name) {
      document.title = brandingData.name
    }
  }

  function updateFavicon(iconUrl: string) {
    // Remove existing favicons
    const existingLinks = document.querySelectorAll("link[rel*='icon']")
    existingLinks.forEach(link => link.remove())

    // Add new favicon
    const link = document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = iconUrl
    document.head.appendChild(link)

    // Also add as apple-touch-icon
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = iconUrl
    document.head.appendChild(appleLink)
  }

  function hexToHSL(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  // This component doesn't render anything
  return null
}

// Hook to use branding data in other components
export function useBranding() {
  const [logos, setLogos] = useState<any>(null)
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('custom-branding-logos')
    if (stored) {
      setLogos(JSON.parse(stored))
    }

    // Listen for updates
    function handleUpdate(event: CustomEvent) {
      if (event.detail.theme === currentTheme) {
        setLogos(event.detail.logos)
      }
    }

    window.addEventListener('branding-updated' as any, handleUpdate)
    return () => window.removeEventListener('branding-updated' as any, handleUpdate)
  }, [currentTheme])

  return { logos }
}