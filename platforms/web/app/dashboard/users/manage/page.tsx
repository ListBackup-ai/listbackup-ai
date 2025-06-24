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
  Phone,
  Calendar,
  MapPin,
  Building,
  Crown,
  Ban,
  Unlock,
  Lock,
  RotateCcw,
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
  Smartphone,
  Laptop,
  Tablet,
  Monitor
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'

// Types
interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'invited'
  role: 'admin' | 'manager' | 'user' | 'viewer' | 'owner'
  permissions: string[]
  accountId: string
  accountName: string
  createdAt: string
  lastLoginAt?: string
  lastActivityAt?: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  profile: {
    phone?: string
    timezone: string
    language: string
    location?: string
    company?: string
    department?: string
    jobTitle?: string
    bio?: string
  }
  preferences: {
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
      marketing: boolean
    }
    theme: 'light' | 'dark' | 'system'
    dateFormat: string
    timeFormat: '12h' | '24h'
  }
  statistics: {
    loginCount: number
    sessionCount: number
    sourcesCreated: number
    jobsExecuted: number
    dataBackedUp: number
    lastLoginIP?: string
    lastLoginDevice?: string
  }
  security: {
    failedLoginAttempts: number
    lastPasswordChange: string
    sessions: UserSession[]
    loginHistory: LoginAttempt[]
  }
}

interface UserSession {
  sessionId: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  ipAddress: string
  location: string
  createdAt: string
  lastActivity: string
  isActive: boolean
}

interface LoginAttempt {
  timestamp: string
  ipAddress: string
  location: string
  userAgent: string
  success: boolean
  failureReason?: string
}

interface UserActivity {
  activityId: string
  userId: string
  action: string
  resource: string
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
  metadata: Record<string, any>
}

interface UserInvitation {
  invitationId: string
  email: string
  role: string
  accountId: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  message?: string
}

export default function UserManagementPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedActivity, setSelectedActivity] = useState<UserActivity[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'manage'],
    queryFn: () => api.users.list({ includeStats: true, includeProfile: true }),
  })

  const { data: userActivity = [] } = useQuery({
    queryKey: ['users', 'activity'],
    queryFn: () => api.users.getActivity(),
  })

  const { data: userInvitations = [] } = useQuery({
    queryKey: ['users', 'invitations'],
    queryFn: () => api.users.getInvitations(),
  })

  const { data: userStats } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => api.users.getStats(),
  })

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: (data: { email: string; role: string; message?: string }) =>
      api.users.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowInviteDialog(false)
      toast({ title: 'User invitation sent successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to send user invitation', variant: 'destructive' })
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: (data: { userId: string; updates: Partial<User> }) =>
      api.users.update(data.userId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditDialog(false)
      toast({ title: 'User updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update user', variant: 'destructive' })
    },
  })

  const suspendUserMutation = useMutation({
    mutationFn: api.users.suspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'User suspended successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to suspend user', variant: 'destructive' })
    },
  })

  const unsuspendUserMutation = useMutation({
    mutationFn: api.users.unsuspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'User unsuspended successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to unsuspend user', variant: 'destructive' })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'User deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete user', variant: 'destructive' })
    },
  })

  const resendInvitationMutation = useMutation({
    mutationFn: api.users.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Invitation resent successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to resend invitation', variant: 'destructive' })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: api.users.resetPassword,
    onSuccess: () => {
      toast({ title: 'Password reset email sent successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to send password reset email', variant: 'destructive' })
    },
  })

  // Table columns
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: 'displayName',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.displayName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        const colors = {
          owner: 'bg-purple-100 text-purple-800 border-purple-200',
          admin: 'bg-red-100 text-red-800 border-red-200',
          manager: 'bg-blue-100 text-blue-800 border-blue-200',
          user: 'bg-green-100 text-green-800 border-green-200',
          viewer: 'bg-gray-100 text-gray-800 border-gray-200',
        }
        return (
          <Badge variant="secondary" className={colors[role as keyof typeof colors]}>
            {role}
          </Badge>
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
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => {
        const date = row.getValue('lastLoginAt') as string
        return date ? (
          <div className="text-sm">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Never</div>
        )
      },
    },
    {
      accessorKey: 'statistics.loginCount',
      header: 'Logins',
      cell: ({ row }) => {
        const count = row.original.statistics.loginCount
        return <div className="text-center">{count.toLocaleString()}</div>
      },
    },
    {
      accessorKey: 'twoFactorEnabled',
      header: '2FA',
      cell: ({ row }) => {
        const enabled = row.getValue('twoFactorEnabled') as boolean
        return enabled ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(user)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewUserActivity(user.userId)}
            >
              <Activity className="h-4 w-4" />
            </Button>
            {user.status === 'active' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => suspendUserMutation.mutate(user.userId)}
                disabled={suspendUserMutation.isPending}
                className="text-orange-600 hover:text-orange-700"
              >
                <Ban className="h-4 w-4" />
              </Button>
            ) : user.status === 'suspended' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => unsuspendUserMutation.mutate(user.userId)}
                disabled={unsuspendUserMutation.isPending}
                className="text-green-600 hover:text-green-700"
              >
                <Unlock className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteUserMutation.mutate(user.userId)}
              disabled={deleteUserMutation.isPending}
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
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'invited':
        return <Mail className="h-4 w-4 text-blue-500" />
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'invited':
        return 'bg-blue-100 text-blue-800 border-blue-200'
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
        return <Users className="h-4 w-4 text-blue-600" />
      case 'user':
        return <Users className="h-4 w-4 text-green-600" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

  const viewUserActivity = async (userId: string) => {
    try {
      const activity = await api.users.getUserActivity(userId)
      setSelectedActivity(activity)
      setShowActivityDialog(true)
    } catch (error) {
      toast({ title: 'Failed to load user activity', variant: 'destructive' })
    }
  }

  const exportUsers = (data: User[]) => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Login Count', '2FA Enabled', 'Created'],
      ...data.map(u => [
        u.displayName,
        u.email,
        u.role,
        u.status,
        u.lastLoginAt || '',
        u.statistics.loginCount.toString(),
        u.twoFactorEnabled ? 'Yes' : 'No',
        u.createdAt
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredUsers = users.filter(user => {
    if (filterStatus !== 'all' && user.status !== filterStatus) return false
    if (filterRole !== 'all' && user.role !== filterRole) return false
    return true
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, permissions, and monitor activity
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
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.filter(u => u.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, u) => sum + u.statistics.sessionCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">2FA Adoption</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.length > 0 ? 
                    Math.round((users.filter(u => u.twoFactorEnabled).length / users.length) * 100) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Users with 2FA enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userInvitations.filter(i => i.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.slice(0, 8).map((activity) => {
                  const user = users.find(u => u.userId === activity.userId)
                  return (
                    <div key={activity.activityId} className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded-r">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={user?.avatar} alt={user?.displayName} />
                        <AvatarFallback>
                          {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
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
                          {user?.displayName} • {activity.resource}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {['owner', 'admin', 'manager', 'user', 'viewer'].map((role) => {
                  const count = users.filter(u => u.role === role).length
                  const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0
                  return (
                    <div key={role} className="text-center p-3 border rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        {getRoleIcon(role)}
                      </div>
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">{role}s</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            {(filterStatus !== 'all' || filterRole !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterRole('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {viewMode === 'table' ? (
            <AdvancedDataTable
              columns={userColumns}
              data={filteredUsers}
              onExport={exportUsers}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              isLoading={usersLoading}
              title="User Directory"
              description="Manage all user accounts and their access levels"
              enableBulkActions={true}
              onBulkDelete={(selectedUsers) => {
                Promise.all(selectedUsers.map(user => deleteUserMutation.mutateAsync(user.userId)))
                  .then(() => toast({ title: `${selectedUsers.length} users deleted successfully` }))
                  .catch(() => toast({ title: 'Failed to delete some users', variant: 'destructive' }))
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                <Card key={user.userId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar} alt={user.displayName} />
                          <AvatarFallback>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{user.displayName}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                          {user.profile.jobTitle && (
                            <div className="text-xs text-muted-foreground">{user.profile.jobTitle}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.status)}
                        {getRoleIcon(user.role)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status and Role */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Badge variant="secondary" className={
                        user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {user.role}
                      </Badge>
                    </div>

                    {/* Security Status */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className={`text-sm font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                          {user.emailVerified ? '✓' : '✗'}
                        </div>
                        <div className="text-xs text-muted-foreground">Email</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${user.phoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                          {user.phoneVerified ? '✓' : '✗'}
                        </div>
                        <div className="text-xs text-muted-foreground">Phone</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${user.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                          {user.twoFactorEnabled ? '✓' : '✗'}
                        </div>
                        <div className="text-xs text-muted-foreground">2FA</div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Logins:</span>
                        <span>{user.statistics.loginCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Login:</span>
                        <span>
                          {user.lastLoginAt ? 
                            formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true }) : 
                            'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sources:</span>
                        <span>{user.statistics.sourcesCreated}</span>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    {user.security.sessions.filter(s => s.isActive).length > 0 && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-green-800">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">
                            {user.security.sessions.filter(s => s.isActive).length} active session(s)
                          </span>
                        </div>
                        <div className="text-green-700 mt-1 text-xs">
                          Last activity: {formatDistanceToNow(new Date(user.lastActivityAt || user.lastLoginAt || ''), { addSuffix: true })}
                        </div>
                      </div>
                    )}

                    {/* Security Alerts */}
                    {user.security.failedLoginAttempts > 0 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{user.security.failedLoginAttempts} failed login attempts</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewUserActivity(user.userId)}
                      >
                        <Activity className="h-3 w-3" />
                      </Button>
                      {user.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suspendUserMutation.mutate(user.userId)}
                          disabled={suspendUserMutation.isPending}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                      {user.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unsuspendUserMutation.mutate(user.userId)}
                          disabled={unsuspendUserMutation.isPending}
                        >
                          <Unlock className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Invitations</CardTitle>
              <CardDescription>Manage pending and sent user invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userInvitations.map((invitation) => (
                  <div key={invitation.invitationId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Role: {invitation.role} • Invited {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={
                        invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        invitation.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {invitation.status}
                      </Badge>
                      {invitation.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitationMutation.mutate(invitation.invitationId)}
                          disabled={resendInvitationMutation.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Resend
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {userInvitations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No invitations sent yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <CardDescription>Complete audit trail of user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.slice(0, 20).map((activity) => {
                  const user = users.find(u => u.userId === activity.userId)
                  return (
                    <div key={activity.activityId} className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded-r">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={user?.avatar} alt={user?.displayName} />
                        <AvatarFallback>
                          {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
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
                          {user?.displayName} • {activity.resource} • {activity.ipAddress}
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            {JSON.stringify(activity.metadata, null, 2).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, u) => sum + u.statistics.loginCount, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All time logins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4h</div>
                <p className="text-xs text-muted-foreground">Average session time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.length > 0 ? 
                    Math.round(
                      users.filter(u => u.twoFactorEnabled && u.emailVerified).length / users.length * 100
                    ) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">Users with strong security</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, u) => sum + u.security.failedLoginAttempts, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total failed attempts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>User activity and engagement analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Engagement charts will be implemented with charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.displayName} />
                  <AvatarFallback>
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {selectedUser.displayName}
              </DialogTitle>
              <DialogDescription>
                Complete user profile and account information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User ID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{selectedUser.userId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.userId)
                        toast({ title: 'User ID copied to clipboard' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm">{selectedUser.email}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge variant="secondary" className={
                    selectedUser.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary" className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>

              {/* Profile Information */}
              {selectedUser.profile && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Profile Information</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedUser.profile.phone && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Phone</div>
                        <div className="text-sm">{selectedUser.profile.phone}</div>
                      </div>
                    )}
                    {selectedUser.profile.company && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Company</div>
                        <div className="text-sm">{selectedUser.profile.company}</div>
                      </div>
                    )}
                    {selectedUser.profile.jobTitle && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Job Title</div>
                        <div className="text-sm">{selectedUser.profile.jobTitle}</div>
                      </div>
                    )}
                    {selectedUser.profile.location && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm">{selectedUser.profile.location}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Information */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Security Status</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-3 border rounded-lg text-center">
                    <div className={`text-lg font-semibold ${selectedUser.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.emailVerified ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-muted-foreground">Email Verified</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className={`text-lg font-semibold ${selectedUser.phoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.phoneVerified ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-muted-foreground">Phone Verified</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className={`text-lg font-semibold ${selectedUser.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.twoFactorEnabled ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-muted-foreground">2FA Enabled</div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              {selectedUser.security.sessions.filter(s => s.isActive).length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Active Sessions</Label>
                  <div className="space-y-2">
                    {selectedUser.security.sessions.filter(s => s.isActive).map((session) => (
                      <div key={session.sessionId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div>
                            <div className="font-medium">{session.browser} on {session.os}</div>
                            <div className="text-sm text-muted-foreground">
                              {session.location} • {session.ipAddress}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Usage Statistics</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedUser.statistics.loginCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Logins</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedUser.statistics.sourcesCreated}</div>
                    <div className="text-xs text-muted-foreground">Sources Created</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">{selectedUser.statistics.jobsExecuted}</div>
                    <div className="text-xs text-muted-foreground">Jobs Executed</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-lg font-semibold">
                      {(selectedUser.statistics.dataBackedUp / 1024 / 1024 / 1024).toFixed(1)}GB
                    </div>
                    <div className="text-xs text-muted-foreground">Data Backed Up</div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedUser.permissions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* User Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Detailed activity log for selected user
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            <div className="space-y-4">
              {selectedActivity.map((activity) => (
                <div key={activity.activityId} className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded-r">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-1">
                    <Activity className="h-4 w-4 text-blue-600" />
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

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea 
                id="message" 
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