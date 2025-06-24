'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Settings, 
  Trash2, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  MoreHorizontal,
  Zap,
  Key,
  Link2,
  TestTube,
  ArrowRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { api, PlatformConnection } from '@listbackup/shared/api'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ConnectionCreateDialog } from '@/components/platforms/connection-create-dialog'

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<PlatformConnection | null>(null)
  
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch connections
  const { data: connectionsData, isLoading } = useQuery({
    queryKey: ['platform-connections', selectedPlatform],
    queryFn: () => api.platformConnections.list(selectedPlatform || undefined),
  })

  // Fetch platforms for filtering
  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: api.platforms.list,
  })

  const connections = connectionsData?.connections || []
  const platforms = platformsData?.platforms || []

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: api.platformConnections.test,
    onSuccess: (data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] })
      toast({
        title: data.success ? 'Connection verified' : 'Connection test failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Test failed',
        description: error.message || 'Failed to test connection',
        variant: 'destructive',
      })
    },
  })

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: api.platformConnections.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] })
      toast({
        title: 'Connection deleted',
        description: 'The connection has been removed successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete connection',
        variant: 'destructive',
      })
    },
  })

  // Reconnect mutation
  const reconnectMutation = useMutation({
    mutationFn: api.platformConnections.reconnect,
    onSuccess: (data, connectionId) => {
      if (data.authUrl) {
        // OAuth reconnection - redirect to auth URL
        window.location.href = data.authUrl
      } else {
        // API key reconnection handled differently
        setSelectedConnection(connections.find(c => c.connectionId === connectionId) || null)
        setIsCreateDialogOpen(true)
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Reconnection failed',
        description: error.message || 'Failed to initiate reconnection',
        variant: 'destructive',
      })
    },
  })

  // Filter connections based on search and platform
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchQuery || 
      connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.platformId.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPlatform = !selectedPlatform || connection.platformId === selectedPlatform
    
    return matchesSearch && matchesPlatform
  })

  const getStatusIcon = (status: PlatformConnection['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: PlatformConnection['status']) => {
    const variants = {
      active: 'default' as const,
      error: 'destructive' as const,
      expired: 'destructive' as const,
      pending: 'secondary' as const,
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const getAuthTypeIcon = (authType: PlatformConnection['authType']) => {
    switch (authType) {
      case 'oauth':
        return <Zap className="h-4 w-4" />
      case 'apikey':
        return <Key className="h-4 w-4" />
      default:
        return <Link2 className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Connections</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connections to external platforms
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Connection
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedPlatform === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
              >
                All Platforms
              </Button>
              {platforms.map((platform) => (
                <Button
                  key={platform.platformId || platform.id}
                  variant={selectedPlatform === (platform.platformId || platform.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.platformId || platform.id || null)}
                >
                  {platform.displayName || platform.title || platform.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connections Grid */}
      {filteredConnections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No connections found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery || selectedPlatform
                    ? 'Try adjusting your filters.'
                    : 'Get started by creating your first platform connection.'}
                </p>
              </div>
              {!searchQuery && !selectedPlatform && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Connection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((connection) => {
            const platform = platforms.find(p => (p.platformId || p.id) === connection.platformId)
            
            return (
              <Card key={connection.connectionId} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {platform && (
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                          <img
                            src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase() + '.com'}`}
                            alt={platform.displayName || platform.title || platform.name}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {platform?.displayName || platform?.title || connection.platformId}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => testConnectionMutation.mutate(connection.connectionId)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/connections/${connection.connectionId}`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        {(connection.status === 'error' || connection.status === 'expired') && (
                          <DropdownMenuItem onClick={() => reconnectMutation.mutate(connection.connectionId)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteConnectionMutation.mutate(connection.connectionId)}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(connection.status)}
                      {getStatusBadge(connection.status)}
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      {getAuthTypeIcon(connection.authType)}
                      <span className="text-sm capitalize">{connection.authType}</span>
                    </div>
                  </div>

                  {connection.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {connection.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {connection.lastConnected && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last connected</span>
                        <span>{format(new Date(connection.lastConnected), 'PPp')}</span>
                      </div>
                    )}
                    {connection.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expires</span>
                        <span className={new Date(connection.expiresAt) < new Date() ? 'text-red-600' : ''}>
                          {format(new Date(connection.expiresAt), 'PPp')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/sources?connection=${connection.connectionId}`)}
                    >
                      View Sources
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Connection Dialog */}
      {isCreateDialogOpen && (
        <ConnectionCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          editConnection={selectedConnection}
        />
      )}
    </div>
  )
}