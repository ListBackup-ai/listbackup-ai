'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  Info
} from 'lucide-react'
import { api, Platform, PlatformConnection } from '@listbackup/shared/api'
import { WizardStepProps } from '../onboarding-wizard'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface OAuthConnectionData {
  selectedPlatform: Platform
  selectedConnection?: PlatformConnection
  isConnecting?: boolean
  connectionAttempts?: number
  lastConnectionError?: string
}

export function OAuthConnectionStep({ 
  data, 
  setData, 
  onNext,
  canProceed,
  isLoading,
  setLoading,
  wizard
}: WizardStepProps) {
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<PlatformConnection | null>(
    data.selectedConnection || null
  )

  const platform = data.selectedPlatform as Platform

  // Fetch existing connections for this platform
  const { data: connectionsData, isLoading: isLoadingConnections, refetch } = useQuery({
    queryKey: ['platform-connections', platform?.platformId],
    queryFn: () => api.platformConnections.list(platform.platformId || platform.id),
    enabled: !!platform,
  })

  const connections = connectionsData?.connections || []
  const hasExistingConnections = connections.length > 0

  // Check if platform requires OAuth
  const requiresOAuth = platform?.authType === 'oauth2' || platform?.requiresOAuth

  // Handle OAuth connection
  const handleOAuthConnect = async () => {
    if (!platform || !currentAccount) return

    try {
      setConnectionState('connecting')
      setLoading?.(true)
      setConnectionError(null)

      // Start OAuth flow
      const response = await api.platformConnections.startOAuth({
        platformId: platform.platformId || platform.id,
        accountId: currentAccount.accountId,
        redirectUrl: `${window.location.origin}/dashboard/connections/oauth-callback`,
      })

      if (response.authUrl) {
        // Open OAuth URL in popup
        const popup = window.open(
          response.authUrl,
          'oauth-popup',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.')
        }

        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'oauth-success') {
            popup.close()
            window.removeEventListener('message', handleMessage)
            handleOAuthSuccess(event.data.connection)
          } else if (event.data.type === 'oauth-error') {
            popup.close()
            window.removeEventListener('message', handleMessage)
            handleOAuthError(event.data.error)
          }
        }

        window.addEventListener('message', handleMessage)

        // Handle popup close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            if (connectionState === 'connecting') {
              setConnectionState('error')
              setConnectionError('Connection cancelled')
            }
          }
        }, 1000)

      } else {
        throw new Error('Failed to start OAuth flow')
      }
    } catch (error: any) {
      handleOAuthError(error.message || 'Failed to connect')
    } finally {
      setLoading?.(false)
    }
  }

  const handleOAuthSuccess = (connection: PlatformConnection) => {
    setConnectionState('connected')
    setSelectedConnection(connection)
    setData({
      ...data,
      selectedConnection: connection,
      connectionAttempts: (data.connectionAttempts || 0) + 1
    })
    
    toast({
      title: 'Connected successfully!',
      description: `Your ${platform.displayName || platform.name} account is now connected.`,
    })

    // Refetch connections to update the list
    refetch()

    // Auto-advance after short delay
    setTimeout(() => {
      onNext()
    }, 1500)
  }

  const handleOAuthError = (error: string) => {
    setConnectionState('error')
    setConnectionError(error)
    setData({
      ...data,
      lastConnectionError: error,
      connectionAttempts: (data.connectionAttempts || 0) + 1
    })
    
    toast({
      title: 'Connection failed',
      description: error,
      variant: 'destructive',
    })
  }

  const handleConnectionSelect = (connection: PlatformConnection) => {
    setSelectedConnection(connection)
    setData({
      ...data,
      selectedConnection: connection
    })
    
    // Auto-advance to next step
    setTimeout(() => {
      onNext()
    }, 500)
  }

  const handleRetry = () => {
    setConnectionState('idle')
    setConnectionError(null)
    handleOAuthConnect()
  }

  useEffect(() => {
    // Update wizard data when selection changes
    if (selectedConnection) {
      setData({
        ...data,
        selectedConnection
      })
    }
  }, [selectedConnection, data, setData])

  if (!platform) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No platform selected. Please go back and select a platform.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <img 
            src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
            alt={platform.company}
            className="w-12 h-12 rounded-lg object-contain"
          />
          <div>
            <h3 className="text-lg font-semibold">
              Connect to {platform.displayName || platform.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {platform.company}
            </p>
          </div>
        </div>
      </div>

      {/* Existing Connections */}
      {hasExistingConnections && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h4 className="font-medium">Existing Connections</h4>
          </div>
          
          <div className="grid gap-3">
            {connections.map((connection) => (
              <Card
                key={connection.connectionId}
                className={cn(
                  "cursor-pointer transition-all border-2",
                  selectedConnection?.connectionId === connection.connectionId
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-muted hover:shadow-md"
                )}
                onClick={() => handleConnectionSelect(connection)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{connection.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Connected {new Date(connection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={connection.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          connection.status === 'active' && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {connection.status}
                      </Badge>
                      {selectedConnection?.connectionId === connection.connectionId && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* OAuth Connection */}
      {requiresOAuth && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h4 className="font-medium">
              {hasExistingConnections ? 'Add New Connection' : 'Connect Your Account'}
            </h4>
          </div>

          {/* OAuth Security Info */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              We use OAuth 2.0 for secure authentication. You'll be redirected to {platform.company} 
              to authorize access to your account data.
            </AlertDescription>
          </Alert>

          {/* Connection State */}
          {connectionState === 'idle' && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Ready to Connect</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the button below to securely connect your {platform.company} account
                    </p>
                    <Button 
                      onClick={handleOAuthConnect}
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect to {platform.company}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionState === 'connecting' && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Connecting...</h4>
                    <p className="text-sm text-muted-foreground">
                      Please complete the authorization in the popup window
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionState === 'connected' && selectedConnection && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-800">Successfully Connected!</h4>
                    <p className="text-sm text-green-700">
                      Your {platform.company} account "{selectedConnection.name}" is now connected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionState === 'error' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-red-800">Connection Failed</h4>
                    <p className="text-sm text-red-700 mb-4">
                      {connectionError || 'Failed to connect to your account'}
                    </p>
                    <Button 
                      onClick={handleRetry}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Manual Connection (for API key based platforms) */}
      {!requiresOAuth && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h4 className="font-medium">API Key Connection</h4>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This platform requires manual API key configuration. You'll be able to enter 
              your credentials in the next step.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Manual Configuration</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll help you set up your {platform.company} API connection manually
                  </p>
                  <Button 
                    onClick={onNext}
                    className="w-full sm:w-auto"
                  >
                    Continue to Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connection Instructions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Secure Authorization</p>
              <p className="text-sm text-muted-foreground">
                You'll be redirected to {platform.company} to authorize access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Choose Data Sources</p>
              <p className="text-sm text-muted-foreground">
                Select which data types you want to backup
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Configure Schedule</p>
              <p className="text-sm text-muted-foreground">
                Set up automatic backups to run on your schedule
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Connection Summary */}
      {selectedConnection && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Connection Ready</p>
                <p className="text-sm text-muted-foreground">
                  Using "{selectedConnection.name}" connection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}