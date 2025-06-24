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
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Users, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Download,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Timer,
  HardDrive,
  CloudUpload,
  Workflow,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  GitBranch,
  Hash,
  Zap
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Source {
  sourceId: string
  name: string
  description: string
  platformId: string
  platformName: string
  platformType: string
  connectionId: string
  status: 'active' | 'inactive' | 'syncing' | 'error' | 'pending'
  isEnabled: boolean
  createdAt: string
  lastSync: string
  nextSync: string
  syncFrequency: string
  config: {
    scheduleEnabled: boolean
    scheduleExpression: string
    backupRetention: number
    compression: boolean
    encryption: boolean
    includePatterns: string[]
    excludePatterns: string[]
    customSettings: Record<string, any>
  }
  statistics: {
    totalBackups: number
    totalSize: number
    lastBackupSize: number
    successfulBackups: number
    failedBackups: number
    avgBackupTime: number
    dataTransferred: number
    compressionRatio: number
  }
  health: {
    score: number
    issues: string[]
    recommendations: string[]
    lastHealthCheck: string
  }
  relationships: {
    dependentSources: string[]
    parentSources: string[]
    linkedSources: string[]
  }
}

interface SourceBackup {
  backupId: string
  sourceId: string
  timestamp: string
  status: 'completed' | 'failed' | 'in_progress' | 'queued'
  size: number
  duration: number
  itemsProcessed: number
  error?: string
  metadata: {
    version: string
    checksum: string
    location: string
    compression: number
  }
}

interface SourceSyncJob {
  jobId: string
  sourceId: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  startTime: string
  endTime?: string
  progress: number
  itemsProcessed: number
  itemsTotal: number
  currentItem: string
  error?: string
}

export default function SourceManagementPage() {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources', 'manage'],
    queryFn: () => api.sources.list({ includeStats: true, includeHealth: true }),
  })

  const { data: sourceBackups = [] } = useQuery({
    queryKey: ['sources', 'backups'],
    queryFn: () => api.sources.getBackups(),
  })

  const { data: activeSyncJobs = [] } = useQuery({
    queryKey: ['sources', 'sync-jobs'],
    queryFn: () => api.sources.getSyncJobs(),
    refetchInterval: 5000, // Refresh every 5 seconds for active jobs
  })

  // Mutations
  const syncSourceMutation = useMutation({
    mutationFn: api.sources.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source sync started successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to start source sync', variant: 'destructive' })
    },
  })

  const updateSourceMutation = useMutation({
    mutationFn: (data: { sourceId: string; updates: Partial<Source> }) =>
      api.sources.update(data.sourceId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update source', variant: 'destructive' })
    },
  })

  const deleteSourceMutation = useMutation({
    mutationFn: api.sources.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete source', variant: 'destructive' })
    },
  })

  const testSourceMutation = useMutation({
    mutationFn: api.sources.test,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source test completed successfully' })
    },
    onError: () => {
      toast({ title: 'Source test failed', variant: 'destructive' })
    },
  })

  const pauseSourceMutation = useMutation({
    mutationFn: (sourceId: string) => api.sources.pause(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source paused successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to pause source', variant: 'destructive' })
    },
  })

  const resumeSourceMutation = useMutation({
    mutationFn: (sourceId: string) => api.sources.resume(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({ title: 'Source resumed successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to resume source', variant: 'destructive' })
    },
  })

  // Table columns
  const sourceColumns: ColumnDef<Source>[] = [
    {
      accessorKey: 'name',
      header: 'Source',
      cell: ({ row }) => {
        const source = row.original
        const syncJob = activeSyncJobs.find(job => job.sourceId === source.sourceId)
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{source.name}</div>
              <div className="text-sm text-muted-foreground">{source.platformName}</div>
              {syncJob && syncJob.status === 'running' && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing... {syncJob.progress}%
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const isEnabled = row.original.isEnabled
        const colors = {
          active: 'bg-green-100 text-green-800 border-green-200',
          inactive: 'bg-gray-100 text-gray-800 border-gray-200',
          syncing: 'bg-blue-100 text-blue-800 border-blue-200',
          error: 'bg-red-100 text-red-800 border-red-200',
          pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={colors[status as keyof typeof colors]}>
              {status}
            </Badge>
            {!isEnabled && (
              <Badge variant="outline" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'syncFrequency',
      header: 'Frequency',
    },
    {
      accessorKey: 'statistics.totalBackups',
      header: 'Backups',
      cell: ({ row }) => {
        const count = row.original.statistics.totalBackups
        const success = row.original.statistics.successfulBackups
        return (
          <div className="text-center">
            <div>{count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {success}/{count} success
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'statistics.totalSize',
      header: 'Total Size',
      cell: ({ row }) => {
        const size = row.original.statistics.totalSize
        const formatSize = (bytes: number) => {
          const units = ['B', 'KB', 'MB', 'GB', 'TB']
          let i = 0
          while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024
            i++
          }
          return `${bytes.toFixed(1)} ${units[i]}`
        }
        return <div className="text-center">{formatSize(size)}</div>
      },
    },
    {
      accessorKey: 'health.score',
      header: 'Health',
      cell: ({ row }) => {
        const score = row.original.health.score
        const color = score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'
        return <div className={`text-center font-medium ${color}`}>{score}%</div>
      },
    },
    {
      accessorKey: 'lastSync',
      header: 'Last Sync',
      cell: ({ row }) => {
        const date = row.getValue('lastSync') as string
        return date ? (
          <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Never</div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const source = row.original
        const isRunning = activeSyncJobs.some(job => job.sourceId === source.sourceId && job.status === 'running')
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSource(source)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => syncSourceMutation.mutate(source.sourceId)}
              disabled={syncSourceMutation.isPending || isRunning}
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => source.isEnabled ? 
                pauseSourceMutation.mutate(source.sourceId) : 
                resumeSourceMutation.mutate(source.sourceId)
              }
            >
              {source.isEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSourceMutation.mutate(source.sourceId)}
              disabled={deleteSourceMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024
      i++
    }
    return `${bytes.toFixed(1)} ${units[i]}`
  }

  const exportSources = (data: Source[]) => {
    const csv = [
      ['Name', 'Platform', 'Status', 'Frequency', 'Total Backups', 'Total Size', 'Health Score', 'Last Sync'],
      ...data.map(s => [
        s.name,
        s.platformName,
        s.status,
        s.syncFrequency,
        s.statistics.totalBackups.toString(),
        formatSize(s.statistics.totalSize),
        s.health.score.toString() + '%',
        s.lastSync
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sources.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSources = sources.filter(source => {
    if (filterStatus !== 'all' && source.status !== filterStatus) return false
    if (filterPlatform !== 'all' && source.platformType !== filterPlatform) return false
    return true
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Source Management</h1>
          <p className="text-muted-foreground">
            Manage data sources, configure backups, and monitor sync operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            {viewMode === 'grid' ? <BarChart3 className="h-4 w-4 mr-2" /> : <Workflow className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/sources/new'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="sync-jobs">Sync Jobs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sources.length}</div>
                <p className="text-xs text-muted-foreground">
                  {sources.filter(s => s.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <CloudUpload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sources.reduce((sum, s) => sum + s.statistics.totalBackups, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time backups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSize(sources.reduce((sum, s) => sum + s.statistics.totalSize, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total storage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sources.length > 0 ? 
                    Math.round(sources.reduce((sum, s) => sum + s.health.score, 0) / sources.length) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  System health
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Sync Jobs */}
          {activeSyncJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Sync Jobs</CardTitle>
                <CardDescription>Currently running backup and sync operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSyncJobs.map((job) => {
                    const source = sources.find(s => s.sourceId === job.sourceId)
                    return (
                      <div key={job.jobId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          </div>
                          <div>
                            <div className="font-medium">{source?.name || 'Unknown Source'}</div>
                            <div className="text-sm text-muted-foreground">
                              {job.itemsProcessed.toLocaleString()} / {job.itemsTotal.toLocaleString()} items
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{job.progress}%</div>
                          <Progress value={job.progress} className="w-20" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Source Health Summary</CardTitle>
              <CardDescription>Health status of all sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sources.slice(0, 6).map((source) => (
                  <div key={source.sourceId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground">{source.platformName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <div className={`text-sm font-medium ${
                        source.health.score >= 90 ? 'text-green-600' :
                        source.health.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {source.health.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="syncing">Syncing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {Array.from(new Set(sources.map(s => s.platformType))).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterStatus !== 'all' || filterPlatform !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterPlatform('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={sourceColumns}
              data={filteredSources}
              onExport={exportSources}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['sources'] })}
              isLoading={sourcesLoading}
              title="Source Directory"
              description="Manage all data sources and their configurations"
              enableBulkActions={true}
              onBulkDelete={(selectedSources) => {
                Promise.all(selectedSources.map(source => deleteSourceMutation.mutateAsync(source.sourceId)))
                  .then(() => toast({ title: `${selectedSources.length} sources deleted successfully` }))
                  .catch(() => toast({ title: 'Failed to delete some sources', variant: 'destructive' }))
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSources.map((source) => {
                const syncJob = activeSyncJobs.find(job => job.sourceId === source.sourceId)
                const isRunning = syncJob?.status === 'running'
                
                return (
                  <Card key={source.sourceId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{source.name}</CardTitle>
                            <CardDescription>{source.platformName}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(source.status)}
                          {!source.isEnabled && (
                            <Badge variant="outline" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Sync Progress */}
                      {isRunning && syncJob && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Syncing...</span>
                            <span>{syncJob.progress}%</span>
                          </div>
                          <Progress value={syncJob.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {syncJob.itemsProcessed.toLocaleString()} / {syncJob.itemsTotal.toLocaleString()} items
                          </div>
                        </div>
                      )}

                      {/* Status and Health */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={
                          source.status === 'active' ? 'bg-green-100 text-green-800' :
                          source.status === 'error' ? 'bg-red-100 text-red-800' :
                          source.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {source.status}
                        </Badge>
                        <div className="text-sm font-medium">
                          Health: <span className={
                            source.health.score >= 90 ? 'text-green-600' :
                            source.health.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }>{source.health.score}%</span>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{source.statistics.totalBackups.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Backups</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{formatSize(source.statistics.totalSize)}</p>
                          <p className="text-xs text-muted-foreground">Size</p>
                        </div>
                      </div>

                      {/* Frequency and Last Sync */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span>{source.syncFrequency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span>
                            {source.lastSync ? 
                              formatDistanceToNow(new Date(source.lastSync), { addSuffix: true }) : 
                              'Never'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Health Issues */}
                      {source.health.issues.length > 0 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">{source.health.issues.length} issues</span>
                          </div>
                          <div className="text-yellow-700 mt-1 text-xs">
                            {source.health.issues[0]}
                            {source.health.issues.length > 1 && ` (+${source.health.issues.length - 1} more)`}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedSource(source)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => syncSourceMutation.mutate(source.sourceId)}
                          disabled={syncSourceMutation.isPending || isRunning}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => source.isEnabled ? 
                            pauseSourceMutation.mutate(source.sourceId) : 
                            resumeSourceMutation.mutate(source.sourceId)
                          }
                        >
                          {source.isEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>Latest backup operations across all sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sourceBackups.slice(0, 10).map((backup) => {
                  const source = sources.find(s => s.sourceId === backup.sourceId)
                  return (
                    <div key={backup.backupId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          backup.status === 'completed' ? 'bg-green-100' :
                          backup.status === 'failed' ? 'bg-red-100' :
                          backup.status === 'in_progress' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {backup.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : backup.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : backup.status === 'in_progress' ? (
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{source?.name || 'Unknown Source'}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(backup.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatSize(backup.size)}</div>
                        <div className="text-xs text-muted-foreground">
                          {backup.itemsProcessed.toLocaleString()} items
                        </div>
                        {backup.duration && (
                          <div className="text-xs text-muted-foreground">
                            {Math.round(backup.duration / 1000)}s
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Jobs</CardTitle>
              <CardDescription>Active and recent synchronization jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSyncJobs.map((job) => {
                  const source = sources.find(s => s.sourceId === job.sourceId)
                  return (
                    <div key={job.jobId} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          </div>
                          <div>
                            <div className="font-medium">{source?.name || 'Unknown Source'}</div>
                            <div className="text-sm text-muted-foreground">
                              Started {formatDistanceToNow(new Date(job.startTime), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {job.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{job.itemsProcessed.toLocaleString()} / {job.itemsTotal.toLocaleString()} items</span>
                          <span>Current: {job.currentItem}</span>
                        </div>
                      </div>

                      {job.error && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  )
                })}

                {activeSyncJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sync jobs
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sources.length > 0 ? 
                    Math.round(
                      sources.reduce((sum, s) => sum + (s.statistics.successfulBackups / s.statistics.totalBackups), 0) / sources.length * 100
                    ) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Overall backup success</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Backup Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sources.length > 0 ? 
                    Math.round(sources.reduce((sum, s) => sum + s.statistics.avgBackupTime, 0) / sources.length / 1000)
                    : 0
                  }s
                </div>
                <p className="text-xs text-muted-foreground">Average duration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compression Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sources.length > 0 ? 
                    (sources.reduce((sum, s) => sum + s.statistics.compressionRatio, 0) / sources.length).toFixed(1)
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Storage savings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Data Transferred</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSize(sources.reduce((sum, s) => sum + s.statistics.dataTransferred, 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total transferred</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Source Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analytics for each source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Source Details Dialog */}
      {selectedSource && (
        <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Database className="h-5 w-5" />
                {selectedSource.name}
              </DialogTitle>
              <DialogDescription>
                Detailed information and configuration for {selectedSource.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Source ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">{selectedSource.sourceId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSource.sourceId)
                        toast({ title: 'Source ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Platform</Label>
                  <div className="text-sm">{selectedSource.platformName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={
                    selectedSource.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedSource.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedSource.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sync Frequency</Label>
                  <div className="text-sm">{selectedSource.syncFrequency}</div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Configuration</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Schedule Enabled</div>
                    <div className="text-sm">{selectedSource.config.scheduleEnabled ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Retention Period</div>
                    <div className="text-sm">{selectedSource.config.backupRetention} days</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Compression</div>
                    <div className="text-sm">{selectedSource.config.compression ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Encryption</div>
                    <div className="text-sm">{selectedSource.config.encryption ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedSource.statistics.totalBackups}</div>
                    <div className="text-xs text-muted-foreground">Total Backups</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{formatSize(selectedSource.statistics.totalSize)}</div>
                    <div className="text-xs text-muted-foreground">Total Size</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {Math.round((selectedSource.statistics.successfulBackups / selectedSource.statistics.totalBackups) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{Math.round(selectedSource.statistics.avgBackupTime / 1000)}s</div>
                    <div className="text-xs text-muted-foreground">Avg Backup Time</div>
                  </div>
                </div>
              </div>

              {/* Health Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Health Status</Label>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedSource.health.score >= 90 ? 'bg-green-500' :
                        selectedSource.health.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">Health Score: {selectedSource.health.score}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last checked: {formatDistanceToNow(new Date(selectedSource.health.lastHealthCheck), { addSuffix: true })}
                    </div>
                  </div>

                  {selectedSource.health.issues.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600">Issues:</div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {selectedSource.health.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSource.health.recommendations.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="text-sm font-medium text-blue-600">Recommendations:</div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {selectedSource.health.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}