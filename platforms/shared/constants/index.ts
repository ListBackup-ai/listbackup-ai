// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://main.api.listbackup.ai'
export const API_TIMEOUT = 30000 // 30 seconds

// App Configuration
export const APP_NAME = 'ListBackup.ai'
export const APP_VERSION = '2.0.0'

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'listbackup_auth_token',
  USER_DATA: 'listbackup_user_data',
  THEME: 'listbackup_theme',
  ACCOUNT_ID: 'listbackup_account_id',
} as const

// File Types
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'odt'],
  SPREADSHEET: ['xls', 'xlsx', 'csv'],
  ARCHIVE: ['zip', 'tar', 'gz', 'rar', '7z'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
} as const

// Integration Types
export const INTEGRATION_TYPES = {
  KEAP: 'keap',
  STRIPE: 'stripe',
  GOHIGHLEVEL: 'gohighlevel',
  ACTIVECAMPAIGN: 'activecampaign',
  MAILCHIMP: 'mailchimp',
  HUBSPOT: 'hubspot',
  SHOPIFY: 'shopify',
  ZENDESK: 'zendesk',
} as const

// Job States
export const JOB_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const