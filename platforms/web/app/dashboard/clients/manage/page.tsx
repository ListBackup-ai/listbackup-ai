'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedDataTable } from '@/components/ui/advanced-data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building, 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  Shield, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Key,
  Mail,
  Crown,
  Ban,
  Unlock,
  Lock,
  Send,
  Download,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Hash,
  Globe,
  Calendar,
  MapPin,
  Phone,
  DollarSign,
  Star,
  Award,
  Target,
  Briefcase,
  Users,
  Database,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  MessageSquare,
  Video,
  Share2,
  Archive,
  RotateCcw,
  Link
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Client {
  clientId: string
  name: string
  displayName: string
  domain: string
  subdomain: string
  status: 'active' | 'inactive' | 'suspended' | 'trial' | 'cancelled'
  tier: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom'
  createdAt: string
  lastLoginAt: string
  expiresAt?: string
  contact: {
    name: string
    email: string
    phone?: string
    title?: string
  }
  company: {
    name: string
    size: string
    industry: string
    location: string
    website?: string
    description?: string
  }
  subscription: {
    plan: string
    status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
    currentPeriodStart: string
    currentPeriodEnd: string
    trialEnd?: string
    cancelAtPeriodEnd: boolean
    billing: {
      amount: number
      currency: string
      interval: 'month' | 'year'
      nextInvoice?: string
    }
  }
  usage: {
    users: number
    sources: number
    storage: number
    apiCalls: number
    lastActivity: string
  }
  limits: {
    maxUsers: number
    maxSources: number
    maxStorage: number
    maxApiCalls: number
  }
  branding: {
    logoUrl?: string
    primaryColor: string
    secondaryColor: string
    customCss?: string
    whiteLabel: boolean
  }
  portal: {
    enabled: boolean
    customDomain?: string
    features: string[]
    theme: 'light' | 'dark' | 'auto'
    language: string
  }
  security: {
    ssoEnabled: boolean
    mfaRequired: boolean
    ipWhitelist: string[]
    allowedDomains: string[]
    sessionTimeout: number
  }
  support: {
    tier: 'basic' | 'priority' | 'dedicated'
    contactMethods: string[]
    responseTime: string
    dedicatedManager?: string
  }
  analytics: {
    totalSessions: number
    totalUsers: number
    dataProcessed: number
    errorRate: number
    uptimePercentage: number
    satisfactionScore: number
  }
  integrations: {
    sso: ClientIntegration[]
    webhooks: ClientWebhook[]
    apiKeys: ClientApiKey[]
  }
}

interface ClientIntegration {
  integrationId: string
  type: 'saml' | 'oauth' | 'oidc'
  provider: string
  status: 'active' | 'inactive' | 'pending'
  config: Record<string, any>
  lastUsed?: string
}

interface ClientWebhook {
  webhookId: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  secret: string
  lastTriggered?: string
  deliveryStatus: 'success' | 'failed' | 'pending'
}

interface ClientApiKey {
  keyId: string
  name: string
  key: string
  scopes: string[]
  status: 'active' | 'inactive'
  createdAt: string
  lastUsed?: string
  expiresAt?: string
}

interface ClientActivity {
  activityId: string
  clientId: string
  userId?: string
  action: string
  resource: string
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
  metadata: Record<string, any>
}

export default function ClientManagementPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBrandingDialog, setShowBrandingDialog] = useState(false)
  const [showPortalDialog, setShowPortalDialog] = useState(false)
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [selectedActivity, setSelectedActivity] = useState<ClientActivity[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'manage'],
    queryFn: () => api.clients.list(),
  })

  const { data: clientActivity = [] } = useQuery({
    queryKey: ['clients', 'activity'],
    queryFn: () => api.activity.list({ category: ['user'], limit: 50 }),
  })

  const { data: clientStats } = useQuery({
    queryKey: ['clients', 'stats'],
    queryFn: () => api.clients.getStats(),
  })

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => api.clients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowCreateDialog(false)
      toast({ title: 'Client created successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to create client', variant: 'destructive' })
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: (data: { clientId: string; updates: Partial<Client> }) =>
      api.clients.update(data.clientId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({ title: 'Client updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update client', variant: 'destructive' })
    },
  })

  const suspendClientMutation = useMutation({
    mutationFn: api.clients.suspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({ title: 'Client suspended successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to suspend client', variant: 'destructive' })
    },
  })

  const unsuspendClientMutation = useMutation({
    mutationFn: api.clients.unsuspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({ title: 'Client unsuspended successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to unsuspend client', variant: 'destructive' })
    },
  })

  const deleteClientMutation = useMutation({
    mutationFn: api.clients.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({ title: 'Client deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete client', variant: 'destructive' })
    },
  })

  const updateBrandingMutation = useMutation({
    mutationFn: (data: { clientId: string; branding: Partial<Client['branding']> }) =>
      api.clients.updateBranding(data.clientId, data.branding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowBrandingDialog(false)
      toast({ title: 'Branding updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update branding', variant: 'destructive' })
    },
  })

  const updatePortalMutation = useMutation({
    mutationFn: (data: { clientId: string; portal: Partial<Client['portal']> }) =>
      api.clients.updatePortal(data.clientId, data.portal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowPortalDialog(false)
      toast({ title: 'Portal configuration updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update portal configuration', variant: 'destructive' })
    },
  })

  // Table columns
  const clientColumns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: 'Client',
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={client.branding.logoUrl} alt={client.name} />
              <AvatarFallback>
                <Building className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{client.name}</div>
              <div className="text-sm text-muted-foreground">{client.domain}</div>
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
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant="secondary" className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => {
        const tier = row.getValue('tier') as string
        const colors = {
          free: 'bg-gray-100 text-gray-800 border-gray-200',
          basic: 'bg-blue-100 text-blue-800 border-blue-200',
          professional: 'bg-green-100 text-green-800 border-green-200',
          enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
          custom: 'bg-orange-100 text-orange-800 border-orange-200',
        }
        return (
          <Badge variant="secondary" className={colors[tier as keyof typeof colors]}>
            {tier}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'usage.users',
      header: 'Users',
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="text-center">
            {client.usage.users}/{client.limits.maxUsers}
          </div>
        )
      },
    },
    {
      accessorKey: 'usage.sources',
      header: 'Sources',
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="text-center">
            {client.usage.sources}/{client.limits.maxSources}
          </div>
        )
      },
    },
    {
      accessorKey: 'subscription.billing.amount',
      header: 'MRR',
      cell: ({ row }) => {
        const client = row.original
        const amount = client.subscription.billing.amount
        const currency = client.subscription.billing.currency.toUpperCase()
        return <div className="text-center">{currency} {amount.toLocaleString()}</div>
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => {
        const date = row.getValue('lastLoginAt') as string
        return <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClient(client)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClient(client)
                setShowBrandingDialog(true)
              }}
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewClientActivity(client.clientId)}
            >
              <Activity className="h-4 w-4" />
            </Button>
            {client.status === 'active' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => suspendClientMutation.mutate(client.clientId)}
                disabled={suspendClientMutation.isPending}
                className="text-orange-600 hover:text-orange-700"
              >
                <Ban className="h-4 w-4" />
              </Button>
            ) : client.status === 'suspended' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => unsuspendClientMutation.mutate(client.clientId)}
                disabled={unsuspendClientMutation.isPending}
                className="text-green-600 hover:text-green-700"
              >
                <Unlock className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteClientMutation.mutate(client.clientId)}
              disabled={deleteClientMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      case 'suspended':
        return <Ban className="h-4 w-4 text-red-500" />
      case 'trial':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Star className="h-4 w-4 text-gray-600" />
      case 'basic':
        return <Award className="h-4 w-4 text-blue-600" />
      case 'professional':
        return <Target className="h-4 w-4 text-green-600" />
      case 'enterprise':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'custom':
        return <Zap className="h-4 w-4 text-orange-600" />
      default:
        return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  const viewClientActivity = async (clientId: string) => {
    try {
      const activity = await api.clients.getClientActivity(clientId)
      setSelectedActivity(activity)
      setShowActivityDialog(true)
    } catch (error) {
      toast({ title: 'Failed to load client activity', variant: 'destructive' })
    }
  }

  const exportClients = (data: Client[]) => {
    const csv = [
      ['Name', 'Domain', 'Status', 'Tier', 'Users', 'Sources', 'MRR', 'Last Login', 'Created'],
      ...data.map(c => [
        c.name,
        c.domain,
        c.status,
        c.tier,
        `${c.usage.users}/${c.limits.maxUsers}`,
        `${c.usage.sources}/${c.limits.maxSources}`,
        `${c.subscription.billing.currency.toUpperCase()} ${c.subscription.billing.amount}`,
        c.lastLoginAt,
        c.createdAt
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredClients = clients.filter(client => {
    if (filterStatus !== 'all' && client.status !== filterStatus) return false
    if (filterTier !== 'all' && client.tier !== filterTier) return false
    return true
  })

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024
      i++
    }
    return `${bytes.toFixed(1)} ${units[i]}`
  }

  const calculateMRR = () => {
    return clients.reduce((sum, client) => {
      if (client.subscription.status === 'active') {
        const amount = client.subscription.billing.amount
        return sum + (client.subscription.billing.interval === 'year' ? amount / 12 : amount)
      }
      return sum
    }, 0)
  }

  const calculateARR = () => {
    return calculateMRR() * 12
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage client accounts, configure portals, and monitor usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            {viewMode === 'grid' ? <BarChart3 className="h-4 w-4 mr-2" /> : <Building className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
                <p className="text-xs text-muted-foreground">
                  {clients.filter(c => c.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${calculateMRR().toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  MRR from active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${calculateARR().toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  ARR projection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.length > 0 ? 
                    (clients.reduce((sum, c) => sum + c.analytics.satisfactionScore, 0) / clients.length).toFixed(1) : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of 10
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Tier */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tier</CardTitle>
              <CardDescription>Monthly recurring revenue breakdown by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {['free', 'basic', 'professional', 'enterprise', 'custom'].map((tier) => {
                  const tierClients = clients.filter(c => c.tier === tier && c.subscription.status === 'active')
                  const tierRevenue = tierClients.reduce((sum, c) => {
                    const amount = c.subscription.billing.amount
                    return sum + (c.subscription.billing.interval === 'year' ? amount / 12 : amount)
                  }, 0)
                  
                  return (
                    <div key={tier} className="text-center p-3 border rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        {getTierIcon(tier)}
                      </div>
                      <div className="text-lg font-semibold">${tierRevenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground capitalize">{tier}</div>
                      <div className="text-xs text-muted-foreground">{tierClients.length} clients</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Clients by Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Usage</CardTitle>
              <CardDescription>Highest usage and most active clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients
                  .sort((a, b) => b.usage.apiCalls - a.usage.apiCalls)
                  .slice(0, 8)
                  .map((client) => (
                    <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={client.branding.logoUrl} alt={client.name} />
                          <AvatarFallback>
                            <Building className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.company.industry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {client.usage.apiCalls.toLocaleString()} API calls
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.usage.users} users • {formatSize(client.usage.storage)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {(filterStatus !== 'all' || filterTier !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterTier('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={clientColumns}
              data={filteredClients}
              onExport={exportClients}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
              isLoading={clientsLoading}
              title="Client Directory"
              description="Manage all client accounts and configurations"
              enableBulkActions={true}
              onBulkDelete={(selectedClients) => {
                Promise.all(selectedClients.map(client => deleteClientMutation.mutateAsync(client.clientId)))
                  .then(() => toast({ title: `${selectedClients.length} clients deleted successfully` }))
                  .catch(() => toast({ title: 'Failed to delete some clients', variant: 'destructive' }))
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client.clientId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.branding.logoUrl} alt={client.name} />
                          <AvatarFallback>
                            <Building className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <CardDescription>{client.domain}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(client.status)}
                        {getTierIcon(client.tier)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Tier */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                      <Badge variant="secondary" className={
                        client.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        client.tier === 'professional' ? 'bg-green-100 text-green-800' :
                        client.tier === 'basic' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {client.tier}
                      </Badge>
                    </div>

                    {/* Usage vs Limits */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {client.usage.users}/{client.limits.maxUsers}
                        </p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {client.usage.sources}/{client.limits.maxSources}
                        </p>
                        <p className="text-xs text-muted-foreground">Sources</p>
                      </div>
                    </div>

                    {/* Revenue and Contact */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span>
                          {client.subscription.billing.currency.toUpperCase()} {client.subscription.billing.amount.toLocaleString()}/{client.subscription.billing.interval}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{client.contact.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Login:</span>
                        <span>{formatDistanceToNow(new Date(client.lastLoginAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Portal Configuration */}
                    {client.portal.enabled && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Monitor className="h-4 w-4" />
                          <span className="font-medium">Portal Enabled</span>
                        </div>
                        {client.portal.customDomain && (
                          <div className="text-blue-700 mt-1 text-xs">
                            Custom domain: {client.portal.customDomain}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trial Warning */}
                    {client.status === 'trial' && client.expiresAt && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            Trial expires {formatDistanceToNow(new Date(client.expiresAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* White Label */}
                    {client.branding.whiteLabel && (
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-purple-800">
                          <Palette className="h-4 w-4" />
                          <span className="font-medium">White Label Enabled</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedClient(client)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client)
                          setShowBrandingDialog(true)
                        }}
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client)
                          setShowPortalDialog(true)
                        }}
                      >
                        <Monitor className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewClientActivity(client.clientId)}
                      >
                        <Activity className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateMRR().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateARR().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Annual recurring revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${clients.length > 0 ? Math.round(calculateMRR() / clients.filter(c => c.subscription.status === 'active').length) : 0}
                </div>
                <p className="text-xs text-muted-foreground">Average revenue per user</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.1%</div>
                <p className="text-xs text-muted-foreground">Monthly churn rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Revenue trends and subscription metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Revenue charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.usage.users, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.usage.sources, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Connected sources</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSize(clients.reduce((sum, c) => sum + c.usage.storage, 0))}
                </div>
                <p className="text-xs text-muted-foreground">Data stored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.usage.apiCalls, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage by Client</CardTitle>
              <CardDescription>Detailed usage metrics for each client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.slice(0, 10).map((client) => (
                  <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.branding.logoUrl} alt={client.name} />
                        <AvatarFallback>
                          <Building className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.tier}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-medium">{client.usage.users}</div>
                        <div className="text-muted-foreground">Users</div>
                      </div>
                      <div>
                        <div className="font-medium">{client.usage.sources}</div>
                        <div className="text-muted-foreground">Sources</div>
                      </div>
                      <div>
                        <div className="font-medium">{formatSize(client.usage.storage)}</div>
                        <div className="text-muted-foreground">Storage</div>
                      </div>
                      <div>
                        <div className="font-medium">{client.usage.apiCalls.toLocaleString()}</div>
                        <div className="text-muted-foreground">API Calls</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.length > 0 ? 
                    (clients.reduce((sum, c) => sum + c.analytics.uptimePercentage, 0) / clients.length).toFixed(2) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">System uptime</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.length > 0 ? 
                    (clients.reduce((sum, c) => sum + c.analytics.errorRate, 0) / clients.length).toFixed(2) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Error rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.analytics.totalSessions, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">User sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSize(clients.reduce((sum, c) => sum + c.analytics.dataProcessed, 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total processed</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Performance Analytics</CardTitle>
              <CardDescription>Detailed performance metrics and satisfaction scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedClient.branding.logoUrl} alt={selectedClient.name} />
                  <AvatarFallback>
                    <Building className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {selectedClient.name}
              </DialogTitle>
              <DialogDescription>
                Complete client information and configuration details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Client ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedClient.clientId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedClient.clientId)
                        toast({ title: 'Client ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Domain</Label>
                  <div className="text-sm">{selectedClient.domain}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedClient.status)}>
                    {selectedClient.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tier</Label>
                  <Badge variant="secondary" className={
                    selectedClient.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    selectedClient.tier === 'professional' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedClient.tier}
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Contact Information</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Primary Contact</div>
                    <div className="text-sm">{selectedClient.contact.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm">{selectedClient.contact.email}</div>
                  </div>
                  {selectedClient.contact.phone && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm">{selectedClient.contact.phone}</div>
                    </div>
                  )}
                  {selectedClient.contact.title && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Title</div>
                      <div className="text-sm">{selectedClient.contact.title}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Company Information</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Company Name</div>
                    <div className="text-sm">{selectedClient.company.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Industry</div>
                    <div className="text-sm">{selectedClient.company.industry}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Company Size</div>
                    <div className="text-sm">{selectedClient.company.size}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Location</div>
                    <div className="text-sm">{selectedClient.company.location}</div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Subscription</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {selectedClient.subscription.billing.currency.toUpperCase()} {selectedClient.subscription.billing.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {selectedClient.subscription.billing.interval}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold capitalize">{selectedClient.subscription.plan}</div>
                    <div className="text-xs text-muted-foreground">Plan</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold capitalize">{selectedClient.subscription.status}</div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {format(new Date(selectedClient.subscription.currentPeriodEnd), 'MMM dd')}
                    </div>
                    <div className="text-xs text-muted-foreground">Next billing</div>
                  </div>
                </div>
              </div>

              {/* Usage and Limits */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Usage & Limits</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {selectedClient.usage.users}/{selectedClient.limits.maxUsers}
                    </div>
                    <div className="text-xs text-muted-foreground">Users</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {selectedClient.usage.sources}/{selectedClient.limits.maxSources}
                    </div>
                    <div className="text-xs text-muted-foreground">Sources</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {formatSize(selectedClient.usage.storage)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      / {formatSize(selectedClient.limits.maxStorage)}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {selectedClient.usage.apiCalls.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      / {selectedClient.limits.maxApiCalls.toLocaleString()} API calls
                    </div>
                  </div>
                </div>
              </div>

              {/* Portal Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Portal Configuration</Label>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="font-medium">Client Portal</span>
                    </div>
                    <Badge variant={selectedClient.portal.enabled ? 'default' : 'secondary'}>
                      {selectedClient.portal.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {selectedClient.portal.enabled && (
                    <div className="space-y-2 text-sm">
                      {selectedClient.portal.customDomain && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custom Domain:</span>
                          <span>{selectedClient.portal.customDomain}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Theme:</span>
                        <span className="capitalize">{selectedClient.portal.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span>{selectedClient.portal.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Features:</span>
                        <span>{selectedClient.portal.features.length} enabled</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics Summary */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Analytics Summary</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedClient.analytics.uptimePercentage.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedClient.analytics.errorRate.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Error Rate</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedClient.analytics.totalSessions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedClient.analytics.satisfactionScore.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Client Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" placeholder="Acme Corporation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDomain">Domain</Label>
              <Input id="clientDomain" placeholder="acme.listbackup.ai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" placeholder="admin@acme.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Client Activity</DialogTitle>
            <DialogDescription>
              Detailed activity log for selected client
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            <div className="space-y-4">
              {selectedActivity.map((activity) => (
                <div key={activity.activityId} className="flex items-start gap-3 p-3 border-l-2 border-green-200 bg-green-50/50 rounded-r">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mt-1">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.details}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.resource} • {activity.ipAddress}
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}