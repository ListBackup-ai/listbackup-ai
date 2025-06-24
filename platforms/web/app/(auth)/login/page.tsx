'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@listbackup/shared/api'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Loader2 } from 'lucide-react'

interface LoginData {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  data?: {
    accessToken: string
    idToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
    user: {
      userId: string
      email: string
      name: string
      accountId: string
      role: string
      mfaEnabled: boolean
      emailVerified: boolean
    }
  }
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  })

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return await api.auth.login(data)
    },
    onSuccess: (response) => {
      console.log('Login successful:', response)
      
      if (!response.success || !response.data) {
        console.error('Login failed:', response.error)
        // TODO: Add toast notification
        return
      }
      
      const { data } = response
      console.log('Setting auth with user:', data.user)
      
      // Update user object to match auth store interface
      const user = {
        ...data.user,
        id: data.user.userId,
        drawerOpen: false,
        createdAt: Date.now()
      }
      
      setAuth(user, data.accessToken, data.refreshToken)
      
      console.log('Redirecting to dashboard...')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      console.error('Login failed:', error)
      // TODO: Add toast notification
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(formData)
  }

  return (
    <Card className="border-muted">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loginMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}