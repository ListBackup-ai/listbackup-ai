'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'

interface OAuthButtonProps {
  platformType: string
  sourceId?: string
  onSuccess?: (sourceId: string) => void
  className?: string
  children?: React.ReactNode
}

export function OAuthButton({ 
  platformType, 
  sourceId,
  onSuccess,
  className,
  children 
}: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleOAuthConnect = async () => {
    setIsLoading(true)

    try {
      // Special handling for Shopify which requires shop domain
      let additionalData = {}
      if (platformType === 'shopify') {
        const shopDomain = prompt('Enter your Shopify shop domain (e.g., myshop.myshopify.com):')
        if (!shopDomain) {
          setIsLoading(false)
          return
        }
        additionalData = { shopDomain }
      }

      // Initiate OAuth flow
      const response = await api.platforms.initiateOAuth(platformType, {
        sourceId,
        returnUrl: window.location.href,
        ...additionalData
      })

      if (response.authUrl) {
        // Store state for verification on return
        sessionStorage.setItem('oauth_state', response.state)
        
        // Redirect to OAuth provider
        window.location.href = response.authUrl
      }
    } catch (error: any) {
      console.error('OAuth initiation error:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to initiate OAuth connection',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check for OAuth callback parameters
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const returnedSourceId = urlParams.get('sourceId')
    
    if (success === 'true' && returnedSourceId) {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(returnedSourceId)
      }
      
      // Show success message
      toast({
        title: 'Connected successfully',
        description: 'Your account has been connected.',
      })
    } else if (error) {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Show error message
      toast({
        title: 'Connection failed',
        description: decodeURIComponent(error),
        variant: 'destructive'
      })
    }
  }

  return (
    <Button 
      onClick={handleOAuthConnect}
      disabled={isLoading}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || 'Connect with OAuth'}
    </Button>
  )
}