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
  UserPlus,
  LogOut,
  Trash2,
  Edit
} from 'lucide-react'
import { api, Team } from '@listbackup/shared/api'
import { TeamCreateDialog } from '@/components/teams/team-create-dialog'
import { TeamDetailsDialog } from '@/components/teams/team-details-dialog'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { useAuthStore } from '@/lib/stores/auth-store'
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

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState('my-teams')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  
  const { currentAccount } = useAccountContext()
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Fetch user's teams
  const { data: myTeamsData, isLoading: isLoadingMyTeams } = useQuery({
    queryKey: ['teams', 'my', user?.userId],
    queryFn: () => api.teams.list({ userId: user?.userId }),
    enabled: !!user?.userId
  })

  // Fetch teams with access to current account
  const { data: accountTeamsData, isLoading: isLoadingAccountTeams } = useQuery({
    queryKey: ['teams', 'account', currentAccount?.accountId],
    queryFn: () => api.teams.list({ accountId: currentAccount?.accountId }),
    enabled: !!currentAccount?.accountId
  })

  // Fetch invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['team-invitations'],
    queryFn: () => api.teams.getMyInvitations(),
  })

  const myTeams = myTeamsData?.teams || []
  const accountTeams = accountTeamsData?.teams || []
  const invitations = invitationsData?.invitations || []

  const filteredTeams = (teams: Team[]) => {
    if (!searchQuery) return teams
    return teams.filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleLeaveTeam = async (teamId: string) => {
    if (!user?.userId) return
    
    try {
      await api.teams.removeMember(teamId, user.userId)
      toast({
        title: 'Left team',
        description: 'You have successfully left the team.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to leave team',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await api.teams.deleteTeam(teamId)
      toast({
        title: 'Team deleted',
        description: 'The team has been permanently deleted.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to delete team',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleAcceptInvitation = async (inviteCode: string) => {
    try {
      await api.teams.acceptInvitation(inviteCode)
      toast({
        title: 'Invitation accepted',
        description: 'You have joined the team successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to accept invitation',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const renderTeamCard = (team: Team, isOwner: boolean = false) => (
    <Card key={team.teamId} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {team.name}
              {isOwner && (
                <Badge variant="secondary" className="text-xs">Owner</Badge>
              )}
            </CardTitle>
            {team.description && (
              <CardDescription className="text-sm">{team.description}</CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedTeam(team)
                setShowDetailsDialog(true)
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedTeam(team)
                setShowDetailsDialog(true)
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isOwner ? (
                <DropdownMenuItem 
                  onClick={() => handleDeleteTeam(team.teamId)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => handleLeaveTeam(team.teamId)}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Team
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{team.memberCount} members</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{team.accountCount} accounts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedTeam(team)
              setShowDetailsDialog(true)
            }}
          >
            View Details
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
              Invitation to {invitation.team?.name}
            </CardTitle>
            <CardDescription className="text-sm">
              Invited as {invitation.role} by {invitation.invitedBy}
            </CardDescription>
          </div>
          <Badge variant="secondary">Pending</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {invitation.team?.description || 'No description provided'}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Decline
            </Button>
            <Button 
              size="sm"
              onClick={() => handleAcceptInvitation(invitation.inviteCode)}
            >
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-2">
            Collaborate with your team members across accounts and sources
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-teams">
            My Teams
            {myTeams.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myTeams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="account-teams">
            Account Teams
            {accountTeams.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {accountTeams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {invitations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-teams" className="space-y-4">
          {isLoadingMyTeams ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : filteredTeams(myTeams).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams(myTeams).map(team => 
                renderTeamCard(team, team.ownerId === user?.userId)
              )}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No teams yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Create your first team to start collaborating
                  </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="account-teams" className="space-y-4">
          {isLoadingAccountTeams ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : filteredTeams(accountTeams).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams(accountTeams).map(team => renderTeamCard(team))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No teams with account access</h3>
                  <p className="text-muted-foreground mt-2">
                    No teams have been granted access to this account yet
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {isLoadingInvitations ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : invitations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invitations.map(invitation => renderInvitationCard(invitation))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No pending invitations</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any team invitations at the moment
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Team Dialog */}
      <TeamCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Team Details Dialog */}
      {selectedTeam && (
        <TeamDetailsDialog
          team={selectedTeam}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  )
}