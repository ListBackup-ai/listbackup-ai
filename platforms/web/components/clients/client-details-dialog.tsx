'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building,
  Users,
  Shield,
  Activity,
  Download,
  Calendar,
  Clock,
  Mail,
  MoreVertical,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  FileText,
  Link2
} from 'lucide-react'
import { 
  api, 
  Client, 
  ClientAccount,
  ClientTeam,
  UpdateClientRequest 
} from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow, format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface ClientDetailsDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailsDialog({ client, open, onOpenChange }: ClientDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(client.name)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editCompany, setEditCompany] = useState(client.company || '')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch client accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['client-accounts', client.clientId],
    queryFn: () => api.clients.listAccounts(client.clientId),
    enabled: open
  })

  // Fetch client teams
  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['client-teams', client.clientId],
    queryFn: () => api.clients.listTeams(client.clientId),
    enabled: open
  })

  // Fetch client permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['client-permissions', client.clientId],
    queryFn: () => api.clients.getPermissions(client.clientId),
    enabled: open
  })

  const accounts = accountsData?.accounts || []
  const teams = teamsData?.teams || []
  const permissions = permissionsData?.permissions || []

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (data: UpdateClientRequest) => api.clients.update(client.clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: 'Client updated',
        description: 'Client details have been updated successfully.',
      })
      setEditingName(false)
      setEditingCompany(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update client',
        variant: 'destructive',
      })
    },
  })

  // Remove account access mutation
  const removeAccountMutation = useMutation({
    mutationFn: (accountId: string) => api.clients.revokeAccountAccess(client.clientId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accounts', client.clientId] })
      toast({
        title: 'Access revoked',
        description: 'Account access has been removed.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to revoke access',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  // Remove team access mutation
  const removeTeamMutation = useMutation({
    mutationFn: (teamId: string) => api.clients.revokeTeamAccess(client.clientId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-teams', client.clientId] })
      toast({
        title: 'Access revoked',
        description: 'Team access has been removed.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to revoke access',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === client.name) {
      setEditingName(false)
      return
    }
    
    await updateClientMutation.mutateAsync({ name: editName.trim() })
  }

  const handleUpdateCompany = async () => {
    if (editCompany === client.company) {
      setEditingCompany(false)
      return
    }
    
    await updateClientMutation.mutateAsync({ company: editCompany.trim() || undefined })
  }

  const handleStatusChange = async (status: 'active' | 'inactive' | 'suspended') => {
    await updateClientMutation.mutateAsync({ status })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Client Details
              <Badge variant={getStatusBadgeVariant(client.status)}>
                {client.status}
              </Badge>
            </DialogTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('inactive')}>
                  <UserX className="h-4 w-4 mr-2" />
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('suspended')}>
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DialogDescription>
            Manage client access and permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">
              Accounts
              <Badge variant="secondary" className="ml-2 text-xs">
                {accounts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="teams">
              Teams
              <Badge variant="secondary" className="ml-2 text-xs">
                {teams.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    {editingName ? (
                      <div className="flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateName()
                            if (e.key === 'Escape') setEditingName(false)
                          }}
                        />
                        <Button size="sm" onClick={handleUpdateName}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{client.name}</p>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditName(client.name)
                          setEditingName(true)
                        }}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm">{client.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Company</Label>
                    {editingCompany ? (
                      <div className="flex gap-2">
                        <Input
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateCompany()
                            if (e.key === 'Escape') setEditingCompany(false)
                          }}
                          placeholder="Add company"
                        />
                        <Button size="sm" onClick={handleUpdateCompany}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCompany(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{client.company || 'Not specified'}</p>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditCompany(client.company || '')
                          setEditingCompany(true)
                        }}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <p className="text-sm font-mono">{client.clientId}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <p className="text-sm">
                      {format(new Date(client.createdAt), 'MMM d, yyyy')}
                      <span className="text-muted-foreground ml-2">
                        ({formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })})
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <p className="text-sm">
                      {client.lastLoginAt ? (
                        <>
                          {format(new Date(client.lastLoginAt), 'MMM d, yyyy')}
                          <span className="text-muted-foreground ml-2">
                            ({formatDistanceToNow(new Date(client.lastLoginAt), { addSuffix: true })})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Never logged in</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Account Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accounts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Accessible accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teams.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Accessible teams
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Access</CardTitle>
                <CardDescription>
                  Manage which accounts this client can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : accounts.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {accounts.map((account) => (
                        <Card key={account.accountId}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{account.account?.name}</p>
                                <p className="text-sm text-muted-foreground">{account.account?.accountPath}</p>
                                <div className="flex gap-2 mt-2">
                                  {account.permissions.map((perm) => (
                                    <Badge key={perm} variant="outline" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {account.expiresAt && (
                                  <Badge variant="secondary" className="text-xs">
                                    Expires {format(new Date(account.expiresAt), 'MMM d')}
                                  </Badge>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeAccountMutation.mutate(account.accountId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No account access granted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Access</CardTitle>
                <CardDescription>
                  Manage which teams this client can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTeams ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : teams.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {teams.map((team) => (
                        <Card key={team.teamId}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{team.team?.name}</p>
                                {team.team?.description && (
                                  <p className="text-sm text-muted-foreground">{team.team.description}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  {team.permissions.map((perm) => (
                                    <Badge key={perm} variant="outline" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeTeamMutation.mutate(team.teamId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No team access granted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>
                  Client activity and access logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Data Export</p>
                      <p className="text-xs text-muted-foreground">
                        Exported contacts from Account ABC • 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Report Viewed</p>
                      <p className="text-xs text-muted-foreground">
                        Viewed monthly backup summary • Yesterday
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Login</p>
                      <p className="text-xs text-muted-foreground">
                        Logged in from 192.168.1.1 • 3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}