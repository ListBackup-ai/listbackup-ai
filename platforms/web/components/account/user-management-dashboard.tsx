'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  AlertCircle,
  Check,
  X,
  Search,
  Filter,
  Download,
  Clock,
  Building2,
  UserCog,
  UserCheck,
  UserX
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'
import { format } from 'date-fns'
import { UserInvitationForm } from './user-invitation-form'
import { PendingInvitations } from './pending-invitations'

interface UserManagementDashboardProps {
  accountId: string
}

const roleConfigs = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-800', icon: Shield },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: UserCog },
  member: { label: 'Member', color: 'bg-green-100 text-green-800', icon: UserCheck },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-800', icon: UserX },
}

const statusConfigs = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
}

export function UserManagementDashboard({ accountId }: UserManagementDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('users')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch users for this account
  const { data: users, isLoading } = useQuery({
    queryKey: ['account-users', accountId],
    queryFn: () => Promise.resolve([]),
  })

  // Fetch pending invitations
  const { data: invitations } = useQuery({
    queryKey: ['account-invitations', accountId],
    queryFn: () => Promise.resolve([]),
  })

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      Promise.resolve(),
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['account-users', accountId] })
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    },
  })

  // Remove user from account
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) =>
      Promise.resolve(),
    onSuccess: () => {
      toast({
        title: 'User removed',
        description: 'User has been removed from the account',
      })
      queryClient.invalidateQueries({ queryKey: ['account-users', accountId] })
    },
    onError: () => {
      toast({
        title: 'Remove failed',
        description: 'Failed to remove user',
        variant: 'destructive',
      })
    },
  })

  // Filter users
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u: any) => u.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u: any) => u.role === 'admin' || u.role === 'owner').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Can manage account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Manage users who have access to this account
                  </CardDescription>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(roleConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Users Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user: any) => {
                        const roleConfig = roleConfigs[user.role as keyof typeof roleConfigs]
                        const statusConfig = statusConfigs[user.status as keyof typeof statusConfigs]
                        const RoleIcon = roleConfig?.icon

                        return (
                          <TableRow key={user.userId}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {RoleIcon && <RoleIcon className="h-4 w-4" />}
                                <Badge className={cn(roleConfig?.color || '')}>
                                  {roleConfig?.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(statusConfig?.color || '')}>
                                {statusConfig?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.lastActive ? (
                                format(new Date(user.lastActive), 'PP')
                              ) : (
                                <span className="text-muted-foreground">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.joinedAt), 'PP')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Key className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to remove this user?')) {
                                        removeUserMutation.mutate(user.userId)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No users found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <div>Pending Invitations component</div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Understand what each role can do in your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(roleConfigs).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold">{config.label}</h3>
                        <Badge className={cn(config.color)}>
                          {users?.filter((u: any) => u.role === key).length || 0} users
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {getPermissionsForRole(key).map((permission) => (
                          <div key={permission} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new user to this account
            </DialogDescription>
          </DialogHeader>
          <div>User Invitation Form</div>        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => {
                    updateRoleMutation.mutate({ userId: selectedUser.userId, role: value })
                    setSelectedUser(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    owner: [
      'Full account access',
      'Manage billing',
      'Delete account',
      'Manage all users',
      'Create sub-accounts',
      'View all data',
    ],
    admin: [
      'Manage users',
      'Create sources',
      'Run backups',
      'View all data',
      'Export data',
      'Manage settings',
    ],
    member: [
      'Create sources',
      'Run backups',
      'View own data',
      'Export own data',
    ],
    viewer: [
      'View data',
      'View reports',
    ],
  }
  
  return permissions[role] || []
}