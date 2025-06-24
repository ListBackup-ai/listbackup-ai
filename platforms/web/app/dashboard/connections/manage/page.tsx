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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { 
  Link, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Users, 
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Key,
  Globe,
  Settings,
  History,
  AlertTriangle,
  ExternalLink,
  Copy,
  RotateCcw,
  PlayCircle,
  StopCircle,
  Wifi,
  WifiOff,
  Timer,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Connection {
  connectionId: string
  name: string
  platformId: string
  platformName: string
  platformType: string
  status: 'active' | 'inactive' | 'error' | 'pending' | 'expired'
  authType: 'oauth' | 'api_key' | 'basic' | 'token'
  createdAt: string
  lastUsed: string
  lastTest: {
    timestamp: string
    success: boolean
    responseTime: number
    error?: string
  }
  config: {
    scopes: string[]
    permissions: string[]
    expiresAt?: string
    refreshToken?: boolean
  }
  statistics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    avgResponseTime: number
    lastDayUsage: number
  }
  metadata: {
    userAgent: string
    ipAddress: string
    location: string
  }
  isActive: boolean
  autoRefresh: boolean
  rateLimitStatus: {
    limit: number
    remaining: number
    resetAt: string
  }
}

interface ConnectionTest {
  connectionId: string
  timestamp: string
  success: boolean
  responseTime: number
  statusCode: number
  error?: string
  details: Record<string, any>
}

interface ConnectionActivity {
  connectionId: string
  timestamp: string
  action: string
  details: string
  success: boolean
  metadata: Record<string, any>
}

export default function ConnectionManagementPage() {
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTestResults, setShowTestResults] = useState(false)
  const [testResults, setTestResults] = useState<ConnectionTest[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections', 'manage'],
    queryFn: () => api.connections.list({ includeStats: true }),
  })

  const { data: connectionTests = [] } = useQuery({
    queryKey: ['connections', 'tests'],
    queryFn: () => api.connections.getTests(),
  })

  const { data: connectionActivity = [] } = useQuery({
    queryKey: ['connections', 'activity'],
    queryFn: () => api.connections.getActivity(),
  })

  // Mutations
  const testConnectionMutation = useMutation({
    mutationFn: api.connections.test,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      setTestResults([data])
      setShowTestResults(true)
      toast({ title: 'Connection test completed' })
    },
    onError: () => {
      toast({ title: 'Connection test failed', variant: 'destructive' })
    },
  })

  const refreshConnectionMutation = useMutation({
    mutationFn: api.connections.refresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      toast({ title: 'Connection refreshed successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to refresh connection', variant: 'destructive' })
    },
  })

  const updateConnectionMutation = useMutation({
    mutationFn: (data: { connectionId: string; updates: Partial<Connection> }) =>
      api.connections.update(data.connectionId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      toast({ title: 'Connection updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update connection', variant: 'destructive' })
    },
  })

  const deleteConnectionMutation = useMutation({
    mutationFn: api.connections.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      toast({ title: 'Connection deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete connection', variant: 'destructive' })
    },
  })

  // Table columns
  const connectionColumns: ColumnDef<Connection>[] = [
    {
      accessorKey: 'name',
      header: 'Connection',
      cell: ({ row }) => {
        const connection = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{connection.name}</div>
              <div className="text-sm text-muted-foreground">{connection.platformName}</div>
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
          error: 'bg-red-100 text-red-800 border-red-200',
          pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          expired: 'bg-orange-100 text-orange-800 border-orange-200',
        }
        return (
          <Badge variant="secondary" className={colors[status as keyof typeof colors]}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'authType',
      header: 'Auth Type',
      cell: ({ row }) => {
        const authType = row.getValue('authType') as string
        return <span className="capitalize">{authType.replace('_', ' ')}</span>
      },
    },
    {
      accessorKey: 'lastUsed',
      header: 'Last Used',
      cell: ({ row }) => {
        const date = row.getValue('lastUsed') as string
        return <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      },
    },
    {
      accessorKey: 'statistics.totalRequests',
      header: 'Requests',
      cell: ({ row }) => {
        const count = row.original.statistics.totalRequests
        return <div className="text-center">{count.toLocaleString()}</div>
      },
    },
    {
      accessorKey: 'statistics.avgResponseTime',
      header: 'Avg Response',
      cell: ({ row }) => {
        const time = row.original.statistics.avgResponseTime
        return <div className="text-center">{time}ms</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const connection = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConnection(connection)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testConnectionMutation.mutate(connection.connectionId)}
              disabled={testConnectionMutation.isPending}
            >
              <Zap className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshConnectionMutation.mutate(connection.connectionId)}
              disabled={refreshConnectionMutation.isPending || connection.authType !== 'oauth'}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteConnectionMutation.mutate(connection.connectionId)}
              disabled={deleteConnectionMutation.isPending}
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
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAuthTypeIcon = (authType: string) => {
    switch (authType) {
      case 'oauth':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'api_key':
        return <Key className="h-4 w-4 text-purple-500" />
      case 'basic':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'token':
        return <Settings className="h-4 w-4 text-orange-500" />
      default:
        return <Key className="h-4 w-4 text-gray-500" />
    }
  }

  const exportConnections = (data: Connection[]) => {
    const csv = [
      ['Name', 'Platform', 'Status', 'Auth Type', 'Last Used', 'Total Requests', 'Success Rate', 'Avg Response Time'],
      ...data.map(c => [
        c.name,
        c.platformName,
        c.status,
        c.authType,
        c.lastUsed,
        c.statistics.totalRequests.toString(),
        ((c.statistics.successfulRequests / c.statistics.totalRequests) * 100).toFixed(2) + '%',
        c.statistics.avgResponseTime.toString() + 'ms'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'connections.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyConnectionId = (connectionId: string) => {
    navigator.clipboard.writeText(connectionId)
    toast({ title: 'Connection ID copied to clipboard' })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connection Management</h1>
          <p className="text-muted-foreground">
            Manage OAuth connections, API keys, and integration credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            {viewMode === 'grid' ? <Database className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Connection
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connections.length}</div>
                <p className="text-xs text-muted-foreground">
                  {connections.filter(c => c.status === 'active').length} active
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
                  {connections.length > 0 ? 
                    Math.round(
                      connections.reduce((sum, c) => sum + (c.statistics.successfulRequests / c.statistics.totalRequests), 0) / connections.length * 100
                    ) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.length > 0 ? 
                    Math.round(connections.reduce((sum, c) => sum + c.statistics.avgResponseTime, 0) / connections.length)
                    : 0
                  }ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.filter(c => 
                    c.config.expiresAt && 
                    new Date(c.config.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Next 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status Overview</CardTitle>
              <CardDescription>Current status of all connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.slice(0, 6).map((connection) => (
                  <div key={connection.connectionId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getAuthTypeIcon(connection.authType)}
                      </div>
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">{connection.platformName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connection.status)}
                      <div className="text-sm">
                        {Math.round((connection.statistics.successfulRequests / connection.statistics.totalRequests) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={connectionColumns}
              data={connections}
              onExport={exportConnections}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['connections'] })}
              isLoading={connectionsLoading}
              title="Connection Directory"
              description="Manage all platform connections and credentials"
              filterableColumns={[
                {
                  id: 'status',
                  title: 'Status',
                  options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Error', value: 'error' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Expired', value: 'expired' },
                  ],
                },
                {
                  id: 'authType',
                  title: 'Auth Type',
                  options: [
                    { label: 'OAuth', value: 'oauth' },
                    { label: 'API Key', value: 'api_key' },
                    { label: 'Basic Auth', value: 'basic' },
                    { label: 'Token', value: 'token' },
                  ],
                },
              ]}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.connectionId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getAuthTypeIcon(connection.authType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connection.name}</CardTitle>
                          <CardDescription>{connection.platformName}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                        {connection.autoRefresh && (
                          <Badge variant="secondary" className="text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Auth Type */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={
                        connection.status === 'active' ? 'bg-green-100 text-green-800' :
                        connection.status === 'error' ? 'bg-red-100 text-red-800' :
                        connection.status === 'expired' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {connection.status}
                      </Badge>
                      <span className="text-sm capitalize">{connection.authType.replace('_', ' ')}</span>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{connection.statistics.totalRequests.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Requests</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {Math.round((connection.statistics.successfulRequests / connection.statistics.totalRequests) * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>

                    {/* Response Time and Last Used */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span>{connection.statistics.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Used:</span>
                        <span>{formatDistanceToNow(new Date(connection.lastUsed), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Rate Limiting */}
                    {connection.rateLimitStatus && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rate Limit:</span>
                          <span>{connection.rateLimitStatus.remaining}/{connection.rateLimitStatus.limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full" 
                            style={{ 
                              width: `${(connection.rateLimitStatus.remaining / connection.rateLimitStatus.limit) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Expiration Warning */}
                    {connection.config.expiresAt && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800">
                          Expires {formatDistanceToNow(new Date(connection.config.expiresAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedConnection(connection)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => testConnectionMutation.mutate(connection.connectionId)}
                        disabled={testConnectionMutation.isPending}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      {connection.authType === 'oauth' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refreshConnectionMutation.mutate(connection.connectionId)}
                          disabled={refreshConnectionMutation.isPending}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connection Testing</CardTitle>
                  <CardDescription>Test and validate your connections</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    Promise.all(
                      connections.slice(0, 5).map(c => testConnectionMutation.mutateAsync(c.connectionId))
                    ).then((results) => {
                      setTestResults(results)
                      setShowTestResults(true)
                    })
                  }}
                  disabled={testConnectionMutation.isPending}
                >
                  {testConnectionMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-2" />
                  )}
                  Test All Connections
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map((connection) => (
                  <div key={connection.connectionId} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{connection.name}</div>
                      <Badge variant="secondary" className={
                        connection.status === 'active' ? 'bg-green-100 text-green-800' :
                        connection.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {connection.status}
                      </Badge>
                    </div>
                    
                    {connection.lastTest && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Test:</span>
                          <span className={connection.lastTest.success ? 'text-green-600' : 'text-red-600'}>
                            {connection.lastTest.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Response Time:</span>
                          <span>{connection.lastTest.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tested:</span>
                          <span>{formatDistanceToNow(new Date(connection.lastTest.timestamp), { addSuffix: true })}</span>
                        </div>
                        {connection.lastTest.error && (
                          <div className="text-sm text-red-600">
                            Error: {connection.lastTest.error}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => testConnectionMutation.mutate(connection.connectionId)}
                      disabled={testConnectionMutation.isPending}
                    >
                      {testConnectionMutation.isPending ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Activity</CardTitle>
              <CardDescription>Recent activity and events for your connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectionActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded-r">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.details}</div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(activity.metadata, null, 2).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Details Dialog */}
      {selectedConnection && (
        <Dialog open={!!selectedConnection} onOpenChange={() => setSelectedConnection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getAuthTypeIcon(selectedConnection.authType)}
                {selectedConnection.name}
              </DialogTitle>
              <DialogDescription>
                Connection details and configuration for {selectedConnection.platformName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Connection ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedConnection.connectionId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyConnectionId(selectedConnection.connectionId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Platform</Label>
                  <div className="text-sm">{selectedConnection.platformName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={
                    selectedConnection.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedConnection.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedConnection.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Authentication</Label>
                  <div className="text-sm capitalize">{selectedConnection.authType.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Configuration</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Scopes</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedConnection.config.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Permissions</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedConnection.config.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Usage Statistics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedConnection.statistics.totalRequests.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedConnection.statistics.successfulRequests.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedConnection.statistics.failedRequests.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedConnection.statistics.avgResponseTime}ms</div>
                    <div className="text-xs text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              {selectedConnection.rateLimitStatus && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Rate Limiting</Label>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Remaining Requests:</span>
                      <span>{selectedConnection.rateLimitStatus.remaining}/{selectedConnection.rateLimitStatus.limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(selectedConnection.rateLimitStatus.remaining / selectedConnection.rateLimitStatus.limit) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Resets: {formatDistanceToNow(new Date(selectedConnection.rateLimitStatus.resetAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Test Results Dialog */}
      <Dialog open={showTestResults} onOpenChange={setShowTestResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connection Test Results</DialogTitle>
            <DialogDescription>
              Results from the latest connection tests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Connection Test</div>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span>{result.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Code:</span>
                    <span>{result.statusCode}</span>
                  </div>
                  {result.error && (
                    <div className="text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}