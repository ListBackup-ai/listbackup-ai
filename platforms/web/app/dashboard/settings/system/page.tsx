'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings,
  Database,
  Key,
  Mail,
  Bell,
  Shield,
  Server,
  Globe,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  TestTube,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'

interface SystemConfig {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    maintenanceMode: boolean
    debugMode: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  database: {
    maxConnections: number
    connectionTimeout: number
    queryTimeout: number
    backupRetention: number
  }
  api: {
    rateLimit: number
    timeout: number
    maxPayloadSize: number
    enableCors: boolean
    corsOrigins: string[]
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    slackWebhook?: string
    emailSettings: {
      smtpHost: string
      smtpPort: number
      smtpUser: string
      smtpPassword: string
      fromAddress: string
    }
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireTwoFactor: boolean
    allowedIpRanges: string[]
  }
  storage: {
    defaultProvider: 's3' | 'gcs' | 'azure'
    retentionDays: number
    compressionEnabled: boolean
    encryptionEnabled: boolean
  }
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed?: string
  createdAt: string
  expiresAt?: string
  status: 'active' | 'revoked' | 'expired'
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswords, setShowPasswords] = useState(false)
  const [newApiKeyOpen, setNewApiKeyOpen] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>([])
  const [testingConfig, setTestingConfig] = useState<string | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data - replace with actual API calls
  const { data: config, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async (): Promise<SystemConfig> => ({
      general: {
        siteName: 'ListBackup.ai',
        siteUrl: 'https://listbackup.ai',
        adminEmail: 'admin@listbackup.ai',
        maintenanceMode: false,
        debugMode: false,
        logLevel: 'info',
      },
      database: {
        maxConnections: 100,
        connectionTimeout: 30000,
        queryTimeout: 60000,
        backupRetention: 30,
      },
      api: {
        rateLimit: 1000,
        timeout: 30000,
        maxPayloadSize: 10485760, // 10MB
        enableCors: true,
        corsOrigins: ['https://listbackup.ai', 'https://app.listbackup.ai'],
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        slackWebhook: 'https://hooks.slack.com/services/...',
        emailSettings: {
          smtpHost: 'smtp.aws.com',
          smtpPort: 587,
          smtpUser: 'noreply@listbackup.ai',
          smtpPassword: '••••••••',
          fromAddress: 'noreply@listbackup.ai',
        },
      },
      security: {
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireTwoFactor: true,
        allowedIpRanges: ['0.0.0.0/0'],
      },
      storage: {
        defaultProvider: 's3',
        retentionDays: 365,
        compressionEnabled: true,
        encryptionEnabled: true,
      },
    }),
  })

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async (): Promise<ApiKey[]> => [
      {
        id: '1',
        name: 'Production API',
        key: 'lb_prod_••••••••••••••••',
        permissions: ['read', 'write', 'admin'],
        lastUsed: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        status: 'active',
      },
      {
        id: '2',
        name: 'Mobile App',
        key: 'lb_mobile_••••••••••••••••',
        permissions: ['read', 'write'],
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        status: 'active',
      },
      {
        id: '3',
        name: 'Legacy Integration',
        key: 'lb_legacy_••••••••••••••••',
        permissions: ['read'],
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
        status: 'revoked',
      },
    ],
  })

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<SystemConfig>) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return newConfig
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({
        title: 'Settings updated',
        description: 'System configuration has been saved successfully',
      })
    },
  })

  const testConfigMutation = useMutation({
    mutationFn: async (configType: string) => {
      setTestingConfig(configType)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return Math.random() > 0.2 // 80% success rate
    },
    onSuccess: (success, configType) => {
      setTestingConfig(null)
      toast({
        title: success ? 'Test successful' : 'Test failed',
        description: success 
          ? `${configType} configuration is working correctly`
          : `${configType} configuration test failed`,
        variant: success ? 'default' : 'destructive',
      })
    },
  })

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string[] }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        id: Date.now().toString(),
        name: data.name,
        key: `lb_${data.name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2)}`,
        permissions: data.permissions,
        createdAt: new Date().toISOString(),
        status: 'active' as const,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setNewApiKeyOpen(false)
      setNewApiKeyName('')
      setNewApiKeyPermissions([])
      toast({
        title: 'API key created',
        description: 'New API key has been generated successfully',
      })
    },
  })

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast({
        title: 'API key revoked',
        description: 'The API key has been revoked and is no longer valid',
      })
    },
  })

  const handleConfigUpdate = (section: keyof SystemConfig, updates: any) => {
    if (!config) return
    
    const newConfig = {
      ...config,
      [section]: { ...config[section], ...updates }
    }
    updateConfigMutation.mutate(newConfig)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      description: 'The text has been copied to your clipboard',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and manage API access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Settings className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => handleConfigUpdate('general', { siteName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={config.general.siteUrl}
                    onChange={(e) => handleConfigUpdate('general', { siteUrl: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={config.general.adminEmail}
                  onChange={(e) => handleConfigUpdate('general', { adminEmail: e.target.value })}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable to put the system in maintenance mode
                    </div>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => handleConfigUpdate('general', { maintenanceMode: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable debug logging and error details
                    </div>
                  </div>
                  <Switch
                    checked={config.general.debugMode}
                    onCheckedChange={(checked) => handleConfigUpdate('general', { debugMode: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                  value={config.general.logLevel}
                  onValueChange={(value) => handleConfigUpdate('general', { logLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>Database connection and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={config.database.maxConnections}
                    onChange={(e) => handleConfigUpdate('database', { maxConnections: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                  <Input
                    id="connectionTimeout"
                    type="number"
                    value={config.database.connectionTimeout}
                    onChange={(e) => handleConfigUpdate('database', { connectionTimeout: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="queryTimeout">Query Timeout (ms)</Label>
                  <Input
                    id="queryTimeout"
                    type="number"
                    value={config.database.queryTimeout}
                    onChange={(e) => handleConfigUpdate('database', { queryTimeout: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={config.database.backupRetention}
                    onChange={(e) => handleConfigUpdate('database', { backupRetention: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => testConfigMutation.mutate('Database')}
                  disabled={testingConfig === 'Database'}
                >
                  {testingConfig === 'Database' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>API limits and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={config.api.rateLimit}
                    onChange={(e) => handleConfigUpdate('api', { rateLimit: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.api.timeout}
                    onChange={(e) => handleConfigUpdate('api', { timeout: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxPayloadSize">Max Payload Size (bytes)</Label>
                  <Input
                    id="maxPayloadSize"
                    type="number"
                    value={config.api.maxPayloadSize}
                    onChange={(e) => handleConfigUpdate('api', { maxPayloadSize: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable CORS</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow cross-origin requests
                  </div>
                </div>
                <Switch
                  checked={config.api.enableCors}
                  onCheckedChange={(checked) => handleConfigUpdate('api', { enableCors: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="corsOrigins">CORS Origins</Label>
                <Textarea
                  id="corsOrigins"
                  value={config.api.corsOrigins.join('\n')}
                  onChange={(e) => handleConfigUpdate('api', { corsOrigins: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="https://example.com"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API access keys</CardDescription>
                </div>
                <Dialog open={newApiKeyOpen} onOpenChange={setNewApiKeyOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Generate a new API key for external access
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKeyName">Key Name</Label>
                        <Input
                          id="apiKeyName"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="Production API Key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="space-y-2">
                          {['read', 'write', 'admin'].map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={permission}
                                checked={newApiKeyPermissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewApiKeyPermissions([...newApiKeyPermissions, permission])
                                  } else {
                                    setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== permission))
                                  }
                                }}
                                className="rounded"
                              />
                              <Label htmlFor={permission} className="capitalize">
                                {permission}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createApiKeyMutation.mutate({
                          name: newApiKeyName,
                          permissions: newApiKeyPermissions
                        })}
                        disabled={!newApiKeyName || newApiKeyPermissions.length === 0}
                      >
                        Create Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys?.map((apiKey) => (
                  <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <code className="bg-muted px-2 py-1 rounded">{apiKey.key}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key.replace('••••••••••••••••', 'full_key_would_be_here'))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Permissions: {apiKey.permissions.join(', ')} • 
                        Created: {new Date(apiKey.createdAt).toLocaleDateString()} •
                        {apiKey.lastUsed && ` Last used: ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeApiKeyMutation.mutate(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Send notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={config.notifications.emailEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('notifications', { emailEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </div>
                  </div>
                  <Switch
                    checked={config.notifications.smsEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('notifications', { smsEnabled: checked })}
                  />
                </div>
              </div>
              
              {config.notifications.emailEnabled && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Email Configuration</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={config.notifications.emailSettings.smtpHost}
                        onChange={(e) => handleConfigUpdate('notifications', {
                          emailSettings: { ...config.notifications.emailSettings, smtpHost: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.notifications.emailSettings.smtpPort}
                        onChange={(e) => handleConfigUpdate('notifications', {
                          emailSettings: { ...config.notifications.emailSettings, smtpPort: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={config.notifications.emailSettings.smtpUser}
                        onChange={(e) => handleConfigUpdate('notifications', {
                          emailSettings: { ...config.notifications.emailSettings, smtpUser: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <div className="relative">
                        <Input
                          id="smtpPassword"
                          type={showPasswords ? "text" : "password"}
                          value={config.notifications.emailSettings.smtpPassword}
                          onChange={(e) => handleConfigUpdate('notifications', {
                            emailSettings: { ...config.notifications.emailSettings, smtpPassword: e.target.value }
                          })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fromAddress">From Address</Label>
                    <Input
                      id="fromAddress"
                      type="email"
                      value={config.notifications.emailSettings.fromAddress}
                      onChange={(e) => handleConfigUpdate('notifications', {
                        emailSettings: { ...config.notifications.emailSettings, fromAddress: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => testConfigMutation.mutate('Email')}
                      disabled={testingConfig === 'Email'}
                    >
                      {testingConfig === 'Email' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test Email
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                <Input
                  id="slackWebhook"
                  value={config.notifications.slackWebhook || ''}
                  onChange={(e) => handleConfigUpdate('notifications', { slackWebhook: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (ms)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => handleConfigUpdate('security', { sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => handleConfigUpdate('security', { maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Min Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => handleConfigUpdate('security', { passwordMinLength: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <div className="text-sm text-muted-foreground">
                    Force all users to enable 2FA
                  </div>
                </div>
                <Switch
                  checked={config.security.requireTwoFactor}
                  onCheckedChange={(checked) => handleConfigUpdate('security', { requireTwoFactor: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowedIpRanges">Allowed IP Ranges</Label>
                <Textarea
                  id="allowedIpRanges"
                  value={config.security.allowedIpRanges.join('\n')}
                  onChange={(e) => handleConfigUpdate('security', { allowedIpRanges: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="192.168.1.0/24"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>Data storage and retention settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultProvider">Default Storage Provider</Label>
                <Select
                  value={config.storage.defaultProvider}
                  onValueChange={(value) => handleConfigUpdate('storage', { defaultProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Retention Period (days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={config.storage.retentionDays}
                  onChange={(e) => handleConfigUpdate('storage', { retentionDays: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compression Enabled</Label>
                    <div className="text-sm text-muted-foreground">
                      Compress data before storage
                    </div>
                  </div>
                  <Switch
                    checked={config.storage.compressionEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('storage', { compressionEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encryption Enabled</Label>
                    <div className="text-sm text-muted-foreground">
                      Encrypt data at rest
                    </div>
                  </div>
                  <Switch
                    checked={config.storage.encryptionEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('storage', { encryptionEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}