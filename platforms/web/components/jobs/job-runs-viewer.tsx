'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Play, 
  Pause, 
  Square,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Calendar,
  Timer,
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  HardDrive,
  Zap,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Copy,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@listbackup/shared/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface JobRunsViewerProps {
  jobId: string
  jobName?: string
}

interface JobRun {
  runId: string
  jobId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  duration?: number
  progress?: number
  statistics?: {
    recordsProcessed: number
    recordsFailed: number
    filesCreated: number
    totalSize: number
    errors: string[]
  }
  logs?: Array<{
    timestamp: string
    level: 'info' | 'warning' | 'error'
    message: string
  }>
}

const statusConfig = {
  running: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'Running',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Failed',
  },
  cancelled: {
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Cancelled',
  },
}

export function JobRunsViewer({ jobId, jobName }: JobRunsViewerProps) {
  const [selectedRun, setSelectedRun] = useState<JobRun | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDetails, setShowDetails] = useState(false)

  // Mock data - replace with actual API call
  const { data: runs, isLoading } = useQuery({
    queryKey: ['job-runs', jobId, timeRange, statusFilter],
    queryFn: async () => {
      // Replace with actual API call
      return mockJobRuns
    },
  })

  const { data: analytics } = useQuery({
    queryKey: ['job-analytics', jobId, timeRange],
    queryFn: async () => {
      // Replace with actual API call
      return mockAnalytics
    },
  })

  const getStatusIcon = (status: JobRun['status']) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return <Icon className={cn('h-4 w-4', config.color)} />
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '-'
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Runs</h2>
          <p className="text-muted-foreground">
            {jobName ? `History for ${jobName}` : 'Backup execution history'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalRuns}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.successRate}%</div>
              <Progress value={analytics.successRate} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Duration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgDuration}</div>
              <p className="text-xs text-muted-foreground">
                <Timer className="h-3 w-3 inline mr-1" />
                -5% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Data Backed Up</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalData}</div>
              <p className="text-xs text-muted-foreground">
                <Database className="h-3 w-3 inline mr-1" />
                {analytics.totalRecords} records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">
            <Activity className="h-4 w-4 mr-2" />
            Run History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Run History Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs?.map((run) => {
                    const StatusIcon = statusConfig[run.status].icon
                    
                    return (
                      <TableRow 
                        key={run.runId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRun(run)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(run.status)}
                            <span className="font-medium capitalize">{run.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(parseISO(run.startedAt), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(run.startedAt), 'HH:mm:ss')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDuration(run.duration)}</TableCell>
                        <TableCell>
                          {run.statistics ? (
                            <div>
                              <p className="font-medium">
                                {run.statistics.recordsProcessed.toLocaleString()}
                              </p>
                              {run.statistics.recordsFailed > 0 && (
                                <p className="text-xs text-red-500">
                                  {run.statistics.recordsFailed} failed
                                </p>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {run.statistics ? formatFileSize(run.statistics.totalSize) : '-'}
                        </TableCell>
                        <TableCell>
                          {run.status === 'running' && run.progress ? (
                            <div className="space-y-1">
                              <Progress value={run.progress} className="h-1" />
                              <p className="text-xs text-muted-foreground">
                                {run.progress}%
                              </p>
                            </div>
                          ) : (
                            <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                              {statusConfig[run.status].label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedRun(run)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {run.status === 'completed' && (
                                <>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Files
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Run ID
                                  </DropdownMenuItem>
                                </>
                              )}
                              {run.status === 'running' && (
                                <DropdownMenuItem className="text-red-600">
                                  <Square className="h-4 w-4 mr-2" />
                                  Cancel Run
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Success Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Success Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics?.successRateData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Duration Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.durationData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="duration" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics?.statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics?.statusDistribution?.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === 'Completed' ? '#10b981' :
                            entry.name === 'Failed' ? '#ef4444' :
                            entry.name === 'Cancelled' ? '#6b7280' :
                            '#3b82f6'
                          }
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Data Volume */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics?.dataVolumeData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="size" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Logs</CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {mockLogs.map((log, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg text-sm font-mono",
                        log.level === 'error' && "bg-red-50 text-red-900",
                        log.level === 'warning' && "bg-yellow-50 text-yellow-900",
                        log.level === 'info' && "bg-gray-50 text-gray-900"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(log.timestamp), 'HH:mm:ss.SSS')}
                        </span>
                        <Badge
                          variant={
                            log.level === 'error' ? 'destructive' :
                            log.level === 'warning' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {log.level}
                        </Badge>
                      </div>
                      <p className="break-all">{log.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Run Details Dialog */}
      {selectedRun && (
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Run Details</DialogTitle>
              <DialogDescription>
                Run ID: {selectedRun.runId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedRun.status)}
                  <span className="font-medium capitalize">{selectedRun.status}</span>
                </div>
                {selectedRun.progress && (
                  <Progress value={selectedRun.progress} className="flex-1" />
                )}
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Started</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedRun.startedAt), 'PPpp')}
                  </p>
                </div>
                {selectedRun.completedAt && (
                  <div>
                    <Label>Completed</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedRun.completedAt), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {selectedRun.statistics && (
                <>
                  <Separator />
                  <div>
                    <Label className="mb-3 block">Statistics</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Records Processed</p>
                        <p className="text-lg font-medium">
                          {selectedRun.statistics.recordsProcessed.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Failed Records</p>
                        <p className="text-lg font-medium text-red-500">
                          {selectedRun.statistics.recordsFailed.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Files Created</p>
                        <p className="text-lg font-medium">
                          {selectedRun.statistics.filesCreated}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-lg font-medium">
                          {formatFileSize(selectedRun.statistics.totalSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Errors */}
              {selectedRun.statistics?.errors && selectedRun.statistics.errors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="mb-3 block">Errors</Label>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {selectedRun.statistics.errors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-900">
                            {error}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex justify-end gap-2">
                {selectedRun.status === 'completed' && (
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup
                  </Button>
                )}
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Logs
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Mock data - replace with actual API data
const mockJobRuns: JobRun[] = [
  {
    runId: 'run_1',
    jobId: 'job_1',
    status: 'completed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 1800000).toISOString(),
    duration: 1800000,
    statistics: {
      recordsProcessed: 15420,
      recordsFailed: 0,
      filesCreated: 3,
      totalSize: 125829120,
      errors: [],
    },
  },
  {
    runId: 'run_2',
    jobId: 'job_1',
    status: 'running',
    startedAt: new Date(Date.now() - 600000).toISOString(),
    progress: 45,
    statistics: {
      recordsProcessed: 6789,
      recordsFailed: 0,
      filesCreated: 1,
      totalSize: 45678901,
      errors: [],
    },
  },
  {
    runId: 'run_3',
    jobId: 'job_1',
    status: 'failed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 85800000).toISOString(),
    duration: 600000,
    statistics: {
      recordsProcessed: 3200,
      recordsFailed: 150,
      filesCreated: 1,
      totalSize: 23456789,
      errors: [
        'API rate limit exceeded',
        'Failed to process batch 45-50',
      ],
    },
  },
]

const mockAnalytics = {
  totalRuns: 245,
  successRate: 92.5,
  avgDuration: '12m 45s',
  totalData: '1.2 TB',
  totalRecords: '2.5M',
  successRateData: [
    { date: 'Mon', rate: 95 },
    { date: 'Tue', rate: 92 },
    { date: 'Wed', rate: 88 },
    { date: 'Thu', rate: 94 },
    { date: 'Fri', rate: 93 },
    { date: 'Sat', rate: 91 },
    { date: 'Sun', rate: 95 },
  ],
  durationData: [
    { date: 'Mon', duration: 720 },
    { date: 'Tue', duration: 810 },
    { date: 'Wed', duration: 750 },
    { date: 'Thu', duration: 695 },
    { date: 'Fri', duration: 765 },
    { date: 'Sat', duration: 800 },
    { date: 'Sun', duration: 720 },
  ],
  statusDistribution: [
    { name: 'Completed', value: 227 },
    { name: 'Failed', value: 12 },
    { name: 'Cancelled', value: 6 },
  ],
  dataVolumeData: [
    { date: 'Mon', size: 180 },
    { date: 'Tue', size: 165 },
    { date: 'Wed', size: 190 },
    { date: 'Thu', size: 175 },
    { date: 'Fri', size: 185 },
    { date: 'Sat', size: 160 },
    { date: 'Sun', size: 170 },
  ],
}

const mockLogs = [
  {
    timestamp: new Date(Date.now() - 5000).toISOString(),
    level: 'info' as const,
    message: 'Starting backup job for source: Keap Production',
  },
  {
    timestamp: new Date(Date.now() - 4500).toISOString(),
    level: 'info' as const,
    message: 'Authenticating with Keap API...',
  },
  {
    timestamp: new Date(Date.now() - 4000).toISOString(),
    level: 'info' as const,
    message: 'Successfully authenticated. Beginning data extraction.',
  },
  {
    timestamp: new Date(Date.now() - 3500).toISOString(),
    level: 'info' as const,
    message: 'Processing contacts: batch 1/50',
  },
  {
    timestamp: new Date(Date.now() - 3000).toISOString(),
    level: 'warning' as const,
    message: 'Rate limit approaching: 450/500 requests used',
  },
  {
    timestamp: new Date(Date.now() - 2500).toISOString(),
    level: 'info' as const,
    message: 'Processing contacts: batch 25/50',
  },
  {
    timestamp: new Date(Date.now() - 2000).toISOString(),
    level: 'error' as const,
    message: 'Failed to process contact ID 12345: Invalid email format',
  },
  {
    timestamp: new Date(Date.now() - 1500).toISOString(),
    level: 'info' as const,
    message: 'Retrying failed contact...',
  },
  {
    timestamp: new Date(Date.now() - 1000).toISOString(),
    level: 'info' as const,
    message: 'Successfully processed contact on retry',
  },
  {
    timestamp: new Date(Date.now() - 500).toISOString(),
    level: 'info' as const,
    message: 'Backup completed. Uploading to S3...',
  },
]