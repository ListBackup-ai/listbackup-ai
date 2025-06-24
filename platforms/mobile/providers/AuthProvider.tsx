import React, { createContext, useEffect, useState, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { apiClient } from '../services/apiClient'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  emailVerified: boolean
  accountId: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => Promise<void>
  loginWithBiometrics: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.token) {
        await SecureStore.setItemAsync('auth_token', response.token)
        
        if (response.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', response.refreshToken)
        }
        
        setUser(response.user)
      } else {
        throw new Error('No token received')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      const response = await apiClient.register(userData)
      
      if (response.token) {
        await SecureStore.setItemAsync('auth_token', response.token)
        
        if (response.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', response.refreshToken)
        }
        
        setUser(response.user)
      } else {
        throw new Error('No token received')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      setUser(null)
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('refresh_token')
      await SecureStore.deleteItemAsync('biometric_token')
    }
  }

  const loginWithBiometrics = async () => {
    try {
      // Check if biometrics are available and enrolled
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available')
      }

      // Check if we have a stored biometric token
      const biometricToken = await SecureStore.getItemAsync('biometric_token')
      if (!biometricToken) {
        throw new Error('No biometric credentials stored')
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use passcode',
      })

      if (result.success) {
        // Use the stored token to log in
        await SecureStore.setItemAsync('auth_token', biometricToken)
        await refreshUser()
      } else {
        throw new Error('Biometric authentication failed')
      }
    } catch (error) {
      console.error('Biometric login failed:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.getAccount()
      setUser(response.user)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      await logout()
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    loginWithBiometrics,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}