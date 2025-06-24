'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp, 
  FileText, 
  Shield, 
  Bell, 
  User, 
  Building, 
  Activity, 
  BarChart3, 
  PieChart, 
  Filter,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'
import { format, formatDistanceToNow } from 'date-fns'

interface ClientPortalDashboardProps {
  clientId: string
  className?: string
}

interface ClientDashboardData {
  client: {
    clientId: string
    companyName: string
    industry: string
    contactName: string
    contactEmail: string
    contactPhone?: string
    website?: string
    logoUrl?: string
    createdAt: string
    lastLoginAt?: string
    status: 'active' | 'inactive' | 'suspended'
  }
  stats: {
    totalBackups: number
    totalDataSize: number
    lastBackupDate: string
    successRate: number
    availableReports: number
    dataRetentionDays: number
  }
  recentBackups: Array<{
    backupId: string
    sourceName: string
    sourceType: string
    status: 'completed' | 'failed' | 'running'
    startedAt: string
    completedAt?: string
    dataSize?: number
    recordCount?: number
    errorMessage?: string
  }>
  availableReports: Array<{
    reportId: string
    name: string
    description: string
    type: 'analytics' | 'export' | 'compliance'
    lastGenerated?: string
    isAvailable: boolean
    downloadUrl?: string
  }>
  dataAccess: {
    allowedAccounts: Array<{
      accountId: string
      accountName: string
      permissions: string[]
    }>
    restrictions: string[]
  }
  notifications: Array<{
    notificationId: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    createdAt: string
    isRead: boolean
  }>
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800'
}

const backupStatusColors = {
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800'
}

const reportTypeColors = {
  analytics: 'bg-blue-100 text-blue-800',
  export: 'bg-green-100 text-green-800',
  compliance: 'bg-purple-100 text-purple-800'
}

const notificationColors = {
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
  error: 'border-red-200 bg-red-50',
  success: 'border-green-200 bg-green-50'
}

const notificationIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle
}

// Mock data generator
const generateMockData = (clientId: string): ClientDashboardData => {
  const client = {
    clientId,
    companyName: 'Acme Corporation',
    industry: 'Technology',
    contactName: 'John Smith',
    contactEmail: 'john@acme.com',
    contactPhone: '+1 (555) 123-4567',
    website: 'https://acme.com',
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-06-19T14:30:00Z',
    status: 'active' as const
  }

  const stats = {
    totalBackups: 247,
    totalDataSize: 15.6 * 1024 * 1024 * 1024, // 15.6 GB in bytes
    lastBackupDate: '2024-06-20T02:00:00Z',
    successRate: 98.8,
    availableReports: 12,
    dataRetentionDays: 365
  }

  const recentBackups = [
    {
      backupId: 'backup_001',
      sourceName: 'CRM Database',
      sourceType: 'salesforce',
      status: 'completed' as const,
      startedAt: '2024-06-20T02:00:00Z',
      completedAt: '2024-06-20T02:15:00Z',
      dataSize: 2.1 * 1024 * 1024 * 1024,
      recordCount: 15420
    },
    {
      backupId: 'backup_002',
      sourceName: 'Email Marketing',
      sourceType: 'mailchimp',
      status: 'completed' as const,
      startedAt: '2024-06-19T14:30:00Z',
      completedAt: '2024-06-19T14:35:00Z',
      dataSize: 156 * 1024 * 1024,
      recordCount: 8932
    },
    {
      backupId: 'backup_003',
      sourceName: 'Support Tickets',
      sourceType: 'zendesk',
      status: 'failed' as const,
      startedAt: '2024-06-19T10:00:00Z',
      errorMessage: 'API rate limit exceeded'
    },
    {
      backupId: 'backup_004',
      sourceName: 'E-commerce Store',
      sourceType: 'shopify',
      status: 'running' as const,
      startedAt: '2024-06-20T08:00:00Z'
    }
  ]

  const availableReports = [
    {
      reportId: 'report_001',
      name: 'Monthly Data Summary',
      description: 'Comprehensive overview of all backed up data for the month',
      type: 'analytics' as const,
      lastGenerated: '2024-06-01T09:00:00Z',
      isAvailable: true,
      downloadUrl: '/api/reports/report_001/download'
    },
    {
      reportId: 'report_002',
      name: 'Customer Data Export',
      description: 'Complete export of customer information and interactions',
      type: 'export' as const,
      lastGenerated: '2024-06-15T16:00:00Z',
      isAvailable: true,
      downloadUrl: '/api/reports/report_002/download'
    },
    {
      reportId: 'report_003',
      name: 'GDPR Compliance Report',
      description: 'Data processing and compliance verification report',
      type: 'compliance' as const,
      lastGenerated: '2024-05-30T12:00:00Z',
      isAvailable: true,
      downloadUrl: '/api/reports/report_003/download'
    }
  ]

  const dataAccess = {
    allowedAccounts: [
      {
        accountId: 'account_001',
        accountName: 'Production Environment',
        permissions: ['data.view', 'data.export', 'reports.view']
      },
      {
        accountId: 'account_002',
        accountName: 'Marketing Department',
        permissions: ['data.view', 'reports.view']
      }
    ],
    restrictions: [
      'Cannot access administrative functions',
      'Limited to own company data only',
      'No user management capabilities',
      'Read-only access to most features'
    ]
  }

  const notifications = [
    {
      notificationId: 'notif_001',
      type: 'success' as const,
      title: 'Backup Completed',
      message: 'Your CRM database backup completed successfully with 15,420 records.',
      createdAt: '2024-06-20T02:15:00Z',
      isRead: false
    },
    {
      notificationId: 'notif_002',
      type: 'error' as const,
      title: 'Backup Failed',
      message: 'Support tickets backup failed due to API rate limits. Retrying in 1 hour.',
      createdAt: '2024-06-19T10:05:00Z',
      isRead: false
    },
    {
      notificationId: 'notif_003',
      type: 'info' as const,
      title: 'New Report Available',
      message: 'Your monthly data summary report is ready for download.',
      createdAt: '2024-06-01T09:00:00Z',
      isRead: true
    }
  ]

  return {
    client,
    stats,
    recentBackups,
    availableReports,
    dataAccess,
    notifications
  }
}

export function ClientPortalDashboard({ clientId, className }: ClientPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [reportFilter, setReportFilter] = useState<string>('all')
  const [notificationFilter, setNotificationFilter] = useState<string>('unread')
  
  const { toast } = useToast()

  // Fetch client dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['client-dashboard', clientId],
    queryFn: () => Promise.resolve(generateMockData(clientId)),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center min-h-96", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Client Not Found</h3>
        <p className="text-muted-foreground">The requested client could not be found.</p>
      </div>
    )
  }

  const { client, stats, recentBackups, availableReports, dataAccess, notifications } = dashboardData

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredReports = availableReports.filter(report => {
    if (reportFilter === 'all') return true
    return report.type === reportFilter
  })

  const filteredNotifications = notifications.filter(notification => {
    if (notificationFilter === 'all') return true
    if (notificationFilter === 'unread') return !notification.isRead
    return notification.isRead
  })

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.logoUrl} />
            <AvatarFallback>
              <Building className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{client.companyName}</h1>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs', statusColors[client.status])}>
                {client.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last login: {client.lastLoginAt ? formatDistanceToNow(new Date(client.lastLoginAt), { addSuffix: true }) : 'Never'}
              </span>
            </div>
          </div>
        </div>
        
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Stored</p>
                <p className="text-2xl font-bold">{formatBytes(stats.totalDataSize)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Reports</p>
                <p className="text-2xl font-bold">{stats.availableReports}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Alert */}
      {unreadNotificationCount > 0 && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            You have {unreadNotificationCount} unread notification{unreadNotificationCount !== 1 ? 's' : ''}. 
            <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => setActiveTab('notifications')}>
              View notifications
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="access">Data Access</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadNotificationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Industry:</span>
                    <span className="ml-2">{client.industry}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Contact:</span>
                    <span className="ml-2">{client.contactName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{client.contactEmail}</span>
                  </div>
                  {client.contactPhone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span className="ml-2">{client.contactPhone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">Website:</span>
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                        {client.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Client since:</span>
                    <span className="ml-2">{format(new Date(client.createdAt), 'PPP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Backup Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Backup Activity</CardTitle>
                <CardDescription>
                  Last backup: {formatDistanceToNow(new Date(stats.lastBackupDate), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBackups.slice(0, 4).map((backup) => (
                    <div key={backup.backupId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full",
                          backupStatusColors[backup.status]
                        )}>
                          {getBackupStatusIcon(backup.status)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{backup.sourceName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{backup.sourceType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn('text-xs', backupStatusColors[backup.status])}>
                          {backup.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(backup.startedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Retention & Success Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>
                  Your data is kept for {stats.dataRetentionDays} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Retention period</span>
                    <span className="font-medium">{stats.dataRetentionDays} days</span>
                  </div>
                  <Progress value={(stats.dataRetentionDays / 365) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Data older than {stats.dataRetentionDays} days is automatically deleted
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Success Rate</CardTitle>
                <CardDescription>
                  Overall reliability of your backups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success rate</span>
                    <span className="font-medium">{stats.successRate}%</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.successRate / 100) * stats.totalBackups)} of {stats.totalBackups} backups successful
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                Complete history of all backup operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBackups.map((backup) => (
                  <div key={backup.backupId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full",
                          backupStatusColors[backup.status]
                        )}>
                          {getBackupStatusIcon(backup.status)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{backup.sourceName}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{backup.sourceType}</p>
                        </div>
                      </div>
                      <Badge className={cn('', backupStatusColors[backup.status])}>
                        {backup.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Started:</span>
                        <p className="text-muted-foreground">
                          {format(new Date(backup.startedAt), 'PPp')}
                        </p>
                      </div>
                      {backup.completedAt && (
                        <div>
                          <span className="font-medium">Completed:</span>
                          <p className="text-muted-foreground">
                            {format(new Date(backup.completedAt), 'PPp')}
                          </p>
                        </div>
                      )}
                      {backup.dataSize && (
                        <div>
                          <span className="font-medium">Data Size:</span>
                          <p className="text-muted-foreground">
                            {formatBytes(backup.dataSize)}
                          </p>
                        </div>
                      )}
                      {backup.recordCount && (
                        <div>
                          <span className="font-medium">Records:</span>
                          <p className="text-muted-foreground">
                            {backup.recordCount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {backup.errorMessage && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {backup.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Reports</h3>
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="export">Data Export</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.reportId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <Badge className={cn('text-xs', reportTypeColors[report.type])}>
                      {report.type}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.lastGenerated && (
                    <div className="text-sm text-muted-foreground mb-3">
                      Generated: {formatDistanceToNow(new Date(report.lastGenerated), { addSuffix: true })}
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    disabled={!report.isAvailable}
                    onClick={() => {
                      if (report.downloadUrl) {
                        window.open(report.downloadUrl, '_blank')
                      }
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Access Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Access</CardTitle>
              <CardDescription>
                Accounts and permissions available to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataAccess.allowedAccounts.map((account) => (
                  <div key={account.accountId} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{account.accountName}</h4>
                    <div className="flex flex-wrap gap-2">
                      {account.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace('.', ': ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Restrictions</CardTitle>
              <CardDescription>
                Limitations and restrictions on your account access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {dataAccess.restrictions.map((restriction, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                    {restriction}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <Select value={notificationFilter} onValueChange={setNotificationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const IconComponent = notificationIcons[notification.type]
              return (
                <Alert key={notification.notificationId} className={cn(
                  'transition-colors',
                  notificationColors[notification.type],
                  !notification.isRead && 'border-l-4'
                )}>
                  <IconComponent className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <AlertDescription>{notification.message}</AlertDescription>
                  </div>
                </Alert>
              )
            })}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {notificationFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}