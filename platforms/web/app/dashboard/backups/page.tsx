'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  Play,
  Pause,
  Calendar,
  Clock,
  Upload,
  Database,
  FolderSync,
  BarChart3
} from 'lucide-react'

// Mock active backup jobs
const activeJobs = [
  {
    id: 'job-1',
    name: 'Google Drive Daily Backup',
    source: 'Google Drive (john@company.com)',
    destination: 'AWS S3 - Production',
    status: 'running',
    progress: 67,
    eta: '3 minutes',
    currentFile: 'documents/reports/Q3-2024.pdf',
    filesProcessed: 1247,
    totalFiles: 1856,
    startTime: '2:15 PM',
    icon: '📁'
  },
  {
    id: 'job-2',
    name: 'Slack Export Weekly',
    source: 'Slack (Company Team)',
    destination: 'AWS S3 - Archive',
    status: 'completed',
    progress: 100,
    eta: 'Complete',
    currentFile: 'Export completed successfully',
    filesProcessed: 2503,
    totalFiles: 2503,
    startTime: '1:30 PM',
    icon: '💬'
  },
  {
    id: 'job-3',
    name: 'Database Backup',
    source: 'PostgreSQL Production',
    destination: 'AWS S3 - Backup',
    status: 'queued',
    progress: 0,
    eta: 'Waiting to start',
    currentFile: 'Scheduled for 3:00 PM',
    filesProcessed: 0,
    totalFiles: 1,
    startTime: '3:00 PM',
    icon: '🗄️'
  }
]

// Mock scheduled backups
const scheduledBackups = [
  {
    id: 'schedule-1',
    name: 'Google Drive Daily',
    sources: ['Google Drive', 'Google Docs'],
    schedule: 'Daily at 2:00 AM',
    lastRun: '6 hours ago',
    nextRun: 'in 18 hours',
    status: 'active',
    successRate: 98,
    icon: '📁'
  },
  {
    id: 'schedule-2',
    name: 'Slack Weekly Export',
    sources: ['Slack Workspace'],
    schedule: 'Weekly on Sunday',
    lastRun: '2 days ago',
    nextRun: 'in 5 days',
    status: 'active',
    successRate: 100,
    icon: '💬'
  },
  {
    id: 'schedule-3',
    name: 'Database Backup',
    sources: ['PostgreSQL', 'Redis'],
    schedule: 'Every 6 hours',
    lastRun: '45 minutes ago',
    nextRun: 'in 5 hours',
    status: 'paused',
    successRate: 95,
    icon: '🗄️'
  }
]

// Mock backup statistics
const backupStats = [
  { label: 'Total Backups', value: '2,847', change: '+12%', icon: Upload },
  { label: 'Success Rate', value: '98.2%', change: '+0.3%', icon: CheckCircle2 },
  { label: 'Data Backed Up', value: '142 GB', change: '+8.5%', icon: Database },
  { label: 'Active Sources', value: '8', change: '+2', icon: FolderSync }
]

export default function BackupsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup Jobs</h1>
          <p className="text-muted-foreground">
            Manage your backup schedules and monitor active operations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Backup
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {backupStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Jobs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Jobs</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {activeJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{job.icon}</span>
                    <div>
                      <h3 className="font-medium">{job.name}</h3>
                      <p className="text-sm text-muted-foreground">{job.source} → {job.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={job.status === 'completed' ? 'default' : 
                               job.status === 'running' ? 'secondary' : 'outline'}
                      className={
                        job.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }
                    >
                      {job.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {job.status === 'running' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                      {job.status === 'queued' && <Clock className="h-3 w-3 mr-1" />}
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Files</span>
                      <span className="font-medium">{job.filesProcessed.toLocaleString()} / {job.totalFiles.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">ETA</span>
                      <span className="font-medium">{job.eta}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Started</span>
                      <span className="font-medium">{job.startTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Current</span>
                      <span className="font-medium truncate">{job.currentFile}</span>
                    </div>
                  </div>
                </div>

                {job.status === 'running' && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheduled Backups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Scheduled Backups</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scheduledBackups.map((backup) => (
            <Card key={backup.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{backup.icon}</span>
                    <div>
                      <h3 className="font-medium">{backup.name}</h3>
                      <p className="text-sm text-muted-foreground">{backup.sources.join(', ')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge 
                      variant={backup.status === 'active' ? 'default' : 'secondary'}
                      className={
                        backup.status === 'active' 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {backup.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {backup.status === 'paused' && <Pause className="h-3 w-3 mr-1" />}
                      {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="text-sm">{backup.schedule}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium">{backup.successRate}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Last run</span>
                      <span>{backup.lastRun}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Next run</span>
                      <span>{backup.nextRun}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {backup.status === 'active' ? (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}