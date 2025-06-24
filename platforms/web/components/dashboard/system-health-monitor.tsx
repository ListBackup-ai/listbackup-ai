'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Database,
  Cloud,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Zap,
  Users,
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'
import { formatDistanceToNow } from 'date-fns'

interface HealthMetric {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  value: number
  unit: string
  threshold: {
    warning: number
    critical: number
  }
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
  description?: string
}

interface ServiceStatus {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  uptime: number
  responseTime: number
  lastCheck: Date
  endpoint?: string
  description?: string
}

interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'critical'
  metrics: HealthMetric[]
  services: ServiceStatus[]
  lastUpdate: Date
}

export function SystemHealthMonitor() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - replace with actual API calls
  const mockHealthData: SystemHealthData = {
    overall: 'healthy',
    lastUpdate: new Date(),
    metrics: [
      {
        id: 'cpu',
        name: 'CPU Usage',
        status: 'healthy',
        value: 45,
        unit: '%',
        threshold: { warning: 70, critical: 90 },
        trend: 'stable',
        lastUpdated: new Date(),
        description: 'System CPU utilization',
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        status: 'warning',
        value: 78,
        unit: '%',
        threshold: { warning: 75, critical: 90 },
        trend: 'up',
        lastUpdated: new Date(),
        description: 'System memory utilization',
      },
      {
        id: 'storage',
        name: 'Storage Usage',
        status: 'healthy',
        value: 52,
        unit: '%',
        threshold: { warning: 80, critical: 95 },
        trend: 'stable',
        lastUpdated: new Date(),
        description: 'Primary storage utilization',
      },
      {
        id: 'network',
        name: 'Network I/O',
        status: 'healthy',
        value: 234,
        unit: 'Mbps',
        threshold: { warning: 800, critical: 900 },
        trend: 'down',
        lastUpdated: new Date(),
        description: 'Network throughput',
      },
      {
        id: 'api_calls',
        name: 'API Calls/min',
        status: 'healthy',
        value: 1247,
        unit: 'calls',
        threshold: { warning: 5000, critical: 8000 },
        trend: 'up',
        lastUpdated: new Date(),
        description: 'API requests per minute',
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        status: 'healthy',
        value: 0.02,
        unit: '%',
        threshold: { warning: 1, critical: 5 },
        trend: 'stable',
        lastUpdated: new Date(),
        description: 'System error rate',
      },
    ],
    services: [
      {
        id: 'api',
        name: 'API Gateway',
        status: 'operational',
        uptime: 99.9,
        responseTime: 125,
        lastCheck: new Date(),
        endpoint: 'https://api.listbackup.ai/health',
        description: 'Main API gateway service',
      },
      {
        id: 'auth',
        name: 'Authentication Service',
        status: 'operational',
        uptime: 99.8,
        responseTime: 89,
        lastCheck: new Date(),
        endpoint: 'https://auth.listbackup.ai/health',
        description: 'User authentication and authorization',
      },
      {
        id: 'database',
        name: 'Database',
        status: 'operational',
        uptime: 99.95,
        responseTime: 15,
        lastCheck: new Date(),
        description: 'Primary database cluster',
      },
      {
        id: 'storage',
        name: 'File Storage',
        status: 'degraded',
        uptime: 98.5,
        responseTime: 450,
        lastCheck: new Date(),
        description: 'Object storage service',
      },
      {
        id: 'backup',
        name: 'Backup Processing',
        status: 'operational',
        uptime: 99.2,
        responseTime: 234,
        lastCheck: new Date(),
        description: 'Background backup processing',
      },
      {
        id: 'notifications',
        name: 'Notification Service',
        status: 'operational',
        uptime: 99.7,
        responseTime: 67,
        lastCheck: new Date(),
        description: 'Email and push notifications',
      },
    ],
  }

  useEffect(() => {
    // Simulate API call
    const fetchHealthData = async () => {
      setIsLoading(true)
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setHealthData(mockHealthData)
      setIsLoading(false)
    }

    fetchHealthData()

    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchHealthData, 30000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'outage':
        return 'text-red-600 bg-red-100'
      case 'maintenance':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle2 className="h-4 w-4" />
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
      case 'outage':
        return <XCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu':
        return <Cpu className="h-4 w-4" />
      case 'memory':
        return <Zap className="h-4 w-4" />
      case 'storage':
        return <HardDrive className="h-4 w-4" />
      case 'network':
        return <Network className="h-4 w-4" />
      case 'api_calls':
        return <Activity className="h-4 w-4" />
      case 'error_rate':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const refreshData = () => {
    // Trigger a manual refresh
    setHealthData(null)
    setTimeout(() => setHealthData(mockHealthData), 1000)
  }

  if (isLoading && !healthData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!healthData) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of system performance and service status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn('text-sm', getStatusColor(healthData.overall))}
          >
            {getStatusIcon(healthData.overall)}
            <span className="ml-1 capitalize">{healthData.overall}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">99.8%</p>
                  </div>
                  <Server className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                    <p className="text-2xl font-bold">125ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">0.02%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {healthData.metrics.some(m => m.status === 'critical') && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthData.metrics
                    .filter(m => m.status === 'critical')
                    .map(metric => (
                      <div key={metric.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="font-medium">{metric.name}</span>
                        <Badge variant="destructive">{metric.value}{metric.unit}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {healthData.metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getMetricIcon(metric.id)}
                      {metric.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', getStatusColor(metric.status))}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {metric.unit}
                        </span>
                      </span>
                    </div>
                    
                    {/* Progress bar for percentage metrics */}
                    {metric.unit === '%' && (
                      <Progress 
                        value={metric.value} 
                        className={cn(
                          "h-2",
                          metric.status === 'critical' && "bg-red-100",
                          metric.status === 'warning' && "bg-yellow-100"
                        )}
                      />
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      <p>{metric.description}</p>
                      <p>Updated {formatDistanceToNow(metric.lastUpdated, { addSuffix: true })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="space-y-4">
            {healthData.services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", getStatusColor(service.status))}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium">Uptime</p>
                        <p className="text-lg font-bold">{service.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Response</p>
                        <p className="text-lg font-bold">{service.responseTime}ms</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(service.status)}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {service.endpoint && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Endpoint: {service.endpoint}
                    </div>
                  )}
                  
                  <div className="mt-1 text-xs text-muted-foreground">
                    Last checked {formatDistanceToNow(service.lastCheck, { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Last updated: {formatDistanceToNow(healthData.lastUpdate, { addSuffix: true })}
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto-refresh every 30s
        </label>
      </div>
    </div>
  )
}