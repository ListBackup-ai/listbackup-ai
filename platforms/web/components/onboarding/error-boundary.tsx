'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  Mail
} from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export class OnboardingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Onboarding Error:', error)
      console.error('Error Info:', errorInfo)
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an error during the setup process. This shouldn't happen!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="font-mono text-xs">
                    {this.state.error.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Still having issues?
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('mailto:support@listbackup.ai?subject=Onboarding Error')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Simplified error display component
export function OnboardingErrorDisplay({ 
  error, 
  onRetry,
  onGoBack 
}: {
  error: string
  onRetry?: () => void
  onGoBack?: () => void
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-medium text-red-800 mb-2">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <div className="flex gap-2 justify-center">
          {onGoBack && (
            <Button variant="outline" size="sm" onClick={onGoBack}>
              Go Back
            </Button>
          )}
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}