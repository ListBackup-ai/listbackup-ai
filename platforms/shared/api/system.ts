import { BaseAPI } from './base'

export interface SystemHealth {
  overall: {
    status: 'healthy' | 'warning' | 'critical'
    score: number
    lastChecked: string
  }
  services: SystemService[]
  infrastructure: InfrastructureMetrics
  performance: PerformanceMetrics
  security: SecurityMetrics
}

export interface SystemService {
  serviceId: string
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  version: string
  lastDeployed: string
  uptime: number
  responseTime: number
  errorRate: number
  requestsPerMinute: number
  dependencies: string[]
  endpoint: string
  region: string
}

export interface InfrastructureMetrics {
  lambdas: {
    totalFunctions: number
    activeFunctions: number
    totalInvocations: number
    totalErrors: number
    avgDuration: number
    avgMemoryUsed: number
    coldStarts: number
  }
  dynamodb: {
    totalTables: number
    totalItems: number
    readCapacity: number
    writeCapacity: number
    consumedReadCapacity: number
    consumedWriteCapacity: number
    throttles: number
  }
  s3: {
    totalBuckets: number
    totalObjects: number
    totalSize: number
    requests: number
    bandwidthUsed: number
  }
  cloudwatch: {
    totalAlarms: number
    activeAlarms: number
    metrics: number
    logGroups: number
    logStreams: number
  }
}

export interface PerformanceMetrics {
  apiLatency: {
    p50: number
    p95: number
    p99: number
    avg: number
  }
  throughput: {
    requestsPerSecond: number
    requestsPerMinute: number
    requestsPerHour: number
  }
  errorRates: {
    total: number
    rate: number
    byService: Record<string, number>
  }
  availability: {
    uptime: number
    downtime: number
    mttr: number
    mtbf: number
  }
}

export interface SecurityMetrics {
  authentication: {
    totalLogins: number
    failedLogins: number
    suspiciousActivity: number
    mfaEnabled: number
  }
  authorization: {
    privilegedAccess: number
    roleViolations: number
    accessDenied: number
  }
  compliance: {
    dataRetention: boolean
    encryption: boolean
    backups: boolean
    auditLogs: boolean
  }
  threats: {
    blockedIPs: number
    suspiciousRequests: number
    rateLimitHits: number
  }
}

export interface SystemAlert {
  alertId: string
  type: 'error' | 'warning' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  service: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  metadata?: Record<string, any>
}

export interface SystemLog {
  logId: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  service: string
  message: string
  context?: Record<string, any>
  userId?: string
  requestId?: string
  traceId?: string
}

export interface MaintenanceWindow {
  windowId: string
  title: string
  description: string
  type: 'scheduled' | 'emergency'
  status: 'planned' | 'active' | 'completed'
  startTime: string
  endTime: string
  affectedServices: string[]
  impact: 'none' | 'minimal' | 'moderate' | 'high'
  createdBy: string
  notifications: boolean
}

export interface SystemConfig {
  configId: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json'
  environment: 'development' | 'staging' | 'production'
  category: string
  description?: string
  encrypted: boolean
  lastModified: string
  modifiedBy: string
}

class SystemAPI extends BaseAPI {
  // Health & Monitoring
  async getSystemHealth(): Promise<SystemHealth> {
    return this.get<SystemHealth>('/admin/system/health')
  }

  async getServiceHealth(serviceId: string): Promise<SystemService> {
    return this.get<SystemService>(`/admin/system/services/${serviceId}`)
  }

  async refreshSystemHealth(): Promise<SystemHealth> {
    return this.post<SystemHealth>('/admin/system/health/refresh')
  }

  // Alerts & Logging
  async getSystemAlerts(params?: {
    type?: string
    severity?: string
    resolved?: boolean
    service?: string
    limit?: number
    page?: number
  }): Promise<{ alerts: SystemAlert[], totalCount: number }> {
    return this.get<{ alerts: SystemAlert[], totalCount: number }>('/admin/system/alerts', params)
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    return this.post(`/admin/system/alerts/${alertId}/resolve`, { resolvedBy })
  }

  async getSystemLogs(params?: {
    level?: string
    service?: string
    startTime?: string
    endTime?: string
    limit?: number
    page?: number
  }): Promise<{ logs: SystemLog[], totalCount: number }> {
    return this.get<{ logs: SystemLog[], totalCount: number }>('/admin/system/logs', params)
  }

  // Maintenance
  async getMaintenanceWindows(params?: {
    status?: string
    upcoming?: boolean
    limit?: number
  }): Promise<{ windows: MaintenanceWindow[], totalCount: number }> {
    return this.get<{ windows: MaintenanceWindow[], totalCount: number }>('/admin/system/maintenance', params)
  }

  async createMaintenanceWindow(window: Omit<MaintenanceWindow, 'windowId' | 'status'>): Promise<MaintenanceWindow> {
    return this.post<MaintenanceWindow>('/admin/system/maintenance', window)
  }

  async updateMaintenanceWindow(windowId: string, updates: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> {
    return this.put<MaintenanceWindow>(`/admin/system/maintenance/${windowId}`, updates)
  }

  async deleteMaintenanceWindow(windowId: string): Promise<void> {
    return this.delete(`/admin/system/maintenance/${windowId}`)
  }

  // Configuration
  async getSystemConfigs(params?: {
    environment?: string
    category?: string
    encrypted?: boolean
  }): Promise<{ configs: SystemConfig[], totalCount: number }> {
    return this.get<{ configs: SystemConfig[], totalCount: number }>('/admin/system/config', params)
  }

  async getSystemConfig(configId: string): Promise<SystemConfig> {
    return this.get<SystemConfig>(`/admin/system/config/${configId}`)
  }

  async updateSystemConfig(configId: string, updates: { value: any, description?: string }): Promise<SystemConfig> {
    return this.put<SystemConfig>(`/admin/system/config/${configId}`, updates)
  }

  async createSystemConfig(config: Omit<SystemConfig, 'configId' | 'lastModified'>): Promise<SystemConfig> {
    return this.post<SystemConfig>('/admin/system/config', config)
  }

  async deleteSystemConfig(configId: string): Promise<void> {
    return this.delete(`/admin/system/config/${configId}`)
  }

  // Service Management
  async restartService(serviceId: string): Promise<void> {
    return this.post(`/admin/system/services/${serviceId}/restart`)
  }

  async deployService(serviceId: string, version?: string): Promise<void> {
    return this.post(`/admin/system/services/${serviceId}/deploy`, { version })
  }

  async scaleService(serviceId: string, instances: number): Promise<void> {
    return this.post(`/admin/system/services/${serviceId}/scale`, { instances })
  }

  // Backup & Recovery
  async createBackup(type: 'full' | 'incremental' | 'configuration'): Promise<{ backupId: string }> {
    return this.post<{ backupId: string }>('/admin/system/backup', { type })
  }

  async getBackups(): Promise<{ backups: any[], totalCount: number }> {
    return this.get<{ backups: any[], totalCount: number }>('/admin/system/backup')
  }

  async restoreBackup(backupId: string): Promise<void> {
    return this.post(`/admin/system/backup/${backupId}/restore`)
  }

  // Performance Metrics
  async getPerformanceMetrics(timeRange: string = '1h'): Promise<PerformanceMetrics> {
    return this.get<PerformanceMetrics>('/admin/system/performance', { timeRange })
  }

  async getInfrastructureMetrics(): Promise<InfrastructureMetrics> {
    return this.get<InfrastructureMetrics>('/admin/system/infrastructure')
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return this.get<SecurityMetrics>('/admin/system/security')
  }
}

export const systemApi = new SystemAPI()