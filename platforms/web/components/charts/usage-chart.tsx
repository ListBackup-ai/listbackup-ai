'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', storage: 2.4, backups: 12 },
  { name: 'Feb', storage: 3.8, backups: 18 },
  { name: 'Mar', storage: 5.2, backups: 24 },
  { name: 'Apr', storage: 4.6, backups: 21 },
  { name: 'May', storage: 6.1, backups: 28 },
  { name: 'Jun', storage: 7.8, backups: 35 },
]

export function UsageChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>
          Monthly storage usage and backup count trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="storage"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorStorage)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}