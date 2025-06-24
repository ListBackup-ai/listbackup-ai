import { authApiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  company?: string
}

export interface LoginResponse {
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

export interface RefreshTokenRequest {
  refreshToken: string
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await authApiClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  signup: async (data: SignupRequest) => {
    const response = await authApiClient.post<LoginResponse>('/auth/register', data)
    return response.data
  },

  logout: async () => {
    const response = await authApiClient.post('/auth/logout')
    return response.data
  },

  refresh: async (data: RefreshTokenRequest) => {
    const response = await authApiClient.post<LoginResponse>('/auth/refresh', data)
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await authApiClient.post('/auth/verify', { token })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await authApiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await authApiClient.post('/auth/reset-password', { token, password })
    return response.data
  },
}