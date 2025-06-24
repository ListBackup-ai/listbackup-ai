'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedDataTable } from '@/components/ui/advanced-data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Users, 
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Workflow,
  AlertTriangle,
  Timer,
  Server,
  Link,
  Key
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Platform {
  platformId: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated'
  version: string
  lastUpdated: string
  totalSources: number
  totalConnections: number
  healthScore: number
  isOfficial: boolean
  supportLevel: 'full' | 'partial' | 'deprecated'
  categories: string[]
  capabilities: string[]
  config: {
    authType: 'oauth' | 'api_key' | 'basic'
    rateLimits: {
      requests: number
      period: string
    }
    endpoints: {
      auth: string
      api: string
      webhook?: string
    }
  }
  statistics: {
    totalUsers: number
    activeConnections: number
    dailyRequests: number
    errorRate: number
    avgResponseTime: number
  }
  lastHealthCheck: {
    timestamp: string
    status: 'healthy' | 'warning' | 'error'
    details: string
  }
}

interface PlatformHealthMetrics {
  platformId: string
  uptime: number
  responseTime: number
  errorRate: number
  throughput: number
  lastChecked: string
}

interface PlatformUsageStats {
  platformId: string
  period: string
  requests: number
  users: number
  errors: number
  peakHour: string
}

export default function PlatformManagementPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showHealthDetails, setShowHealthDetails] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: platforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ['platforms', 'manage'],
    queryFn: () => api.platforms.list({ includeStats: true }),
  })

  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['platforms', 'health'],
    queryFn: () => api.platforms.getHealthMetrics(),
  })

  const { data: usageStats = [] } = useQuery({
    queryKey: ['platforms', 'usage'],
    queryFn: () => api.platforms.getUsageStats(),
  })

  // Mutations
  const updatePlatformMutation = useMutation({
    mutationFn: (data: { platformId: string; updates: Partial<Platform> }) =>
      api.platforms.update(data.platformId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      toast({ title: 'Platform updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update platform', variant: 'destructive' })
    },
  })

  const deletePlatformMutation = useMutation({
    mutationFn: api.platforms.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      toast({ title: 'Platform deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete platform', variant: 'destructive' })
    },
  })

  const testPlatformMutation = useMutation({
    mutationFn: api.platforms.test,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      toast({ title: 'Platform test completed' })
    },
    onError: () => {
      toast({ title: 'Platform test failed', variant: 'destructive' })
    },
  })

  // Table columns
  const platformColumns: ColumnDef<Platform>[] = [
    {
      accessorKey: 'name',
      header: 'Platform',
      cell: ({ row }) => {
        const platform = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{platform.name}</div>
              <div className="text-sm text-muted-foreground capitalize">{platform.type}</div>
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
        const colors = {
          active: 'bg-green-100 text-green-800 border-green-200',
          inactive: 'bg-gray-100 text-gray-800 border-gray-200',
          maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          deprecated: 'bg-red-100 text-red-800 border-red-200',
        }
        return (
          <Badge variant="secondary" className={colors[status as keyof typeof colors]}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'version',
      header: 'Version',
    },
    {
      accessorKey: 'totalSources',
      header: 'Sources',
      cell: ({ row }) => {
        const count = row.getValue('totalSources') as number
        return <div className="text-center">{count.toLocaleString()}</div>
      },
    },
    {
      accessorKey: 'totalConnections',
      header: 'Connections',
      cell: ({ row }) => {
        const count = row.getValue('totalConnections') as number
        return <div className="text-center">{count.toLocaleString()}</div>
      },
    },
    {
      accessorKey: 'healthScore',
      header: 'Health',
      cell: ({ row }) => {
        const score = row.getValue('healthScore') as number
        const color = score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'
        return <div className={`text-center font-medium ${color}`}>{score}%</div>
      },
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = row.getValue('lastUpdated') as string
        return <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const platform = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlatform(platform)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testPlatformMutation.mutate(platform.platformId)}
              disabled={testPlatformMutation.isPending}
            >
              <Zap className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deletePlatformMutation.mutate(platform.platformId)}
              disabled={deletePlatformMutation.isPending}
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
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'deprecated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const exportPlatforms = (data: Platform[]) => {
    const csv = [
      ['Name', 'Type', 'Status', 'Version', 'Sources', 'Connections', 'Health Score', 'Last Updated'],
      ...data.map(p => [
        p.name,
        p.type,
        p.status,
        p.version,
        p.totalSources.toString(),
        p.totalConnections.toString(),
        p.healthScore.toString(),
        p.lastUpdated
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'platforms.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Management</h1>
          <p className="text-muted-foreground">
            Manage platforms, monitor health, and configure integrations
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
            Add Platform
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Platforms</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platforms.length}</div>
                <p className="text-xs text-muted-foreground">
                  {platforms.filter(p => p.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platforms.reduce((sum, p) => sum + p.totalSources, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
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
                  {Math.round(platforms.reduce((sum, p) => sum + p.healthScore, 0) / platforms.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  System health
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platforms.reduce((sum, p) => sum + p.totalConnections, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  User connections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Platform Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Status Overview</CardTitle>
              <CardDescription>Current status of all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms.slice(0, 6).map((platform) => (
                  <div key={platform.platformId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-sm text-muted-foreground">{platform.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(platform.status)}
                      <div className="text-sm font-medium">{platform.healthScore}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={platformColumns}
              data={platforms}
              onExport={exportPlatforms}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['platforms'] })}
              isLoading={platformsLoading}
              title="Platform Directory"
              description="Manage all registered platforms and their configurations"
              filterableColumns={[
                {
                  id: 'status',
                  title: 'Status',
                  options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Maintenance', value: 'maintenance' },
                    { label: 'Deprecated', value: 'deprecated' },
                  ],
                },
                {
                  id: 'type',
                  title: 'Type',
                  options: platforms.reduce((acc, p) => {
                    if (!acc.find(opt => opt.value === p.type)) {
                      acc.push({ label: p.type, value: p.type })
                    }
                    return acc
                  }, [] as Array<{ label: string; value: string }>),
                },
              ]}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => (
                <Card key={platform.platformId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Database className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <CardDescription className="capitalize">{platform.type}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(platform.status)}
                        {platform.isOfficial && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Official
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Health */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={
                        platform.status === 'active' ? 'bg-green-100 text-green-800' :
                        platform.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {platform.status}
                      </Badge>
                      <div className="text-sm font-medium">
                        Health: <span className={
                          platform.healthScore >= 90 ? 'text-green-600' :
                          platform.healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }>{platform.healthScore}%</span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{platform.totalSources.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Sources</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{platform.totalConnections.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Connections</p>
                      </div>
                    </div>

                    {/* Version and Last Updated */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{platform.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{formatDistanceToNow(new Date(platform.lastUpdated), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedPlatform(platform)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => testPlatformMutation.mutate(platform.platformId)}
                        disabled={testPlatformMutation.isPending}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Health Monitor</CardTitle>
                  <CardDescription>Real-time platform health and performance metrics</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowHealthDetails(true)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map((platform) => (
                  <div key={platform.platformId} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{platform.name}</div>
                      <div className={`text-sm font-medium ${
                        platform.healthScore >= 90 ? 'text-green-600' :
                        platform.healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {platform.healthScore}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span>{platform.statistics.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Error Rate:</span>
                        <span className={platform.statistics.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                          {platform.statistics.errorRate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Daily Requests:</span>
                        <span>{platform.statistics.dailyRequests.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        {platform.lastHealthCheck.status === 'healthy' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : platform.lastHealthCheck.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(platform.lastHealthCheck.timestamp), { addSuffix: true })}
                        </span>
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
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platforms.reduce((sum, p) => sum + p.statistics.dailyRequests, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(platforms.reduce((sum, p) => sum + p.statistics.avgResponseTime, 0) / platforms.length)}ms
                </div>
                <p className="text-xs text-muted-foreground">Across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(platforms.reduce((sum, p) => sum + p.statistics.errorRate, 0) / platforms.length).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">System average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platforms.reduce((sum, p) => sum + p.statistics.totalUsers, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Connected users</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Performance Trends</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Platform Details Dialog */}
      {selectedPlatform && (
        <Dialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                {selectedPlatform.name}
              </DialogTitle>
              <DialogDescription>
                Platform configuration and management details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Platform Type</Label>
                  <div className="text-sm">{selectedPlatform.type}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Version</Label>
                  <div className="text-sm">{selectedPlatform.version}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={
                    selectedPlatform.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedPlatform.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedPlatform.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Health Score</Label>
                  <div className={`text-sm font-medium ${
                    selectedPlatform.healthScore >= 90 ? 'text-green-600' :
                    selectedPlatform.healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedPlatform.healthScore}%
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Configuration</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Authentication Type</div>
                    <div className="text-sm text-muted-foreground">{selectedPlatform.config.authType}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Rate Limits</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPlatform.config.rateLimits.requests} requests per {selectedPlatform.config.rateLimits.period}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedPlatform.statistics.totalUsers}</div>
                    <div className="text-xs text-muted-foreground">Total Users</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedPlatform.statistics.activeConnections}</div>
                    <div className="text-xs text-muted-foreground">Active Connections</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedPlatform.statistics.dailyRequests.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Daily Requests</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedPlatform.statistics.avgResponseTime}ms</div>
                    <div className="text-xs text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}