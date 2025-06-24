'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Building, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  Clock, 
  Key, 
  CreditCard, 
  Upload, 
  Download, 
  Trash2, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  Check,
  X,
  Loader2,
  Info,
  FileText,
  Palette,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { cn } from '@listbackup/shared/utils'

interface AccountSettings {
  // General Settings
  name: string
  company?: string
  description?: string
  website?: string
  industry?: string
  timezone: string
  dateFormat: string
  language: string
  
  // Contact Information
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  phone?: string
  email?: string
  
  // Business Settings
  fiscalYearStart?: string
  currency?: string
  businessHours?: {
    start: string
    end: string
    timezone: string
    workDays: string[]
  }
  
  // Branding
  branding?: {
    logoUrl?: string
    primaryColor?: string
    secondaryColor?: string
    customCSS?: string
    faviconUrl?: string
  }
  
  // Security Settings
  security?: {
    requireTwoFactor: boolean
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
      expirationDays: number
    }
    ipWhitelist?: string[]
    allowedDomains?: string[]
    auditLogRetention: number
  }
  
  // Notification Settings
  notifications?: {
    email: {
      enabled: boolean
      digestFrequency: 'daily' | 'weekly' | 'monthly'
      types: string[]
    }
    webhook?: {
      enabled: boolean
      url?: string
      secret?: string
      events: string[]
    }
    slack?: {
      enabled: boolean
      webhookUrl?: string
      channel?: string
    }
  }
  
  // Data & Backup Settings
  dataSettings?: {
    retentionPeriod: number
    compressionEnabled: boolean
    encryptionEnabled: boolean
    backupFrequency: 'hourly' | 'daily' | 'weekly'
    exportFormats: string[]
    storageRegion: string
  }
  
  // API Settings
  apiSettings?: {
    enabled: boolean
    rateLimitPerHour: number
    allowedIPs?: string[]
    webhookEndpoint?: string
    apiVersion: string
  }
  
  // Compliance Settings
  compliance?: {
    gdprEnabled: boolean
    hipaaEnabled: boolean
    soc2Enabled: boolean
    dataProcessingAgreement: boolean
    privacyPolicyUrl?: string
    termsOfServiceUrl?: string
  }
}

interface AccountSettingsInterfaceProps {
  accountId?: string
  className?: string
}

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
]

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'SEK', label: 'Swedish Krona (SEK)' },
  { value: 'NOK', label: 'Norwegian Krone (NOK)' },
  { value: 'DKK', label: 'Danish Krone (DKK)' },
]

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Legal',
  'Marketing & Advertising',
  'Consulting',
  'Non-profit',
  'Government',
  'Other'
]

export function AccountSettingsInterface({ accountId, className }: AccountSettingsInterfaceProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<AccountSettings>({
    name: '',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    language: 'en'
  })
  const [isDirty, setIsDirty] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()
  const queryClient = useQueryClient()

  const finalAccountId = accountId || currentAccount?.accountId

  // Fetch account settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['account-settings', finalAccountId],
    queryFn: () => Promise.resolve({ settings: settings }),
    enabled: !!finalAccountId,
    onSuccess: (data) => {
      if (data.settings) {
        setSettings(data.settings)
        setIsDirty(false)
      }
    }
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: AccountSettings) => Promise.resolve(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-settings', finalAccountId] })
      toast({
        title: 'Settings saved',
        description: 'Account settings have been updated successfully.',
      })
      setIsDirty(false)
    },
    onError: () => {
      toast({
        title: 'Save failed',
        description: 'Failed to save account settings',
        variant: 'destructive',
      })
    }
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      toast({
        title: 'Account deleted',
        description: 'Account has been permanently deleted.',
      })
    },
    onError: () => {
      toast({
        title: 'Deletion failed',
        description: 'Failed to delete account',
        variant: 'destructive',
      })
    }
  })

  const handleSave = () => {
    updateSettingsMutation.mutate(settings)
  }

  const handleReset = () => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings)
      setIsDirty(false)
    }
  }

  const updateSettings = (updates: Partial<AccountSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const updateNestedSettings = (key: keyof AccountSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
    setIsDirty(true)
  }

  if (!finalAccountId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Please select an account to manage settings</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage settings and preferences for {currentAccount?.name}
          </p>
        </div>
        
        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <Building className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data & Backup
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    placeholder="Enter account name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={settings.company || ''}
                    onChange={(e) => updateSettings({ company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description || ''}
                  onChange={(e) => updateSettings({ description: e.target.value })}
                  placeholder="Brief description of this account"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website || ''}
                    onChange={(e) => updateSettings({ website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={settings.industry || ''} 
                    onValueChange={(value) => updateSettings({ industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure timezone, language, and formatting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => updateSettings({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => updateSettings({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.currency || 'USD'} 
                    onValueChange={(value) => updateSettings({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Primary contact details for this account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => updateSettings({ email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => updateSettings({ phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Address</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Street address"
                    value={settings.address?.street || ''}
                    onChange={(e) => updateNestedSettings('address', { 
                      ...settings.address, 
                      street: e.target.value 
                    })}
                  />
                  <Input
                    placeholder="City"
                    value={settings.address?.city || ''}
                    onChange={(e) => updateNestedSettings('address', { 
                      ...settings.address, 
                      city: e.target.value 
                    })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="State/Province"
                    value={settings.address?.state || ''}
                    onChange={(e) => updateNestedSettings('address', { 
                      ...settings.address, 
                      state: e.target.value 
                    })}
                  />
                  <Input
                    placeholder="Postal Code"
                    value={settings.address?.postalCode || ''}
                    onChange={(e) => updateNestedSettings('address', { 
                      ...settings.address, 
                      postalCode: e.target.value 
                    })}
                  />
                  <Input
                    placeholder="Country"
                    value={settings.address?.country || ''}
                    onChange={(e) => updateNestedSettings('address', { 
                      ...settings.address, 
                      country: e.target.value 
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Access</CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Force all users to enable 2FA
                  </p>
                </div>
                <Switch
                  checked={settings.security?.requireTwoFactor || false}
                  onCheckedChange={(checked) => updateNestedSettings('security', {
                    ...settings.security,
                    requireTwoFactor: checked
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security?.sessionTimeout || 480}
                  onChange={(e) => updateNestedSettings('security', {
                    ...settings.security,
                    sessionTimeout: parseInt(e.target.value) || 480
                  })}
                  min={15}
                  max={1440}
                />
                <p className="text-sm text-muted-foreground">
                  Users will be logged out after this period of inactivity
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>
                Set password requirements for all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={settings.security?.passwordPolicy?.minLength || 8}
                    onChange={(e) => updateNestedSettings('security', {
                      ...settings.security,
                      passwordPolicy: {
                        ...settings.security?.passwordPolicy,
                        minLength: parseInt(e.target.value) || 8
                      }
                    })}
                    min={6}
                    max={128}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Password Expiration (days)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    value={settings.security?.passwordPolicy?.expirationDays || 90}
                    onChange={(e) => updateNestedSettings('security', {
                      ...settings.security,
                      passwordPolicy: {
                        ...settings.security?.passwordPolicy,
                        expirationDays: parseInt(e.target.value) || 90
                      }
                    })}
                    min={0}
                    max={365}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Character Requirements</Label>
                <div className="space-y-2">
                  {[
                    { key: 'requireUppercase', label: 'Require uppercase letters' },
                    { key: 'requireLowercase', label: 'Require lowercase letters' },
                    { key: 'requireNumbers', label: 'Require numbers' },
                    { key: 'requireSpecialChars', label: 'Require special characters' },
                  ].map((requirement) => (
                    <div key={requirement.key} className="flex items-center justify-between">
                      <Label>{requirement.label}</Label>
                      <Switch
                        checked={settings.security?.passwordPolicy?.[requirement.key as keyof typeof settings.security.passwordPolicy] || false}
                        onCheckedChange={(checked) => updateNestedSettings('security', {
                          ...settings.security,
                          passwordPolicy: {
                            ...settings.security?.passwordPolicy,
                            [requirement.key]: checked
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications?.email?.enabled || false}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', {
                    ...settings.notifications,
                    email: {
                      ...settings.notifications?.email,
                      enabled: checked
                    }
                  })}
                />
              </div>

              {settings.notifications?.email?.enabled && (
                <div className="space-y-2">
                  <Label>Digest Frequency</Label>
                  <Select 
                    value={settings.notifications?.email?.digestFrequency || 'daily'} 
                    onValueChange={(value: any) => updateNestedSettings('notifications', {
                      ...settings.notifications,
                      email: {
                        ...settings.notifications?.email,
                        digestFrequency: value
                      }
                    })}
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Notifications</CardTitle>
              <CardDescription>
                Send notifications to external systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Webhook Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send HTTP notifications to your endpoint
                  </p>
                </div>
                <Switch
                  checked={settings.notifications?.webhook?.enabled || false}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', {
                    ...settings.notifications,
                    webhook: {
                      ...settings.notifications?.webhook,
                      enabled: checked
                    }
                  })}
                />
              </div>

              {settings.notifications?.webhook?.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={settings.notifications?.webhook?.url || ''}
                      onChange={(e) => updateNestedSettings('notifications', {
                        ...settings.notifications,
                        webhook: {
                          ...settings.notifications?.webhook,
                          url: e.target.value
                        }
                      })}
                      placeholder="https://your-app.com/webhooks/listbackup"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={settings.notifications?.webhook?.secret || ''}
                      onChange={(e) => updateNestedSettings('notifications', {
                        ...settings.notifications,
                        webhook: {
                          ...settings.notifications?.webhook,
                          secret: e.target.value
                        }
                      })}
                      placeholder="Optional secret for signature verification"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Backup Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Configure how long data is stored and backed up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                <Input
                  id="retentionPeriod"
                  type="number"
                  value={settings.dataSettings?.retentionPeriod || 365}
                  onChange={(e) => updateNestedSettings('dataSettings', {
                    ...settings.dataSettings,
                    retentionPeriod: parseInt(e.target.value) || 365
                  })}
                  min={30}
                  max={2555}
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep backed up data before automatic deletion
                </p>
              </div>

              <div className="space-y-3">
                <Label>Data Processing Options</Label>
                <div className="space-y-2">
                  {[
                    { key: 'compressionEnabled', label: 'Enable compression to save storage space' },
                    { key: 'encryptionEnabled', label: 'Enable encryption for additional security' },
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <Label>{option.label}</Label>
                      <Switch
                        checked={settings.dataSettings?.[option.key as keyof typeof settings.dataSettings] || false}
                        onCheckedChange={(checked) => updateNestedSettings('dataSettings', {
                          ...settings.dataSettings,
                          [option.key]: checked
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>
                Set default backup frequency and storage preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Backup Frequency</Label>
                  <Select 
                    value={settings.dataSettings?.backupFrequency || 'daily'} 
                    onValueChange={(value: any) => updateNestedSettings('dataSettings', {
                      ...settings.dataSettings,
                      backupFrequency: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Storage Region</Label>
                  <Select 
                    value={settings.dataSettings?.storageRegion || 'us-east-1'} 
                    onValueChange={(value) => updateNestedSettings('dataSettings', {
                      ...settings.dataSettings,
                      storageRegion: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Configure API access and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow programmatic access to your data
                  </p>
                </div>
                <Switch
                  checked={settings.apiSettings?.enabled || false}
                  onCheckedChange={(checked) => updateNestedSettings('apiSettings', {
                    ...settings.apiSettings,
                    enabled: checked
                  })}
                />
              </div>

              {settings.apiSettings?.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={settings.apiSettings?.rateLimitPerHour || 1000}
                      onChange={(e) => updateNestedSettings('apiSettings', {
                        ...settings.apiSettings,
                        rateLimitPerHour: parseInt(e.target.value) || 1000
                      })}
                      min={100}
                      max={10000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhookEndpoint">Webhook Endpoint</Label>
                    <Input
                      id="webhookEndpoint"
                      value={settings.apiSettings?.webhookEndpoint || ''}
                      onChange={(e) => updateNestedSettings('apiSettings', {
                        ...settings.apiSettings,
                        webhookEndpoint: e.target.value
                      })}
                      placeholder="https://your-app.com/webhooks"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Legal</CardTitle>
              <CardDescription>
                Configure compliance requirements and legal settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Compliance Features</Label>
                <div className="space-y-2">
                  {[
                    { key: 'gdprEnabled', label: 'GDPR Compliance (EU)' },
                    { key: 'hipaaEnabled', label: 'HIPAA Compliance (Healthcare)' },
                    { key: 'soc2Enabled', label: 'SOC 2 Compliance' },
                    { key: 'dataProcessingAgreement', label: 'Data Processing Agreement' },
                  ].map((compliance) => (
                    <div key={compliance.key} className="flex items-center justify-between">
                      <Label>{compliance.label}</Label>
                      <Switch
                        checked={settings.compliance?.[compliance.key as keyof typeof settings.compliance] || false}
                        onCheckedChange={(checked) => updateNestedSettings('compliance', {
                          ...settings.compliance,
                          [compliance.key]: checked
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These actions are permanent and cannot be undone. Please be very careful.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the account and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This will permanently delete:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All backed up data</li>
                <li>All user accounts and permissions</li>
                <li>All integrations and configurations</li>
                <li>All billing and subscription information</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Type "DELETE" to confirm:</Label>
            <Input placeholder="DELETE" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                deleteAccountMutation.mutate()
                setShowDeleteDialog(false)
              }}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}