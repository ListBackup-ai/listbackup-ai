'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Database,
  Clock,
  Zap,
  HardDrive,
  Activity,
  FileText,
  Users,
  DollarSign,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { UsageChart } from '@/components/charts/usage-chart'
import { ActivityChart } from '@/components/charts/activity-chart'
import { cn } from '@listbackup/shared/utils'

// Mock data for analytics
const mockAnalytics = {
  overview: {
    totalBackups: 2847,
    totalBackupsChange: 12.5,
    successRate: 98.2,
    successRateChange: 0.3,
    storageUsed: 142 * 1024 * 1024 * 1024, // 142GB
    storageChange: 8.5,
    activeJobs: 8,
    activeJobsChange: 2,
    avgBackupTime: 4.3, // minutes
    avgBackupTimeChange: -0.8,
    dataProcessed: 1.2 * 1024 * 1024 * 1024 * 1024, // 1.2TB
    dataProcessedChange: 15.2
  },
  performance: {
    hourlyMetrics: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      backups: Math.floor(Math.random() * 50) + 10,
      successRate: 95 + Math.random() * 5,
      avgDuration: 3 + Math.random() * 3
    })),
    dailyMetrics: Array.from({ length: 30 }, (_, i) => ({
      day: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      backups: Math.floor(Math.random() * 200) + 50,
      successRate: 95 + Math.random() * 5,
      dataSize: Math.random() * 50 * 1024 * 1024 * 1024 // GB
    }))
  },
  sources: [
    { name: 'Google Drive', backups: 892, successRate: 99.1, dataSize: 45 * 1024 * 1024 * 1024, trend: 'up' },
    { name: 'Stripe', backups: 745, successRate: 98.5, dataSize: 23 * 1024 * 1024 * 1024, trend: 'up' },
    { name: 'Keap', backups: 623, successRate: 97.8, dataSize: 17 * 1024 * 1024 * 1024, trend: 'down' },
    { name: 'MailChimp', backups: 412, successRate: 99.3, dataSize: 12 * 1024 * 1024 * 1024, trend: 'up' },
    { name: 'Zendesk', backups: 175, successRate: 96.2, dataSize: 8 * 1024 * 1024 * 1024, trend: 'stable' }
  ],
  topFiles: [
    { name: 'contacts_export_2024.csv', source: 'Keap', size: 2.3 * 1024 * 1024 * 1024, downloads: 45 },
    { name: 'transactions_q1_2024.json', source: 'Stripe', size: 1.8 * 1024 * 1024 * 1024, downloads: 38 },
    { name: 'documents_backup.zip', source: 'Google Drive', size: 5.2 * 1024 * 1024 * 1024, downloads: 32 },
    { name: 'campaign_data.xml', source: 'MailChimp', size: 890 * 1024 * 1024, downloads: 28 },
    { name: 'tickets_archive.csv', source: 'Zendesk', size: 456 * 1024 * 1024, downloads: 21 }
  ],
  costs: {
    current: 142.56,
    projected: 168.23,
    breakdown: {
      storage: 45.23,
      compute: 62.18,
      bandwidth: 35.15
    }
  }
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('backups')

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string
    value: number
    change: number
    icon: React.ElementType
    format?: 'number' | 'bytes' | 'percent' | 'time'
  }) => {
    const isPositive = change > 0
    const formattedValue = 
      format === 'bytes' ? formatBytes(value) :
      format === 'percent' ? `${value}%` :
      format === 'time' ? `${value}m` :
      formatNumber(value)

    return (
      <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{formattedValue}</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>{Math.abs(change)}%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              isPositive ? "bg-green-100" : "bg-red-100"
            )}>
              {isPositive ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your backup performance and system metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 hover:shadow-md transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="hover:scale-105 transition-transform duration-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" className="hover:scale-105 transition-transform duration-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <MetricCard
          title="Total Backups"
          value={mockAnalytics.overview.totalBackups}
          change={mockAnalytics.overview.totalBackupsChange}
          icon={Database}
        />
        <MetricCard
          title="Success Rate"
          value={mockAnalytics.overview.successRate}
          change={mockAnalytics.overview.successRateChange}
          icon={Activity}
          format="percent"
        />
        <MetricCard
          title="Storage Used"
          value={mockAnalytics.overview.storageUsed}
          change={mockAnalytics.overview.storageChange}
          icon={HardDrive}
          format="bytes"
        />
        <MetricCard
          title="Active Jobs"
          value={mockAnalytics.overview.activeJobs}
          change={mockAnalytics.overview.activeJobsChange}
          icon={Zap}
        />
        <MetricCard
          title="Avg Backup Time"
          value={mockAnalytics.overview.avgBackupTime}
          change={mockAnalytics.overview.avgBackupTimeChange}
          icon={Clock}
          format="time"
        />
        <MetricCard
          title="Data Processed"
          value={mockAnalytics.overview.dataProcessed}
          change={mockAnalytics.overview.dataProcessedChange}
          icon={BarChart3}
          format="bytes"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="files">Top Files</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backup Activity</CardTitle>
                  <CardDescription>Backup operations over time</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48 hover:shadow-md transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backups">Total Backups</SelectItem>
                    <SelectItem value="success">Success Rate</SelectItem>
                    <SelectItem value="duration">Avg Duration</SelectItem>
                    <SelectItem value="size">Data Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ActivityChart />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
                <CardDescription>Backup activity by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockAnalytics.performance.hourlyMetrics.filter((_, i) => i % 3 === 0).map((metric) => (
                    <div key={metric.hour} className="flex items-center justify-between">
                      <span className="text-sm">{metric.hour}:00</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(metric.backups / 50) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{metric.backups}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg Response Time</span>
                  </div>
                  <span className="font-medium">234ms</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">API Uptime</span>
                  </div>
                  <span className="font-medium">99.98%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Concurrent Jobs</span>
                  </div>
                  <span className="font-medium">12 / 20</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Queue Depth</span>
                  </div>
                  <span className="font-medium">3 jobs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Source Performance</CardTitle>
              <CardDescription>Backup statistics by data source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.sources.map((source) => (
                  <div key={source.name} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {source.backups} backups • {formatBytes(source.dataSize)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{source.successRate}%</p>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                        </div>
                        <div className={cn(
                          "p-2 rounded-lg",
                          source.trend === 'up' ? "bg-green-100" : 
                          source.trend === 'down' ? "bg-red-100" : "bg-gray-100"
                        )}>
                          {source.trend === 'up' ? 
                            <TrendingUp className="h-4 w-4 text-green-600" /> : 
                            source.trend === 'down' ?
                            <TrendingDown className="h-4 w-4 text-red-600" /> :
                            <Activity className="h-4 w-4 text-gray-600" />
                          }
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${source.successRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Most Accessed Files</CardTitle>
              <CardDescription>Files with the highest download count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAnalytics.topFiles.map((file, index) => (
                  <div key={file.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.source} • {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{file.downloads}</p>
                        <p className="text-xs text-muted-foreground">Downloads</p>
                      </div>
                      <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Current Month Costs</CardTitle>
                <CardDescription>Breakdown of your current usage costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${mockAnalytics.costs.current}</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      15% over budget
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(mockAnalytics.costs.breakdown).map(([category, amount]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize">{category}</span>
                          <span className="text-sm font-medium">${amount}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(amount / mockAnalytics.costs.current) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle>Cost Projection</CardTitle>
                <CardDescription>Estimated costs based on current usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">End of month projection</p>
                    <p className="text-2xl font-bold">${mockAnalytics.costs.projected}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm">Daily Average</span>
                      <span className="font-medium">${(mockAnalytics.costs.current / 14).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm">Current Rate</span>
                      <span className="font-medium">+${((mockAnalytics.costs.projected - mockAnalytics.costs.current) / 16).toFixed(2)}/day</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Cost Optimization Tip</p>
                        <p className="text-xs mt-1">Enable compression on large files to reduce storage costs by up to 40%.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}