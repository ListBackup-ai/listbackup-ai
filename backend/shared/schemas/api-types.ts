// Shared TypeScript types for ListBackup.ai API

export interface User {
  userId: string
  email: string
  name: string
  accountId: string
  role: 'user' | 'admin' | 'owner'
  mfaEnabled: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  timezone: string
  notifications: {
    email: boolean
    slack: boolean
    backupComplete: boolean
    backupFailed: boolean
    weeklyReport: boolean
  }
  theme: 'light' | 'dark' | 'auto'
}

export interface Account {
  accountId: string
  userId: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  billingEmail: string
  createdAt: string
  updatedAt: string
  settings: AccountSettings
  usage: AccountUsage
}

export interface AccountSettings {
  maxSources: number
  maxStorageGB: number
  maxBackupJobs: number
  retentionDays: number
  encryptionEnabled: boolean
  twoFactorRequired: boolean
}

export interface AccountUsage {
  sources: number
  storageUsedGB: number
  backupJobs: number
  monthlyBackups: number
  monthlyAPIRequests: number
}

export interface DataSource {
  sourceId: string
  accountId: string
  type: 'google-drive' | 'dropbox' | 'slack' | 'onedrive' | 'notion' | 'github'
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  credentials: SourceCredentials
  settings: SourceSettings
  stats: SourceStats
  createdAt: string
  updatedAt: string
  lastSyncAt?: string
}

export interface SourceCredentials {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  scope?: string[]
  accountInfo?: {
    email?: string
    name?: string
    id?: string
  }
}

export interface SourceSettings {
  autoSync: boolean
  syncFrequency: 'hourly' | 'daily' | 'weekly'
  includeFolders: string[]
  excludeFolders: string[]
  fileTypes: string[]
  maxFileSize: number
  compressionEnabled: boolean
}

export interface SourceStats {
  totalFiles: number
  totalSizeBytes: number
  lastBackupFiles: number
  lastBackupSizeBytes: number
  errorCount: number
  successRate: number
}

export interface BackupJob {
  jobId: string
  accountId: string
  sourceIds: string[]
  name: string
  description?: string
  type: 'full' | 'incremental' | 'differential'
  schedule: JobSchedule
  settings: JobSettings
  status: 'active' | 'paused' | 'stopped' | 'error'
  stats: JobStats
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  nextRunAt?: string
}

export interface JobSchedule {
  enabled: boolean
  cron: string
  timezone: string
  retryPolicy: {
    maxRetries: number
    backoffMultiplier: number
    maxBackoffSeconds: number
  }
}

export interface JobSettings {
  priority: 'low' | 'normal' | 'high'
  parallel: boolean
  maxConcurrency: number
  chunkSizeBytes: number
  compressionLevel: number
  encryptionEnabled: boolean
  notifyOnComplete: boolean
  notifyOnFailure: boolean
}

export interface JobStats {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDurationMs: number
  totalFilesProcessed: number
  totalBytesProcessed: number
  lastRunDurationMs?: number
  lastRunFiles?: number
  lastRunBytes?: number
}

export interface BackupRun {
  runId: string
  jobId: string
  accountId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  type: 'manual' | 'scheduled'
  progress: RunProgress
  stats: RunStats
  logs: RunLog[]
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface RunProgress {
  percentage: number
  currentStep: string
  totalSteps: number
  currentStepProgress: number
  filesProcessed: number
  totalFiles: number
  bytesProcessed: number
  totalBytes: number
  estimatedTimeRemainingMs?: number
}

export interface RunStats {
  filesAdded: number
  filesUpdated: number
  filesDeleted: number
  filesSkipped: number
  filesError: number
  bytesTransferred: number
  compressionRatio: number
  transferRateBytesPerSecond: number
}

export interface RunLog {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
}

export interface FileMetadata {
  fileId: string
  accountId: string
  sourceId: string
  runId?: string
  name: string
  path: string
  type: 'file' | 'folder'
  mimeType?: string
  sizeBytes: number
  hash: string
  checksumMd5?: string
  checksumSha256?: string
  permissions?: string[]
  tags?: string[]
  metadata: Record<string, any>
  createdAt: string
  modifiedAt: string
  backedUpAt: string
  s3Key: string
  s3Bucket: string
  encrypted: boolean
  compressed: boolean
}

export interface Activity {
  activityId: string
  accountId: string
  userId?: string
  type: 'backup' | 'restore' | 'sync' | 'auth' | 'config' | 'api'
  action: string
  resource?: string
  resourceId?: string
  status: 'success' | 'warning' | 'error'
  message: string
  metadata?: Record<string, any>
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

// API Request/Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  requestId: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface LoginRequest {
  email: string
  password: string
  mfaCode?: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  accountName?: string
}

export interface CreateSourceRequest {
  type: DataSource['type']
  name: string
  credentials: SourceCredentials
  settings?: Partial<SourceSettings>
}

export interface CreateJobRequest {
  sourceIds: string[]
  name: string
  description?: string
  type: BackupJob['type']
  schedule: JobSchedule
  settings?: Partial<JobSettings>
}

export interface FileSearchRequest {
  query?: string
  sourceIds?: string[]
  fileTypes?: string[]
  dateRange?: {
    from: string
    to: string
  }
  sizeRange?: {
    min: number
    max: number
  }
  page?: number
  limit?: number
  sortBy?: 'name' | 'size' | 'modified' | 'created'
  sortOrder?: 'asc' | 'desc'
}

export interface AnalyticsRequest {
  timeRange: '1h' | '24h' | '7d' | '30d' | '90d'
  metrics: string[]
  groupBy?: 'hour' | 'day' | 'week'
  filters?: Record<string, any>
}