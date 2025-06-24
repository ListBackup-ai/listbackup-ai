'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { api } from '@listbackup/shared/api'
import { OnboardingWizard, WizardConfig } from './onboarding-wizard'
import { PlatformSelectionStep } from './steps/platform-selection-step'
import { OAuthConnectionStep } from './steps/oauth-connection-step'
import { DataSourceSelectionStep } from './steps/data-source-selection-step'
import { BackupConfigurationStep } from './steps/backup-configuration-step'
import { ReviewAndCreateStep } from './steps/review-and-create-step'

interface StreamlinedOnboardingFlowProps {
  onComplete?: (sourceId: string) => void
  onCancel?: () => void
  initialData?: any
}

export function StreamlinedOnboardingFlow({
  onComplete,
  onCancel,
  initialData = {}
}: StreamlinedOnboardingFlowProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()

  // Mutation for creating the backup source
  const createSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!currentAccount || !data.selectedConnection || !data.selectedSources?.length) {
        throw new Error('Missing required data for source creation')
      }

      // Create source for each selected platform source
      const sourcePromises = data.selectedSources.map((platformSource: any) => 
        api.sources.create({
          accountId: currentAccount.accountId,
          connectionId: data.selectedConnection.connectionId,
          platformSourceId: platformSource.platformSourceId,
          name: data.sourceName,
          description: data.sourceDescription,
          schedule: data.schedule?.enabled ? {
            frequency: data.schedule.frequency,
            time: data.schedule.time,
            dayOfWeek: data.schedule.dayOfWeek,
            dayOfMonth: data.schedule.dayOfMonth,
            timezone: data.schedule.timezone || currentAccount.settings?.timezone || 'UTC'
          } : undefined,
          notifications: {
            onSuccess: data.notifications?.onSuccess || false,
            onFailure: data.notifications?.onFailure || true,
            email: data.notifications?.email || currentAccount.email,
            slack: data.notifications?.slack || false,
            webhook: data.notifications?.webhook
          },
          retention: data.retention?.enabled ? {
            days: data.retention.days
          } : undefined,
          encryption: {
            enabled: data.encryption?.enabled ?? true,
            level: data.encryption?.level || 'standard'
          }
        })
      )

      return Promise.all(sourcePromises)
    },
    onSuccess: (sources) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
      
      toast({
        title: 'Backup created successfully!',
        description: `Created ${sources.length} backup source${sources.length > 1 ? 's' : ''}.`,
      })

      if (onComplete) {
        onComplete(sources[0].sourceId)
      } else {
        router.push('/dashboard/sources')
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create backup',
        description: error.message || 'There was an error creating your backup source.',
        variant: 'destructive',
      })
      throw error
    }
  })

  // Wizard configuration
  const wizardConfig: WizardConfig = {
    id: 'streamlined-onboarding',
    title: 'Set Up Your First Backup',
    description: 'Connect a platform and start backing up your data in minutes',
    enableStateRecovery: true,
    showProgress: true,
    showStepNumbers: false,
    allowStepSkipping: false,
    mobileOptimized: true,
    maxWidth: 'max-w-4xl',
    steps: [
      {
        id: 'platform-selection',
        title: 'Choose Platform',
        description: 'Select the platform you want to backup',
        component: PlatformSelectionStep,
        validation: (data) => {
          if (!data.selectedPlatform) {
            return 'Please select a platform to continue'
          }
          return true
        }
      },
      {
        id: 'connection-setup',
        title: 'Connect Account',
        description: 'Connect your account securely',
        component: OAuthConnectionStep,
        validation: (data) => {
          if (!data.selectedConnection) {
            return 'Please connect your account to continue'
          }
          return true
        },
        onEnter: async (data) => {
          // Pre-validate platform selection
          if (!data.selectedPlatform) {
            throw new Error('Platform selection is required')
          }
        }
      },
      {
        id: 'data-source-selection',
        title: 'Select Data',
        description: 'Choose what data to backup',
        component: DataSourceSelectionStep,
        validation: (data) => {
          if (!data.selectedSources || data.selectedSources.length === 0) {
            return 'Please select at least one data source'
          }
          return true
        },
        onEnter: async (data) => {
          // Pre-validate connection
          if (!data.selectedConnection) {
            throw new Error('Connection setup is required')
          }
        }
      },
      {
        id: 'configuration',
        title: 'Configure Backup',
        description: 'Set up schedule and preferences',
        component: BackupConfigurationStep,
        validation: (data) => {
          if (!data.sourceName?.trim()) {
            return 'Please provide a name for your backup'
          }
          if (data.schedule?.enabled && !data.schedule?.frequency) {
            return 'Please select a backup frequency'
          }
          return true
        },
        onEnter: async (data) => {
          // Pre-validate data source selection
          if (!data.selectedSources || data.selectedSources.length === 0) {
            throw new Error('Data source selection is required')
          }
        }
      },
      {
        id: 'review-and-create',
        title: 'Review & Create',
        description: 'Review your configuration and create the backup',
        component: ReviewAndCreateStep,
        validation: () => true,
        onEnter: async (data) => {
          // Final validation of all required data
          const requiredFields = [
            'selectedPlatform',
            'selectedConnection', 
            'selectedSources',
            'sourceName'
          ]
          
          for (const field of requiredFields) {
            if (!data[field]) {
              throw new Error(`Missing required field: ${field}`)
            }
          }
          
          if (data.selectedSources.length === 0) {
            throw new Error('At least one data source must be selected')
          }
        }
      }
    ],
    onComplete: async (data) => {
      await createSourceMutation.mutateAsync(data)
    },
    onCancel: () => {
      if (onCancel) {
        onCancel()
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <OnboardingWizard
          config={wizardConfig}
          initialData={initialData}
        />
      </div>
    </div>
  )
}

// Export individual components for reuse
export {
  PlatformSelectionStep,
  OAuthConnectionStep,
  DataSourceSelectionStep,
  BackupConfigurationStep,
  ReviewAndCreateStep
}