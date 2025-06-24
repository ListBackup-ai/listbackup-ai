'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Search, 
  Settings,
  Shield,
  Building,
  Mail,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Download,
  Calendar,
  Clock
} from 'lucide-react'
import { api, Client } from '@listbackup/shared/api'
import { ClientCreateDialog } from '@/components/clients/client-create-dialog'
import { ClientDetailsDialog } from '@/components/clients/client-details-dialog'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  
  const { currentAccount } = useAccountContext()
  const { toast } = useToast()

  // Fetch clients
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', currentAccount?.accountId, statusFilter],
    queryFn: () => api.clients.list({ 
      accountId: currentAccount?.accountId,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    enabled: !!currentAccount?.accountId
  })

  // Fetch invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['client-invitations'],
    queryFn: () => api.clients.listInvitations(),
  })

  const clients = clientsData?.clients || []
  const invitations = invitationsData?.invitations || []

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const handleStatusChange = async (clientId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      await api.clients.update(clientId, { status })
      toast({
        title: 'Status updated',
        description: 'Client status has been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update client status',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.clients.deleteClient(clientId)
      toast({
        title: 'Client deleted',
        description: 'The client has been removed successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-3 w-3" />
      case 'inactive':
      case 'suspended':
        return <UserX className="h-3 w-3" />
      default:
        return null
    }
  }

  const renderClientCard = (client: Client) => (
    <Card key={client.clientId} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{client.name}</CardTitle>
            <CardDescription className="text-sm">
              {client.email}
              {client.company && ` • ${client.company}`}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(client.status)} className="gap-1">
              {getStatusIcon(client.status)}
              {client.status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Client Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setSelectedClient(client)
                  setShowDetailsDialog(true)
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedClient(client)
                  setShowDetailsDialog(true)
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusChange(client.clientId, 
                    client.status === 'active' ? 'inactive' : 'active'
                  )}
                >
                  {client.status === 'active' ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteClient(client.clientId)}
                  className="text-destructive"
                >
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Last Login</p>
            <p className="font-medium">
              {client.lastLoginAt 
                ? formatDistanceToNow(new Date(client.lastLoginAt), { addSuffix: true })
                : 'Never'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              <span>2 accounts</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>1 team</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedClient(client)
              setShowDetailsDialog(true)
            }}
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderInvitationCard = (invitation: any) => (
    <Card key={invitation.inviteCode} className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitation Pending
            </CardTitle>
            <CardDescription className="text-sm">
              {invitation.email}
              {invitation.company && ` • ${invitation.company}`}
            </CardDescription>
          </div>
          <Badge variant="secondary">Pending</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">
            Invited {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
          </p>
          <p className="text-muted-foreground">
            Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {invitation.accountAccess && (
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>{invitation.accountAccess.length} accounts</span>
              </div>
            )}
            {invitation.teamAccess && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{invitation.teamAccess.length} teams</span>
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => api.clients.cancelInvitation(invitation.inviteCode)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage client access to your accounts and data
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.lastLoginAt && 
                new Date(c.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Active Clients */}
          {filteredClients.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold">Active Clients</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map(client => renderClientCard(client))}
              </div>
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invitations.map(invitation => renderInvitationCard(invitation))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredClients.length === 0 && invitations.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No clients yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Invite clients to give them limited access to your data
                  </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Client
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Create Client Dialog */}
      <ClientCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Client Details Dialog */}
      {selectedClient && (
        <ClientDetailsDialog
          client={selectedClient}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  )
}