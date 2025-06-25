import axios from 'axios'
import { getApiConfig, getPlatformConfig, Platform } from '../config'

const apiConfig = getApiConfig()
const platformConfig = getPlatformConfig()

export const API_BASE_URL = apiConfig.baseUrl
export const AUTH_API_BASE_URL = apiConfig.baseUrl

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
})

export const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
})

// Platform-specific storage abstraction
const storage = {
  getItem: (key: string): string | null => {
    if (Platform.isWeb) {
      return localStorage.getItem(key)
    }
    // For React Native, this would use AsyncStorage
    // For iOS native, this would use UserDefaults/Keychain
    return null
  },
  setItem: (key: string, value: string): void => {
    if (Platform.isWeb) {
      localStorage.setItem(key, value)
    }
    // Platform-specific implementations
  },
  removeItem: (key: string): void => {
    if (Platform.isWeb) {
      localStorage.removeItem(key)
    }
    // Platform-specific implementations
  },
  clear: (): void => {
    if (Platform.isWeb) {
      localStorage.clear()
    }
    // Platform-specific implementations
  },
}

// Request interceptor to add auth token to API client
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getItem('serviceToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token to Auth API client
authApiClient.interceptors.request.use(
  (config) => {
    const token = storage.getItem('serviceToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh for API client
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = storage.getItem('refreshToken')
        if (refreshToken) {
          const { data } = await authApiClient.post('/auth/refresh', {
            refreshToken,
          })
          
          if (data.success && data.data) {
            storage.setItem('serviceToken', data.data.accessToken)
            storage.setItem('accessToken', data.data.accessToken)
            storage.setItem('refreshToken', data.data.refreshToken)
            
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
            return apiClient(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        storage.clear()
        if (Platform.isWeb) {
          window.location.href = '/login'
        }
        // For mobile platforms, would trigger navigation to login screen
      }
    }

    return Promise.reject(error)
  }
)

// Response interceptor for auth API client
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't retry on auth endpoints to avoid infinite loops
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      storage.clear()
      if (Platform.isWeb) {
        window.location.href = '/login'
      }
      // For mobile platforms, would trigger navigation to login screen
    }
    return Promise.reject(error)
  }
)