'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Upload,
  Download,
  Settings,
  RefreshCw,
  Calendar,
  User
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MonitorPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: activity, isLoading, refetch } = useQuery({
    queryKey: ['activity', { type: typeFilter }],
    queryFn: () => api.activity.list({ 
      limit: 50,
      type: typeFilter === 'all' ? undefined : [typeFilter]
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'source.created':
      case 'source.updated':
        return <Database className="h-4 w-4 text-blue-500" />
      case 'source.test.success':
      case 'source.sync.success':
      case 'job.run.completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'source.test.failed':
      case 'source.sync.failed':
      case 'job.run.failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'job.created':
      case 'job.updated':
      case 'job.run.started':
        return <Upload className="h-4 w-4 text-blue-500" />
      case 'file.downloaded':
        return <Download className="h-4 w-4 text-purple-500" />
      case 'account.updated':
        return <Settings className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string) => {
    if (type.includes('success') || type.includes('completed') || type.includes('created')) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    if (type.includes('failed') || type.includes('error')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (type.includes('started') || type.includes('updated')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getDisplayType = (type: string) => {
    const typeMap: Record<string, string> = {
      'source.created': 'Source Created',
      'source.updated': 'Source Updated',
      'source.deleted': 'Source Deleted',
      'source.test.success': 'Test Passed',
      'source.test.failed': 'Test Failed',
      'source.sync.success': 'Sync Completed',
      'source.sync.failed': 'Sync Failed',
      'job.created': 'Job Created',
      'job.updated': 'Job Updated',
      'job.deleted': 'Job Deleted',
      'job.run.started': 'Job Started',
      'job.run.completed': 'Job Completed',
      'job.run.failed': 'Job Failed',
      'file.downloaded': 'File Downloaded',
      'account.updated': 'Account Updated'
    }
    return typeMap[type] || type
  }

  const filteredActivity = activity?.activities?.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDisplayType(item.type).toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'success' && (item.type.includes('success') || item.type.includes('completed'))) ||
      (statusFilter === 'failed' && item.type.includes('failed')) ||
      (statusFilter === 'warning' && item.type.includes('warning'))
    
    return matchesSearch && matchesStatus
  }) || []

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Monitor</h1>
          <p className="text-muted-foreground">
            Real-time system activity and event monitoring
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline"
          className="hover:scale-105 transition-transform duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter activity by type, status, or search terms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="transition-all duration-200 hover:shadow-md focus:shadow-md"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="source">Source Events</SelectItem>
                <SelectItem value="job">Job Events</SelectItem>
                <SelectItem value="file">File Events</SelectItem>
                <SelectItem value="account">Account Events</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {filteredActivity.length > 0 ? (
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">
              Activity Timeline
              <Badge variant="secondary" className="ml-2 hover:scale-110 transition-transform duration-200">
                {filteredActivity.length} events
              </Badge>
            </CardTitle>
            <CardDescription>
              {searchQuery || typeFilter || statusFilter ? 
                'Filtered activity events' :
                'Latest system activity and events'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredActivity.map((event) => (
                <div key={event.activityId} className="p-4 hover:bg-muted/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 hover:scale-110 transition-transform duration-200">
                      {getActivityIcon(event.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${getActivityColor(event.type)} hover:scale-105 transition-transform duration-200`}>
                          {getDisplayType(event.type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">{event.description}</p>
                      
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {event.metadata.sourceName && (
                            <span>Source: {event.metadata.sourceName} • </span>
                          )}
                          {event.metadata.jobName && (
                            <span>Job: {event.metadata.jobName} • </span>
                          )}
                          {event.metadata.fileName && (
                            <span>File: {event.metadata.fileName} • </span>
                          )}
                          {event.metadata.duration && (
                            <span>Duration: {Math.round(event.metadata.duration / 1000)}s</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      {event.userId && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          <span>User</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' ? 'No matching activity' : 'No activity yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' ? 
                  'No activity events match your current filters. Try adjusting your search or filter criteria.' :
                  'System activity will appear here as you use data sources, run backup jobs, and interact with the platform.'
                }
              </p>
            </div>
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setTypeFilter('all')
                    setStatusFilter('all')
                  }}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}