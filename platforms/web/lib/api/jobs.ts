import { apiClient } from './client'

export interface BackupJob {
  jobId: string
  accountId: string
  sourceId: string
  name: string
  type: 'backup' | 'sync' | 'export' | 'import'
  status: 'active' | 'paused' | 'completed' | 'failed'
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  config: {
    destination?: string
    filters?: any
    options?: any
  }
  lastRun?: number
  nextRun?: number
  statistics?: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageDuration: number
    totalDataProcessed: number
  }
  createdAt: number
  updatedAt: number
}

export interface JobRun {
  runId: string
  jobId: string
  accountId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
  duration?: number
  progress?: {
    current: number
    total: number
    percentage: number
  }
  statistics?: {
    filesProcessed: number
    bytesProcessed: number
    errors: number
    warnings: number
  }
  error?: {
    message: string
    code?: string
    details?: any
  }
  result?: {
    outputPath?: string
    summary?: any
  }
}

export interface CreateJobRequest {
  sourceId: string
  name: string
  type: BackupJob['type']
  schedule?: BackupJob['schedule']
  config?: BackupJob['config']
}

export interface UpdateJobRequest {
  name?: string
  status?: BackupJob['status']
  schedule?: BackupJob['schedule']
  config?: BackupJob['config']
}

export const jobsApi = {
  list: async () => {
    const response = await apiClient.get<BackupJob[]>('/jobs')
    return response.data
  },

  get: async (jobId: string) => {
    const response = await apiClient.get<BackupJob>(`/jobs/${jobId}`)
    return response.data
  },

  create: async (data: CreateJobRequest) => {
    const response = await apiClient.post<BackupJob>('/jobs', data)
    return response.data
  },

  update: async (jobId: string, data: UpdateJobRequest) => {
    const response = await apiClient.put<BackupJob>(`/jobs/${jobId}`, data)
    return response.data
  },

  delete: async (jobId: string) => {
    const response = await apiClient.delete(`/jobs/${jobId}`)
    return response.data
  },

  run: async (jobId: string) => {
    const response = await apiClient.post<JobRun>(`/jobs/${jobId}/run`)
    return response.data
  },

  getRuns: async (jobId: string) => {
    const response = await apiClient.get<JobRun[]>(`/jobs/${jobId}/runs`)
    return response.data
  },

  cancelRun: async (jobId: string, runId: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/runs/${runId}/cancel`)
    return response.data
  },
}