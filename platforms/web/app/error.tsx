'use client'

import { useEffect } from 'react'
import { LandingLayout } from '@/components/landing/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error)
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <LandingLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-destructive/20 animate-fade-in-up">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
                <p className="text-muted-foreground">
                  We encountered an unexpected error while processing your request. Our team has been notified.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={reset} className="w-full">
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

                {/* Additional Help */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/help">
                      Contact Support
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/status">
                      Check Status
                    </Link>
                  </Button>
                </div>

                {/* Error ID for support */}
                {error.digest && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Error ID: <code className="bg-muted px-1 rounded">{error.digest}</code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please include this ID when contacting support
                    </p>
                  </div>
                )}

                {/* Development Error Details */}
                {isDevelopment && (
                  <details className="mt-6 p-4 bg-muted rounded-lg">
                    <summary className="cursor-pointer font-medium flex items-center">
                      <Bug className="w-4 h-4 mr-2" />
                      Developer Details (Development Only)
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div>
                        <h4 className="font-medium text-destructive">Error Message:</h4>
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
                      {error.digest && (
                        <div>
                          <h4 className="font-medium text-destructive">Error Digest:</h4>
                          <code className="text-sm bg-destructive/10 p-2 rounded block mt-1">
                            {error.digest}
                          </code>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Suggestions */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">What you can try:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Refresh the page and try again</li>
                    <li>• Check your internet connection</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Try accessing the page from a different browser</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}