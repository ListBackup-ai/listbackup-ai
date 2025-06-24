'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedDataTable } from '@/components/ui/advanced-data-table'
import { BulkOperationsDialog } from '@/components/ui/bulk-operations-dialog'
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
  Link,
  Download,
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
import { cn } from '@listbackup/shared/utils'

interface Source {
  sourceId: string
  name: string
  type: string
  status: 'active' | 'error' | 'pending' | 'inactive'
  lastSync?: string
  lastTest?: {
    success: boolean
    timestamp: string
  }
  statistics?: {
    totalFiles: number
    totalSize: number
  }
  createdAt: string
  updatedAt: string
  accountId: string
}

function EnhancedSourcesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('sources')
  const [selectedSources, setSelectedSources] = useState<Source[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkSyncOpen, setBulkSyncOpen] = useState(false)
  const [bulkOperations, setBulkOperations] = useState<any[]>([])
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'platforms') {
      setActiveTab('platforms')
    }
  }, [searchParams])

  const { data: sources, isLoading, refetch } = useQuery({
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
        return <Users className="h-4 w-4 text-orange-600" />
      case 'stripe':
        return <CreditCard className="h-4 w-4 text-purple-600" />
      case 'gohighlevel':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'activecampaign':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'mailchimp':
        return <Mail className="h-4 w-4 text-yellow-600" />
      case 'zendesk':
        return <Briefcase className="h-4 w-4 text-green-600" />
      case 'shopify':
        return <Store className="h-4 w-4 text-green-500" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Cloud className="h-4 w-4" />
      case 'file':
        return <FileText className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
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

  const columns: ColumnDef<Source>[] = [
    {
      accessorKey: 'name',
      header: 'Source Name',
      cell: ({ row }) => {
        const source = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              {getSourceIcon(source.type)}
            </div>
            <div>
              <div className="font-medium">{source.name}</div>
              <div className="text-sm text-muted-foreground capitalize">{source.type}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant="secondary" className={cn('gap-1', getStatusColor(status))}>
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'lastSync',
      header: 'Last Sync',
      cell: ({ row }) => {
        const lastSync = row.getValue('lastSync') as string
        return lastSync ? (
          <div className="text-sm">
            {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Never</div>
        )
      },
    },
    {
      accessorKey: 'statistics',
      header: 'Data',
      cell: ({ row }) => {
        const stats = row.getValue('statistics') as Source['statistics']
        if (!stats) return <div className="text-sm text-muted-foreground">No data</div>
        
        return (
          <div className="text-sm">
            <div>{stats.totalFiles.toLocaleString()} files</div>
            <div className="text-muted-foreground">
              {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'lastTest',
      header: 'Last Test',
      cell: ({ row }) => {
        const lastTest = row.getValue('lastTest') as Source['lastTest']
        if (!lastTest) return <div className="text-sm text-muted-foreground">Not tested</div>
        
        return (
          <div className="flex items-center gap-2 text-sm">
            {lastTest.success ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-red-500" />
            )}
            <span>
              {formatDistanceToNow(new Date(lastTest.timestamp), { addSuffix: true })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Modified',
      cell: ({ row }) => {
        const updatedAt = row.getValue('updatedAt') as string
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const source = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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
        )
      },
    },
  ]

  const filterableColumns = [
    {
      id: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Error', value: 'error' },
        { label: 'Pending', value: 'pending' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      id: 'type',
      title: 'Type',
      options: [
        { label: 'Keap', value: 'keap' },
        { label: 'Stripe', value: 'stripe' },
        { label: 'GoHighLevel', value: 'gohighlevel' },
        { label: 'ActiveCampaign', value: 'activecampaign' },
        { label: 'MailChimp', value: 'mailchimp' },
        { label: 'Zendesk', value: 'zendesk' },
        { label: 'Shopify', value: 'shopify' },
      ],
    },
  ]

  const handleBulkDelete = async () => {
    setIsProcessingBulk(true)
    const operations = selectedSources.map(source => ({
      id: source.sourceId,
      name: source.name,
      status: 'pending' as const,
    }))
    setBulkOperations(operations)

    try {
      // Process deletions one by one
      for (let i = 0; i < selectedSources.length; i++) {
        const source = selectedSources[i]
        setBulkOperations(prev => prev.map(op => 
          op.id === source.sourceId ? { ...op, status: 'processing' } : op
        ))

        try {
          await deleteMutation.mutateAsync(source.sourceId)
          setBulkOperations(prev => prev.map(op => 
            op.id === source.sourceId ? { ...op, status: 'success' } : op
          ))
        } catch (error) {
          setBulkOperations(prev => prev.map(op => 
            op.id === source.sourceId ? { 
              ...op, 
              status: 'error',
              error: 'Failed to delete source'
            } : op
          ))
        }
      }
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleBulkSync = async () => {
    setIsProcessingBulk(true)
    const operations = selectedSources.map(source => ({
      id: source.sourceId,
      name: source.name,
      status: 'pending' as const,
    }))
    setBulkOperations(operations)

    try {
      // Process syncs one by one
      for (let i = 0; i < selectedSources.length; i++) {
        const source = selectedSources[i]
        setBulkOperations(prev => prev.map(op => 
          op.id === source.sourceId ? { ...op, status: 'processing' } : op
        ))

        try {
          await syncMutation.mutateAsync(source.sourceId)
          setBulkOperations(prev => prev.map(op => 
            op.id === source.sourceId ? { ...op, status: 'success' } : op
          ))
        } catch (error) {
          setBulkOperations(prev => prev.map(op => 
            op.id === source.sourceId ? { 
              ...op, 
              status: 'error',
              error: 'Failed to sync source'
            } : op
          ))
        }
      }
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleExport = (data: Source[]) => {
    const csvContent = [
      ['Name', 'Type', 'Status', 'Last Sync', 'Files', 'Size (MB)', 'Created', 'Modified'].join(','),
      ...data.map(source => [
        source.name,
        source.type,
        source.status,
        source.lastSync || 'Never',
        source.statistics?.totalFiles || 0,
        source.statistics ? (source.statistics.totalSize / 1024 / 1024).toFixed(1) : 0,
        new Date(source.createdAt).toLocaleDateString(),
        new Date(source.updatedAt).toLocaleDateString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sources-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export completed',
      description: `Exported ${data.length} sources to CSV`,
    })
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
          <AdvancedDataTable
            columns={columns}
            data={sources || []}
            filterableColumns={filterableColumns}
            onRowSelect={setSelectedSources}
            onBulkDelete={(selected) => {
              setSelectedSources(selected)
              setBulkDeleteOpen(true)
            }}
            onBulkEdit={(selected) => {
              setSelectedSources(selected)
              setBulkSyncOpen(true)
            }}
            onExport={handleExport}
            onRefresh={() => refetch()}
            isLoading={isLoading}
            title="Data Sources"
            description="Connected data sources and their status"
          />
        </TabsContent>

        <TabsContent value="connections">
          <div className="text-center py-12">
            <Link className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Manage Platform Connections</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              View and manage your connections to external platforms.
            </p>
            <Button onClick={() => router.push('/dashboard/connections')}>
              <Link className="h-4 w-4 mr-2" />
              Go to Connections
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <PlatformsBrowser />
        </TabsContent>
      </Tabs>

      {/* Bulk Delete Dialog */}
      <BulkOperationsDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Sources"
        description="Are you sure you want to delete the selected sources? This action cannot be undone."
        operations={bulkOperations}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        variant="delete"
        isProcessing={isProcessingBulk}
      />

      {/* Bulk Sync Dialog */}
      <BulkOperationsDialog
        open={bulkSyncOpen}
        onOpenChange={setBulkSyncOpen}
        title="Sync Sources"
        description="Synchronize the selected sources to update their data."
        operations={bulkOperations}
        onConfirm={handleBulkSync}
        onCancel={() => setBulkSyncOpen(false)}
        variant="sync"
        isProcessing={isProcessingBulk}
      />
    </div>
  )
}

export default function EnhancedSourcesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnhancedSourcesPageContent />
    </Suspense>
  )
}