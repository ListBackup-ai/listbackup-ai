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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Timer,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Settings,
  Filter,
  Search,
  Download,
  Upload,
  Database,
  CloudUpload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Workflow,
  GitBranch,
  Hash,
  ExternalLink,
  Copy,
  Archive,
  FastForward,
  Rewind,
  SkipForward,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Job {
  jobId: string
  name: string
  type: 'backup' | 'sync' | 'export' | 'import' | 'cleanup' | 'validation'
  status: 'running' | 'completed' | 'failed' | 'queued' | 'paused' | 'cancelled' | 'scheduled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  sourceId?: string
  sourceName?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  scheduledFor?: string
  progress: number
  totalSteps: number
  currentStep: number
  currentStepName: string
  estimatedDuration?: number
  actualDuration?: number
  config: {
    retryAttempts: number
    timeout: number
    scheduleExpression?: string
    parameters: Record<string, any>
  }
  result?: {
    success: boolean
    itemsProcessed: number
    itemsTotal: number
    dataSize: number
    errors: string[]
    warnings: string[]
    outputLocation?: string
  }
  logs: JobLog[]
  dependencies: string[]
  dependents: string[]
  metadata: {
    createdBy: string
    tags: string[]
    environment: string
    version: string
  }
}

interface JobLog {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
}

interface JobQueue {
  name: string
  priority: number
  maxConcurrency: number
  currentJobs: number
  queuedJobs: number
  avgWaitTime: number
  throughput: number
}

interface JobSchedule {
  scheduleId: string
  name: string
  expression: string
  timezone: string
  enabled: boolean
  jobTemplate: Partial<Job>
  lastRun?: string
  nextRun: string
  runCount: number
  failureCount: number
}

export default function JobManagementPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedLogs, setSelectedLogs] = useState<JobLog[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'manage'],
    queryFn: () => api.jobs.list({ includeLogs: false, includeMetadata: true }),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  })

  const { data: jobQueues = [] } = useQuery({
    queryKey: ['jobs', 'queues'],
    queryFn: () => api.jobs.getQueues(),
    refetchInterval: 10000,
  })

  const { data: jobSchedules = [] } = useQuery({
    queryKey: ['jobs', 'schedules'],
    queryFn: () => api.jobs.getSchedules(),
  })

  const { data: jobStats } = useQuery({
    queryKey: ['jobs', 'stats'],
    queryFn: () => api.jobs.getStats(),
    refetchInterval: 30000,
  })

  // Mutations
  const startJobMutation = useMutation({
    mutationFn: api.jobs.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job started successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to start job', variant: 'destructive' })
    },
  })

  const pauseJobMutation = useMutation({
    mutationFn: api.jobs.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job paused successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to pause job', variant: 'destructive' })
    },
  })

  const resumeJobMutation = useMutation({
    mutationFn: api.jobs.resume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job resumed successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to resume job', variant: 'destructive' })
    },
  })

  const cancelJobMutation = useMutation({
    mutationFn: api.jobs.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job cancelled successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to cancel job', variant: 'destructive' })
    },
  })

  const retryJobMutation = useMutation({
    mutationFn: api.jobs.retry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job retry initiated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to retry job', variant: 'destructive' })
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: api.jobs.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({ title: 'Job deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete job', variant: 'destructive' })
    },
  })

  // Job columns for table view
  const jobColumns: ColumnDef<Job>[] = [
    {
      accessorKey: 'name',
      header: 'Job',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {getJobTypeIcon(job.type)}
            </div>
            <div>
              <div className="font-medium">{job.name}</div>
              <div className="text-sm text-muted-foreground">{job.sourceName || job.type}</div>
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
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant="secondary" className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        return <span className="capitalize">{type}</span>
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        const colors = {
          low: 'bg-gray-100 text-gray-800',
          normal: 'bg-blue-100 text-blue-800',
          high: 'bg-yellow-100 text-yellow-800',
          urgent: 'bg-red-100 text-red-800',
        }
        return (
          <Badge variant="secondary" className={colors[priority as keyof typeof colors]}>
            {priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="w-20">
            <div className="flex justify-between text-sm mb-1">
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedJob(job)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {renderJobActions(job)}
          </div>
        )
      },
    },
  ]

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'backup':
        return <Archive className="h-4 w-4 text-blue-600" />
      case 'sync':
        return <RefreshCw className="h-4 w-4 text-green-600" />
      case 'export':
        return <Download className="h-4 w-4 text-purple-600" />
      case 'import':
        return <Upload className="h-4 w-4 text-orange-600" />
      case 'cleanup':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Workflow className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paused':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderJobActions = (job: Job) => {
    switch (job.status) {
      case 'running':
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pauseJobMutation.mutate(job.jobId)}
              disabled={pauseJobMutation.isPending}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelJobMutation.mutate(job.jobId)}
              disabled={cancelJobMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )
      case 'paused':
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resumeJobMutation.mutate(job.jobId)}
              disabled={resumeJobMutation.isPending}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelJobMutation.mutate(job.jobId)}
              disabled={cancelJobMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )
      case 'failed':
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryJobMutation.mutate(job.jobId)}
              disabled={retryJobMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteJobMutation.mutate(job.jobId)}
              disabled={deleteJobMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )
      case 'queued':
      case 'scheduled':
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startJobMutation.mutate(job.jobId)}
              disabled={startJobMutation.isPending}
            >
              <FastForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelJobMutation.mutate(job.jobId)}
              disabled={cancelJobMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )
      case 'completed':
      case 'cancelled':
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteJobMutation.mutate(job.jobId)}
            disabled={deleteJobMutation.isPending}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      default:
        return null
    }
  }

  const viewJobLogs = async (jobId: string) => {
    try {
      const logs = await api.jobs.getLogs(jobId)
      setSelectedLogs(logs)
      setShowLogsDialog(true)
    } catch (error) {
      toast({ title: 'Failed to load job logs', variant: 'destructive' })
    }
  }

  const exportJobs = (data: Job[]) => {
    const csv = [
      ['Name', 'Type', 'Status', 'Priority', 'Progress', 'Created', 'Started', 'Completed', 'Duration'],
      ...data.map(j => [
        j.name,
        j.type,
        j.status,
        j.priority,
        j.progress + '%',
        j.createdAt,
        j.startedAt || '',
        j.completedAt || '',
        j.actualDuration ? Math.round(j.actualDuration / 1000) + 's' : ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jobs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredJobs = jobs.filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false
    if (filterType !== 'all' && job.type !== filterType) return false
    if (filterPriority !== 'all' && job.priority !== filterPriority) return false
    return true
  })

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
          <p className="text-muted-foreground">
            Monitor job execution, manage queues, and view detailed logs
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
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {jobs.filter(j => j.status === 'running').length} running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.length > 0 ? 
                    Math.round((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.filter(j => j.actualDuration).length > 0 ? 
                    formatDuration(
                      jobs.reduce((sum, j) => sum + (j.actualDuration || 0), 0) / 
                      jobs.filter(j => j.actualDuration).length
                    ) : '0s'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Average execution time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Load</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobQueues.reduce((sum, q) => sum + q.currentJobs, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active across all queues
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Running Jobs */}
          {jobs.filter(j => j.status === 'running').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Currently Running Jobs</CardTitle>
                <CardDescription>Jobs in progress with real-time status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.filter(j => j.status === 'running').map((job) => (
                    <div key={job.jobId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          {getJobTypeIcon(job.type)}
                        </div>
                        <div>
                          <div className="font-medium">{job.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Step {job.currentStep}/{job.totalSteps}: {job.currentStepName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{job.progress}%</div>
                        <Progress value={job.progress} className="w-20" />
                        {job.estimatedDuration && (
                          <div className="text-xs text-muted-foreground">
                            ~{formatDuration(job.estimatedDuration * (1 - job.progress / 100))} remaining
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Status</CardTitle>
              <CardDescription>Job queue performance and load distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobQueues.map((queue) => (
                  <div key={queue.name} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{queue.name}</div>
                      <Badge variant="secondary" className={
                        queue.currentJobs >= queue.maxConcurrency ? 'bg-red-100 text-red-800' :
                        queue.currentJobs > queue.maxConcurrency * 0.8 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {queue.currentJobs}/{queue.maxConcurrency}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Queued:</span>
                        <span>{queue.queuedJobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Wait:</span>
                        <span>{formatDuration(queue.avgWaitTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Throughput:</span>
                        <span>{queue.throughput}/min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="cleanup">Cleanup</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {(filterStatus !== 'all' || filterType !== 'all' || filterPriority !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterType('all')
                  setFilterPriority('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={jobColumns}
              data={filteredJobs}
              onExport={exportJobs}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
              isLoading={jobsLoading}
              title="Job Execution Log"
              description="Complete history of job executions and their status"
              enableBulkActions={true}
              onBulkDelete={(selectedJobs) => {
                const deletableJobs = selectedJobs.filter(job => 
                  ['completed', 'failed', 'cancelled'].includes(job.status)
                )
                if (deletableJobs.length > 0) {
                  Promise.all(deletableJobs.map(job => deleteJobMutation.mutateAsync(job.jobId)))
                    .then(() => toast({ title: `${deletableJobs.length} jobs deleted successfully` }))
                    .catch(() => toast({ title: 'Failed to delete some jobs', variant: 'destructive' }))
                }
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Card key={job.jobId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getJobTypeIcon(job.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{job.name}</CardTitle>
                          <CardDescription className="capitalize">{job.type} job</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <Badge variant="secondary" className={
                          job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          job.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {job.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <span className="text-sm font-medium">{job.progress}%</span>
                      </div>
                      {job.status === 'running' && (
                        <>
                          <Progress value={job.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Step {job.currentStep}/{job.totalSteps}: {job.currentStepName}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Timing Information */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                      </div>
                      {job.startedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Started:</span>
                          <span>{formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}</span>
                        </div>
                      )}
                      {job.completedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}</span>
                        </div>
                      )}
                      {job.actualDuration && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{formatDuration(job.actualDuration)}</span>
                        </div>
                      )}
                    </div>

                    {/* Results */}
                    {job.result && (
                      <div className="p-2 border rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Processed:</span>
                          <span>{job.result.itemsProcessed.toLocaleString()}/{job.result.itemsTotal.toLocaleString()}</span>
                        </div>
                        {job.result.errors.length > 0 && (
                          <div className="text-xs text-red-600">
                            {job.result.errors.length} error(s)
                          </div>
                        )}
                        {job.result.warnings.length > 0 && (
                          <div className="text-xs text-yellow-600">
                            {job.result.warnings.length} warning(s)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedJob(job)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewJobLogs(job.jobId)}
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                      <div className="flex gap-1">
                        {renderJobActions(job)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="queues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Queues</CardTitle>
              <CardDescription>Manage job queue configuration and monitor performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {jobQueues.map((queue) => (
                  <Card key={queue.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{queue.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Priority: {queue.priority}
                          </Badge>
                          <Badge variant={
                            queue.currentJobs >= queue.maxConcurrency ? 'destructive' :
                            queue.currentJobs > queue.maxConcurrency * 0.8 ? 'default' :
                            'secondary'
                          }>
                            {queue.currentJobs}/{queue.maxConcurrency} active
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-lg font-semibold">{queue.queuedJobs}</div>
                          <div className="text-xs text-muted-foreground">Queued Jobs</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-lg font-semibold">{formatDuration(queue.avgWaitTime)}</div>
                          <div className="text-xs text-muted-foreground">Avg Wait Time</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-lg font-semibold">{queue.throughput}/min</div>
                          <div className="text-xs text-muted-foreground">Throughput</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-lg font-semibold">
                            {Math.round((queue.currentJobs / queue.maxConcurrency) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Utilization</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Schedules</CardTitle>
              <CardDescription>Manage recurring job schedules and their configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobSchedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-muted-foreground">{schedule.expression}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Next: {formatDistanceToNow(new Date(schedule.nextRun), { addSuffix: true })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Runs: {schedule.runCount} | Failures: {schedule.failureCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.filter(j => {
                    const today = new Date()
                    const jobDate = new Date(j.createdAt)
                    return jobDate.toDateString() === today.toDateString()
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Created today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.length > 0 ? 
                    Math.round((jobs.filter(j => j.status === 'failed').length / jobs.length) * 100) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Jobs that failed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Queue Wait Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobQueues.length > 0 ? 
                    formatDuration(jobQueues.reduce((sum, q) => sum + q.avgWaitTime, 0) / jobQueues.length) : '0s'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Average wait time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobQueues.reduce((sum, q) => sum + q.throughput, 0)}/min
                </div>
                <p className="text-xs text-muted-foreground">Jobs per minute</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Performance Trends</CardTitle>
              <CardDescription>Historical job performance and queue metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getJobTypeIcon(selectedJob.type)}
                {selectedJob.name}
              </DialogTitle>
              <DialogDescription>
                Detailed information for job execution
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Job ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedJob.jobId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedJob.jobId)
                        toast({ title: 'Job ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="text-sm capitalize">{selectedJob.type}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedJob.status)}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant="secondary" className={
                    selectedJob.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedJob.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedJob.priority}
                  </Badge>
                </div>
              </div>

              {/* Progress */}
              {selectedJob.status === 'running' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Progress</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Step {selectedJob.currentStep}/{selectedJob.totalSteps}: {selectedJob.currentStepName}</span>
                      <span>{selectedJob.progress}%</span>
                    </div>
                    <Progress value={selectedJob.progress} className="h-3" />
                  </div>
                </div>
              )}

              {/* Results */}
              {selectedJob.result && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Results</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold">{selectedJob.result.itemsProcessed.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Items Processed</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold">{selectedJob.result.errors.length}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold">{selectedJob.result.warnings.length}</div>
                      <div className="text-xs text-muted-foreground">Warnings</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Configuration</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Retry Attempts</div>
                    <div className="text-sm">{selectedJob.config.retryAttempts}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Timeout</div>
                    <div className="text-sm">{formatDuration(selectedJob.config.timeout)}</div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Metadata</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Created By</div>
                    <div className="text-sm">{selectedJob.metadata.createdBy}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Environment</div>
                    <div className="text-sm">{selectedJob.metadata.environment}</div>
                  </div>
                </div>
                {selectedJob.metadata.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedJob.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Job Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Job Logs</DialogTitle>
            <DialogDescription>
              Detailed execution logs and debug information
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            <div className="space-y-2 font-mono text-sm">
              {selectedLogs.map((log, index) => (
                <div key={index} className={`p-2 rounded text-xs ${
                  log.level === 'error' ? 'bg-red-50 text-red-800' :
                  log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                  log.level === 'info' ? 'bg-blue-50 text-blue-800' :
                  'bg-gray-50 text-gray-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">
                      {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                    <Badge variant="outline" className={`text-xs ${
                      log.level === 'error' ? 'border-red-200 text-red-700' :
                      log.level === 'warn' ? 'border-yellow-200 text-yellow-700' :
                      log.level === 'info' ? 'border-blue-200 text-blue-700' :
                      'border-gray-200 text-gray-700'
                    }`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span>{log.message}</span>
                  </div>
                  {log.context && Object.keys(log.context).length > 0 && (
                    <div className="mt-1 ml-20 text-xs text-muted-foreground">
                      {JSON.stringify(log.context, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}