'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. This has been reported to our team.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={resetError} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              </div>

              {/* Support */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Still having issues?
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/help">
                    Get Help
                  </Link>
                </Button>
              </div>

              {/* Development Error Details */}
              {isDevelopment && error && (
                <details className="mt-6 p-4 bg-muted rounded-lg">
                  <summary className="cursor-pointer font-medium flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Developer Details
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <h4 className="font-medium text-destructive">Error:</h4>
                      <code className="text-sm bg-destructive/10 p-2 rounded block mt-1">
                        {error.message}
                      </code>
                    </div>
                    {error.stack && (
                      <div>
                        <h4 className="font-medium text-destructive">Stack Trace:</h4>
                        <pre className="text-xs bg-destructive/10 p-2 rounded mt-1 overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error handled:', error, errorInfo)
    // In a real app, you'd send this to your error reporting service
  }
}