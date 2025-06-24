'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar,
  Clock,
  Database,
  Shield,
  FileArchive,
  Activity,
  Settings,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { api, Job, JobRun } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface JobDetailsDialogProps {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JobDetailsDialog({ job, open, onOpenChange }: JobDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  // Fetch job runs
  const { data: runsData, isLoading: isLoadingRuns } = useQuery({
    queryKey: ['job-runs', job.jobId],
    queryFn: () => api.jobs.getRuns(job.jobId, { limit: 10 }),
    enabled: open,
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  const runs = runsData?.runs || []
  const isRunning = job.lastRun?.status === 'running'

  const handleRunJob = async () => {
    try {
      await api.jobs.run(job.jobId)
      toast({
        title: 'Job started',
        description: 'The job has been triggered successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to start job',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{job.name}</DialogTitle>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
          <DialogDescription>
            {job.description || 'View and manage job details'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="history">
              History
              <Badge variant="secondary" className="ml-2 text-xs">
                {runs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Job Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {job.statistics?.totalRuns || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.statistics?.successfulRuns || 0} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {job.statistics?.totalRuns
                      ? Math.round((job.statistics.successfulRuns / job.statistics.totalRuns) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.statistics?.failedRuns || 0} failed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(job.statistics?.totalDataProcessed || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total backed up
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Last Run Info */}
            {job.lastRun && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last Run</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.lastRun.status)}
                      <span className="text-sm font-medium">{job.lastRun.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(job.lastRun.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {job.lastRun.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="text-sm">
                        {formatDuration(
                          new Date(job.lastRun.startedAt),
                          new Date(job.lastRun.completedAt)
                        )}
                      </span>
                    </div>
                  )}
                  {job.lastRun.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <p className="text-sm text-red-800">{job.lastRun.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  onClick={handleRunJob}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </>
                  )}
                </Button>
                <Button variant="outline" disabled={isRunning}>
                  <Pause className="h-4 w-4 mr-2" />
                  {job.status === 'active' ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.schedule ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Frequency</span>
                      <Badge>{job.schedule.frequency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time</span>
                      <span className="text-sm font-medium">{job.schedule.time}</span>
                    </div>
                    {job.schedule.timezone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Timezone</span>
                        <span className="text-sm font-medium">{job.schedule.timezone}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Manual trigger only</p>
                )}
              </CardContent>
            </Card>

            {/* Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.sources?.map((source) => (
                    <div key={source.sourceId} className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{source.sourceName}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Format</span>
                  <Badge variant="outline">{job.config?.format || 'JSON'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compression</span>
                  <span className="text-sm">
                    {job.config?.compression ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Encryption</span>
                  <span className="text-sm">
                    {job.config?.encryption ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {isLoadingRuns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : runs.length > 0 ? (
                <div className="space-y-2">
                  {runs.map((run: JobRun) => (
                    <Card key={run.runId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <p className="text-sm font-medium">
                                Run #{run.runId.slice(-8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(run.startedAt), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {run.statistics && (
                              <p className="text-sm">
                                {formatNumber(run.statistics.recordsProcessed)} records
                              </p>
                            )}
                            {run.duration && (
                              <p className="text-xs text-muted-foreground">
                                {run.duration}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No run history yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a run from the history tab to view logs
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDuration(start: Date, end: Date): string {
  const duration = end.getTime() - start.getTime()
  const seconds = Math.floor(duration / 1000)
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

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}