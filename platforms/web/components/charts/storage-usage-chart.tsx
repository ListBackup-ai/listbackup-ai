'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StorageData {
  used: number
  limit: number
  percentage: number
  bySource?: Array<{
    name: string
    size: number
    percentage: number
  }>
}

interface StorageUsageChartProps {
  data: StorageData
  className?: string
}

export function StorageUsageChart({ data, className }: StorageUsageChartProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>Current storage consumption and breakdown by source</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {formatBytes(data.used)}</span>
            <span>Limit: {formatBytes(data.limit)}</span>
          </div>
          <Progress 
            value={data.percentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {data.percentage.toFixed(1)}% of storage limit used
          </p>
        </div>

        {/* Breakdown by Source */}
        {data.bySource && data.bySource.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Breakdown by Source</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bySource} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    className="text-xs"
                    tickFormatter={(value) => formatBytes(value)}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatBytes(value), 'Storage Used']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="size" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Storage Breakdown List */}
        {data.bySource && data.bySource.length > 0 && (
          <div className="space-y-2">
            {data.bySource.slice(0, 5).map((source, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{source.name}</span>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-muted-foreground">{formatBytes(source.size)}</span>
                  <div className="w-16">
                    <Progress value={source.percentage} className="h-1" />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {source.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Storage Health Indicator */}
        <div className={`p-3 rounded-lg ${
          data.percentage < 50 ? 'bg-green-50 border border-green-200' :
          data.percentage < 80 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getUsageColor(data.percentage)}`} />
            <span className="text-sm font-medium">
              {data.percentage < 50 ? 'Storage Healthy' :
               data.percentage < 80 ? 'Storage Warning' :
               'Storage Critical'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.percentage < 50 ? 'You have plenty of storage space remaining.' :
             data.percentage < 80 ? 'Consider cleaning up old backups or upgrading your plan.' :
             'Storage is nearly full. Immediate action recommended.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}