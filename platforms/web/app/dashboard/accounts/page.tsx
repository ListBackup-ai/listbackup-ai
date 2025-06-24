'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Users, 
  Plus, 
  Settings,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  Building,
  UserPlus,
  Shield,
  CreditCard,
  Activity,
  FolderTree,
  Crown,
  Info,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { api, Account } from '@listbackup/shared/api'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { useRouter } from 'next/navigation'
import { AccountHierarchyTree } from '@/components/account/account-hierarchy-tree'
import { AccountSwitcher } from '@/components/account/account-switcher'
import { CreateSubAccountDialog } from '@/components/account/create-sub-account-dialog'
import { InlineEntityTagging } from '@/components/tags'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AccountWithStats extends Account {
  stats?: {
    totalUsers: number
    totalSources: number
    totalJobs: number
    storageUsed: number
  }
  subAccounts?: AccountWithStats[]
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()
  const { 
    currentAccount, 
    availableAccounts,
    switchAccount,
    canCreateSubAccounts,
    userPermissions 
  } = useAccountContext()

  // Fetch account hierarchy with stats
  const { data: accountHierarchy, isLoading } = useQuery({
    queryKey: ['account-hierarchy', currentAccount?.accountId],
    queryFn: () => api.account.getHierarchy(currentAccount?.accountId || ''),
    enabled: !!currentAccount?.accountId
  })

  // Fetch account activity
  const { data: accountActivity } = useQuery({
    queryKey: ['account-activity', currentAccount?.accountId],
    queryFn: () => api.activity.list({ accountId: currentAccount?.accountId }),
    enabled: !!currentAccount?.accountId
  })

  // Switch account mutation
  const switchAccountMutation = useMutation({
    mutationFn: (accountId: string) => switchAccount(accountId),
    onSuccess: () => {
      toast({
        title: 'Account switched',
        description: 'You have switched to the selected account.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Switch failed',
        description: error.message || 'Failed to switch account',
        variant: 'destructive',
      })
    }
  })

  const toggleAccountExpanded = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const handleAccountAction = (action: string, account: Account) => {
    switch (action) {
      case 'switch':
        switchAccountMutation.mutate(account.accountId)
        break
      case 'settings':
        router.push(`/dashboard/settings/account?accountId=${account.accountId}`)
        break
      case 'users':
        router.push(`/dashboard/users?accountId=${account.accountId}`)
        break
      case 'billing':
        router.push(`/dashboard/billing?accountId=${account.accountId}`)
        break
      case 'create-sub':
        setSelectedAccount(account)
        setIsCreateDialogOpen(true)
        break
    }
  }

  const getAccountTypeIcon = (level: number) => {
    if (level === 0) return <Crown className="h-4 w-4" />
    if (level === 1) return <Building2 className="h-4 w-4" />
    return <Building className="h-4 w-4" />
  }

  const getAccountTypeName = (level: number) => {
    if (level === 0) return 'Root Account'
    if (level === 1) return 'Division'
    if (level === 2) return 'Sub-Division'
    return `Level ${level}`
  }

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filterAccounts = (accounts: AccountWithStats[], query: string): AccountWithStats[] => {
    if (!query) return accounts
    
    return accounts.reduce((filtered, account) => {
      const accountMatches = 
        account.name.toLowerCase().includes(query.toLowerCase()) ||
        account.company?.toLowerCase().includes(query.toLowerCase()) ||
        account.accountId.toLowerCase().includes(query.toLowerCase())

      const filteredSubAccounts = account.subAccounts 
        ? filterAccounts(account.subAccounts, query)
        : []

      if (accountMatches || filteredSubAccounts.length > 0) {
        filtered.push({
          ...account,
          subAccounts: filteredSubAccounts
        })
      }

      return filtered
    }, [] as AccountWithStats[])
  }

  const renderAccountCard = (account: AccountWithStats, depth: number = 0) => {
    const isExpanded = expandedAccounts.has(account.accountId)
    const hasSubAccounts = account.subAccounts && account.subAccounts.length > 0
    const isCurrentAccount = account.accountId === currentAccount?.accountId

    return (
      <div key={account.accountId} className={depth > 0 ? 'ml-8' : ''}>
        <Card className={`mb-4 ${isCurrentAccount ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {hasSubAccounts && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mt-1"
                    onClick={() => toggleAccountExpanded(account.accountId)}
                  >
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getAccountTypeIcon(account.level)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      {isCurrentAccount && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span>{account.company || getAccountTypeName(account.level)}</span>
                      <span className="text-xs">•</span>
                      <span className="text-xs font-mono">{account.accountId}</span>
                    </CardDescription>
                    <div className="mt-2">
                      <InlineEntityTagging
                        entityId={account.accountId}
                        entityType="account"
                        editable={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isCurrentAccount && (
                    <>
                      <DropdownMenuItem onClick={() => handleAccountAction('switch', account)}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Switch to Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => handleAccountAction('settings', account)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAccountAction('users', account)}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAccountAction('billing', account)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  {account.settings?.allowSubAccounts && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAccountAction('create-sub', account)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sub-Account
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          {account.stats && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Users</p>
                  <p className="font-medium">{account.stats.totalUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sources</p>
                  <p className="font-medium">{account.stats.totalSources}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Jobs</p>
                  <p className="font-medium">{account.stats.totalJobs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Storage</p>
                  <p className="font-medium">{formatStorageSize(account.stats.storageUsed)}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
        
        {isExpanded && hasSubAccounts && account.subAccounts && (
          <div className="space-y-2">
            {account.subAccounts.map(subAccount => renderAccountCard(subAccount, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const filteredHierarchy = accountHierarchy 
    ? filterAccounts([accountHierarchy], searchQuery)
    : []

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account hierarchy and settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <AccountSwitcher 
            accounts={availableAccounts}
            currentAccountId={currentAccount?.accountId || ''}
          />
          {canCreateSubAccounts && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sub-Account
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Current Account</CardTitle>
              <CardDescription>
                You are currently working in this account context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentAccount?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentAccount?.company || 'No company name'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard/settings/account')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Billing Status</p>
                  <p className="font-medium capitalize">{currentAccount?.billing?.status || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">{getAccountTypeName(currentAccount?.level || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {currentAccount?.createdAt && format(new Date(currentAccount.createdAt), 'PP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Path</p>
                  <p className="font-medium font-mono text-xs">{currentAccount?.accountPath}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/users')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-muted-foreground">Add or remove users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/billing')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Billing</p>
                    <p className="text-sm text-muted-foreground">Manage subscription</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/sources')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Data Sources</p>
                    <p className="text-sm text-muted-foreground">View all sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/settings/account')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Security</p>
                    <p className="text-sm text-muted-foreground">Account security</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Accounts</CardTitle>
                  <CardDescription>
                    Accounts you have access to
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {availableAccounts.length} accounts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableAccounts.map((account) => (
                  <div
                    key={account.accountId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      account.accountId === currentAccount?.accountId
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded">
                        {getAccountTypeIcon(account.level)}
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.company || account.accountPath}
                        </p>
                      </div>
                    </div>
                    {account.accountId !== currentAccount?.accountId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => switchAccountMutation.mutate(account.accountId)}
                      >
                        Switch
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Account Hierarchy</CardTitle>
                  <CardDescription>
                    Visual representation of your account structure
                  </CardDescription>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHierarchy.length > 0 ? (
                <div className="space-y-4">
                  {filteredHierarchy.map(account => renderAccountCard(account))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No accounts found matching your search.' : 'No account hierarchy available.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tree View */}
          <Card>
            <CardHeader>
              <CardTitle>Tree View</CardTitle>
              <CardDescription>
                Interactive tree view of your account hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountHierarchyTree 
                hierarchy={accountHierarchy || []}
                currentAccountId={currentAccount?.accountId || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent actions across all your accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountActivity?.activities && accountActivity.activities.length > 0 ? (
                <div className="space-y-4">
                  {accountActivity.activities.map((activity) => (
                    <div key={activity.activityId} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                      <div className="p-2 bg-muted rounded-full">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.actorName || 'System'}</span>
                          {' '}
                          {activity.action}
                          {' '}
                          <span className="font-medium">{activity.resourceName}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.timestamp), 'PPp')}
                          {' • '}
                          {activity.accountName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity to display.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Sub-Account Dialog */}
      {isCreateDialogOpen && (
        <CreateSubAccountDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          parentAccount={selectedAccount || currentAccount}
        />
      )}
    </div>
  )
}