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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Bell, 
  Smartphone,
  Key,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Camera,
  Globe,
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@listbackup/shared/api'
import { useAuthStore } from '@/lib/stores/auth-store'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserProfile {
  userId: string
  email: string
  fullName: string
  phoneNumber?: string
  avatarUrl?: string
  timezone: string
  language: string
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  notificationPreferences: {
    email: {
      jobComplete: boolean
      jobFailed: boolean
      weeklyReport: boolean
      securityAlerts: boolean
      productUpdates: boolean
    }
    sms: {
      jobFailed: boolean
      securityAlerts: boolean
    }
  }
}

interface UpdateProfileRequest {
  fullName?: string
  phoneNumber?: string
  timezone?: string
  language?: string
  notificationPreferences?: UserProfile['notificationPreferences']
}

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()

  // Form states
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [timezone, setTimezone] = useState('')
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState<UserProfile['notificationPreferences']>({
    email: {
      jobComplete: true,
      jobFailed: true,
      weeklyReport: false,
      securityAlerts: true,
      productUpdates: false
    },
    sms: {
      jobFailed: true,
      securityAlerts: true
    }
  })

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: api.auth.profile,
    enabled: !!user
  })

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '')
      setPhoneNumber(profile.phoneNumber || '')
      setTimezone(profile.timezone || 'UTC')
      setLanguage(profile.language || 'en')
      setNotifications(profile.notificationPreferences || notifications)
    }
  }, [profile])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.auth.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      setIsEditing(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    }
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      api.auth.updatePassword(data),
    onSuccess: () => {
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Password change failed',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      })
    }
  })

  // Enable 2FA mutation
  const enable2FAMutation = useMutation({
    mutationFn: () => api.account.enable2FA(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast({
        title: '2FA enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      })
      // Show QR code dialog for setup
    },
    onError: (error: any) => {
      toast({
        title: '2FA setup failed',
        description: error.message || 'Failed to enable two-factor authentication',
        variant: 'destructive',
      })
    }
  })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await updateProfileMutation.mutateAsync({
        fullName,
        phoneNumber,
        timezone,
        language,
        notificationPreferences: notifications
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure your new passwords match.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }

    await changePasswordMutation.mutateAsync({
      currentPassword,
      newPassword
    })
  }

  const toggleNotification = (type: 'email' | 'sms', key: string) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key as keyof typeof prev[typeof type]]
      }
    }))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback>{getInitials(fullName || user?.email || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" disabled={!isEditing}>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="flex-1"
                    />
                    {profile?.emailVerified ? (
                      <Badge variant="default" className="whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                      className="flex-1"
                    />
                    {profile?.phoneVerified && phoneNumber && (
                      <Badge variant="default" className="whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
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

                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Account Info */}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono">{profile?.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>{profile?.createdAt && format(new Date(profile.createdAt), 'PPP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showChangePassword ? (
                <Button onClick={() => setShowChangePassword(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowChangePassword(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.twoFactorEnabled ? (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled on your account.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Manage 2FA Devices
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Protect your account with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
                  </p>
                  <Button onClick={() => enable2FAMutation.mutate()}>
                    <Shield className="h-4 w-4 mr-2" />
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Session</p>
                      <p className="text-xs text-muted-foreground">
                        Chrome on macOS • San Francisco, CA
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Sign Out All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose which emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-job-complete">Job Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when backup jobs complete successfully
                  </p>
                </div>
                <Switch
                  id="email-job-complete"
                  checked={notifications.email.jobComplete}
                  onCheckedChange={() => toggleNotification('email', 'jobComplete')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-job-failed">Job Failures</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when backup jobs fail
                  </p>
                </div>
                <Switch
                  id="email-job-failed"
                  checked={notifications.email.jobFailed}
                  onCheckedChange={() => toggleNotification('email', 'jobFailed')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-weekly-report">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summaries of your backup activity
                  </p>
                </div>
                <Switch
                  id="email-weekly-report"
                  checked={notifications.email.weeklyReport}
                  onCheckedChange={() => toggleNotification('email', 'weeklyReport')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-security-alerts">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications about your account
                  </p>
                </div>
                <Switch
                  id="email-security-alerts"
                  checked={notifications.email.securityAlerts}
                  onCheckedChange={() => toggleNotification('email', 'securityAlerts')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-product-updates">Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    News about new features and improvements
                  </p>
                </div>
                <Switch
                  id="email-product-updates"
                  checked={notifications.email.productUpdates}
                  onCheckedChange={() => toggleNotification('email', 'productUpdates')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Critical alerts sent to your phone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!phoneNumber ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add a phone number to your profile to enable SMS notifications.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-job-failed">Job Failures</Label>
                      <p className="text-sm text-muted-foreground">
                        Get SMS alerts for critical job failures
                      </p>
                    </div>
                    <Switch
                      id="sms-job-failed"
                      checked={notifications.sms.jobFailed}
                      onCheckedChange={() => toggleNotification('sms', 'jobFailed')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Urgent security notifications
                      </p>
                    </div>
                    <Switch
                      id="sms-security-alerts"
                      checked={notifications.sms.securityAlerts}
                      onCheckedChange={() => toggleNotification('sms', 'securityAlerts')}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving || updateProfileMutation.isPending}
            >
              {(isSaving || updateProfileMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Notification Preferences
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}