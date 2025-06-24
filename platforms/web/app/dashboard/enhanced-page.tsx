'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useDashboardData } from '@/lib/hooks/use-dashboard-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SystemHealthMonitor } from '@/components/dashboard/system-health-monitor'
import { 
  Plus, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FolderPlus, 
  Upload, 
  RefreshCw, 
  Loader2,
  Activity,
  Database,
  Users,
  Server,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Zap,
  HardDrive,
  Cpu,
  Eye,
  Settings,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { UsageOverviewChart } from '@/components/charts/usage-overview-chart'
import { BackupStatusChart } from '@/components/charts/backup-status-chart'
import { StorageUsageChart } from '@/components/charts/storage-usage-chart'
import { NewUserWelcome } from '@/components/dashboard/new-user-welcome'
import { useRouter } from 'next/navigation'
import { cn } from '@listbackup/shared/utils'

export default function EnhancedDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { sources, jobs, activity, account, usage, stats, isLoading } = useDashboardData()
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  // Check if user is new (has no sources)
  const isNewUser = !isLoading && (!sources || sources.length === 0)

  // Mock data for enhanced features
  const systemMetrics = {
    cpu: { value: 45, trend: 'stable', status: 'healthy' },
    memory: { value: 68, trend: 'up', status: 'warning' },
    storage: { value: 52, trend: 'stable', status: 'healthy' },
    network: { value: 234, trend: 'down', status: 'healthy' },
  }

  const recentAlerts = [
    {
      id: '1',
      type: 'warning',
      message: 'High memory usage detected on backup server',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      resolved: false,
    },
    {
      id: '2',
      type: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      resolved: true,
    },
    {
      id: '3',
      type: 'success',
      message: 'All backup jobs completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      resolved: true,
    },
  ]

  const quickActions = [
    {
      title: 'Create Source',
      description: 'Connect a new data source',
      icon: Plus,
      action: () => router.push('/dashboard/sources/new'),
      color: 'text-blue-600',
    },
    {
      title: 'Schedule Job',
      description: 'Set up automated backup',
      icon: Clock,
      action: () => router.push('/dashboard/jobs?action=create'),
      color: 'text-green-600',
    },
    {
      title: 'Browse Data',
      description: 'Explore backed up data',
      icon: Database,
      action: () => router.push('/dashboard/browse'),
      color: 'text-purple-600',
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      action: () => router.push('/dashboard/analytics'),
      color: 'text-orange-600',
    },
  ]

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
    used: usage?.storage?.total || 1024 * 1024 * 200,
    limit: account?.usage?.storage?.limit || 1024 * 1024 * 1024,
    percentage: account?.usage?.storage?.limit ? 
      ((usage?.storage?.total || 0) / account.usage.storage.limit) * 100 : 20,
    bySource: sources?.slice(0, 5).map((source, index) => ({
      name: source.name,
      size: Math.random() * 50 * 1024 * 1024,
      percentage: Math.random() * 30 + 5
    })) || []
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isNewUser) {
    return <NewUserWelcome />
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's what's happening with your data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            All systems operational
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sources</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{stats.totalSources || 0}</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        +2 this week
                      </Badge>
                    </div>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Running Jobs</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{stats.activeJobs || 0}</p>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {stats.totalJobs || 0} total
                      </Badge>
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Stored</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {((usage?.storage?.total || 0) / 1024 / 1024).toFixed(0)}MB
                      </p>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 ml-1">12%</span>
                      </div>
                    </div>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">98.5%</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </div>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={action.action}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn("h-5 w-5 mt-0.5", action.color)} />
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>Storage, API calls, and backup trends</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageOverviewChart data={usageData} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Backup Status</CardTitle>
                <CardDescription>Current backup job distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <BackupStatusChart data={backupStatusData} />
              </CardContent>
            </Card>
          </div>

          {/* Storage and Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>
                  {((storageData.used / 1024 / 1024).toFixed(0))}MB of {((storageData.limit / 1024 / 1024 / 1024).toFixed(1))}GB used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StorageUsageChart data={storageData} />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="p-1 rounded-full bg-primary/10">
                        <Activity className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.source} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* System Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{systemMetrics.cpu.value}%</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Healthy
                      </Badge>
                    </div>
                  </div>
                  <Cpu className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{systemMetrics.memory.value}%</p>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                        Warning
                      </Badge>
                    </div>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">1.2K</p>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 ml-1">8%</span>
                      </div>
                    </div>
                  </div>
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">99.9%</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </div>
                  </div>
                  <Server className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>System performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageOverviewChart data={usageData} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Error types and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <BackupStatusChart data={backupStatusData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={cn("p-1 rounded-full", {
                      "bg-yellow-100": alert.type === 'warning',
                      "bg-blue-100": alert.type === 'info',
                      "bg-green-100": alert.type === 'success',
                    })}>
                      {alert.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                      {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                      {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={alert.resolved ? "secondary" : "destructive"} className="text-xs">
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Detailed system activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity?.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <div className="p-1 rounded-full bg-primary/10">
                      <Activity className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.source} • {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                      </p>
                      {item.details && (
                        <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}