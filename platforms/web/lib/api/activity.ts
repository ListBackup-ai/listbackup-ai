import { apiClient } from './client'

export interface ActivityEvent {
  eventId: string
  accountId: string
  userId?: string
  timestamp: number
  type: 'job.created' | 'job.started' | 'job.completed' | 'job.failed' | 
        'source.created' | 'source.updated' | 'source.deleted' | 'source.synced' |
        'file.uploaded' | 'file.downloaded' | 'file.deleted' |
        'account.updated' | 'user.login' | 'user.logout'
  category: 'job' | 'source' | 'file' | 'account' | 'user' | 'system'
  description: string
  metadata?: {
    jobId?: string
    sourceId?: string
    fileId?: string
    [key: string]: any
  }
  severity: 'info' | 'warning' | 'error' | 'success'
}

export interface ActivityFilter {
  startTime?: number
  endTime?: number
  type?: string[]
  category?: string[]
  severity?: string[]
  limit?: number
  offset?: number
}

export interface ActivityStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  recentEvents: ActivityEvent[]
}

export interface ActivityResponse {
  activities: ActivityEvent[]
  groupedActivities: any[]
  count: number
  filters: any
  lastKey: string | null
  hasMore: boolean
}

export const activityApi = {
  list: async (filter?: ActivityFilter) => {
    const response = await apiClient.get<ActivityResponse>('/activity', {
      params: filter
    })
    return response.data
  },

  get: async (eventId: string) => {
    const response = await apiClient.get<ActivityEvent>(`/activity/${eventId}`)
    return response.data
  },

  stats: async (period?: 'day' | 'week' | 'month') => {
    const response = await apiClient.get<ActivityStats>('/activity/stats', {
      params: { period }
    })
    return response.data
  },
}