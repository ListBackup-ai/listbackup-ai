'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Building2,
  Users,
  Settings,
  CreditCard,
  Shield,
  Activity,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Key,
  Lock,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building,
  Store,
  Briefcase,
  Factory,
  Home,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  PieChart,
  Database,
  HardDrive,
  Zap,
  Crown,
  Star
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@listbackup/shared/api'
import { format } from 'date-fns'
import { AccountBreadcrumb } from '@/components/account/account-breadcrumb'
import { AccountHierarchyTree } from '@/components/account/account-hierarchy-tree'
import { AccountSwitcher } from '@/components/account/account-switcher'
import { UserManagementDashboard } from '@/components/account/user-management-dashboard'
import { AccountManagementDashboard } from '@/components/account/account-management-dashboard'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

// Account type configurations
const accountTypeConfig = {
  conglomerate: {
    icon: Building2,
    label: 'Conglomerate',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Parent organization with multiple subsidiaries',
    badge: 'Enterprise',
    badgeColor: 'bg-purple-600'
  },
  subsidiary: {
    icon: Building,
    label: 'Subsidiary',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Company owned by parent organization',
    badge: 'Business',
    badgeColor: 'bg-blue-600'
  },
  division: {
    icon: Briefcase,
    label: 'Division',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Business unit within a company',
    badge: 'Division',
    badgeColor: 'bg-green-600'
  },
  location: {
    icon: Store,
    label: 'Location',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Physical store or office location',
    badge: 'Location',
    badgeColor: 'bg-orange-600'
  },
  franchise: {
    icon: Home,
    label: 'Franchise',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Franchisee location',
    badge: 'Franchise',
    badgeColor: 'bg-pink-600'
  }
}

// Plan configurations
const planConfig = {
  free: {
    label: 'Free',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: null,
    limits: {
      users: 1,
      sources: 1,
      storage: '1 GB',
      accounts: 1
    }
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Star,
    limits: {
      users: 3,
      sources: 3,
      storage: '10 GB',
      accounts: 3
    }
  },
  professional: {
    label: 'Professional',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Zap,
    limits: {
      users: 10,
      sources: 10,
      storage: '100 GB',
      accounts: 10
    }
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Crown,
    limits: {
      users: 'Unlimited',
      sources: 'Unlimited',
      storage: 'Unlimited',
      accounts: 'Unlimited'
    }
  }
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const { user } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch account data
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account'],
    queryFn: api.account.get,
  })

  // Fetch account hierarchy
  const { data: hierarchy } = useQuery({
    queryKey: ['account-hierarchy', account?.accountId],
    queryFn: () => api.account.get(),
    enabled: !!account?.accountId,
  })

  // Fetch all user accounts
  const { data: userAccounts } = useQuery({
    queryKey: ['user-accounts'],
    queryFn: () => api.account.get(),
  })

  // Fetch usage data
  const { data: usage } = useQuery({
    queryKey: ['account-usage'],
    queryFn: () => api.account.getUsage('month'),
  })

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: api.account.update,
    onSuccess: () => {
      toast({
        title: 'Account updated',
        description: 'Your account settings have been saved',
      })
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update account settings',
        variant: 'destructive',
      })
    },
  })

  if (accountLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load account information</AlertDescription>
        </Alert>
      </div>
    )
  }

  const accountType = accountTypeConfig[(account as any)?.accountType as keyof typeof accountTypeConfig] || accountTypeConfig.location
  const AccountIcon = accountType.icon
  const plan = planConfig[(account as any)?.plan as keyof typeof planConfig] || planConfig.free
  const PlanIcon = plan.icon

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Account Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-lg", accountType.bgColor)}>
            <AccountIcon className={cn("h-6 w-6", accountType.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{account.name}</h1>
              <Badge className={cn("text-white", accountType.badgeColor)}>
                {accountType.label}
              </Badge>
              <Badge variant="outline" className={cn(plan.color, plan.bgColor)}>
                {PlanIcon && <PlanIcon className="h-3 w-3 mr-1" />}
                {plan.label}
              </Badge>
            </div>
            <AccountBreadcrumb account={account} hierarchy={hierarchy} />
          </div>
        </div>
        <AccountSwitcher accounts={[]} currentAccountId={account.accountId} />
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Account Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {account.status === 'active' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Active</span>
                </>
              ) : account.status === 'suspended' ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-700">Suspended</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Cancelled</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {format(new Date(account.createdAt), 'MMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(hierarchy as any)?.userCount || 1}
              {typeof plan.limits.users === 'number' && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{plan.limits.users}
                </span>
              )}
            </div>
            <Progress 
              value={typeof plan.limits.users === 'number' ? (((hierarchy as any)?.userCount || 1) / plan.limits.users) * 100 : 0} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage ? formatBytes(usage.storage.total) : '0 B'}
              {typeof plan.limits.storage === 'string' && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{plan.limits.storage}
                </span>
              )}
            </div>
            <Progress 
              value={usage && typeof plan.limits.storage === 'string' ? 
                (usage.storage.total / (parseInt(plan.limits.storage) * 1073741824)) * 100 : 0
              } 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sub-Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(hierarchy as any)?.childAccounts?.length || 0}
              {typeof plan.limits.accounts === 'number' && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{plan.limits.accounts}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(hierarchy as any)?.totalDescendants || 0} total in hierarchy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <Building2 className="h-4 w-4 mr-2" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{account.accountId}</code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(account.createdAt), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{account.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{account.company || 'Not set'}</p>
                  </div>
                </div>

                {(account as any)?.parentAccountId && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Parent Account</p>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{(hierarchy as any)?.parent?.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Overview</CardTitle>
                <CardDescription>Current billing period</CardDescription>
              </CardHeader>
              <CardContent>
                {usage && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Storage</span>
                        <span className="text-sm font-medium">{formatBytes(usage.storage.total)}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Bandwidth</span>
                        <span className="text-sm font-medium">{formatBytes(usage.bandwidth.total)}</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">API Calls</span>
                        <span className="text-sm font-medium">{usage.jobs.total.toLocaleString()}</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                    <Separator />
                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estimated Cost</span>
                        <span className="text-lg font-bold">${usage.costs.estimated.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
                <Button variant="outline" className="justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Create Sub-Account
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          <AccountManagementDashboard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <UserManagementDashboard accountId={account.accountId} />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                    <CardDescription>Manage your subscription</CardDescription>
                  </div>
                  <Badge className={cn("text-white", plan.bgColor)}>
                    {PlanIcon && <PlanIcon className="h-3 w-3 mr-1" />}
                    {plan.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-lg font-medium">{plan.limits.users}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sources</p>
                    <p className="text-lg font-medium">{plan.limits.sources}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Storage</p>
                    <p className="text-lg font-medium">{plan.limits.storage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sub-Accounts</p>
                    <p className="text-lg font-medium">{plan.limits.accounts}</p>
                  </div>
                </div>

                {account.subscription && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Next billing date</span>
                      <span className="font-medium">
                        {format(new Date(account.subscription.currentPeriodEnd * 1000), 'PPP')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={account.subscription.status === 'active' ? 'default' : 'secondary'}>
                        {account.subscription.status}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">View Invoice History</Button>
                  {account.subscription?.cancelAtPeriodEnd && (
                    <Badge variant="destructive">Cancelling at period end</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      defaultValue={account.name}
                      onBlur={(e) => {
                        if (e.target.value !== account.name) {
                          updateAccountMutation.mutate({ name: e.target.value })
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      defaultValue={account.company}
                      placeholder="Enter company name"
                      onBlur={(e) => {
                        if (e.target.value !== account.company) {
                          updateAccountMutation.mutate({ company: e.target.value })
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={account.settings?.security?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setShowTwoFactorSetup(true)
                      } else {
                        // Handle disable 2FA
                      }
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>IP Whitelist</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict access to specific IP addresses
                  </p>
                  {account.settings?.security?.ipWhitelist?.map((ip, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={ip} readOnly />
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add IP Address
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your backups via email
                    </p>
                  </div>
                  <Switch
                    defaultChecked={account.settings?.notifications?.email}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Webhook Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send events to your webhook endpoint
                    </p>
                  </div>
                  <Switch
                    defaultChecked={account.settings?.notifications?.webhook}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. All data will be permanently removed.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}