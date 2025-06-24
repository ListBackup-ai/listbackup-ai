'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdvancedDataTable } from '@/components/ui/advanced-data-table'
import { BulkOperationsDialog } from '@/components/ui/bulk-operations-dialog'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { JobDetailsDialog } from '@/components/jobs/job-details-dialog'
import { JobRunsViewer } from '@/components/jobs/job-runs-viewer'
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Eye, 
  Settings,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Activity,
  Timer,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'

interface Job {
  jobId: string
  name: string
  type: 'backup' | 'sync' | 'export' | 'import' | 'maintenance'
  status: 'active' | 'paused' | 'completed' | 'failed' | 'pending'
  schedule?: string
  nextRun?: string
  lastRun?: {
    status: 'success' | 'failed' | 'running'
    startTime: string
    endTime?: string
    duration?: number
    recordsProcessed?: number
    errorMessage?: string
  }
  sourceId?: string
  sourceName?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  statistics?: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageDuration: number
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

export function EnhancedJobsPage() {
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([])
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false)
  const [jobRunsOpen, setJobRunsOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [bulkActionOpen, setBulkActionOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'start' | 'pause' | 'delete'>('start')
  const [bulkOperations, setBulkOperations] = useState<any[]>([])
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.jobs.list,
  })

  const { data: jobStats } = useQuery({
    queryKey: ['job-stats'],
    queryFn: () => api.jobs.getStats(),
  })

  const startJobMutation = useMutation({
    mutationFn: api.jobs.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job started',
        description: 'Job has been started successfully',
      })
    },
  })

  const pauseJobMutation = useMutation({
    mutationFn: api.jobs.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job paused',
        description: 'Job has been paused',
      })
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: api.jobs.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job deleted',
        description: 'Job has been removed',
      })
    },
  })

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'backup':
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case 'sync':
        return <RefreshCw className="h-4 w-4 text-green-600" />
      case 'export':
        return <RefreshCw className="h-4 w-4 text-purple-600" />
      case 'import':
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      case 'maintenance':
        return <Settings className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: 'name',
      header: 'Job Name',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              {getJobTypeIcon(job.type)}
            </div>
            <div>
              <div className="font-medium">{job.name}</div>
              <div className="text-sm text-muted-foreground">
                {job.sourceName && `${job.sourceName} • `}
                <span className="capitalize">{job.type}</span>
              </div>
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
          <Badge variant="secondary" className={cn('gap-1', getStatusColor(status))}>
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        return (
          <Badge variant="secondary" className={getPriorityColor(priority)}>
            <span className="capitalize">{priority}</span>
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'schedule',
      header: 'Schedule',
      cell: ({ row }) => {
        const schedule = row.getValue('schedule') as string
        const nextRun = row.original.nextRun
        
        if (!schedule) {
          return <div className="text-sm text-muted-foreground">Manual</div>
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {schedule}
            </div>
            {nextRun && (
              <div className="text-muted-foreground">
                Next: {format(new Date(nextRun), 'MMM dd, HH:mm')}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'lastRun',
      header: 'Last Run',
      cell: ({ row }) => {
        const lastRun = row.getValue('lastRun') as Job['lastRun']
        if (!lastRun) {
          return <div className="text-sm text-muted-foreground">Never run</div>
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              {lastRun.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {lastRun.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
              {lastRun.status === 'running' && <Activity className="h-3 w-3 text-blue-500 animate-pulse" />}
              <span>
                {formatDistanceToNow(new Date(lastRun.startTime), { addSuffix: true })}
              </span>
            </div>
            {lastRun.duration && (
              <div className="text-muted-foreground">
                Duration: {formatDuration(lastRun.duration)}
              </div>
            )}
            {lastRun.recordsProcessed && (
              <div className="text-muted-foreground">
                Processed: {lastRun.recordsProcessed.toLocaleString()} records
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'statistics',
      header: 'Statistics',
      cell: ({ row }) => {
        const stats = row.getValue('statistics') as Job['statistics']
        if (!stats) return <div className="text-sm text-muted-foreground">No data</div>
        
        const successRate = stats.totalRuns > 0 ? (stats.successfulRuns / stats.totalRuns) * 100 : 0
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{successRate.toFixed(1)}%</span>
              <span className="text-muted-foreground">success rate</span>
            </div>
            <div className="text-muted-foreground">
              {stats.totalRuns} runs • Avg: {formatDuration(stats.averageDuration)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Modified',
      cell: ({ row }) => {
        const updatedAt = row.getValue('updatedAt') as string
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const job = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedJob(job)
                setJobDetailsOpen(true)
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedJob(job)
                setJobRunsOpen(true)
              }}>
                <Activity className="h-4 w-4 mr-2" />
                View Runs
              </DropdownMenuItem>
              {job.status === 'paused' && (
                <DropdownMenuItem onClick={() => startJobMutation.mutate(job.jobId)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Job
                </DropdownMenuItem>
              )}
              {job.status === 'active' && (
                <DropdownMenuItem onClick={() => pauseJobMutation.mutate(job.jobId)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Job
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteJobMutation.mutate(job.jobId)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const filterableColumns = [
    {
      id: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
    },
    {
      id: 'type',
      title: 'Type',
      options: [
        { label: 'Backup', value: 'backup' },
        { label: 'Sync', value: 'sync' },
        { label: 'Export', value: 'export' },
        { label: 'Import', value: 'import' },
        { label: 'Maintenance', value: 'maintenance' },
      ],
    },
    {
      id: 'priority',
      title: 'Priority',
      options: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  ]

  const handleBulkAction = async () => {
    setIsProcessingBulk(true)
    const operations = selectedJobs.map(job => ({
      id: job.jobId,
      name: job.name,
      status: 'pending' as const,
    }))
    setBulkOperations(operations)

    try {
      for (let i = 0; i < selectedJobs.length; i++) {
        const job = selectedJobs[i]
        setBulkOperations(prev => prev.map(op => 
          op.id === job.jobId ? { ...op, status: 'processing' } : op
        ))

        try {
          switch (bulkActionType) {
            case 'start':
              await startJobMutation.mutateAsync(job.jobId)
              break
            case 'pause':
              await pauseJobMutation.mutateAsync(job.jobId)
              break
            case 'delete':
              await deleteJobMutation.mutateAsync(job.jobId)
              break
          }
          
          setBulkOperations(prev => prev.map(op => 
            op.id === job.jobId ? { ...op, status: 'success' } : op
          ))
        } catch (error) {
          setBulkOperations(prev => prev.map(op => 
            op.id === job.jobId ? { 
              ...op, 
              status: 'error',
              error: `Failed to ${bulkActionType} job`
            } : op
          ))
        }
      }
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleExport = (data: Job[]) => {
    const csvContent = [
      ['Name', 'Type', 'Status', 'Priority', 'Schedule', 'Last Run', 'Success Rate', 'Total Runs', 'Created'].join(','),
      ...data.map(job => [
        job.name,
        job.type,
        job.status,
        job.priority,
        job.schedule || 'Manual',
        job.lastRun ? new Date(job.lastRun.startTime).toLocaleDateString() : 'Never',
        job.statistics ? `${((job.statistics.successfulRuns / job.statistics.totalRuns) * 100).toFixed(1)}%` : '0%',
        job.statistics?.totalRuns || 0,
        new Date(job.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export completed',
      description: `Exported ${data.length} jobs to CSV`,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage backup jobs, schedules, and processing tasks
          </p>
        </div>
        <Button onClick={() => setCreateJobOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Stats Cards */}
      {jobStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold">{jobStats.activeJobs}</p>
                </div>
                <Play className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{jobStats.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(jobStats.averageDuration)}</p>
                </div>
                <Timer className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Jobs</p>
                  <p className="text-2xl font-bold">{jobStats.failedJobs}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <AdvancedDataTable
        columns={columns}
        data={jobs || []}
        filterableColumns={filterableColumns}
        onRowSelect={setSelectedJobs}
        onBulkDelete={(selected) => {
          setSelectedJobs(selected)
          setBulkActionType('delete')
          setBulkActionOpen(true)
        }}
        onBulkEdit={(selected) => {
          setSelectedJobs(selected)
          setBulkActionType('start')
          setBulkActionOpen(true)
        }}
        onExport={handleExport}
        onRefresh={() => refetch()}
        isLoading={isLoading}
        title="All Jobs"
        description="Scheduled and manual jobs across all sources"
      />

      {/* Create Job Dialog */}
      <CreateJobDialog
        open={createJobOpen}
        onOpenChange={setCreateJobOpen}
      />

      {/* Job Details Dialog */}
      {selectedJob && (
        <JobDetailsDialog
          job={selectedJob}
          open={jobDetailsOpen}
          onOpenChange={setJobDetailsOpen}
        />
      )}

      {/* Job Runs Viewer */}
      {selectedJob && (
        <JobRunsViewer
          jobId={selectedJob.jobId}
          open={jobRunsOpen}
          onOpenChange={setJobRunsOpen}
        />
      )}

      {/* Bulk Action Dialog */}
      <BulkOperationsDialog
        open={bulkActionOpen}
        onOpenChange={setBulkActionOpen}
        title={`${bulkActionType === 'start' ? 'Start' : bulkActionType === 'pause' ? 'Pause' : 'Delete'} Jobs`}
        description={`${bulkActionType === 'start' ? 'Start' : bulkActionType === 'pause' ? 'Pause' : 'Delete'} the selected jobs.`}
        operations={bulkOperations}
        onConfirm={handleBulkAction}
        onCancel={() => setBulkActionOpen(false)}
        variant={bulkActionType === 'delete' ? 'delete' : bulkActionType === 'start' ? 'sync' : 'edit'}
        isProcessing={isProcessingBulk}
      />
    </div>
  )
}