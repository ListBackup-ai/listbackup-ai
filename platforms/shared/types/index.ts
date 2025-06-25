/**
 * Shared TypeScript types for all ListBackup.ai platforms
 */

// Base types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// User types
export interface User extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  avatar?: string
  emailVerified: boolean
  phone?: string
  timezone?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  notifications: NotificationSettings
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
}

export interface NotificationSettings {
  email: {
    backupComplete: boolean
    backupFailed: boolean
    systemUpdates: boolean
    billing: boolean
  }
  push: {
    backupComplete: boolean
    backupFailed: boolean
    systemAlerts: boolean
  }
  inApp: {
    backupComplete: boolean
    backupFailed: boolean
    systemAlerts: boolean
  }
}

// Account types
export interface Account extends BaseEntity {
  name: string
  type: 'personal' | 'business' | 'enterprise'
  ownerId: string
  parentAccountId?: string
  accountPath?: string
  level?: number
  settings: AccountSettings
  usage: AccountUsage
  subscription?: Subscription
}

export interface AccountSettings {
  backupRetention: number // days
  backupFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  encryptionEnabled: boolean
  twoFactorRequired: boolean
  allowedIntegrations: string[]
}

export interface AccountUsage {
  storageUsed: number // bytes
  storageLimit: number // bytes
  integrationsUsed: number
  integrationsLimit: number
  lastBackupDate?: string
}

// Authentication types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  accountName?: string
  accountType?: Account['type']
}

// Integration types
export interface Integration extends BaseEntity {
  name: string
  type: IntegrationType
  description: string
  logoUrl?: string
  status: 'available' | 'coming_soon' | 'deprecated'
  category: IntegrationCategory
  requiredFields: IntegrationField[]
  optionalFields: IntegrationField[]
  capabilities: IntegrationCapability[]
  pricing?: IntegrationPricing
}

export type IntegrationType = 
  | 'keap' 
  | 'stripe' 
  | 'gohighlevel' 
  | 'activecampaign' 
  | 'mailchimp' 
  | 'hubspot' 
  | 'shopify' 
  | 'salesforce' 
  | 'pipedrive' 
  | 'zendesk' 
  | 'intercom'

export type IntegrationCategory = 
  | 'crm' 
  | 'email_marketing' 
  | 'ecommerce' 
  | 'payments' 
  | 'support' 
  | 'analytics' 
  | 'all_in_one'

export interface IntegrationField {
  name: string
  type: 'text' | 'password' | 'url' | 'select' | 'checkbox'
  label: string
  description?: string
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  options?: { label: string; value: string }[]
}

export interface IntegrationCapability {
  type: 'backup' | 'sync' | 'export' | 'migration'
  description: string
  dataTypes: string[]
}

export interface IntegrationPricing {
  free: boolean
  planRequired?: 'starter' | 'professional' | 'enterprise'
  additionalCost?: number
}

// Source types
export interface Source extends BaseEntity {
  accountId: string
  integrationId: string
  integrationType: IntegrationType
  name: string
  status: SourceStatus
  connectionStatus: ConnectionStatus
  configuration: SourceConfiguration
  lastSyncDate?: string
  nextSyncDate?: string
  metrics: SourceMetrics
}

export type SourceStatus = 'active' | 'paused' | 'error' | 'disabled'
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface SourceConfiguration {
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  dataTypes: string[]
  filters?: Record<string, any>
  credentials: Record<string, any>
  settings: Record<string, any>
}

export interface SourceMetrics {
  totalRecords: number
  recordsToday: number
  recordsThisWeek: number
  recordsThisMonth: number
  lastBackupSize: number
  totalBackupSize: number
  errorCount: number
  successRate: number
}

// Job types
export interface Job extends BaseEntity {
  accountId: string
  sourceId: string
  type: JobType
  status: JobStatus
  priority: JobPriority
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  duration?: number
  result?: JobResult
  error?: string
  metadata?: Record<string, any>
}

export type JobType = 'backup' | 'sync' | 'export' | 'migration' | 'cleanup'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface JobResult {
  recordsProcessed: number
  recordsUpdated: number
  recordsCreated: number
  recordsDeleted: number
  bytesProcessed: number
  errors: string[]
  warnings: string[]
}

// Data types
export interface DataRecord {
  id: string
  sourceId: string
  type: string
  data: Record<string, any>
  originalId: string
  checksum: string
  createdAt: string
  updatedAt: string
}

export interface DataExport {
  id: string
  accountId: string
  format: 'json' | 'csv' | 'xml' | 'xlsx'
  filters?: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  expiresAt?: string
  fileSize?: number
  recordCount?: number
}

// Activity types
export interface Activity extends BaseEntity {
  accountId: string
  userId?: string
  type: ActivityType
  entity: string
  entityId: string
  action: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export type ActivityType = 'user' | 'system' | 'integration' | 'backup' | 'billing'

// Billing types
export interface Subscription extends BaseEntity {
  accountId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string
  trialStart?: string
  trialEnd?: string
  metadata?: Record<string, any>
}

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid'

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: PlanFeature[]
  limits: PlanLimits
}

export interface PlanFeature {
  name: string
  description: string
  included: boolean
  limit?: number
}

export interface PlanLimits {
  storage: number // GB
  integrations: number
  users: number
  backupFrequency: string[]
  retention: number // days
}

export interface Invoice extends BaseEntity {
  accountId: string
  subscriptionId: string
  amount: number
  currency: string
  status: InvoiceStatus
  dueDate: string
  paidAt?: string
  items: InvoiceItem[]
  downloadUrl?: string
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

export interface InvoiceItem {
  description: string
  amount: number
  quantity: number
  unitPrice: number
  metadata?: Record<string, any>
}

// System types
export interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  services: ServiceStatus[]
  lastChecked: string
}

export interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  uptime: number
  responseTime?: number
  lastIncident?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
}

// Notification types
export interface PushNotification {
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
}

// Platform-specific types
export interface WebAppConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  analytics: {
    googleAnalyticsId?: string
    mixpanelToken?: string
  }
  features: {
    enablePushNotifications: boolean
    enableAnalytics: boolean
    enableErrorReporting: boolean
  }
}

export interface MobileAppConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  biometricAuth: boolean
  pushNotifications: boolean
  backgroundSync: boolean
  features: {
    offlineMode: boolean
    cameraAccess: boolean
    fileDownload: boolean
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>