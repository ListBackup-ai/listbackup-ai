'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Trash2,
  Download,
  Shield,
  Database,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Users,
  Package,
  CreditCard,
  Mail,
  ShoppingCart,
  Globe,
  Lock,
  Unlock,
  Link as LinkIcon,
  Unlink,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit,
  Zap,
  Plus
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { JobRunsViewer } from '@/components/jobs/job-runs-viewer'
import { cn } from '@listbackup/shared/utils'

interface PageProps {
  params: Promise<{
    sourceId: string
  }>
}

// Platform-specific icons
const platformIcons: Record<string, any> = {
  keap: Globe,
  stripe: CreditCard,
  gohighlevel: Zap,
  hubspot: Users,
  mailchimp: Mail,
  activecampaign: Activity,
  shopify: ShoppingCart,
  quickbooks: FileText,
  google: Globe,
  dropbox: Database,
  box: Package,
}

// Data type statistics
const dataTypeStats = {
  contacts: { icon: Users, color: 'text-blue-500' },
  orders: { icon: ShoppingCart, color: 'text-green-500' },
  products: { icon: Package, color: 'text-purple-500' },
  invoices: { icon: FileText, color: 'text-yellow-500' },
  customers: { icon: Users, color: 'text-blue-500' },
  payments: { icon: CreditCard, color: 'text-green-500' },
  subscriptions: { icon: RefreshCw, color: 'text-purple-500' },
  emails: { icon: Mail, color: 'text-yellow-500' },
}

export default function SourceDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [sourceId, setSourceId] = useState<string>('')

  // Unwrap the params promise
  React.useEffect(() => {
    params.then(p => setSourceId(p.sourceId))
  }, [params])

  const { data: source, isLoading } = useQuery({
    queryKey: ['source', sourceId],
    queryFn: () => api.sources.get(sourceId),
    enabled: !!sourceId,
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', { sourceId }],
    queryFn: () => api.jobs.list(),
    enabled: !!sourceId,
  })
  
  const jobs = jobsData?.jobs || []

  const { data: stats } = useQuery({
    queryKey: ['source-stats', sourceId],
    queryFn: async () => {
      // Mock stats - replace with actual API call
      return {
        totalRecords: 45320,
        totalSize: 1234567890,
        lastSync: new Date().toISOString(),
        syncStatus: 'success',
        dataTypes: {
          contacts: 15420,
          orders: 8932,
          products: 1245,
          invoices: 3456,
        },
        syncHistory: [
          { date: new Date(Date.now() - 86400000).toISOString(), status: 'success', records: 14500 },
          { date: new Date(Date.now() - 172800000).toISOString(), status: 'success', records: 14800 },
          { date: new Date(Date.now() - 259200000).toISOString(), status: 'failed', records: 0 },
          { date: new Date(Date.now() - 345600000).toISOString(), status: 'success', records: 15200 },
        ],
      }
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => api.sources.sync(sourceId),
    onSuccess: () => {
      toast({
        title: 'Sync started',
        description: 'Data synchronization has been initiated',
      })
      queryClient.invalidateQueries({ queryKey: ['source', sourceId] })
    },
    onError: () => {
      toast({
        title: 'Sync failed',
        description: 'Failed to start synchronization',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.sources.delete(sourceId),
    onSuccess: () => {
      toast({
        title: 'Source deleted',
        description: 'Data source has been removed',
      })
      router.push('/dashboard/sources')
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete source',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!source) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Source not found
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const PlatformIcon = platformIcons[source.type] || Database
  const isConnected = source.status === 'active'

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlatformIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{source.name}</h1>
                <p className="text-muted-foreground capitalize">{source.type} Integration</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              syncMutation.isPending && "animate-spin"
            )} />
            Sync Now
          </Button>
          <Button onClick={() => setShowCreateJob(true)}>
            <Play className="h-4 w-4 mr-2" />
            Create Backup Job
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Configuration
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy Source ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this source?')) {
                    deleteMutation.mutate()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Connection Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Disconnected</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isConnected ? 'OAuth token valid' : 'Reconnection required'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRecords.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all data types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatFileSize(stats.totalSize) : '0 B'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Compressed & encrypted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {source.lastSync ? formatDistanceToNow(new Date(source.lastSync), { addSuffix: true }) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.syncStatus === 'success' ? 'Completed successfully' : 'Pending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Clock className="h-4 w-4 mr-2" />
            Backup Jobs
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data Types
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" />
            Sync History
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Connection Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium capitalize">{source.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auth Type</p>
                    <p className="font-medium">
                      {source.config?.authType === 'oauth' ? 'OAuth 2.0' : 'API Key'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(source.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source ID</p>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {source.sourceId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(source.sourceId)
                          toast({
                            title: 'Copied',
                            description: 'Source ID copied to clipboard',
                          })
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {source.config?.userInfo && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Account Info</p>
                    <div className="space-y-2">
                      {source.config.userInfo.email && (
                        <p className="text-sm">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {source.config.userInfo.email}
                        </p>
                      )}
                      {source.config.userInfo.name && (
                        <p className="text-sm">
                          <Users className="h-3 w-3 inline mr-1" />
                          {source.config.userInfo.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => syncMutation.mutate()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Manual Sync
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateJob(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Backup Job
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Latest Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Permissions
                </Button>
                {!isConnected && (
                  <Button className="w-full justify-start">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Reconnect Integration
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Overview */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(stats.dataTypes).map(([type, count]) => {
                    const typeConfig = dataTypeStats[type as keyof typeof dataTypeStats]
                    if (!typeConfig) return null
                    const Icon = typeConfig.icon

                    return (
                      <div key={type} className="text-center">
                        <div className={cn(
                          "inline-flex p-3 rounded-lg bg-muted mb-2",
                          typeConfig.color
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground capitalize">{type}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          {jobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.jobId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                        <CardDescription>
                          {job.schedule?.frequency || 'Manual'} backup
                        </CardDescription>
                      </div>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Next Run</p>
                        <p className="font-medium">
                          {job.nextRunAt ? formatDistanceToNow(new Date(job.nextRunAt), { addSuffix: true }) : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Run</p>
                        <p className="font-medium">
                          {job.lastRun ? formatDistanceToNow(new Date(job.lastRun.startedAt), { addSuffix: true }) : 'Never'}
                        </p>
                      </div>
                      <div className="pt-3 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                          View Runs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No backup jobs yet</h3>
                  <p className="text-muted-foreground">
                    Create a backup job to automate your data protection
                  </p>
                </div>
                <Button onClick={() => setShowCreateJob(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Backup Job
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Data Types Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Data Types</CardTitle>
              <CardDescription>
                Data types supported by this {source.type} integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {stats && Object.entries(stats.dataTypes).map(([type, count]) => {
                  const typeConfig = dataTypeStats[type as keyof typeof dataTypeStats]
                  if (!typeConfig) return null
                  const Icon = typeConfig.icon

                  return (
                    <div key={type} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-5 w-5", typeConfig.color)} />
                        <div>
                          <p className="font-medium capitalize">{type}</p>
                          <p className="text-sm text-muted-foreground">
                            {count.toLocaleString()} records
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync History</CardTitle>
              <CardDescription>
                Recent synchronization activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.syncHistory.map((sync, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      {sync.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {format(new Date(sync.date), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sync.status === 'success' 
                            ? `${sync.records.toLocaleString()} records synced`
                            : 'Sync failed'
                          }
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection */}
              <div className="space-y-4">
                <h3 className="font-medium">Connection</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <>
                        <Lock className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Secure Connection</p>
                          <p className="text-sm text-muted-foreground">OAuth 2.0 authenticated</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Connection Lost</p>
                          <p className="text-sm text-muted-foreground">Reconnection required</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant={isConnected ? 'outline' : 'default'} size="sm">
                    {isConnected ? 'Disconnect' : 'Reconnect'}
                  </Button>
                </div>
              </div>

              {/* Sync Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Sync Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Incremental Sync</p>
                      <p className="text-sm text-muted-foreground">Only sync changes since last run</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Include Deleted Records</p>
                      <p className="text-sm text-muted-foreground">Sync soft-deleted items</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time Webhooks</p>
                      <p className="text-sm text-muted-foreground">Receive instant updates (Premium)</p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-red-600">Danger Zone</h3>
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-sm text-red-800 mb-3">
                    Deleting this source will remove all associated backup jobs and configurations. 
                    Backed up data will be retained according to your retention policy.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
                        deleteMutation.mutate()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Source
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <CreateJobDialog
        isOpen={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        sourceId={sourceId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['jobs', { sourceId }] })
        }}
      />
    </div>
  )
}