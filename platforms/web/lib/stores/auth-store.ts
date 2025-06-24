import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  userId: string
  email: string
  name: string
  accountId: string
  drawerOpen: boolean
  createdAt: number
  updatedAt?: number
  stripeCustomerId?: string
  emailVerified?: boolean
  preferences?: UserPreferences
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  sidebarCollapsed?: boolean
  language?: string
  timezone?: string
  dateFormat?: string
  notifications?: {
    email?: boolean
    browser?: boolean
    mobile?: boolean
  }
}

interface AuthState {
  user: User | null
  serviceToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, serviceToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      serviceToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, serviceToken, refreshToken) => {
        // Store both serviceToken (for legacy) and accessToken (for Cognito)
        localStorage.setItem('serviceToken', serviceToken)
        localStorage.setItem('accessToken', serviceToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('serviceUser', JSON.stringify(user))
        
        // Set cookies for middleware
        if (typeof document !== 'undefined') {
          document.cookie = `serviceToken=${serviceToken}; path=/; max-age=${24 * 60 * 60}` // 24 hours
          document.cookie = `accessToken=${serviceToken}; path=/; max-age=${24 * 60 * 60}` // 24 hours
          document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}` // 30 days
        }
        
        set({
          user,
          serviceToken,
          refreshToken,
          isAuthenticated: true,
        })
      },
      clearAuth: () => {
        localStorage.removeItem('serviceToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('serviceUser')
        localStorage.removeItem('user')
        localStorage.removeItem('account')
        
        // Clear cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'serviceToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        }
        
        set({
          user: null,
          serviceToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)