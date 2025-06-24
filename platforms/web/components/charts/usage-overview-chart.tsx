'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UsageData {
  date: string
  storage: number
  apiCalls: number
  backups: number
}

interface UsageOverviewChartProps {
  data: UsageData[]
  className?: string
}

export function UsageOverviewChart({ data, className }: UsageOverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Storage, API calls, and backup activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p className="text-sm">No usage data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>Storage, API calls, and backup activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  name === 'storage' ? `${(value / 1024 / 1024).toFixed(1)} MB` :
                  name === 'apiCalls' ? `${value} calls` :
                  `${value} backups`,
                  name === 'storage' ? 'Storage Used' :
                  name === 'apiCalls' ? 'API Calls' :
                  'Backups'
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Area
                type="monotone"
                dataKey="storage"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="apiCalls"
                stackId="1"
                stroke="hsl(var(--secondary))"
                fill="hsl(var(--secondary))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="backups"
                stackId="1"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}