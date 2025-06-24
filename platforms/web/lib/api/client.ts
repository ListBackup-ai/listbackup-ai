import axios from 'axios'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.listbackup.ai'
export const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://api.listbackup.ai'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token to API client
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('serviceToken')
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
    const token = localStorage.getItem('serviceToken')
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
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const { data } = await authApiClient.post('/auth/refresh', {
            refreshToken,
          })
          
          if (data.success && data.data) {
            localStorage.setItem('serviceToken', data.data.accessToken)
            localStorage.setItem('accessToken', data.data.accessToken)
            localStorage.setItem('refreshToken', data.data.refreshToken)
            
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
            return apiClient(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear()
        window.location.href = '/login'
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
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)