import { apiClient } from './client'

export interface PlatformSourceDefaults {
  syncFrequency?: string
  dataRetention?: number
  includeArchived?: boolean
  filters?: Record<string, any>
  customSettings?: Record<string, any>
}

export interface PlatformSource {
  platformSourceId: string
  platformId: string
  name: string
  displayName: string
  description: string
  dataType: string
  category: string
  icon?: string
  requiresConnection: boolean
  defaultSettings: PlatformSourceDefaults
  availableSettings: {
    field: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
    options?: { value: string; label: string }[]
    required?: boolean
    defaultValue?: any
  }[]
  estimatedSize?: string
  syncDuration?: string
  features: string[]
  limitations?: string[]
  createdAt: string
  updatedAt: string
}

export interface ListPlatformSourcesResponse {
  sources: PlatformSource[]
  total: number
  categories: string[]
}

export const platformSourcesApi = {
  list: async (platformId: string) => {
    const response = await apiClient.get<ListPlatformSourcesResponse>(`/platforms/${platformId}/sources`)
    return response.data
  },

  get: async (platformId: string, platformSourceId: string) => {
    const response = await apiClient.get<PlatformSource>(`/platforms/${platformId}/sources/${platformSourceId}`)
    return response.data
  },

  // Get all available platform sources across all platforms
  listAll: async () => {
    const response = await apiClient.get<ListPlatformSourcesResponse>('/platform-sources')
    return response.data
  },

  // Get estimated data size for a platform source
  estimate: async (platformSourceId: string, connectionId: string) => {
    const response = await apiClient.post<{
      estimatedRecords: number
      estimatedSize: string
      dataTypes: { type: string; count: number }[]
    }>(`/platform-sources/${platformSourceId}/estimate`, { connectionId })
    return response.data
  },
}