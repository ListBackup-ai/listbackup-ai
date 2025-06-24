'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User,
  Mail,
  Shield,
  Bell,
  Globe,
  Key,
  Database,
  AlertCircle,
  Check,
  ChevronRight,
  Settings2,
  Lock,
  Eye,
  EyeOff,
  Save,
  Plus
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    backupComplete: true,
    backupFailed: true,
    weeklyReport: true,
    monthlyReport: false,
    securityAlerts: true
  })
  
  const [apiSettings, setApiSettings] = useState({
    rateLimitAlerts: true,
    webhookUrl: '',
    apiKeyName: ''
  })

  const { data: account } = useQuery({
    queryKey: ['account'],
    queryFn: api.account.get,
  })

  const updateProfileMutation = useMutation({
    mutationFn: api.account.updateProfile,
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: api.account.updatePassword,
    onSuccess: () => {
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully',
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update password',
        variant: 'destructive',
      })
    },
  })

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData)
  }

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match',
        variant: 'destructive',
      })
      return
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
  }

  const handleNotificationUpdate = () => {
    toast({
      title: 'Notifications updated',
      description: 'Your notification preferences have been saved',
    })
  }

  const handleApiUpdate = () => {
    toast({
      title: 'API settings updated',
      description: 'Your API configuration has been saved',
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                  />
                  {user?.emailVerified ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and subscription status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Account ID</p>
                    <p className="text-xs text-muted-foreground">{account?.accountId || 'Loading...'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data Region</p>
                    <p className="text-xs text-muted-foreground">US East (Virginia)</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time Zone</p>
                    <p className="text-xs text-muted-foreground">Pacific Time (UTC-8)</p>
                  </div>
                </div>
                <Select defaultValue="pst">
                  <SelectTrigger className="w-48 hover:shadow-md transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="mst">Mountain Time</SelectItem>
                    <SelectItem value="cst">Central Time</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={updatePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                  Disabled
                </Badge>
              </div>
              <Button className="w-full mt-4 hover:scale-105 transition-transform duration-200">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose which email notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                emailAlerts: 'Email alerts for important updates',
                backupComplete: 'Backup completion notifications',
                backupFailed: 'Backup failure alerts',
                weeklyReport: 'Weekly activity summary',
                monthlyReport: 'Monthly usage report',
                securityAlerts: 'Security and login alerts'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotificationSettings({
                      ...notificationSettings,
                      [key]: !notificationSettings[key as keyof typeof notificationSettings]
                    })}
                    className={notificationSettings[key as keyof typeof notificationSettings] ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {notificationSettings[key as keyof typeof notificationSettings] ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button onClick={handleNotificationUpdate} className="hover:scale-105 transition-transform duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for programmatic access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Production API Key</p>
                      <p className="text-xs text-muted-foreground">lb_live_sk_••••••••••••••••</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                    <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
                      Regenerate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKeyName">Create New API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKeyName"
                      placeholder="Key name (e.g., Development)"
                      value={apiSettings.apiKeyName}
                      onChange={(e) => setApiSettings({ ...apiSettings, apiKeyName: e.target.value })}
                      className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                    />
                    <Button className="hover:scale-105 transition-transform duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Configure webhooks to receive real-time event notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  value={apiSettings.webhookUrl}
                  onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                  className="transition-all duration-200 hover:shadow-md focus:shadow-md"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Rate limit alerts</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApiSettings({
                    ...apiSettings,
                    rateLimitAlerts: !apiSettings.rateLimitAlerts
                  })}
                  className={apiSettings.rateLimitAlerts ? 'bg-primary text-primary-foreground' : ''}
                >
                  {apiSettings.rateLimitAlerts ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleApiUpdate} className="hover:scale-105 transition-transform duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}