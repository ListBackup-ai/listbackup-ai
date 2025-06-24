import { apiClient } from './client'

export interface DataSource {
  sourceId: string
  accountId: string
  name: string
  type: 'keap' | 'stripe' | 'gohighlevel' | 'activecampaign' | 'mailchimp' | 'zendesk' | 'shopify' | 'quickbooks' | 'google-drive' | 'dropbox' | 'slack' | 'notion' | 'github' | 'gitlab' | 'salesforce' | 'hubspot'
  status: 'active' | 'inactive' | 'error' | 'pending'
  config: {
    [key: string]: any
  }
  lastSync?: string
  lastTest?: {
    timestamp: string
    success: boolean
    error?: string
  }
  nextSync?: string
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
  createdAt: string
  updatedAt: string
  createdBy: string
  lastError?: string
  statistics?: {
    totalFiles: number
    totalSize: number
    lastBackupSize: number
    lastBackupFiles: number
  }
}

export interface CreateSourceRequest {
  name: string
  type: DataSource['type']
  config: Record<string, any>
  syncFrequency?: DataSource['syncFrequency']
}

export interface UpdateSourceRequest {
  name?: string
  config?: Record<string, any>
  syncFrequency?: DataSource['syncFrequency']
  status?: DataSource['status']
}

export const sourcesApi = {
  list: async () => {
    const response = await apiClient.get<DataSource[]>('/sources')
    return response.data
  },

  get: async (sourceId: string) => {
    const response = await apiClient.get<DataSource>(`/sources/${sourceId}`)
    return response.data
  },

  create: async (data: CreateSourceRequest) => {
    const response = await apiClient.post<DataSource>('/sources', data)
    return response.data
  },

  update: async (sourceId: string, data: UpdateSourceRequest) => {
    const response = await apiClient.put<DataSource>(`/sources/${sourceId}`, data)
    return response.data
  },

  delete: async (sourceId: string) => {
    const response = await apiClient.delete(`/sources/${sourceId}`)
    return response.data
  },

  test: async (sourceId: string) => {
    const response = await apiClient.post(`/sources/${sourceId}/test`)
    return response.data
  },

  sync: async (sourceId: string) => {
    const response = await apiClient.post(`/sources/${sourceId}/sync`)
    return response.data
  },
}