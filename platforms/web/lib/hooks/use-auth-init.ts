'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function useAuthInit() {
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Check if we have tokens in localStorage
    const serviceToken = localStorage.getItem('serviceToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const userStr = localStorage.getItem('serviceUser')

    if (serviceToken && refreshToken && userStr && !isAuthenticated) {
      try {
        const user = JSON.parse(userStr)
        console.log('Restoring auth from localStorage:', { user, hasTokens: !!serviceToken })
        setAuth(user, serviceToken, refreshToken)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        clearAuth()
      }
    } else if (!serviceToken && isAuthenticated) {
      // Clear auth if no tokens but state says authenticated
      console.log('No tokens found, clearing auth state')
      clearAuth()
    }
  }, [setAuth, clearAuth, isAuthenticated])
}