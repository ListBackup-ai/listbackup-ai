'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2,
  Clock,
  Shield,
  Bell,
  Calendar,
  Database,
  Users,
  ShoppingCart,
  Mail,
  FileText,
  DollarSign,
  Activity,
  Info,
  Zap,
  Edit3,
  Play,
  Loader2
} from 'lucide-react'
import { Platform, PlatformConnection, PlatformSource } from '@listbackup/shared/api'
import { WizardStepProps } from '../onboarding-wizard'
import { cn } from '@/lib/utils'

interface ReviewData {
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
  }
  retention: {
    enabled: boolean
    days: number
  }
  encryption: {
    enabled: boolean
    level: 'standard' | 'enhanced'
  }
  estimatedSize?: number
  estimatedTime?: number
}

// Icon mapping for different data types
const getDataTypeIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    contacts: <Users className="h-4 w-4" />,
    customers: <Users className="h-4 w-4" />,
    orders: <ShoppingCart className="h-4 w-4" />,
    products: <Database className="h-4 w-4" />,
    emails: <Mail className="h-4 w-4" />,
    campaigns: <Mail className="h-4 w-4" />,
    files: <FileText className="h-4 w-4" />,
    events: <Calendar className="h-4 w-4" />,
    transactions: <DollarSign className="h-4 w-4" />,
    analytics: <Activity className="h-4 w-4" />,
    default: <Database className="h-4 w-4" />
  }
  
  return iconMap[type.toLowerCase()] || iconMap.default
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export function ReviewAndCreateStep({ 
  data, 
  setData, 
  onNext,
  canProceed,
  isLoading,
  setLoading,
  wizard
}: WizardStepProps) {
  const [creationProgress, setCreationProgress] = useState(0)
  const [creationStep, setCreationStep] = useState('')
  
  const reviewData = data as ReviewData
  const {
    selectedPlatform,
    selectedConnection,
    selectedSources,
    sourceName,
    sourceDescription,
    schedule,
    notifications,
    retention,
    encryption,
    estimatedSize = 0,
    estimatedTime = 0
  } = reviewData

  const getScheduleDescription = () => {
    if (!schedule.enabled) return 'Manual backups only'
    
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule
    
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

  const getNotificationSummary = () => {
    const types = []
    if (notifications.onSuccess) types.push('Success')
    if (notifications.onFailure) types.push('Failure')
    if (notifications.slack) types.push('Slack')
    
    return types.length > 0 ? types.join(', ') : 'None'
  }

  const handleCreateBackup = async () => {
    try {
      setLoading?.(true)
      setCreationProgress(0)
      
      // Simulate creation steps with progress
      const steps = [
        { step: 'Validating connection...', progress: 20 },
        { step: 'Creating backup configuration...', progress: 40 },
        { step: 'Setting up data sources...', progress: 60 },
        { step: 'Configuring schedule...', progress: 80 },
        { step: 'Finalizing setup...', progress: 100 }
      ]

      for (const { step, progress } of steps) {
        setCreationStep(step)
        setCreationProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Complete the wizard
      await wizard.completeWizard()
      
    } catch (error) {
      console.error('Failed to create backup:', error)
    } finally {
      setLoading?.(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold">Review Your Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Review your backup setup before creating
            </p>
          </div>
        </div>
      </div>

      {/* Creation Progress */}
      {isLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <h4 className="font-medium">Creating Your Backup</h4>
                  <p className="text-sm text-muted-foreground">{creationStep}</p>
                </div>
              </div>
              <Progress value={creationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {creationProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform & Connection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Platform & Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img 
              src={selectedPlatform.logo || `https://logo.clearbit.com/${selectedPlatform.company.toLowerCase()}.com`}
              alt={selectedPlatform.company}
              className="w-12 h-12 rounded-lg object-contain"
            />
            <div>
              <h4 className="font-medium">
                {selectedPlatform.displayName || selectedPlatform.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {selectedPlatform.company}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connection:</span>
              <span className="font-medium">{selectedConnection.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-500">
                {selectedConnection.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5" />
            Selected Data Sources
          </CardTitle>
          <CardDescription>
            {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {selectedSources.map((source) => (
              <div key={source.platformSourceId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
                  {getDataTypeIcon(source.sourceType)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{source.displayName}</p>
                  <p className="text-xs text-muted-foreground">{source.sourceType}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-center">
            <div>
              <div className="text-lg font-bold text-primary">~{estimatedSize}MB</div>
              <div className="text-xs text-muted-foreground">Estimated Size</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">~{estimatedTime}min</div>
              <div className="text-xs text-muted-foreground">Backup Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">{sourceName}</span>
            </div>
            {sourceDescription && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="text-sm">{sourceDescription}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Schedule:</span>
              </div>
              <span className="text-sm font-medium">{getScheduleDescription()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Notifications:</span>
              </div>
              <span className="text-sm font-medium">{getNotificationSummary()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Retention:</span>
              </div>
              <span className="text-sm font-medium">
                {retention.enabled ? `${retention.days} days` : 'Forever'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Encryption:</span>
              </div>
              <span className="text-sm font-medium capitalize">{encryption.level}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Edit Options */}
      {!isLoading && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Need to Make Changes?
            </CardTitle>
            <CardDescription>
              You can go back to any step to modify your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => wizard.goToStep(0)}
                className="text-xs"
              >
                Platform
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => wizard.goToStep(1)}
                className="text-xs"
              >
                Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => wizard.goToStep(2)}
                className="text-xs"
              >
                Data Sources
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => wizard.goToStep(3)}
                className="text-xs"
              >
                Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>What happens next:</strong> Your backup will be created and{' '}
          {schedule.enabled ? 'scheduled to run automatically' : 'ready for manual execution'}.
          You can monitor progress and manage settings from your dashboard.
        </AlertDescription>
      </Alert>

      {/* Create Button */}
      {!isLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <h4 className="font-medium mb-2">Ready to Create Your Backup?</h4>
              <p className="text-sm text-muted-foreground">
                This will create your backup configuration and{' '}
                {schedule.enabled ? 'start the first backup' : 'make it ready for manual execution'}.
              </p>
            </div>
            
            <Button 
              onClick={handleCreateBackup}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Play className="h-4 w-4 mr-2" />
              Create Backup Source
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {creationProgress === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Backup Created Successfully!</h4>
              <p className="text-sm text-green-700">
                Your {selectedPlatform.displayName || selectedPlatform.name} backup is now configured and ready.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}