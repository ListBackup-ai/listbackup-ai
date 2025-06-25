import { BaseAPI } from './base'

export interface Job {
  jobId: string
  accountId: string
  name: string
  description?: string
  type: 'backup' | 'sync' | 'export' | 'migration'
  status: 'active' | 'paused' | 'completed' | 'failed'
  sources?: Array<{
    sourceId: string
    sourceName: string
  }>
  schedule?: {
    enabled: boolean
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
    timezone?: string
  }
  config?: {
    destination?: string
    format?: string
    compression?: boolean
    encryption?: boolean
    filters?: any
    options?: any
  }
  lastRun?: {
    runId: string
    status: 'running' | 'completed' | 'failed'
    startedAt: string
    completedAt?: string
    progress?: number
    error?: string
  }
  nextRunAt?: string
  statistics?: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageDuration: number
    totalDataProcessed: number
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface JobRun {
  runId: string
  jobId: string
  jobName: string
  accountId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  duration?: string
  progress?: {
    current: number
    total: number
    percentage: number
  }
  statistics?: {
    recordsProcessed: number
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
    downloadUrl?: string
    summary?: any
  }
}

export interface CreateJobRequest {
  name: string
  description?: string
  type: Job['type']
  sources: Array<{
    sourceId: string
  }>
  schedule?: Job['schedule']
  config?: Job['config']
}

export interface UpdateJobRequest {
  name?: string
  description?: string
  status?: Job['status']
  schedule?: Job['schedule']
  config?: Job['config']
}

export interface JobsListResponse {
  jobs: Job[]
}

export interface JobRunsListResponse {
  runs: JobRun[]
}

class JobsAPI extends BaseAPI {
  async list(params?: { accountId?: string; status?: string; type?: string }): Promise<JobsListResponse> {
    return this.get('/jobs', params)
  }

  async getJob(jobId: string): Promise<Job> {
    return this.get(`/jobs/${jobId}`)
  }

  async create(data: CreateJobRequest): Promise<Job> {
    return this.post('/jobs', data)
  }

  async update(jobId: string, data: UpdateJobRequest): Promise<Job> {
    return this.put(`/jobs/${jobId}`, data)
  }

  async deleteJob(jobId: string): Promise<void> {
    return this.delete(`/jobs/${jobId}`)
  }

  async run(jobId: string): Promise<JobRun> {
    return this.post(`/jobs/${jobId}/run`, {})
  }

  async pause(jobId: string): Promise<Job> {
    return this.post<Job>(`/jobs/${jobId}/pause`, {})
  }

  async resume(jobId: string): Promise<Job> {
    return this.post<Job>(`/jobs/${jobId}/resume`, {})
  }

  async getRuns(jobId: string, params?: { limit?: number; status?: string }): Promise<JobRunsListResponse> {
    return this.get<JobRunsListResponse>(`/jobs/${jobId}/runs`, params)
  }

  async getRecentRuns(params?: { limit?: number; accountId?: string }): Promise<JobRunsListResponse> {
    return this.get<JobRunsListResponse>('/jobs/runs/recent', params)
  }

  async getRun(jobId: string, runId: string): Promise<JobRun> {
    return this.get<JobRun>(`/jobs/${jobId}/runs/${runId}`)
  }

  async cancelRun(jobId: string, runId: string): Promise<JobRun> {
    return this.post<JobRun>(`/jobs/${jobId}/runs/${runId}/cancel`, {})
  }

  async getRunLogs(jobId: string, runId: string): Promise<{ logs: string[] }> {
    return this.get<{ logs: string[] }>(`/jobs/${jobId}/runs/${runId}/logs`)
  }
}

export const jobsApi = new JobsAPI()