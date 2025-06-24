import { apiClient } from './client'

export interface Platform {
  id: string
  title: string
  company: string
  description: string
  categories: string[]
  logo: string
  popularityScore: number
  authType: 'api_key' | 'oauth2' | 'custom'
  fields: PlatformField[]
}

export interface PlatformField {
  name: string
  label: string
  type: 'text' | 'password' | 'email' | 'url' | 'number'
  placeholder?: string
  required: boolean
  description?: string
  validation?: {
    pattern?: string
    min?: number
    max?: number
  }
}

export interface CreateSourceFromPlatformRequest {
  name: string
  type: string
  config: Record<string, any>
}

export const platformsApi = {
  list: async () => {
    const response = await apiClient.get<{ platforms: Platform[], total: number }>('/platforms')
    return response.data
  },

  get: async (platformId: string) => {
    const response = await apiClient.get<Platform>(`/platforms/${platformId}`)
    return response.data
  },

  createSource: async (data: CreateSourceFromPlatformRequest) => {
    const response = await apiClient.post('/sources', data)
    return response.data
  },
}