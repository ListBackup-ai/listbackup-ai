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
  Users, 
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
  UserMinus,
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
  Building,
  Calendar,
  MapPin,
  Target,
  Award,
  Star,
  GitBranch,
  Zap,
  MessageSquare,
  Phone,
  Video,
  Share2,
  Archive,
  RotateCcw
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface Team {
  teamId: string
  name: string
  description: string
  slug: string
  status: 'active' | 'inactive' | 'archived'
  visibility: 'public' | 'private' | 'restricted'
  createdAt: string
  updatedAt: string
  settings: {
    defaultRole: string
    requireApproval: boolean
    allowInvitations: boolean
    maxMembers: number
    features: string[]
  }
  statistics: {
    memberCount: number
    sourceCount: number
    jobCount: number
    dataSize: number
    lastActivity: string
  }
  members: TeamMember[]
  projects: TeamProject[]
  metadata: {
    tags: string[]
    department?: string
    location?: string
    budget?: number
  }
}

interface TeamMember {
  userId: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
  permissions: string[]
  joinedAt: string
  lastActivity: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  invitedBy?: string
  contribution: {
    sourcesCreated: number
    jobsExecuted: number
    dataProcessed: number
    collaborations: number
  }
}

interface TeamProject {
  projectId: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: string
  endDate?: string
  progress: number
  assignedMembers: string[]
  resources: {
    sources: string[]
    budgetUsed: number
    budgetTotal: number
  }
}

interface TeamInvitation {
  invitationId: string
  teamId: string
  email: string
  role: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  message?: string
}

interface TeamActivity {
  activityId: string
  teamId: string
  userId: string
  action: string
  resource: string
  details: string
  timestamp: string
  metadata: Record<string, any>
}

export default function TeamManagementPage() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'manage'],
    queryFn: () => api.teams.list({ includeMembers: true, includeStats: true }),
  })

  const { data: teamInvitations = [] } = useQuery({
    queryKey: ['teams', 'invitations'],
    queryFn: () => api.teams.getInvitations(),
  })

  const { data: teamActivity = [] } = useQuery({
    queryKey: ['teams', 'activity'],
    queryFn: () => api.teams.getActivity(),
  })

  const { data: teamStats } = useQuery({
    queryKey: ['teams', 'stats'],
    queryFn: () => api.teams.getStats(),
  })

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (data: Partial<Team>) => api.teams.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setShowCreateDialog(false)
      toast({ title: 'Team created successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to create team', variant: 'destructive' })
    },
  })

  const updateTeamMutation = useMutation({
    mutationFn: (data: { teamId: string; updates: Partial<Team> }) =>
      api.teams.update(data.teamId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update team', variant: 'destructive' })
    },
  })

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { teamId: string; email: string; role: string; message?: string }) =>
      api.teams.inviteMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setShowInviteDialog(false)
      toast({ title: 'Member invitation sent successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to send member invitation', variant: 'destructive' })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (data: { teamId: string; userId: string }) =>
      api.teams.removeMember(data.teamId, data.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Member removed successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to remove member', variant: 'destructive' })
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: (data: { teamId: string; userId: string; role: string }) =>
      api.teams.updateMemberRole(data.teamId, data.userId, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Member role updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update member role', variant: 'destructive' })
    },
  })

  const archiveTeamMutation = useMutation({
    mutationFn: api.teams.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team archived successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to archive team', variant: 'destructive' })
    },
  })

  const deleteTeamMutation = useMutation({
    mutationFn: api.teams.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete team', variant: 'destructive' })
    },
  })

  // Table columns
  const teamColumns: ColumnDef<Team>[] = [
    {
      accessorKey: 'name',
      header: 'Team',
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{team.name}</div>
              <div className="text-sm text-muted-foreground">{team.slug}</div>
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
      accessorKey: 'visibility',
      header: 'Visibility',
      cell: ({ row }) => {
        const visibility = row.getValue('visibility') as string
        const colors = {
          public: 'bg-green-100 text-green-800 border-green-200',
          private: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          restricted: 'bg-red-100 text-red-800 border-red-200',
        }
        return (
          <Badge variant="secondary" className={colors[visibility as keyof typeof colors]}>
            {visibility}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'statistics.memberCount',
      header: 'Members',
      cell: ({ row }) => {
        const count = row.original.statistics.memberCount
        return <div className="text-center">{count}</div>
      },
    },
    {
      accessorKey: 'statistics.sourceCount',
      header: 'Sources',
      cell: ({ row }) => {
        const count = row.original.statistics.sourceCount
        return <div className="text-center">{count}</div>
      },
    },
    {
      accessorKey: 'statistics.lastActivity',
      header: 'Last Activity',
      cell: ({ row }) => {
        const date = row.original.statistics.lastActivity
        return <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTeam(team)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTeam(team)
                setShowInviteDialog(true)
              }}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            {team.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => archiveTeamMutation.mutate(team.teamId)}
                disabled={archiveTeamMutation.isPending}
                className="text-orange-600 hover:text-orange-700"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTeamMutation.mutate(team.teamId)}
              disabled={deleteTeamMutation.isPending}
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
      case 'archived':
        return <Archive className="h-4 w-4 text-orange-500" />
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
      case 'archived':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'manager':
        return <Star className="h-4 w-4 text-blue-600" />
      case 'member':
        return <Users className="h-4 w-4 text-green-600" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportTeams = (data: Team[]) => {
    const csv = [
      ['Name', 'Slug', 'Status', 'Visibility', 'Members', 'Sources', 'Created', 'Last Activity'],
      ...data.map(t => [
        t.name,
        t.slug,
        t.status,
        t.visibility,
        t.statistics.memberCount.toString(),
        t.statistics.sourceCount.toString(),
        t.createdAt,
        t.statistics.lastActivity
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teams.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTeams = teams.filter(team => {
    if (filterStatus !== 'all' && team.status !== filterStatus) return false
    if (filterVisibility !== 'all' && team.visibility !== filterVisibility) return false
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage teams, members, projects, and collaboration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            {viewMode === 'grid' ? <BarChart3 className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
                <p className="text-xs text-muted-foreground">
                  {teams.filter(t => t.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.reduce((sum, t) => sum + t.statistics.memberCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all teams
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.reduce((sum, t) => sum + t.projects.filter(p => p.status === 'active').length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Managed</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSize(teams.reduce((sum, t) => sum + t.statistics.dataSize, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total team data
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>Performance metrics for all teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.slice(0, 6).map((team) => (
                  <div key={team.teamId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.statistics.memberCount} members
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{team.statistics.sourceCount} sources</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(team.statistics.lastActivity), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Team Activity</CardTitle>
              <CardDescription>Latest team actions and collaborations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamActivity.slice(0, 8).map((activity) => {
                  const team = teams.find(t => t.teamId === activity.teamId)
                  const member = team?.members.find(m => m.userId === activity.userId)
                  return (
                    <div key={activity.activityId} className="flex items-start gap-3 p-3 border-l-2 border-green-200 bg-green-50/50 rounded-r">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={member?.avatar} alt={member?.displayName} />
                        <AvatarFallback>
                          {member?.firstName.charAt(0)}{member?.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{activity.details}</div>
                        <div className="text-xs text-muted-foreground">
                          {member?.displayName} • {team?.name} • {activity.resource}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
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
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>

            {(filterStatus !== 'all' || filterVisibility !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterVisibility('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={teamColumns}
              data={filteredTeams}
              onExport={exportTeams}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['teams'] })}
              isLoading={teamsLoading}
              title="Team Directory"
              description="Manage all teams and their configurations"
              enableBulkActions={true}
              onBulkDelete={(selectedTeams) => {
                Promise.all(selectedTeams.map(team => deleteTeamMutation.mutateAsync(team.teamId)))
                  .then(() => toast({ title: `${selectedTeams.length} teams deleted successfully` }))
                  .catch(() => toast({ title: 'Failed to delete some teams', variant: 'destructive' }))
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <Card key={team.teamId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <CardDescription>{team.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(team.status)}
                        <Badge variant="secondary" className={
                          team.visibility === 'public' ? 'bg-green-100 text-green-800' :
                          team.visibility === 'private' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {team.visibility}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Members */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getStatusColor(team.status)}>
                        {team.status}
                      </Badge>
                      <div className="text-sm font-medium">
                        {team.statistics.memberCount} member{team.statistics.memberCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{team.statistics.sourceCount}</p>
                        <p className="text-xs text-muted-foreground">Sources</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{team.projects.length}</p>
                        <p className="text-xs text-muted-foreground">Projects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatSize(team.statistics.dataSize)}</p>
                        <p className="text-xs text-muted-foreground">Data</p>
                      </div>
                    </div>

                    {/* Team Members Preview */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Members</div>
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 5).map((member) => (
                          <Avatar key={member.userId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={member.avatar} alt={member.displayName} />
                            <AvatarFallback className="text-xs">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{team.members.length - 5}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Projects */}
                    {team.projects.filter(p => p.status === 'active').length > 0 && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Target className="h-4 w-4" />
                          <span className="font-medium">
                            {team.projects.filter(p => p.status === 'active').length} active project(s)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Last Activity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Activity:</span>
                        <span>{formatDistanceToNow(new Date(team.statistics.lastActivity), { addSuffix: true })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeam(team)
                          setShowInviteDialog(true)
                        }}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeam(team)
                          setShowProjectDialog(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>All members across all teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.flatMap(team => 
                  team.members.map(member => ({
                    ...member,
                    teamName: team.name,
                    teamId: team.teamId
                  }))
                ).slice(0, 20).map((member) => (
                  <div key={`${member.teamId}-${member.userId}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.displayName} />
                        <AvatarFallback>
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.displayName}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">{member.teamName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          <span className="text-sm font-medium capitalize">{member.role}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant="secondary" className={
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Projects</CardTitle>
              <CardDescription>All projects across all teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.flatMap(team => 
                  team.projects.map(project => ({
                    ...project,
                    teamName: team.name,
                    teamId: team.teamId
                  }))
                ).map((project) => (
                  <Card key={project.projectId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>{project.teamName}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getProjectStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Started:</span>
                          <span>{format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                        {project.endDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">End Date:</span>
                            <span>{format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {/* Team Members */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Team ({project.assignedMembers.length})</div>
                        <div className="flex -space-x-2">
                          {project.assignedMembers.slice(0, 4).map((memberId, index) => {
                            const team = teams.find(t => t.teamId === project.teamId)
                            const member = team?.members.find(m => m.userId === memberId)
                            return (
                              <Avatar key={memberId} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={member?.avatar} alt={member?.displayName} />
                                <AvatarFallback className="text-xs">
                                  {member?.firstName.charAt(0)}{member?.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })}
                          {project.assignedMembers.length > 4 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">+{project.assignedMembers.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{project.resources.sources.length}</p>
                          <p className="text-xs text-muted-foreground">Sources</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">
                            ${project.resources.budgetUsed.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            / ${project.resources.budgetTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">Average team productivity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Project Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.flatMap(t => t.projects).length > 0 ? 
                    Math.round(
                      teams.flatMap(t => t.projects).filter(p => p.status === 'completed').length / 
                      teams.flatMap(t => t.projects).length * 100
                    ) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Completed projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Team Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.length > 0 ? 
                    Math.round(teams.reduce((sum, t) => sum + t.statistics.memberCount, 0) / teams.length) : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">Members per team</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collaboration Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.7</div>
                <p className="text-xs text-muted-foreground">Out of 10</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Performance Analytics</CardTitle>
              <CardDescription>Detailed team metrics and collaboration insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team analytics charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Details Dialog */}
      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                {selectedTeam.name}
              </DialogTitle>
              <DialogDescription>
                Team details, members, and project information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Team ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedTeam.teamId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTeam.teamId)
                        toast({ title: 'Team ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Slug</Label>
                  <div className="text-sm">{selectedTeam.slug}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedTeam.status)}>
                    {selectedTeam.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Visibility</Label>
                  <Badge variant="secondary" className={
                    selectedTeam.visibility === 'public' ? 'bg-green-100 text-green-800' :
                    selectedTeam.visibility === 'private' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {selectedTeam.visibility}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {selectedTeam.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="text-sm">{selectedTeam.description}</div>
                </div>
              )}

              {/* Team Members */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Team Members ({selectedTeam.members.length})
                </Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTeam.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.displayName} />
                          <AvatarFallback>
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.displayName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                          </div>
                        </div>
                        <Badge variant="secondary" className={
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {selectedTeam.projects.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Projects ({selectedTeam.projects.length})
                  </Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedTeam.projects.map((project) => (
                      <div key={project.projectId} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium">{project.name}</div>
                          <Badge variant="secondary" className={getProjectStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedTeam.statistics.memberCount}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedTeam.statistics.sourceCount}</div>
                    <div className="text-xs text-muted-foreground">Sources</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedTeam.projects.length}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{formatSize(selectedTeam.statistics.dataSize)}</div>
                    <div className="text-xs text-muted-foreground">Data Size</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedTeam.metadata.tags.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Set up a new team for collaboration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" placeholder="Engineering Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSlug">Team Slug</Label>
              <Input id="teamSlug" placeholder="engineering-team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamDescription">Description</Label>
              <Textarea 
                id="teamDescription" 
                placeholder="This team handles all engineering projects and infrastructure..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite someone to join {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email Address</Label>
              <Input id="memberEmail" type="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteMessage">Personal Message (Optional)</Label>
              <Textarea 
                id="inviteMessage" 
                placeholder="Welcome to our team! We're excited to have you join us."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowInviteDialog(false)}>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}