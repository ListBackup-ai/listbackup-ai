'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Mon', backups: 8, exports: 3 },
  { day: 'Tue', backups: 12, exports: 5 },
  { day: 'Wed', backups: 15, exports: 7 },
  { day: 'Thu', backups: 10, exports: 4 },
  { day: 'Fri', backups: 18, exports: 9 },
  { day: 'Sat', backups: 6, exports: 2 },
  { day: 'Sun', backups: 4, exports: 1 },
]

export function ActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>
          Backup and export activity for the past week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
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
            <Bar 
              dataKey="backups" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="exports" 
              fill="hsl(var(--primary) / 0.6)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}