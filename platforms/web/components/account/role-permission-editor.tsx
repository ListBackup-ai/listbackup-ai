'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Users, 
  Settings, 
  Database, 
  Key, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Copy, 
  MoreVertical,
  Save,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Info,
  Building,
  FileText,
  Globe,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { cn } from '@listbackup/shared/utils'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  level: 'read' | 'write' | 'admin' | 'owner'
  critical?: boolean
  dependencies?: string[]
}

interface Role {
  roleId: string
  name: string
  description: string
  permissions: string[]
  isBuiltIn: boolean
  isActive: boolean
  userCount: number
  createdAt: string
  updatedAt: string
  accountId: string
}

interface RoleTemplate {
  templateId: string
  name: string
  description: string
  industry?: string
  permissions: string[]
  isPopular: boolean
}

interface RolePermissionEditorProps {
  accountId?: string
  className?: string
}

const permissionCategories = [
  {
    id: 'account',
    name: 'Account Management',
    icon: Building,
    description: 'Manage account settings, billing, and structure'
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    description: 'Invite, manage, and remove users'
  },
  {
    id: 'data',
    name: 'Data Access',
    icon: Database,
    description: 'View, export, and manage data'
  },
  {
    id: 'sources',
    name: 'Source Management',
    icon: Globe,
    description: 'Create and manage data sources'
  },
  {
    id: 'jobs',
    name: 'Job Management',
    icon: Settings,
    description: 'Create and manage backup jobs'
  },
  {
    id: 'reports',
    name: 'Reporting',
    icon: FileText,
    description: 'Generate and view reports'
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Manage security settings and access'
  }
]

const defaultPermissions: Permission[] = [
  // Account Management
  { id: 'account.view', name: 'View Account', description: 'View account information and settings', category: 'account', level: 'read' },
  { id: 'account.edit', name: 'Edit Account', description: 'Modify account settings and information', category: 'account', level: 'write', dependencies: ['account.view'] },
  { id: 'account.billing', name: 'Manage Billing', description: 'View and modify billing information', category: 'account', level: 'admin', critical: true },
  { id: 'account.delete', name: 'Delete Account', description: 'Delete the account permanently', category: 'account', level: 'owner', critical: true },
  { id: 'account.subaccounts.create', name: 'Create Sub-Accounts', description: 'Create new sub-accounts', category: 'account', level: 'admin' },
  { id: 'account.subaccounts.manage', name: 'Manage Sub-Accounts', description: 'Edit and delete sub-accounts', category: 'account', level: 'admin' },

  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user list and profiles', category: 'users', level: 'read' },
  { id: 'users.invite', name: 'Invite Users', description: 'Send invitations to new users', category: 'users', level: 'write', dependencies: ['users.view'] },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user roles and permissions', category: 'users', level: 'admin', dependencies: ['users.view'] },
  { id: 'users.remove', name: 'Remove Users', description: 'Remove users from the account', category: 'users', level: 'admin', critical: true },
  { id: 'users.roles.manage', name: 'Manage Roles', description: 'Create and modify user roles', category: 'users', level: 'admin' },

  // Data Access
  { id: 'data.view', name: 'View Data', description: 'View backed up data and reports', category: 'data', level: 'read' },
  { id: 'data.export', name: 'Export Data', description: 'Download and export data', category: 'data', level: 'write', dependencies: ['data.view'] },
  { id: 'data.delete', name: 'Delete Data', description: 'Delete backed up data', category: 'data', level: 'admin', critical: true },
  { id: 'data.restore', name: 'Restore Data', description: 'Restore data to original platforms', category: 'data', level: 'admin' },

  // Source Management
  { id: 'sources.view', name: 'View Sources', description: 'View connected data sources', category: 'sources', level: 'read' },
  { id: 'sources.create', name: 'Create Sources', description: 'Connect new data sources', category: 'sources', level: 'write' },
  { id: 'sources.edit', name: 'Edit Sources', description: 'Modify source configurations', category: 'sources', level: 'write', dependencies: ['sources.view'] },
  { id: 'sources.delete', name: 'Delete Sources', description: 'Remove data source connections', category: 'sources', level: 'admin', critical: true },
  { id: 'sources.test', name: 'Test Sources', description: 'Test source connections and credentials', category: 'sources', level: 'write' },

  // Job Management
  { id: 'jobs.view', name: 'View Jobs', description: 'View backup jobs and their status', category: 'jobs', level: 'read' },
  { id: 'jobs.create', name: 'Create Jobs', description: 'Create new backup jobs', category: 'jobs', level: 'write' },
  { id: 'jobs.edit', name: 'Edit Jobs', description: 'Modify job configurations', category: 'jobs', level: 'write', dependencies: ['jobs.view'] },
  { id: 'jobs.delete', name: 'Delete Jobs', description: 'Delete backup jobs', category: 'jobs', level: 'admin' },
  { id: 'jobs.run', name: 'Run Jobs', description: 'Manually trigger backup jobs', category: 'jobs', level: 'write' },

  // Reporting
  { id: 'reports.view', name: 'View Reports', description: 'View analytics and reports', category: 'reports', level: 'read' },
  { id: 'reports.create', name: 'Create Reports', description: 'Generate custom reports', category: 'reports', level: 'write' },
  { id: 'reports.export', name: 'Export Reports', description: 'Download report data', category: 'reports', level: 'write' },
  { id: 'reports.schedule', name: 'Schedule Reports', description: 'Schedule automated report generation', category: 'reports', level: 'admin' },

  // Security
  { id: 'security.view', name: 'View Security', description: 'View security settings and logs', category: 'security', level: 'read' },
  { id: 'security.audit', name: 'View Audit Logs', description: 'Access detailed audit logs', category: 'security', level: 'admin' },
  { id: 'security.settings', name: 'Manage Security', description: 'Configure security settings', category: 'security', level: 'admin', critical: true },
  { id: 'security.2fa', name: 'Enforce 2FA', description: 'Require two-factor authentication', category: 'security', level: 'admin' },
]

const builtInRoles: Role[] = [
  {
    roleId: 'owner',
    name: 'Owner',
    description: 'Full access to all features and settings',
    permissions: defaultPermissions.map(p => p.id),
    isBuiltIn: true,
    isActive: true,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: ''
  },
  {
    roleId: 'admin',
    name: 'Administrator',
    description: 'Administrative access without billing and account deletion',
    permissions: defaultPermissions.filter(p => !['account.billing', 'account.delete'].includes(p.id)).map(p => p.id),
    isBuiltIn: true,
    isActive: true,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: ''
  },
  {
    roleId: 'manager',
    name: 'Manager',
    description: 'Can manage data and sources, view reports',
    permissions: defaultPermissions.filter(p => 
      ['read', 'write'].includes(p.level) && 
      !['users.remove', 'sources.delete', 'data.delete'].includes(p.id)
    ).map(p => p.id),
    isBuiltIn: true,
    isActive: true,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: ''
  },
  {
    roleId: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to data and reports',
    permissions: defaultPermissions.filter(p => p.level === 'read').map(p => p.id),
    isBuiltIn: true,
    isActive: true,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: ''
  }
]

export function RolePermissionEditor({ accountId, className }: RolePermissionEditorProps) {
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['account', 'users']))
  const [searchQuery, setSearchQuery] = useState('')
  
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()
  const queryClient = useQueryClient()

  const finalAccountId = accountId || currentAccount?.accountId

  // Fetch roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', finalAccountId],
    queryFn: () => Promise.resolve({ roles: builtInRoles }),
    enabled: !!finalAccountId
  })

  // Fetch role templates
  const { data: templatesData } = useQuery({
    queryKey: ['role-templates'],
    queryFn: () => Promise.resolve({ templates: [] as RoleTemplate[] })
  })

  const roles = rolesData?.roles || []
  const templates = templatesData?.templates || []

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: Partial<Role>) => Promise.resolve(roleData as Role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', finalAccountId] })
      toast({
        title: 'Role created',
        description: 'New role has been created successfully.',
      })
      setShowCreateDialog(false)
    },
    onError: () => {
      toast({
        title: 'Creation failed',
        description: 'Failed to create role',
        variant: 'destructive',
      })
    }
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: Partial<Role> }) => 
      Promise.resolve({ ...data, roleId } as Role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', finalAccountId] })
      toast({
        title: 'Role updated',
        description: 'Role has been updated successfully.',
      })
      setEditingRole(null)
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update role',
        variant: 'destructive',
      })
    }
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', finalAccountId] })
      toast({
        title: 'Role deleted',
        description: 'Role has been deleted successfully.',
      })
      setSelectedRole(null)
    },
    onError: () => {
      toast({
        title: 'Deletion failed',
        description: 'Failed to delete role',
        variant: 'destructive',
      })
    }
  })

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const getPermissionsByCategory = (categoryId: string) => {
    return defaultPermissions.filter(p => p.category === categoryId)
  }

  const hasPermission = (role: Role, permissionId: string) => {
    return role.permissions.includes(permissionId)
  }

  const togglePermission = (role: Role, permissionId: string) => {
    if (!editingRole) return

    const permission = defaultPermissions.find(p => p.id === permissionId)
    if (!permission) return

    let newPermissions = [...editingRole.permissions]

    if (newPermissions.includes(permissionId)) {
      // Remove permission and any that depend on it
      const dependentPermissions = defaultPermissions.filter(p => 
        p.dependencies?.includes(permissionId)
      )
      newPermissions = newPermissions.filter(id => 
        id !== permissionId && !dependentPermissions.some(dp => dp.id === id)
      )
    } else {
      // Add permission and its dependencies
      const dependencies = permission.dependencies || []
      newPermissions = [...new Set([...newPermissions, permissionId, ...dependencies])]
    }

    setEditingRole({
      ...editingRole,
      permissions: newPermissions
    })
  }

  const getPermissionLevel = (permissionId: string) => {
    const permission = defaultPermissions.find(p => p.id === permissionId)
    return permission?.level || 'read'
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'read': return 'bg-green-100 text-green-800'
      case 'write': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-orange-100 text-orange-800'
      case 'owner': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRoles = roles.filter(role =>
    !searchQuery || 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!finalAccountId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Please select an account to manage roles</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage user roles and their permissions for {currentAccount?.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Roles List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Roles</h3>
              {isLoadingRoles ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoles.map((role) => (
                    <Card 
                      key={role.roleId}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedRole?.roleId === role.roleId && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedRole(role)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{role.name}</h4>
                              {role.isBuiltIn && (
                                <Badge variant="secondary" className="text-xs">
                                  Built-in
                                </Badge>
                              )}
                              {!role.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {role.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {role.permissions.length} permissions
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {role.userCount} users
                              </span>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingRole({ ...role })
                                setSelectedRole(role)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                // Copy role logic
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Role
                              </DropdownMenuItem>
                              {!role.isBuiltIn && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteRoleMutation.mutate(role.roleId)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Role
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Role Details */}
            <div>
              {selectedRole ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {editingRole ? (
                            <Input
                              value={editingRole.name}
                              onChange={(e) => setEditingRole({
                                ...editingRole,
                                name: e.target.value
                              })}
                              className="h-8 text-lg font-semibold"
                            />
                          ) : (
                            selectedRole.name
                          )}
                          {selectedRole.isBuiltIn && (
                            <Badge variant="secondary" className="text-xs">
                              Built-in
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {editingRole ? (
                            <Textarea
                              value={editingRole.description}
                              onChange={(e) => setEditingRole({
                                ...editingRole,
                                description: e.target.value
                              })}
                              className="mt-1"
                              rows={2}
                            />
                          ) : (
                            selectedRole.description
                          )}
                        </CardDescription>
                      </div>
                      
                      {editingRole ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              updateRoleMutation.mutate({
                                roleId: editingRole.roleId,
                                data: editingRole
                              })
                            }}
                            disabled={updateRoleMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingRole(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingRole({ ...selectedRole })}
                          disabled={selectedRole.isBuiltIn}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Role Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Users</Label>
                          <p className="text-2xl font-bold">{selectedRole.userCount}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Permissions</Label>
                          <p className="text-2xl font-bold">{selectedRole.permissions.length}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Permissions by Category */}
                      <div>
                        <Label className="text-sm font-medium">Permissions</Label>
                        <div className="mt-2 space-y-2">
                          {permissionCategories.map((category) => {
                            const categoryPermissions = getPermissionsByCategory(category.id)
                            const grantedPermissions = categoryPermissions.filter(p => 
                              hasPermission(editingRole || selectedRole, p.id)
                            )
                            const isExpanded = expandedCategories.has(category.id)

                            return (
                              <div key={category.id} className="border rounded-lg">
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <category.icon className="h-4 w-4" />
                                    <span className="font-medium text-sm">{category.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {grantedPermissions.length}/{categoryPermissions.length}
                                    </Badge>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                
                                {isExpanded && (
                                  <div className="border-t p-3 space-y-2">
                                    {categoryPermissions.map((permission) => {
                                      const isGranted = hasPermission(editingRole || selectedRole, permission.id)
                                      const isDisabled = !editingRole || selectedRole.isBuiltIn
                                      
                                      return (
                                        <div 
                                          key={permission.id}
                                          className="flex items-center justify-between p-2 rounded hover:bg-muted/30"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium">
                                                {permission.name}
                                              </span>
                                              <Badge 
                                                variant="outline" 
                                                className={cn("text-xs", getLevelColor(permission.level))}
                                              >
                                                {permission.level}
                                              </Badge>
                                              {permission.critical && (
                                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                              )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              {permission.description}
                                            </p>
                                          </div>
                                          
                                          <Switch
                                            checked={isGranted}
                                            onCheckedChange={() => togglePermission(editingRole || selectedRole, permission.id)}
                                            disabled={isDisabled}
                                            className="ml-2"
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a role to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Permissions</CardTitle>
              <CardDescription>
                Complete list of available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionCategories.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category.id)
                  const isExpanded = expandedCategories.has(category.id)

                  return (
                    <div key={category.id} className="border rounded-lg">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <category.icon className="h-5 w-5" />
                          <div className="text-left">
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {categoryPermissions.length} permissions
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t">
                          <div className="p-4 space-y-3">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{permission.name}</h4>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", getLevelColor(permission.level))}
                                    >
                                      {permission.level}
                                    </Badge>
                                    {permission.critical && (
                                      <Badge variant="destructive" className="text-xs">
                                        Critical
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {permission.description}
                                  </p>
                                  {permission.dependencies && permission.dependencies.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span>Requires:</span>
                                      {permission.dependencies.map((depId, index) => (
                                        <span key={depId}>
                                          {defaultPermissions.find(p => p.id === depId)?.name}
                                          {index < permission.dependencies!.length - 1 && ', '}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {permission.id}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Templates</CardTitle>
              <CardDescription>
                Pre-configured role templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Role templates coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <CreateRoleDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRoleCreated={(role) => {
          createRoleMutation.mutate(role)
        }}
        permissions={defaultPermissions}
        categories={permissionCategories}
      />
    </div>
  )
}

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleCreated: (role: Partial<Role>) => void
  permissions: Permission[]
  categories: typeof permissionCategories
}

function CreateRoleDialog({ 
  open, 
  onOpenChange, 
  onRoleCreated, 
  permissions, 
  categories 
}: CreateRoleDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['account']))

  const handleSubmit = () => {
    if (!name.trim()) return

    onRoleCreated({
      name: name.trim(),
      description: description.trim(),
      permissions: selectedPermissions,
      isBuiltIn: false,
      isActive: true,
      userCount: 0
    })

    // Reset form
    setName('')
    setDescription('')
    setSelectedPermissions([])
  }

  const togglePermission = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId)
    if (!permission) return

    let newPermissions = [...selectedPermissions]

    if (newPermissions.includes(permissionId)) {
      // Remove permission and any that depend on it
      const dependentPermissions = permissions.filter(p => 
        p.dependencies?.includes(permissionId)
      )
      newPermissions = newPermissions.filter(id => 
        id !== permissionId && !dependentPermissions.some(dp => dp.id === id)
      )
    } else {
      // Add permission and its dependencies
      const dependencies = permission.dependencies || []
      newPermissions = [...new Set([...newPermissions, permissionId, ...dependencies])]
    }

    setSelectedPermissions(newPermissions)
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a custom role with specific permissions for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Content Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role's responsibilities"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selectedPermissions.length})</Label>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {categories.map((category) => {
                const categoryPermissions = permissions.filter(p => p.category === category.id)
                const grantedPermissions = categoryPermissions.filter(p => 
                  selectedPermissions.includes(p.id)
                )
                const isExpanded = expandedCategories.has(category.id)

                return (
                  <div key={category.id} className="border-b last:border-b-0">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{category.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {grantedPermissions.length}/{categoryPermissions.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t p-3 space-y-2">
                        {categoryPermissions.map((permission) => {
                          const isGranted = selectedPermissions.includes(permission.id)
                          
                          return (
                            <div 
                              key={permission.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted/30"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {permission.name}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {permission.level}
                                  </Badge>
                                  {permission.critical && (
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                              
                              <Switch
                                checked={isGranted}
                                onCheckedChange={() => togglePermission(permission.id)}
                                className="ml-2"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}