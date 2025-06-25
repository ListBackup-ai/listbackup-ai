import { apiClient } from './client'

export interface PlatformConnection {
  connectionId: string
  accountId: string
  platformId: string
  name: string
  description?: string
  status: 'active' | 'expired' | 'error' | 'pending'
  authType: 'oauth' | 'apikey' | 'custom'
  lastConnected?: string
  lastTestedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface CreatePlatformConnectionRequest {
  platformId: string
  name: string
  description?: string
  authType: 'oauth' | 'apikey' | 'custom'
  credentials?: Record<string, any> // For API key connections
}

export interface UpdatePlatformConnectionRequest {
  name?: string
  description?: string
  credentials?: Record<string, any>
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  details?: {
    accountInfo?: Record<string, any>
    permissions?: string[]
    quotas?: Record<string, any>
  }
}

export const platformConnectionsApi = {
  list: async (platformId?: string) => {
    const params = platformId ? `?platformId=${platformId}` : ''
    const response = await apiClient.get<{ connections: PlatformConnection[], total: number }>(`/platform-connections${params}`)
    return response.data
  },

  get: async (connectionId: string) => {
    const response = await apiClient.get<PlatformConnection>(`/platform-connections/${connectionId}`)
    return response.data
  },

  create: async (data: CreatePlatformConnectionRequest) => {
    const response = await apiClient.post<PlatformConnection>('/platform-connections', data)
    return response.data
  },

  update: async (connectionId: string, data: UpdatePlatformConnectionRequest) => {
    const response = await apiClient.put<PlatformConnection>(`/platform-connections/${connectionId}`, data)
    return response.data
  },

  delete: async (connectionId: string) => {
    const response = await apiClient.delete(`/platform-connections/${connectionId}`)
    return response.data
  },

  test: async (connectionId: string) => {
    const response = await apiClient.post<TestConnectionResponse>(`/platform-connections/${connectionId}/test`)
    return response.data
  },

  reconnect: async (connectionId: string) => {
    const response = await apiClient.post<{ authUrl?: string, success: boolean }>(`/platform-connections/${connectionId}/reconnect`)
    return response.data
  },
}