'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BackupStatusData {
  name: string
  value: number
  color: string
}

interface BackupStatusChartProps {
  data: BackupStatusData[]
  className?: string
}

const COLORS = {
  success: '#10b981',
  failed: '#ef4444', 
  running: '#3b82f6',
  pending: '#f59e0b'
}

export function BackupStatusChart({ data, className }: BackupStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Backup Status</CardTitle>
          <CardDescription>Distribution of backup job statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p className="text-sm">No backup data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Backup Status</CardTitle>
        <CardDescription>Distribution of backup job statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} jobs`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>
                      {value} ({entry.payload?.value || 0})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-muted-foreground">Total Jobs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.find(d => d.name === 'Success')?.value || 0}
            </p>
            <p className="text-muted-foreground">Successful</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}