import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

export interface DashboardData {
  totalSources: number
  successfulBackups: number
  totalFiles: number
  storageUsed: number
  recentActivity: Activity[]
  backupTrends: BackupTrend[]
}

export interface Activity {
  id: string
  type: 'backup_completed' | 'backup_failed' | 'source_added' | 'sync_completed'
  title: string
  description?: string
  timestamp: string
  sourceId?: string
  sourceName?: string
}

export interface BackupTrend {
  date: string
  count: number
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await apiClient.get('/dashboard')
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  })
}