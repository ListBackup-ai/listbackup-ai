'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
  Zap,
  Calendar,
  Clock
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  api, 
  Platform, 
  PlatformConnection, 
  PlatformSource 
} from '@listbackup/shared/api'
import { useQuery } from '@tanstack/react-query'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { ConnectionCreateDialog } from '@/components/platforms/connection-create-dialog'
import { PlatformSourcesSelector } from '@/components/platforms/platform-sources-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SourceCreationWizardProps {
  onComplete?: (sourceId: string) => void
  onCancel?: () => void
}

type WizardStep = 'platform' | 'connection' | 'sources' | 'configure' | 'review'

interface WizardState {
  selectedPlatform: Platform | null
  selectedConnection: PlatformConnection | null
  selectedSources: PlatformSource[]
  sourceName: string
  sourceDescription: string
  schedule: {
    enabled: boolean
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    email?: string
  }
}

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'platform', title: 'Select Platform', description: 'Choose the platform to backup from' },
  { id: 'connection', title: 'Choose Connection', description: 'Select or create a connection' },
  { id: 'sources', title: 'Select Data', description: 'Choose what data to backup' },
  { id: 'configure', title: 'Configure', description: 'Set up backup schedule and settings' },
  { id: 'review', title: 'Review & Create', description: 'Review your configuration' }
]

export function SourceCreationWizard({ onComplete, onCancel }: SourceCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('platform')
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()
  
  const [wizardState, setWizardState] = useState<WizardState>({
    selectedPlatform: null,
    selectedConnection: null,
    selectedSources: [],
    sourceName: '',
    sourceDescription: '',
    schedule: {
      enabled: true,
      frequency: 'daily',
      time: '02:00'
    },
    notifications: {
      onSuccess: false,
      onFailure: true
    }
  })

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const canProceed = () => {
    switch (currentStep) {
      case 'platform':
        return !!wizardState.selectedPlatform
      case 'connection':
        return !!wizardState.selectedConnection
      case 'sources':
        return wizardState.selectedSources.length > 0
      case 'configure':
        return !!wizardState.sourceName.trim()
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id)
    }
  }

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id)
    }
  }

  const handlePlatformSelect = (platform: Platform) => {
    setWizardState(prev => ({
      ...prev,
      selectedPlatform: platform,
      selectedConnection: null,
      selectedSources: []
    }))
  }

  const handleConnectionSelect = (connection: PlatformConnection) => {
    setWizardState(prev => ({
      ...prev,
      selectedConnection: connection
    }))
    handleNext()
  }

  const handleSourcesSelect = (sources: PlatformSource[]) => {
    setWizardState(prev => ({
      ...prev,
      selectedSources: sources
    }))
    handleNext()
  }

  const handleCreateSource = async () => {
    if (!currentAccount || !wizardState.selectedConnection || !wizardState.selectedSources.length) {
      return
    }

    setIsCreating(true)
    
    try {
      // Create source for each selected platform source
      const sourcePromises = wizardState.selectedSources.map(platformSource => 
        api.sources.create({
          accountId: currentAccount.accountId,
          connectionId: wizardState.selectedConnection!.connectionId,
          platformSourceId: platformSource.platformSourceId,
          name: wizardState.sourceName,
          description: wizardState.sourceDescription,
          schedule: wizardState.schedule.enabled ? {
            frequency: wizardState.schedule.frequency,
            time: wizardState.schedule.time,
            dayOfWeek: wizardState.schedule.dayOfWeek,
            dayOfMonth: wizardState.schedule.dayOfMonth,
            timezone: currentAccount.settings?.timezone || 'UTC'
          } : undefined,
          notifications: {
            ...wizardState.notifications,
            email: wizardState.notifications.email
          }
        })
      )

      const sources = await Promise.all(sourcePromises)
      
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      
      toast({
        title: 'Sources created successfully',
        description: `Created ${sources.length} backup source${sources.length > 1 ? 's' : ''}.`,
      })

      if (onComplete) {
        onComplete(sources[0].sourceId)
      } else {
        router.push('/dashboard/sources')
      }
    } catch (error: any) {
      toast({
        title: 'Creation failed',
        description: error.message || 'Failed to create backup sources',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'platform':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose a Platform</h3>
              <p className="text-sm text-muted-foreground">
                Select the platform you want to backup data from
              </p>
            </div>
            <PlatformGrid 
              onSelect={(platform) => {
                handlePlatformSelect(platform)
                handleNext()
              }}
            />
          </div>
        )

      case 'connection':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Connection</h3>
              <p className="text-sm text-muted-foreground">
                Choose an existing connection or create a new one for {wizardState.selectedPlatform?.name}
              </p>
            </div>

            <div className="space-y-4">
              {/* Existing Connections */}
              <ConnectionsList
                platformId={wizardState.selectedPlatform?.platformId || ''}
                onSelect={handleConnectionSelect}
                selectedId={wizardState.selectedConnection?.connectionId}
              />

              {/* Create New Connection */}
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Don't see your account? Create a new connection.
                    </p>
                    <Button onClick={() => setShowConnectionDialog(true)}>
                      Create New Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'sources':
        return (
          <PlatformSourcesSelector
            platformId={wizardState.selectedPlatform?.platformId || ''}
            connectionId={wizardState.selectedConnection?.connectionId || ''}
            onSelect={handleSourcesSelect}
            onCancel={() => handleBack()}
          />
        )

      case 'configure':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configure Backup</h3>
              <p className="text-sm text-muted-foreground">
                Set up your backup schedule and preferences
              </p>
            </div>

            <div className="space-y-4">
              {/* Source Name */}
              <div className="space-y-2">
                <Label htmlFor="sourceName">Backup Name *</Label>
                <Input
                  id="sourceName"
                  value={wizardState.sourceName}
                  onChange={(e) => setWizardState(prev => ({ ...prev, sourceName: e.target.value }))}
                  placeholder={`${wizardState.selectedPlatform?.name} Backup`}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for this backup configuration
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="sourceDescription">Description</Label>
                <Textarea
                  id="sourceDescription"
                  value={wizardState.sourceDescription}
                  onChange={(e) => setWizardState(prev => ({ ...prev, sourceDescription: e.target.value }))}
                  placeholder="Optional description for this backup"
                  rows={3}
                />
              </div>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Backup Schedule</CardTitle>
                      <CardDescription className="text-sm">
                        Automatically run backups on a schedule
                      </CardDescription>
                    </div>
                    <Switch
                      checked={wizardState.schedule.enabled}
                      onCheckedChange={(checked) => 
                        setWizardState(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, enabled: checked }
                        }))
                      }
                    />
                  </div>
                </CardHeader>
                {wizardState.schedule.enabled && (
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={wizardState.schedule.frequency}
                          onValueChange={(value: any) => 
                            setWizardState(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, frequency: value }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={wizardState.schedule.time}
                          onChange={(e) => 
                            setWizardState(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>

                    {wizardState.schedule.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Day of Week</Label>
                        <Select
                          value={wizardState.schedule.dayOfWeek?.toString()}
                          onValueChange={(value) => 
                            setWizardState(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, dayOfWeek: parseInt(value) }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {wizardState.schedule.frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min={1}
                          max={31}
                          value={wizardState.schedule.dayOfMonth || 1}
                          onChange={(e) => 
                            setWizardState(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, dayOfMonth: parseInt(e.target.value) || 1 }
                            }))
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <CardDescription className="text-sm">
                    Get notified about backup status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notif-success">Success Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when backups complete successfully
                      </p>
                    </div>
                    <Switch
                      id="notif-success"
                      checked={wizardState.notifications.onSuccess}
                      onCheckedChange={(checked) => 
                        setWizardState(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, onSuccess: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notif-failure">Failure Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when backups fail
                      </p>
                    </div>
                    <Switch
                      id="notif-failure"
                      checked={wizardState.notifications.onFailure}
                      onCheckedChange={(checked) => 
                        setWizardState(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, onFailure: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Review your backup configuration before creating
              </p>
            </div>

            <div className="space-y-4">
              {/* Platform & Connection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform & Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <span className="text-sm font-medium">{wizardState.selectedPlatform?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connection</span>
                    <span className="text-sm font-medium">{wizardState.selectedConnection?.name}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {wizardState.selectedSources.map((source) => (
                      <div key={source.platformSourceId} className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{source.displayName}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{wizardState.sourceName}</span>
                  </div>
                  {wizardState.sourceDescription && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Description</span>
                      <span className="text-sm">{wizardState.sourceDescription}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <span className="text-sm font-medium">
                      {wizardState.schedule.enabled 
                        ? `${wizardState.schedule.frequency} at ${wizardState.schedule.time}`
                        : 'Manual only'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Notifications</span>
                    <div className="flex gap-2">
                      {wizardState.notifications.onSuccess && (
                        <Badge variant="secondary" className="text-xs">Success</Badge>
                      )}
                      {wizardState.notifications.onFailure && (
                        <Badge variant="secondary" className="text-xs">Failure</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your backup will start running according to the schedule you've configured.
                  You can always modify these settings later.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index <= currentStepIndex ? "text-primary" : ""
              )}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? onCancel : handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center space-x-2">
          {currentStep === 'review' ? (
            <Button
              onClick={handleCreateSource}
              disabled={isCreating}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Backup Source
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Connection Creation Dialog */}
      {showConnectionDialog && wizardState.selectedPlatform && (
        <ConnectionCreateDialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
          preselectedPlatformId={wizardState.selectedPlatform.platformId || wizardState.selectedPlatform.id}
        />
      )}
    </div>
  )
}

// Helper component for connections list
function ConnectionsList({ 
  platformId, 
  onSelect, 
  selectedId 
}: { 
  platformId: string
  onSelect: (connection: PlatformConnection) => void
  selectedId?: string
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-connections', platformId],
    queryFn: () => api.platformConnections.list(platformId),
    enabled: !!platformId
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const connections = data?.connections || []

  if (connections.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label>Existing Connections</Label>
      <div className="grid gap-2">
        {connections.map((connection) => (
          <Card
            key={connection.connectionId}
            className={cn(
              "cursor-pointer transition-all",
              selectedId === connection.connectionId ? "ring-2 ring-primary" : "hover:shadow-md"
            )}
            onClick={() => onSelect(connection)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{connection.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Connected {new Date(connection.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
                  {connection.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Simple platform grid component
function PlatformGrid({ onSelect }: { onSelect: (platform: Platform) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: api.platforms.list,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const platforms = data?.platforms || []

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {platforms.map((platform) => (
        <Card
          key={platform.platformId || platform.id}
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => onSelect(platform)}
        >
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
              <img
                src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
                alt={platform.displayName || platform.title || platform.name}
                className="w-8 h-8 object-contain"
              />
            </div>
            <p className="font-medium">{platform.displayName || platform.title || platform.name}</p>
            <p className="text-xs text-muted-foreground">{platform.company}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}