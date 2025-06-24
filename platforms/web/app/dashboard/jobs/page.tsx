'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Play, 
  Pause, 
  Square,
  Settings, 
  Trash2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Calendar,
  BarChart3,
  Timer
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  })

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
  })

  const runMutation = useMutation({
    mutationFn: api.jobs.run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job started',
        description: 'Backup job has been initiated',
      })
    },
    onError: () => {
      toast({
        title: 'Job failed to start',
        description: 'Failed to start backup job',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.jobs.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job deleted',
        description: 'Backup job has been removed',
      })
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete job',
        variant: 'destructive',
      })
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500 hover:scale-110 transition-transform duration-200" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500 hover:scale-110 transition-transform duration-200" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500 hover:scale-110 transition-transform duration-200" />
      default:
        return <Clock className="h-4 w-4 text-gray-500 hover:scale-110 transition-transform duration-200" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFrequencyText = (schedule: any) => {
    if (!schedule) return 'Manual'
    switch (schedule.frequency) {
      case 'hourly':
        return 'Every hour'
      case 'daily':
        return `Daily at ${schedule.time || '00:00'}`
      case 'weekly':
        return `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][schedule.dayOfWeek || 0]})`
      case 'monthly':
        return `Monthly (${schedule.dayOfMonth || 1}${getOrdinalSuffix(schedule.dayOfMonth || 1)})`
      default:
        return 'Manual'
    }
  }

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Backup Jobs</h1>
          <p className="text-muted-foreground">
            Schedule and monitor your automated backup operations
          </p>
        </div>
        <Button 
          className="hover:scale-105 transition-transform duration-200"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Jobs Grid */}
      {jobsData?.jobs && jobsData.jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobsData.jobs.map((job) => {
            const source = sources?.find(s => job.sources?.some(js => js.sourceId === s.sourceId))
            const successRate = job.statistics ? 
              ((job.statistics.successfulRuns / job.statistics.totalRuns) * 100) : 0

            return (
              <Card key={job.jobId} className="relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg hover:text-primary transition-colors duration-200 cursor-default">{job.name}</CardTitle>
                      <CardDescription>
                        {source?.name || 'Unknown source'} " {job.type}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:scale-110 transition-transform duration-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => runMutation.mutate(job.jobId)} className="hover:bg-green-50 transition-colors duration-200">
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-blue-50 transition-colors duration-200">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-purple-50 transition-colors duration-200">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Runs
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(job.jobId)}
                          className="text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium capitalize">{job.status}</span>
                    </div>
                    <Badge variant="secondary" className={`${getStatusColor(job.status)} hover:scale-105 transition-transform duration-200 cursor-default`}>
                      {job.status}
                    </Badge>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 hover:scale-125 transition-transform duration-200" />
                      <span>Schedule</span>
                    </div>
                    <p className="text-sm">{getFrequencyText(job.schedule)}</p>
                  </div>

                  {/* Last Run */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3 hover:scale-125 transition-transform duration-200" />
                      <span>Last Run</span>
                    </div>
                    <p className="text-sm">
                      {job.lastRun ? 
                        formatDistanceToNow(new Date(job.lastRun.startedAt), { addSuffix: true }) : 
                        'Never run'
                      }
                    </p>
                  </div>

                  {/* Statistics */}
                  {job.statistics && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="hover:scale-105 transition-transform duration-200 cursor-default">
                          <p className="text-lg font-semibold">{job.statistics.totalRuns}</p>
                          <p className="text-xs text-muted-foreground">Total Runs</p>
                        </div>
                        <div className="hover:scale-105 transition-transform duration-200 cursor-default">
                          <p className="text-lg font-semibold text-green-600">
                            {job.statistics.successfulRuns}
                          </p>
                          <p className="text-xs text-muted-foreground">Successful</p>
                        </div>
                      </div>
                      
                      {/* Success Rate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span>{successRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={successRate} className="h-1 hover:h-2 transition-all duration-300" />
                      </div>

                      {/* Average Duration */}
                      {job.statistics.averageDuration && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Avg. Duration: {Math.round(job.statistics.averageDuration / 1000 / 60)}m
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 hover:scale-105 hover:shadow-md transition-all duration-200"
                      onClick={() => runMutation.mutate(job.jobId)}
                      disabled={runMutation.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 hover:scale-105 hover:shadow-md transition-all duration-200"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No backup jobs yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first backup job to start automating your data protection. 
                Schedule regular backups for peace of mind.
              </p>
            </div>
            <Button 
              className="hover:scale-105 transition-transform duration-200"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Job
            </Button>
          </div>
        </Card>
      )}

      {/* Create Job Dialog */}
      <CreateJobDialog 
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
        }}
      />
    </div>
  )
}