'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  CreditCard, 
  Users, 
  Shield, 
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Calendar,
  Database,
  HardDrive,
  Zap,
  Crown,
  Info
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { api, Account } from '@listbackup/shared/api'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { format } from 'date-fns'
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
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface AccountSettings {
  accountId: string
  name: string
  company?: string
  description?: string
  accountType: 'personal' | 'business' | 'enterprise'
  settings: {
    allowSubAccounts: boolean
    maxSubAccounts: number
    timezone: string
    whiteLabel: {
      enabled: boolean
      logo?: string
      brandName?: string
      customDomain?: string
    }
    notifications: {
      email: boolean
      jobFailures: boolean
      storageWarnings: boolean
      invitations: boolean
    }
    dataRetention: {
      enabled: boolean
      days: number
    }
    autoBackup: {
      enabled: boolean
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string
    }
  }
  limits: {
    storage: number
    sources: number
    jobs: number
    apiCalls: number
  }
  usage: {
    storage: { used: number; limit: number }
    sources: { used: number; limit: number }
    jobs: { used: number; limit: number }
    apiCalls: { used: number; limit: number; period: string; resetDate: string }
  }
  billing: {
    customerId?: string
    subscriptionId?: string
    status: 'free' | 'paid' | 'inherited' | 'suspended'
    plan?: string
    nextBillingDate?: string
  }
}

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentAccount, userPermissions } = useAccountContext()
  const canChangeSettings = userPermissions?.canChangeSettings || false
  const canManageBilling = userPermissions?.canManageBilling || false
  const canDeleteAccount = userPermissions?.canDeleteAccount || false

  // Form states
  const [accountName, setAccountName] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [timezone, setTimezone] = useState('')
  const [settings, setSettings] = useState<AccountSettings['settings']>({
    allowSubAccounts: false,
    maxSubAccounts: 5,
    timezone: 'UTC',
    whiteLabel: {
      enabled: false
    },
    notifications: {
      email: true,
      jobFailures: true,
      storageWarnings: true,
      invitations: true
    },
    dataRetention: {
      enabled: false,
      days: 90
    },
    autoBackup: {
      enabled: false,
      frequency: 'daily',
      time: '02:00'
    }
  })

  // Fetch account settings
  const { data: accountSettings, isLoading } = useQuery({
    queryKey: ['account-settings', currentAccount?.accountId],
    queryFn: () => api.account.getSettings(currentAccount?.accountId || ''),
    enabled: !!currentAccount?.accountId
  })

  // Update form when settings load
  useEffect(() => {
    if (accountSettings) {
      setAccountName(accountSettings.name || '')
      setCompany(accountSettings.company || '')
      setDescription(accountSettings.description || '')
      setTimezone(accountSettings.settings?.timezone || 'UTC')
      setSettings(accountSettings.settings || settings)
    }
  }, [accountSettings])

  // Update account settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<AccountSettings>) => 
      api.account.updateSettings(currentAccount?.accountId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-settings'] })
      setIsEditing(false)
      toast({
        title: 'Settings updated',
        description: 'Your account settings have been updated successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update account settings',
        variant: 'destructive',
      })
    }
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => api.account.delete(currentAccount?.accountId || ''),
    onSuccess: () => {
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      })
      // Redirect to login or home
      window.location.href = '/'
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      })
    }
  })

  const handleSaveSettings = async () => {
    await updateSettingsMutation.mutateAsync({
      name: accountName,
      company,
      description,
      settings: {
        ...settings,
        timezone
      }
    })
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== accountName.toLowerCase()) {
      toast({
        title: 'Invalid confirmation',
        description: 'Please type the account name exactly to confirm deletion.',
        variant: 'destructive',
      })
      return
    }

    await deleteAccountMutation.mutateAsync()
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ]

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Basic information about your account
                  </CardDescription>
                </div>
                {canChangeSettings && (
                  !isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Settings
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveSettings} 
                        disabled={updateSettingsMutation.isPending}
                      >
                        {updateSettingsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="My Account"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Brief description of this account"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Account Type and Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Billing Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {accountSettings?.billing?.plan || 'Free'}
                    </p>
                  </div>
                  <Badge variant={accountSettings?.billing?.plan === 'Enterprise' ? 'default' : 'secondary'}>
                    {accountSettings?.billing?.plan === 'Enterprise' && <Crown className="h-3 w-3 mr-1" />}
                    {accountSettings?.billing?.plan || 'Free'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Account ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {currentAccount?.accountId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAccount?.createdAt && format(new Date(currentAccount.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive account notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important account updates via email
                  </p>
                </div>
                <Switch
                  id="notif-email"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-failures">Job Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when backup jobs fail
                  </p>
                </div>
                <Switch
                  id="notif-failures"
                  checked={settings.notifications.jobFailures}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, jobFailures: checked }
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-storage">Storage Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when storage usage exceeds 80%
                  </p>
                </div>
                <Switch
                  id="notif-storage"
                  checked={settings.notifications.storageWarnings}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, storageWarnings: checked }
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(accountSettings?.usage?.storage?.used || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {formatBytes(accountSettings?.usage?.storage?.limit || 0)}
                </p>
                <Progress 
                  value={getUsagePercentage(
                    accountSettings?.usage?.storage?.used || 0,
                    accountSettings?.usage?.storage?.limit || 1
                  )} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accountSettings?.usage?.sources?.used || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {accountSettings?.usage?.sources?.limit || 0}
                </p>
                <Progress 
                  value={getUsagePercentage(
                    accountSettings?.usage?.sources?.used || 0,
                    accountSettings?.usage?.sources?.limit || 1
                  )} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Monthly Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(accountSettings?.usage?.jobs?.used || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {formatNumber(accountSettings?.usage?.jobs?.limit || 0)}
                </p>
                <Progress 
                  value={getUsagePercentage(
                    accountSettings?.usage?.jobs?.used || 0,
                    accountSettings?.usage?.jobs?.limit || 1
                  )} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  API Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(accountSettings?.usage?.apiCalls?.used || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {formatNumber(accountSettings?.usage?.apiCalls?.limit || 0)} / {accountSettings?.usage?.apiCalls?.period}
                </p>
                <Progress 
                  value={getUsagePercentage(
                    accountSettings?.usage?.apiCalls?.used || 0,
                    accountSettings?.usage?.apiCalls?.limit || 1
                  )} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <CardDescription>
                Detailed breakdown of your account usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Usage resets on the {accountSettings?.usage?.apiCalls?.resetDate || '1st'} of each month.
                    Upgrade your plan to increase limits.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Storage Usage</p>
                        <p className="text-sm text-muted-foreground">
                          Total data stored across all sources
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatBytes(accountSettings?.usage?.storage?.used || 0)} / {formatBytes(accountSettings?.usage?.storage?.limit || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getUsagePercentage(
                          accountSettings?.usage?.storage?.used || 0,
                          accountSettings?.usage?.storage?.limit || 1
                        )}% used
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Data Sources</p>
                        <p className="text-sm text-muted-foreground">
                          Active connections to platforms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {accountSettings?.usage?.sources?.used || 0} / {accountSettings?.usage?.sources?.limit || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {accountSettings?.usage?.sources?.limit - accountSettings?.usage?.sources?.used} remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {!canManageBilling ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to manage billing for this account.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Billing Overview</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Current Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {accountSettings?.billing?.plan || 'Free Plan'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={accountSettings?.billing?.status === 'paid' ? 'default' : 'secondary'}>
                        {accountSettings?.billing?.status || 'Free'}
                      </Badge>
                      {accountSettings?.billing?.nextBillingDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Next billing: {format(new Date(accountSettings.billing.nextBillingDate), 'PP')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoices
                    </Button>
                  </div>

                  {accountSettings?.billing?.status === 'free' && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Upgrade to a paid plan to unlock more features and higher limits.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    Recent transactions and invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No billing history available
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure data retention and backup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-retention">Data Retention</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old backup data
                    </p>
                  </div>
                  <Switch
                    id="data-retention"
                    checked={settings.dataRetention.enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        dataRetention: { ...prev.dataRetention, enabled: checked }
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                {settings.dataRetention.enabled && (
                  <div className="grid gap-2 ml-6">
                    <Label htmlFor="retention-days">Retention Period (days)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      value={settings.dataRetention.days}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          dataRetention: { ...prev.dataRetention, days: parseInt(e.target.value) || 90 }
                        }))
                      }
                      disabled={!isEditing}
                      min={30}
                      max={365}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Schedule automatic backup jobs
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={settings.autoBackup.enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        autoBackup: { ...prev.autoBackup, enabled: checked }
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                {settings.autoBackup.enabled && (
                  <div className="grid gap-4 ml-6">
                    <div className="grid gap-2">
                      <Label htmlFor="backup-frequency">Frequency</Label>
                      <Select 
                        value={settings.autoBackup.frequency} 
                        onValueChange={(value: any) => 
                          setSettings(prev => ({
                            ...prev,
                            autoBackup: { ...prev.autoBackup, frequency: value }
                          }))
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="backup-time">Time</Label>
                      <Input
                        id="backup-time"
                        type="time"
                        value={settings.autoBackup.time}
                        onChange={(e) => 
                          setSettings(prev => ({
                            ...prev,
                            autoBackup: { ...prev.autoBackup, time: e.target.value }
                          }))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export/Import */}
          <Card>
            <CardHeader>
              <CardTitle>Export & Import</CardTitle>
              <CardDescription>
                Export your account data or import settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Account Data
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Export includes account settings, source configurations, and metadata. 
                  Actual backup data must be downloaded separately.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Actions in this section are permanent and cannot be undone. Please proceed with caution.
            </AlertDescription>
          </Alert>

          {canDeleteAccount ? (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete this account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">This action will:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Permanently delete all account data</li>
                    <li>Cancel all active backup jobs</li>
                    <li>Remove all platform connections</li>
                    <li>Delete all stored backup data</li>
                    <li>Cancel any active subscriptions</li>
                  </ul>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to delete this account. Contact the account owner for assistance.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All your data will be permanently deleted. This includes all backups, configurations, and settings.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold">{accountName}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type account name to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending || deleteConfirmation.toLowerCase() !== accountName.toLowerCase()}
            >
              {deleteAccountMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}