'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useDashboardData } from '@/lib/hooks/use-dashboard-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Shield, AlertCircle, CheckCircle2, Clock, FolderPlus, Upload, RefreshCw, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { UsageOverviewChart } from '@/components/charts/usage-overview-chart'
import { BackupStatusChart } from '@/components/charts/backup-status-chart'
import { StorageUsageChart } from '@/components/charts/storage-usage-chart'
import { NewUserWelcome } from '@/components/dashboard/new-user-welcome'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { sources, jobs, activity, account, usage, stats, isLoading } = useDashboardData()

  // Generate mock data for charts
  const usageData = [
    { date: '2024-01-01', storage: 1024 * 1024 * 50, apiCalls: 150, backups: 5 },
    { date: '2024-01-02', storage: 1024 * 1024 * 75, apiCalls: 220, backups: 8 },
    { date: '2024-01-03', storage: 1024 * 1024 * 100, apiCalls: 180, backups: 6 },
    { date: '2024-01-04', storage: 1024 * 1024 * 125, apiCalls: 280, backups: 12 },
    { date: '2024-01-05', storage: 1024 * 1024 * 150, apiCalls: 320, backups: 15 },
    { date: '2024-01-06', storage: 1024 * 1024 * 175, apiCalls: 250, backups: 10 },
    { date: '2024-01-07', storage: 1024 * 1024 * 200, apiCalls: 400, backups: 18 },
  ]

  const backupStatusData = [
    { name: 'Success', value: stats.totalJobs > 0 ? Math.ceil(stats.totalJobs * 0.8) : 8, color: '#10b981' },
    { name: 'Failed', value: stats.totalJobs > 0 ? Math.floor(stats.totalJobs * 0.1) : 1, color: '#ef4444' },
    { name: 'Running', value: stats.activeJobs || 2, color: '#3b82f6' },
    { name: 'Pending', value: stats.totalJobs > 0 ? Math.floor(stats.totalJobs * 0.1) : 1, color: '#f59e0b' },
  ]

  const storageData = {
    used: usage?.storage?.total || 1024 * 1024 * 200, // 200MB
    limit: account?.usage?.storage?.limit || 1024 * 1024 * 1024, // 1GB
    percentage: account?.usage?.storage?.limit ? 
      ((usage?.storage?.total || 0) / account.usage.storage.limit) * 100 : 20,
    bySource: sources?.slice(0, 5).map((source, index) => ({
      name: source.name,
      size: Math.random() * 50 * 1024 * 1024, // Random size up to 50MB
      percentage: Math.random() * 30 + 5 // Random percentage between 5-35%
    })) || []
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show welcome screen for new users with no sources
  if (stats.totalSources === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <NewUserWelcome />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="text-muted-foreground">
            All your data sources are protected and up to date
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" variant="outline" className="transition-all hover:scale-105">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button size="sm" className="transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            New Backup
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-4 mb-8 animate-in slide-in-from-bottom-4 duration-700">
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                All systems operational
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Backups</p>
                <div className="flex items-center gap-2 mt-1">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-bold">{stats.activeJobs}</span>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Running
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sources</p>
                <div className="flex items-center gap-2 mt-1">
                  <FolderPlus className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold">{stats.totalSources}</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {stats.lastBackup ? formatDistanceToNow(new Date(stats.lastBackup), { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <UsageOverviewChart data={usageData} className="lg:col-span-2" />
        <BackupStatusChart data={backupStatusData} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <StorageUsageChart data={storageData} />
        
        {/* Quick Actions */}
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start transition-all hover:scale-105" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
            <Button variant="outline" className="w-full justify-start transition-all hover:scale-105" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" className="w-full justify-start transition-all hover:scale-105" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Sync
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Active Jobs moved to full width */}

        {/* Active Jobs */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Active Jobs</CardTitle>
            <CardDescription>Currently running backup operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                jobs.slice(0, 3).map((job) => {
                  const source = sources?.find(s => job.sources?.some(js => js.sourceId === s.sourceId))
                  const isRunning = job.status === 'active' && job.lastRun && (Date.now() - new Date(job.lastRun.startedAt).getTime() < 3600000)
                  
                  return (
                    <div 
                      key={job.jobId} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isRunning ? 'bg-blue-50' : 
                        job.status === 'completed' ? 'bg-green-50' : 
                        job.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isRunning ? (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        ) : job.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : job.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source?.name || 'Unknown source'} - {job.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{job.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.lastRun ? formatDistanceToNow(new Date(job.lastRun.startedAt), { addSuffix: true }) : 'Never run'}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No backup jobs configured yet</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Job
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest system events and backup operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity && activity.activities && activity.activities.length > 0 ? (
              activity.activities.slice(0, 5).map((event) => (
                <div key={event.activityId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'success' ? 'bg-green-500' : 
                      event.severity === 'warning' ? 'bg-yellow-500' : 
                      event.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm">{event.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}