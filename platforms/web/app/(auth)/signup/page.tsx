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

interface SignupData {
  email: string
  password: string
  name: string
  company?: string
}

interface SignupResponse {
  serviceToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    accountId: string
    role: string
  }
}

export default function SignupPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    company: '',
  })

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await api.auth.signup(data)
    },
    onSuccess: () => {
      // Registration successful, redirect to login
      router.push('/login?registered=true')
    },
    onError: (error: any) => {
      console.error('Signup failed:', error)
      // TODO: Add toast notification
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signupMutation.mutate(formData)
  }

  return (
    <Card className="border-muted">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={signupMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={signupMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              type="text"
              placeholder="Acme Inc."
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={signupMutation.isPending}
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
              disabled={signupMutation.isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}