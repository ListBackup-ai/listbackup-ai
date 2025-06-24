import axios, { AxiosInstance, AxiosResponse } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = __DEV__ 
      ? 'https://knitting-par-frankfurt-adjust.trycloudflare.com'
      : 'https://api.listbackup.ai'

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `ListBackup-Mobile/${Platform.OS}`,
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('auth_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error)
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          await SecureStore.deleteItemAsync('auth_token')
          await SecureStore.deleteItemAsync('refresh_token')
          // You might want to use a navigation service here
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) {
    const response = await this.client.post('/auth/register', userData)
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('refresh_token')
    }
  }

  // Dashboard
  async getDashboard() {
    const response = await this.client.get('/dashboard')
    return response.data
  }

  // Sources
  async getSources() {
    const response = await this.client.get('/sources')
    return response.data
  }

  async createSource(sourceData: any) {
    const response = await this.client.post('/sources', sourceData)
    return response.data
  }

  async updateSource(sourceId: string, sourceData: any) {
    const response = await this.client.put(`/sources/${sourceId}`, sourceData)
    return response.data
  }

  async deleteSource(sourceId: string) {
    const response = await this.client.delete(`/sources/${sourceId}`)
    return response.data
  }

  // Integrations
  async getIntegrations() {
    const response = await this.client.get('/integrations')
    return response.data
  }

  async getAvailableIntegrations() {
    const response = await this.client.get('/integrations/available')
    return response.data
  }

  // Data
  async getData(params?: {
    sourceId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) {
    const response = await this.client.get('/data', { params })
    return response.data
  }

  async exportData(params: {
    sourceId: string
    format: 'json' | 'csv' | 'xlsx'
    startDate?: string
    endDate?: string
  }) {
    const response = await this.client.post('/data/export', params, {
      responseType: 'blob',
    })
    return response.data
  }

  // Jobs
  async getJobs() {
    const response = await this.client.get('/jobs')
    return response.data
  }

  async createJob(jobData: any) {
    const response = await this.client.post('/jobs', jobData)
    return response.data
  }

  async runJob(jobId: string) {
    const response = await this.client.post(`/jobs/${jobId}/run`)
    return response.data
  }

  // Activity
  async getActivity(params?: {
    limit?: number
    offset?: number
    sourceId?: string
  }) {
    const response = await this.client.get('/activity', { params })
    return response.data
  }

  // Account
  async getAccount() {
    const response = await this.client.get('/account')
    return response.data
  }

  async updateAccount(accountData: any) {
    const response = await this.client.put('/account', accountData)
    return response.data
  }

  // Generic methods
  async get(url: string, config?: any) {
    const response = await this.client.get(url, config)
    return response
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.client.post(url, data, config)
    return response
  }

  async put(url: string, data?: any, config?: any) {
    const response = await this.client.put(url, data, config)
    return response
  }

  async delete(url: string, config?: any) {
    const response = await this.client.delete(url, config)
    return response
  }
}

export const apiClient = new ApiClient()