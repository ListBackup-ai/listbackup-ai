import { apiClient } from './client'

export interface Platform {
  platformId: string
  name: string
  displayName: string
  description: string
  category: string
  tags: string[]
  logo: string
  website?: string
  company: string
  popularityScore: number
  authMethods: string[]
  requiresOAuth: boolean
  requiresAPIKey: boolean
  dataTypes: string[]
  features: string[]
  pricing?: {
    model: string
    startingPrice?: number
  }
  status: 'active' | 'coming_soon' | 'deprecated'
  
  // Legacy fields for compatibility
  id?: string
  title?: string
  authType?: 'api_key' | 'oauth2' | 'custom'
  fields?: PlatformField[]
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

export interface OAuthInitiateRequest {
  sourceId?: string
  returnUrl?: string
  shopDomain?: string // For Shopify
}

export interface OAuthInitiateResponse {
  authUrl: string
  state: string
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

  initiateOAuth: async (platformType: string, data: OAuthInitiateRequest) => {
    const response = await apiClient.post<OAuthInitiateResponse>(
      `/platforms/${platformType}/oauth/initiate`, 
      data
    )
    return response.data
  },
}