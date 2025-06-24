'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  Bell,
  Shield,
  Zap,
  Info,
  CheckCircle2,
  Settings,
  Mail,
  Smartphone,
  AlertTriangle,
  Timer,
  Repeat
} from 'lucide-react'
import { Platform, PlatformConnection, PlatformSource } from '@listbackup/shared/api'
import { WizardStepProps } from '../onboarding-wizard'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { cn } from '@/lib/utils'

interface BackupConfigurationData {
  selectedPlatform: Platform
  selectedConnection: PlatformConnection
  selectedSources: PlatformSource[]
  sourceName: string
  sourceDescription: string
  schedule: {
    enabled: boolean
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
    timezone: string
  }
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    email?: string
    slack?: boolean
    webhook?: string
  }
  retention: {
    enabled: boolean
    days: number
  }
  encryption: {
    enabled: boolean
    level: 'standard' | 'enhanced'
  }
}

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every Hour', description: 'Continuous updates' },
  { value: 'daily', label: 'Daily', description: 'Once per day' },
  { value: 'weekly', label: 'Weekly', description: 'Once per week' },
  { value: 'monthly', label: 'Monthly', description: 'Once per month' }
]

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
]

export function BackupConfigurationStep({ 
  data, 
  setData, 
  onNext,
  canProceed,
  isLoading
}: WizardStepProps) {
  const { currentAccount } = useAccountContext()
  
  const platform = data.selectedPlatform as Platform
  const connection = data.selectedConnection as PlatformConnection
  const sources = data.selectedSources as PlatformSource[]
  
  const [config, setConfig] = useState<BackupConfigurationData>({
    selectedPlatform: platform,
    selectedConnection: connection,
    selectedSources: sources,
    sourceName: data.sourceName || `${platform.displayName || platform.name} Backup`,
    sourceDescription: data.sourceDescription || '',
    schedule: {
      enabled: data.schedule?.enabled ?? true,
      frequency: data.schedule?.frequency || 'daily',
      time: data.schedule?.time || '02:00',
      dayOfWeek: data.schedule?.dayOfWeek,
      dayOfMonth: data.schedule?.dayOfMonth,
      timezone: data.schedule?.timezone || currentAccount?.settings?.timezone || 'UTC'
    },
    notifications: {
      onSuccess: data.notifications?.onSuccess ?? false,
      onFailure: data.notifications?.onFailure ?? true,
      email: data.notifications?.email || currentAccount?.email,
      slack: data.notifications?.slack ?? false,
      webhook: data.notifications?.webhook || ''
    },
    retention: {
      enabled: data.retention?.enabled ?? true,
      days: data.retention?.days || 90
    },
    encryption: {
      enabled: data.encryption?.enabled ?? true,
      level: data.encryption?.level || 'standard'
    }
  })

  // Update wizard data when configuration changes
  useEffect(() => {
    setData({
      ...data,
      ...config
    })
  }, [config, data, setData])

  const updateConfig = (updates: Partial<BackupConfigurationData>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateSchedule = (updates: Partial<BackupConfigurationData['schedule']>) => {
    setConfig(prev => ({
      ...prev,
      schedule: { ...prev.schedule, ...updates }
    }))
  }

  const updateNotifications = (updates: Partial<BackupConfigurationData['notifications']>) => {
    setConfig(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates }
    }))
  }

  const updateRetention = (updates: Partial<BackupConfigurationData['retention']>) => {
    setConfig(prev => ({
      ...prev,
      retention: { ...prev.retention, ...updates }
    }))
  }

  const updateEncryption = (updates: Partial<BackupConfigurationData['encryption']>) => {
    setConfig(prev => ({
      ...prev,
      encryption: { ...prev.encryption, ...updates }
    }))
  }

  const getScheduleDescription = () => {
    const { frequency, time, dayOfWeek, dayOfMonth } = config.schedule
    
    switch (frequency) {
      case 'hourly':
        return 'Every hour, 24/7'
      case 'daily':
        return `Daily at ${time}`
      case 'weekly':
        return `Weekly on ${DAYS_OF_WEEK[dayOfWeek || 0]} at ${time}`
      case 'monthly':
        return `Monthly on day ${dayOfMonth || 1} at ${time}`
      default:
        return 'Custom schedule'
    }
  }

  const estimateBackupFrequency = () => {
    const sourceCount = sources.length
    const { frequency } = config.schedule
    
    const multipliers = {
      hourly: 24 * 30, // per month
      daily: 30,
      weekly: 4,
      monthly: 1
    }
    
    return sourceCount * multipliers[frequency]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Configure Your Backup</h3>
            <p className="text-sm text-muted-foreground">
              Set up scheduling, notifications, and security preferences
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Give your backup a name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceName">Backup Name *</Label>
            <Input
              id="sourceName"
              value={config.sourceName}
              onChange={(e) => updateConfig({ sourceName: e.target.value })}
              placeholder={`${platform.displayName || platform.name} Backup`}
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name to identify this backup configuration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceDescription">Description (Optional)</Label>
            <Textarea
              id="sourceDescription"
              value={config.sourceDescription}
              onChange={(e) => updateConfig({ sourceDescription: e.target.value })}
              placeholder="Optional description for this backup"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Backup Schedule
              </CardTitle>
              <CardDescription>
                Configure when backups should run automatically
              </CardDescription>
            </div>
            <Switch
              checked={config.schedule.enabled}
              onCheckedChange={(enabled) => updateSchedule({ enabled })}
            />
          </div>
        </CardHeader>
        
        {config.schedule.enabled && (
          <CardContent className="space-y-4">
            {/* Frequency Selection */}
            <div className="grid gap-3">
              {FREQUENCY_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    config.schedule.frequency === option.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-muted"
                  )}
                  onClick={() => updateSchedule({ frequency: option.value as any })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {config.schedule.frequency === option.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Time and Day Configuration */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Time */}
              {config.schedule.frequency !== 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={config.schedule.time}
                      onChange={(e) => updateSchedule({ time: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Timezone */}
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={config.schedule.timezone}
                  onValueChange={(timezone) => updateSchedule({ timezone })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Day of Week for Weekly */}
            {config.schedule.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={config.schedule.dayOfWeek?.toString()}
                  onValueChange={(value) => updateSchedule({ dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day of Month for Monthly */}
            {config.schedule.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  value={config.schedule.dayOfMonth || 1}
                  onChange={(e) => updateSchedule({ dayOfMonth: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            {/* Schedule Summary */}
            <Alert>
              <Timer className="h-4 w-4" />
              <AlertDescription>
                <strong>Schedule:</strong> {getScheduleDescription()}
                <br />
                <strong>Estimated backups per month:</strong> {estimateBackupFrequency()}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Get notified about backup status and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Success Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when backups complete successfully
              </p>
            </div>
            <Switch
              checked={config.notifications.onSuccess}
              onCheckedChange={(onSuccess) => updateNotifications({ onSuccess })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failure Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when backups fail or encounter errors
              </p>
            </div>
            <Switch
              checked={config.notifications.onFailure}
              onCheckedChange={(onFailure) => updateNotifications({ onFailure })}
            />
          </div>

          {/* Email Address */}
          {(config.notifications.onSuccess || config.notifications.onFailure) && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={config.notifications.email}
                onChange={(e) => updateNotifications({ email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          )}

          {/* Slack Integration */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Slack Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Send notifications to your Slack workspace
              </p>
            </div>
            <Switch
              checked={config.notifications.slack}
              onCheckedChange={(slack) => updateNotifications({ slack })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Retention
              </CardTitle>
              <CardDescription>
                How long to keep your backup data
              </CardDescription>
            </div>
            <Switch
              checked={config.retention.enabled}
              onCheckedChange={(enabled) => updateRetention({ enabled })}
            />
          </div>
        </CardHeader>
        
        {config.retention.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retention Period (Days)</Label>
              <Select
                value={config.retention.days.toString()}
                onValueChange={(value) => updateRetention({ days: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days (Recommended)</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="-1">Keep forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Older backups will be automatically deleted after this period
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Encryption */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Encryption
              </CardTitle>
              <CardDescription>
                Protect your data with encryption
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Encryption Level</Label>
            <div className="grid gap-3">
              <Card
                className={cn(
                  "cursor-pointer transition-all border-2",
                  config.encryption.level === 'standard'
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-muted"
                )}
                onClick={() => updateEncryption({ level: 'standard' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Standard (AES-256)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Industry-standard encryption for most use cases
                      </p>
                    </div>
                    {config.encryption.level === 'standard' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all border-2",
                  config.encryption.level === 'enhanced'
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-muted"
                )}
                onClick={() => updateEncryption({ level: 'enhanced' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Enhanced (AES-256 + Key Rotation)</span>
                        <Badge variant="outline" className="text-xs">
                          Premium
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Advanced encryption with automatic key rotation
                      </p>
                    </div>
                    {config.encryption.level === 'enhanced' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Schedule:</span>
              <span className="ml-2 font-medium">
                {config.schedule.enabled ? getScheduleDescription() : 'Manual only'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Notifications:</span>
              <span className="ml-2 font-medium">
                {config.notifications.onFailure || config.notifications.onSuccess ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Retention:</span>
              <span className="ml-2 font-medium">
                {config.retention.enabled ? `${config.retention.days} days` : 'Forever'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Encryption:</span>
              <span className="ml-2 font-medium capitalize">
                {config.encryption.level}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}