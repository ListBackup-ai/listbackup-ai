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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users,
  Building,
  Settings,
  Mail,
  Shield,
  UserPlus,
  MoreVertical,
  Trash2,
  Edit,
  Check,
  X,
  Loader2,
  Search
} from 'lucide-react'
import { 
  api, 
  Team, 
  TeamMember, 
  TeamAccount,
  TeamInvitation,
  AddTeamMemberRequest 
} from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TeamDetailsDialogProps {
  team: Team
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamDetailsDialog({ team, open, onOpenChange }: TeamDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('members')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(team.name)
  const [searchQuery, setSearchQuery] = useState('')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()
  const { user } = useAuthStore()

  // Fetch team members
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', team.teamId],
    queryFn: () => api.teams.listMembers(team.teamId),
    enabled: open
  })

  // Fetch team accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['team-accounts', team.teamId],
    queryFn: () => api.teams.listAccounts(team.teamId),
    enabled: open
  })

  // Fetch team invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['team-invitations', team.teamId],
    queryFn: () => api.teams.listInvitations(team.teamId),
    enabled: open
  })

  const members = membersData?.members || []
  const accounts = accountsData?.accounts || []
  const invitations = invitationsData?.invitations || []

  const isOwner = team.ownerId === user?.userId
  const currentMember = members.find(m => m.userId === user?.userId)
  const isAdmin = isOwner || currentMember?.role === 'admin'

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (data: { name: string }) => api.teams.update(team.teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({
        title: 'Team updated',
        description: 'Team details have been updated successfully.',
      })
      setEditingName(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update team',
        variant: 'destructive',
      })
    },
  })

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: (data: AddTeamMemberRequest) => api.teams.addMember(team.teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-invitations', team.teamId] })
      toast({
        title: 'Invitation sent',
        description: 'Team invitation has been sent successfully.',
      })
      setInviteEmail('')
    },
    onError: (error: any) => {
      toast({
        title: 'Invitation failed',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      })
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.teams.removeMember(team.teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.teamId] })
      toast({
        title: 'Member removed',
        description: 'Team member has been removed successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Removal failed',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      })
    },
  })

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' | 'viewer' }) => 
      api.teams.updateMemberRole(team.teamId, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.teamId] })
      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      })
    },
  })

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return
    
    setIsInviting(true)
    try {
      await inviteMemberMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === team.name) {
      setEditingName(false)
      return
    }
    
    await updateTeamMutation.mutateAsync({ name: editName.trim() })
  }

  const filteredMembers = members.filter(member => 
    !searchQuery || 
    member.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {editingName && isAdmin ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  className="h-8 text-lg font-semibold"
                />
                <Button size="icon" variant="ghost" onClick={handleUpdateName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <DialogTitle className="flex items-center gap-2">
                {team.name}
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditName(team.name)
                      setEditingName(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </DialogTitle>
            )}
          </div>
          <DialogDescription>
            {team.description || 'Manage team members, permissions, and account access'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">
              Members
              <Badge variant="secondary" className="ml-2 text-xs">
                {members.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="accounts">
              Accounts
              <Badge variant="secondary" className="ml-2 text-xs">
                {accounts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
              <Badge variant="secondary" className="ml-2 text-xs">
                {invitations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Invite Member */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Invite Team Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                    />
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail.trim()}>
                      {isInviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Members */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Members List */}
            <ScrollArea className="h-[300px]">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length > 0 ? (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <Card key={member.userId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user?.avatarUrl} />
                              <AvatarFallback>
                                {member.user?.name?.charAt(0) || member.user?.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{member.user?.name || member.user?.email}</p>
                              <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {member.role}
                            </Badge>
                            
                            {isAdmin && member.userId !== team.ownerId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateMemberRoleMutation.mutate({ 
                                    userId: member.userId, 
                                    role: 'admin' 
                                  })}>
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateMemberRoleMutation.mutate({ 
                                    userId: member.userId, 
                                    role: 'member' 
                                  })}>
                                    Make Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateMemberRoleMutation.mutate({ 
                                    userId: member.userId, 
                                    role: 'viewer' 
                                  })}>
                                    Make Viewer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => removeMemberMutation.mutate(member.userId)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove from Team
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No members found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Access</CardTitle>
                <CardDescription>
                  Manage which accounts this team can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : accounts.length > 0 ? (
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <Card key={account.accountId}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{account.account?.name}</p>
                              <p className="text-sm text-muted-foreground">{account.account?.accountPath}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {account.permissions.map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No accounts linked to this team</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Invitations</CardTitle>
                <CardDescription>
                  Manage pending team invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInvitations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : invitations.length > 0 ? (
                  <div className="space-y-2">
                    {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                      <Card key={invitation.inviteCode}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{invitation.email}</p>
                              <p className="text-sm text-muted-foreground">
                                Invited {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{invitation.role}</Badge>
                              {isAdmin && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => api.teams.cancelInvitation(team.teamId, invitation.inviteCode)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No pending invitations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Settings</CardTitle>
                <CardDescription>
                  Configure team preferences and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Team ID</Label>
                  <Input value={team.teamId} readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label>Created</Label>
                  <Input 
                    value={`${new Date(team.createdAt).toLocaleDateString()} by ${team.ownerId}`} 
                    readOnly 
                  />
                </div>

                {isOwner && (
                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full">
                      Delete Team
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}