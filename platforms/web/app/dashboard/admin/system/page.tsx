'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedDataTable } from '@/components/ui/advanced-data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Shield, 
  Server,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Hash,
  Globe,
  Database,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Zap,
  CloudUpload,
  Archive,
  RotateCcw,
  Play,
  Pause,
  Square,
  Calendar,
  Timer,
  Users,
  Building,
  Key,
  Lock,
  Unlock,
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Laptop,
  Tablet,
  Wifi,
  WifiOff,
  Bug,
  Wrench,
  Code,
  GitBranch,
  Package
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface SystemHealth {
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

interface SystemService {
  serviceId: string
  name: string
  type: 'api' | 'database' | 'queue' | 'storage' | 'auth' | 'notification'
  status: 'running' | 'stopped' | 'error' | 'degraded'
  version: string
  uptime: number
  lastRestart: string
  healthEndpoint: string
  dependencies: string[]
  metrics: {
    responseTime: number
    throughput: number
    errorRate: number
    memory: number
    cpu: number
  }
  configuration: Record<string, any>
}

interface InfrastructureMetrics {
  servers: ServerMetrics[]
  databases: DatabaseMetrics[]
  storage: StorageMetrics
  network: NetworkMetrics
}

interface ServerMetrics {
  serverId: string
  name: string
  type: 'web' | 'api' | 'worker' | 'database'
  region: string
  status: 'online' | 'offline' | 'maintenance'
  resources: {
    cpu: { usage: number; cores: number }
    memory: { used: number; total: number }
    disk: { used: number; total: number }
    network: { in: number; out: number }
  }
  uptime: number
  lastUpdate: string
}

interface DatabaseMetrics {
  databaseId: string
  name: string
  type: 'postgres' | 'dynamodb' | 'redis'
  status: 'healthy' | 'warning' | 'error'
  connections: { active: number; max: number }
  performance: {
    queryTime: number
    slowQueries: number
    lockWaits: number
    indexHits: number
  }
  storage: { used: number; allocated: number }
  backup: {
    lastBackup: string
    status: 'success' | 'failed' | 'running'
    size: number
  }
}

interface StorageMetrics {
  buckets: StorageBucket[]
  totalUsed: number
  totalAllocated: number
  costOptimization: {
    coldStorage: number
    duplicates: number
    compressionRatio: number
  }
}

interface StorageBucket {
  bucketId: string
  name: string
  region: string
  objectCount: number
  size: number
  storageClass: string
  lastAccessed: string
}

interface NetworkMetrics {
  bandwidth: { in: number; out: number; total: number }
  latency: { avg: number; p95: number; p99: number }
  cdn: {
    hitRatio: number
    requests: number
    dataTransferred: number
  }
  security: {
    blockedRequests: number
    threats: number
    rateLimit: number
  }
}

interface PerformanceMetrics {
  responseTime: { avg: number; p95: number; p99: number }
  throughput: { requests: number; jobs: number; dataProcessed: number }
  errors: { count: number; rate: number; types: Record<string, number> }
  availability: { uptime: number; incidents: number; mttr: number }
}

interface SecurityMetrics {
  vulnerabilities: SecurityVulnerability[]
  compliance: ComplianceStatus
  access: AccessMetrics
  threats: ThreatMetrics
}

interface SecurityVulnerability {
  vulnerabilityId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  description: string
  affectedServices: string[]
  discoveredAt: string
  status: 'open' | 'mitigated' | 'fixed'
  cve?: string
}

interface ComplianceStatus {
  frameworks: ComplianceFramework[]
  score: number
  lastAudit: string
  findings: number
}

interface ComplianceFramework {
  name: string
  status: 'compliant' | 'partial' | 'non_compliant'
  controls: { total: number; passed: number; failed: number }
  lastCheck: string
}

interface AccessMetrics {
  failedLogins: number
  suspiciousActivity: number
  privilegedAccess: number
  sessionAnomalies: number
}

interface ThreatMetrics {
  detectedThreats: number
  blockedAttacks: number
  malwareScans: number
  suspiciousIPs: string[]
}

interface SystemConfiguration {
  configId: string
  category: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  isSecret: boolean
  environment: 'development' | 'staging' | 'production'
  lastModified: string
  modifiedBy: string
}

interface AuditLog {
  logId: string
  timestamp: string
  userId: string
  userEmail: string
  action: string
  resource: string
  details: string
  ipAddress: string
  userAgent: string
  success: boolean
  metadata: Record<string, any>
}

export default function SystemAdministrationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showAuditDialog, setShowAuditDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<SystemService | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<SystemConfiguration | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  // TODO: Implement system API in shared package
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => Promise.resolve({
      overall: { status: 'healthy', score: 98 },
      services: [{
        serviceId: 'svc-api-01',
        name: 'API Service',
        type: 'api' as const,
        status: 'running' as const,
        version: '1.2.3',
        uptime: 99.9,
        lastRestart: new Date().toISOString(),
        healthEndpoint: '/health',
        dependencies: ['database', 'cache'],
        metrics: {
          responseTime: 150,
          throughput: 450,
          errorRate: 0.1,
          memory: 2048,
          cpu: 45
        },
        configuration: { port: 3000, env: 'production' }
      }],
      performance: {
        availability: { uptime: 99.9, incidents: 2, mttr: 15 },
        responseTime: { avg: 150, p50: 120, p95: 200, p99: 350 },
        throughput: { requestsPerSecond: 450, requestsPerMinute: 27000, requestsPerHour: 1620000 },
        errors: { count: 42, rate: 0.1, types: { validation: 15, timeout: 12, server: 15 } }
      },
      security: {
        vulnerabilities: [] as any[],
        compliance: {
          frameworks: [
            {
              name: 'SOC 2 Type II',
              status: 'compliant' as const,
              controls: { total: 67, passed: 64, failed: 3 },
              lastCheck: new Date().toISOString()
            },
            {
              name: 'GDPR',
              status: 'partial' as const,
              controls: { total: 25, passed: 23, failed: 2 },
              lastCheck: new Date().toISOString()
            }
          ],
          score: 95,
          lastAudit: new Date().toISOString(),
          findings: 3
        },
        access: {
          failedLogins: 12,
          suspiciousActivity: 2,
          privilegedAccess: 5,
          sessionAnomalies: 1
        },
        threats: {
          detectedThreats: 8,
          blockedAttacks: 15,
          malwareScans: 1200,
          suspiciousIPs: ['192.168.1.100', '10.0.0.50']
        }
      },
      infrastructure: {
        servers: [
          {
            serverId: 'srv-web-01',
            name: 'Web Server 01',
            type: 'web' as const,
            region: 'us-east-1',
            status: 'online' as const,
            resources: {
              cpu: { usage: 45, cores: 4 },
              memory: { used: 2048, total: 8192 },
              disk: { used: 120000, total: 500000 },
              network: { in: 1024, out: 2048 }
            },
            uptime: 99.9,
            lastUpdate: new Date().toISOString()
          },
          {
            serverId: 'srv-api-01',
            name: 'API Server 01',
            type: 'api' as const,
            region: 'us-east-1',
            status: 'online' as const,
            resources: {
              cpu: { usage: 30, cores: 8 },
              memory: { used: 4096, total: 16384 },
              disk: { used: 80000, total: 1000000 },
              network: { in: 2048, out: 4096 }
            },
            uptime: 99.8,
            lastUpdate: new Date().toISOString()
          }
        ],
        databases: [
          {
            databaseId: 'db-primary',
            name: 'Primary Database',
            type: 'postgresql' as const,
            status: 'healthy' as const,
            connections: { active: 45, max: 100 },
            performance: { queryTime: 12.5, transactions: 1500 },
            storage: { used: 50000, total: 200000 },
            replication: { status: 'synced', lag: 0.1 },
            lastBackup: new Date().toISOString()
          }
        ],
        storage: {
          totalUsed: 500000000,
          totalCapacity: 2000000000,
          buckets: [
            {
              bucketId: 'backup-primary',
              name: 'Primary Backups',
              region: 'us-east-1',
              size: 250000000,
              objects: 15000,
              lifecycle: 'enabled',
              encryption: 'enabled'
            }
          ],
          costOptimization: {
            compressionRatio: 2.3,
            deduplicationSavings: 0.15,
            tieringEnabled: true,
            lastOptimization: new Date().toISOString()
          }
        },
        network: {
          latency: { avg: 25, p95: 45, p99: 80 },
          bandwidth: { in: 1024, out: 2048, peak: 4096 },
          connections: { active: 150, peak: 300 },
          security: { blockedRequests: 45, ddosAttacks: 0 }
        }
      }
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: systemConfig = [], isLoading: configLoading } = useQuery({
    queryKey: ['system', 'configuration'],
    queryFn: () => Promise.resolve([
      {
        configId: 'cfg-001',
        key: 'api.rateLimitPerMinute',
        value: 1000,
        type: 'number' as const,
        environment: 'production' as const,
        category: 'API',
        description: 'Rate limit for API requests per minute',
        isSecret: false,
        lastModified: new Date().toISOString(),
        modifiedBy: 'system'
      },
      {
        configId: 'cfg-002',
        key: 'database.connectionPoolSize',
        value: 50,
        type: 'number' as const,
        environment: 'production' as const,
        category: 'Database',
        description: 'Maximum number of database connections',
        isSecret: false,
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin'
      },
      {
        configId: 'cfg-003',
        key: 'security.encryptionKey',
        value: '***encrypted***',
        type: 'string' as const,
        environment: 'production' as const,
        category: 'Security',
        description: 'Primary encryption key for data protection',
        isSecret: true,
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin'
      }
    ]),
  })

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['system', 'audit'],
    queryFn: () => Promise.resolve([
      {
        logId: 'log-001',
        timestamp: new Date().toISOString(),
        action: 'Configuration Updated',
        userId: 'admin-001',
        userEmail: 'admin@listbackup.ai',
        resource: 'api.rateLimitPerMinute',
        details: 'Changed from 800 to 1000',
        success: true,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Admin Console)',
        metadata: { previousValue: 800, newValue: 1000 }
      },
      {
        logId: 'log-002',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        action: 'Service Restart',
        userId: 'admin-001',
        userEmail: 'admin@listbackup.ai',
        resource: 'api-service',
        details: 'Manual restart initiated',
        success: true,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Admin Console)',
        metadata: { serviceId: 'svc-api-01', reason: 'manual' }
      },
      {
        logId: 'log-003',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action: 'Login Attempt',
        userId: 'user-123',
        userEmail: 'unknown@example.com',
        resource: 'authentication',
        details: 'Failed login attempt - invalid credentials',
        success: false,
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (Unknown)',
        metadata: { attemptCount: 3, locked: false }
      }
    ]),
  })

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: () => Promise.resolve({}),
    refetchInterval: 60000, // Refresh every minute
  })

  // Mutations - TODO: Implement system API mutations
  const updateConfigMutation = useMutation({
    mutationFn: (data: { configId: string; value: any }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'configuration'] })
      setShowConfigDialog(false)
      toast({ title: 'Configuration updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update configuration', variant: 'destructive' })
    },
  })

  const restartServiceMutation = useMutation({
    mutationFn: (serviceId: string) => Promise.resolve({ success: true, serviceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'health'] })
      toast({ title: 'Service restart initiated' })
    },
    onError: () => {
      toast({ title: 'Failed to restart service', variant: 'destructive' })
    },
  })

  const backupSystemMutation = useMutation({
    mutationFn: () => Promise.resolve({ success: true }),
    onSuccess: () => {
      toast({ title: 'System backup initiated' })
    },
    onError: () => {
      toast({ title: 'Failed to initiate backup', variant: 'destructive' })
    },
  })

  const runMaintenanceMutation = useMutation({
    mutationFn: () => Promise.resolve({ success: true }),
    onSuccess: () => {
      toast({ title: 'Maintenance tasks started' })
    },
    onError: () => {
      toast({ title: 'Failed to start maintenance', variant: 'destructive' })
    },
  })

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'online':
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
      case 'degraded':
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'error':
      case 'stopped':
      case 'offline':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'maintenance':
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'online':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
      case 'degraded':
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
      case 'error':
      case 'stopped':
      case 'offline':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Globe className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'queue':
        return <Package className="h-4 w-4" />
      case 'storage':
        return <HardDrive className="h-4 w-4" />
      case 'auth':
        return <Shield className="h-4 w-4" />
      case 'notification':
        return <Bell className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024
      i++
    }
    return `${bytes.toFixed(1)} ${units[i]}`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const exportAuditLogs = (data: AuditLog[]) => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP Address', 'Success'],
      ...data.map(log => [
        log.timestamp,
        log.userEmail,
        log.action,
        log.resource,
        log.details,
        log.ipAddress,
        log.success ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-logs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (healthLoading || configLoading || metricsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground">
            Monitor system health, manage configurations, and maintain infrastructure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => runMaintenanceMutation.mutate()}
            disabled={runMaintenanceMutation.isPending}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Run Maintenance
          </Button>
          <Button
            variant="outline"
            onClick={() => backupSystemMutation.mutate()}
            disabled={backupSystemMutation.isPending}
          >
            <Archive className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['system'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(systemHealth?.overall.status || 'unknown')}
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Overall system status: {systemHealth?.overall.status || 'Unknown'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{systemHealth?.overall.score || 0}%</div>
                  <div className="text-sm text-muted-foreground">Health Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {systemHealth?.services.filter(s => s.status === 'running').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Services Running</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {systemHealth?.performance.availability.uptime.toFixed(2) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {systemHealth?.performance.responseTime.avg.toFixed(0) || 0}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {systemHealth?.performance.errors.rate.toFixed(2) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {(systemHealth?.security?.vulnerabilities?.filter(v => v.severity === 'critical') || []).length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemHealth?.security?.vulnerabilities
                    ?.filter(v => v.severity === 'critical')
                    ?.slice(0, 3)
                    ?.map((vuln) => (
                      <div key={vuln.vulnerabilityId} className="flex items-center justify-between p-2 bg-white border border-red-200 rounded">
                        <div>
                          <div className="font-medium text-red-800">{vuln.type}</div>
                          <div className="text-sm text-red-600">{vuln.description}</div>
                        </div>
                        <Badge variant="secondary" className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Infrastructure Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span>Servers</span>
                    </div>
                    <div className="text-sm">
                      {systemHealth?.infrastructure.servers.filter(s => s.status === 'online').length}/
                      {systemHealth?.infrastructure.servers.length} online
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Databases</span>
                    </div>
                    <div className="text-sm">
                      {systemHealth?.infrastructure.databases.filter(d => d.status === 'healthy').length}/
                      {systemHealth?.infrastructure.databases.length} healthy
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Storage</span>
                    </div>
                    <div className="text-sm">
                      {formatBytes(systemHealth?.infrastructure.storage.totalUsed || 0)} used
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      <span>Network</span>
                    </div>
                    <div className="text-sm">
                      {systemHealth?.infrastructure.network.latency.avg.toFixed(0)}ms latency
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Response Time (P95)</span>
                      <span>{systemHealth?.performance.responseTime.p95.toFixed(0)}ms</span>
                    </div>
                    <Progress value={(systemHealth?.performance.responseTime.p95 || 0) / 10} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Throughput</span>
                      <span>{systemHealth?.performance.throughput.requestsPerHour.toLocaleString()} req/h</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Error Rate</span>
                      <span>{systemHealth?.performance.errors.rate.toFixed(2)}%</span>
                    </div>
                    <Progress 
                      value={(systemHealth?.performance.errors.rate || 0) * 10} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Availability</span>
                      <span>{systemHealth?.performance.availability.uptime.toFixed(2)}%</span>
                    </div>
                    <Progress value={systemHealth?.performance.availability.uptime || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {systemHealth?.services.map((service) => (
              <Card key={service.serviceId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getServiceIcon(service.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription className="capitalize">{service.type} service</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status and Version */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">v{service.version}</span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{service.metrics.responseTime}ms</p>
                      <p className="text-xs text-muted-foreground">Response Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{service.metrics.errorRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Error Rate</p>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage:</span>
                      <span>{service.metrics.cpu.toFixed(1)}%</span>
                    </div>
                    <Progress value={service.metrics.cpu} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage:</span>
                      <span>{formatBytes(service.metrics.memory)}</span>
                    </div>
                    <Progress value={(service.metrics.memory / (1024 * 1024 * 1024)) * 100} className="h-2" />
                  </div>

                  {/* Uptime */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span>{formatUptime(service.uptime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Restart:</span>
                      <span>{formatDistanceToNow(new Date(service.lastRestart), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedService(service)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restartServiceMutation.mutate(service.serviceId)}
                      disabled={restartServiceMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(service.healthEndpoint, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          {/* Servers */}
          <Card>
            <CardHeader>
              <CardTitle>Servers</CardTitle>
              <CardDescription>Infrastructure server status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemHealth?.infrastructure.servers.map((server) => (
                  <div key={server.serverId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span className="font-medium">{server.name}</span>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(server.status)}>
                        {server.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span>{server.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{server.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPU:</span>
                        <span>{server.resources.cpu.usage}% / {server.resources.cpu.cores} cores</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span>
                          {formatBytes(server.resources.memory.used)} / {formatBytes(server.resources.memory.total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disk:</span>
                        <span>
                          {formatBytes(server.resources.disk.used)} / {formatBytes(server.resources.disk.total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span>{formatUptime(server.uptime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Databases */}
          <Card>
            <CardHeader>
              <CardTitle>Databases</CardTitle>
              <CardDescription>Database performance and health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth?.infrastructure.databases.map((database) => (
                  <div key={database.databaseId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-8 w-8 p-1.5 bg-primary/10 rounded-lg" />
                      <div>
                        <div className="font-medium">{database.name}</div>
                        <div className="text-sm text-muted-foreground uppercase">{database.type}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-medium">{database.connections.active}/{database.connections.max}</div>
                        <div className="text-muted-foreground">Connections</div>
                      </div>
                      <div>
                        <div className="font-medium">{database.performance.queryTime}ms</div>
                        <div className="text-muted-foreground">Query Time</div>
                      </div>
                      <div>
                        <div className="font-medium">{formatBytes(database.storage.used)}</div>
                        <div className="text-muted-foreground">Storage Used</div>
                      </div>
                      <div>
                        <Badge variant="secondary" className={getStatusColor(database.status)}>
                          {database.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Storage usage and optimization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-lg font-semibold">
                      {formatBytes(systemHealth?.infrastructure.storage.totalUsed || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Used</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-lg font-semibold">
                      {systemHealth?.infrastructure.storage.costOptimization.compressionRatio.toFixed(1)}x
                    </div>
                    <div className="text-sm text-muted-foreground">Compression Ratio</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {systemHealth?.infrastructure.storage.buckets.slice(0, 5).map((bucket) => (
                    <div key={bucket.bucketId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{bucket.name}</div>
                        <div className="text-sm text-muted-foreground">{bucket.region}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{formatBytes(bucket.size)}</div>
                        <div className="text-muted-foreground">{bucket.objects.toLocaleString()} objects</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth?.security.vulnerabilities.filter(v => v.status === 'open').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Open vulnerabilities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth?.security.access.failedLogins || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Blocked Attacks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth?.security.threats.blockedAttacks || 0}
                </div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth?.security.compliance.score || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Overall compliance</p>
              </CardContent>
            </Card>
          </div>

          {/* Vulnerabilities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Security Vulnerabilities</CardTitle>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth?.security.vulnerabilities
                  .filter(v => filterSeverity === 'all' || v.severity === filterSeverity)
                  .slice(0, 10)
                  .map((vulnerability) => (
                    <div key={vulnerability.vulnerabilityId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={getSeverityColor(vulnerability.severity)}>
                            {vulnerability.severity}
                          </Badge>
                          <span className="font-medium">{vulnerability.type}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{vulnerability.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Discovered {formatDistanceToNow(new Date(vulnerability.discoveredAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={getStatusColor(vulnerability.status)}>
                          {vulnerability.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {vulnerability.affectedServices.length} service(s)
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Compliance framework adherence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth?.security.compliance.frameworks.map((framework) => (
                  <div key={framework.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{framework.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {framework.controls.passed}/{framework.controls.total} controls passed
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={getStatusColor(framework.status)}>
                        {framework.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Last check: {formatDistanceToNow(new Date(framework.lastCheck), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Configuration</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.from(new Set(systemConfig.map(c => c.category))).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Config
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemConfig
                  .filter(config => filterCategory === 'all' || config.category === filterCategory)
                  .map((config) => (
                    <div key={config.configId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{config.key}</span>
                          <Badge variant="outline">{config.category}</Badge>
                          {config.isSecret && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Lock className="h-3 w-3 mr-1" />
                              Secret
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{config.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Modified by {config.modifiedBy} {formatDistanceToNow(new Date(config.lastModified), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{config.type}</Badge>
                        <Badge variant="secondary" className={
                          config.environment === 'production' ? 'bg-red-100 text-red-800' :
                          config.environment === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {config.environment}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConfig(config)
                            setShowConfigDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit Logs</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => exportAuditLogs(auditLogs)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.slice(0, 20).map((log) => (
                  <div key={log.logId} className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded-r">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-1">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{log.details}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.userEmail} • {log.resource} • {log.ipAddress}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {JSON.stringify(log.metadata, null, 2).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Details Dialog */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getServiceIcon(selectedService.type)}
                {selectedService.name}
              </DialogTitle>
              <DialogDescription>
                Detailed service information and configuration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedService.serviceId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedService.serviceId)
                        toast({ title: 'Service ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="text-sm capitalize">{selectedService.type}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedService.status)}>
                    {selectedService.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Version</Label>
                  <div className="text-sm">{selectedService.version}</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Performance Metrics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedService.metrics.responseTime}ms</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedService.metrics.throughput}</div>
                    <div className="text-xs text-muted-foreground">Throughput</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedService.metrics.errorRate.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Error Rate</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{formatUptime(selectedService.uptime)}</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              {selectedService.dependencies.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Dependencies</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.dependencies.map((dep) => (
                      <Badge key={dep} variant="outline">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              {selectedConfig ? 'Update system configuration' : 'Create new system configuration'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configKey">Key</Label>
              <Input 
                id="configKey" 
                defaultValue={selectedConfig?.key || ''} 
                placeholder="config.key.name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configValue">Value</Label>
              {selectedConfig?.isSecret ? (
                <Input 
                  id="configValue" 
                  type="password" 
                  placeholder="••••••••"
                />
              ) : (
                <Textarea 
                  id="configValue" 
                  defaultValue={typeof selectedConfig?.value === 'object' ? 
                    JSON.stringify(selectedConfig.value, null, 2) : 
                    selectedConfig?.value || ''
                  }
                  placeholder="Configuration value"
                  rows={3}
                />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="configCategory">Category</Label>
                <Select defaultValue={selectedConfig?.category || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="cache">Cache</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="configType">Type</Label>
                <Select defaultValue={selectedConfig?.type || 'string'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="configDescription">Description</Label>
              <Textarea 
                id="configDescription" 
                defaultValue={selectedConfig?.description || ''}
                placeholder="Describe what this configuration does"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isSecret" 
                defaultChecked={selectedConfig?.isSecret || false}
              />
              <Label htmlFor="isSecret">Mark as secret</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfigDialog(false)
                  setSelectedConfig(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setShowConfigDialog(false)
                setSelectedConfig(null)
              }}>
                {selectedConfig ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}