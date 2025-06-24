'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'

export default function ClientPortalLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: () => api.clients.login({ email, password }),
    onSuccess: (data) => {
      // Store the client token in a cookie
      document.cookie = `client-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
      
      toast({
        title: 'Login successful',
        description: 'Welcome to your client portal',
      })
      
      router.push('/portal')
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Invalid email or password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Client Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your backup reports and data
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Sign in to your account</CardTitle>
              <CardDescription>
                Enter your credentials to access the portal
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              
              <div className="text-sm text-center text-gray-600">
                <p>
                  First time here?{' '}
                  <a href="/portal/setup" className="font-medium text-primary hover:text-primary/90">
                    Set up your account
                  </a>
                </p>
                <p className="mt-1">
                  <a href="/portal/forgot-password" className="font-medium text-primary hover:text-primary/90">
                    Forgot your password?
                  </a>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help? Contact your account administrator or{' '}
            <a href="mailto:support@listbackup.ai" className="font-medium text-primary hover:text-primary/90">
              support@listbackup.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}