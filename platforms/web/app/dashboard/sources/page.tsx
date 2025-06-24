'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Play, 
  RefreshCw, 
  Database, 
  Cloud, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreHorizontal,
  CreditCard,
  Users,
  Mail,
  MessageSquare,
  Store,
  Briefcase,
  Eye,
  Link
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { PlatformsBrowser } from '@/components/platforms/platforms-browser'
import { InlineEntityTagging } from '@/components/tags'

function SourcesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('sources')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'platforms') {
      setActiveTab('platforms')
    }
  }, [searchParams])

  const { data: sources, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
  })

  const testMutation = useMutation({
    mutationFn: api.sources.test,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({
        title: 'Test completed',
        description: 'Source connection test was successful',
      })
    },
    onError: () => {
      toast({
        title: 'Test failed',
        description: 'Source connection test failed',
        variant: 'destructive',
      })
    },
  })

  const syncMutation = useMutation({
    mutationFn: api.sources.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({
        title: 'Sync started',
        description: 'Source synchronization has been initiated',
      })
    },
    onError: () => {
      toast({
        title: 'Sync failed',
        description: 'Failed to start source synchronization',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.sources.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast({
        title: 'Source deleted',
        description: 'Data source has been removed',
      })
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete source',
        variant: 'destructive',
      })
    },
  })

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'keap':
        return <Users className="h-5 w-5 text-orange-600" />
      case 'stripe':
        return <CreditCard className="h-5 w-5 text-purple-600" />
      case 'gohighlevel':
        return <MessageSquare className="h-5 w-5 text-blue-600" />
      case 'activecampaign':
        return <Mail className="h-5 w-5 text-blue-500" />
      case 'mailchimp':
        return <Mail className="h-5 w-5 text-yellow-600" />
      case 'zendesk':
        return <Briefcase className="h-5 w-5 text-green-600" />
      case 'shopify':
        return <Store className="h-5 w-5 text-green-500" />
      case 'database':
        return <Database className="h-5 w-5" />
      case 'api':
        return <Cloud className="h-5 w-5" />
      case 'file':
        return <FileText className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage your connected data sources and backup configurations
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/sources/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Backup
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">My Sources</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="platforms">Browse Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          {/* Sources Grid */}
          {sources && sources.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <Card 
                  key={source.sourceId} 
                  className="relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/dashboard/sources/${source.sourceId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getSourceIcon(source.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          <CardDescription className="capitalize">{source.type} source</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <InlineEntityTagging
                          entityId={source.sourceId}
                          entityType="source"
                          editable={false}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sources/${source.sourceId}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testMutation.mutate(source.sourceId)}>
                            <Play className="h-4 w-4 mr-2" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => syncMutation.mutate(source.sourceId)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(source.sourceId)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(source.status)}
                        <span className="text-sm font-medium capitalize">{source.status}</span>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(source.status)}>
                        {source.status}
                      </Badge>
                    </div>

                    {/* Last Sync */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Sync</p>
                      <p className="text-sm">
                        {source.lastSync ? 
                          formatDistanceToNow(new Date(source.lastSync), { addSuffix: true }) : 
                          'Never synced'
                        }
                      </p>
                    </div>

                    {/* Last Test */}
                    {source.lastTest && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Last Test</p>
                        <div className="flex items-center gap-2">
                          {source.lastTest.success ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(source.lastTest.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Statistics */}
                    {source.statistics && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{source.statistics.totalFiles.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Files</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">
                            {(source.statistics.totalSize / 1024 / 1024).toFixed(1)}MB
                          </p>
                          <p className="text-xs text-muted-foreground">Size</p>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => testMutation.mutate(source.sourceId)}
                        disabled={testMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => syncMutation.mutate(source.sourceId)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No data sources yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect your first data source to start backing up your important data. 
                    Switch to the "Add Platform" tab to get started.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Link className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Manage Platform Connections</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    View and manage your connections to external platforms.
                  </p>
                </div>
                <Button onClick={() => router.push('/dashboard/connections')}>
                  <Link className="h-4 w-4 mr-2" />
                  Go to Connections
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms">
          <PlatformsBrowser />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SourcesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SourcesPageContent />
    </Suspense>
  )
}