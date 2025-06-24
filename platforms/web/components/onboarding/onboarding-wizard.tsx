'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Clock,
  Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { OnboardingErrorBoundary } from './error-boundary'
import { MobileWizard, useIsMobile } from './mobile-wizard'

// Wizard Step Interface
export interface WizardStep {
  id: string
  title: string
  description: string
  isOptional?: boolean
  canSkip?: boolean
  component: React.ComponentType<WizardStepProps>
  validation?: (data: any) => boolean | string
  onEnter?: (data: any) => Promise<void> | void
  onExit?: (data: any) => Promise<void> | void
}

// Wizard Step Props
export interface WizardStepProps {
  data: any
  setData: (data: any) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
  isLoading?: boolean
  setLoading?: (loading: boolean) => void
  wizard: WizardContextType
}

// Wizard Context
export interface WizardContextType {
  currentStepIndex: number
  totalSteps: number
  progress: number
  data: any
  setData: (data: any) => void
  goToStep: (stepIndex: number) => void
  nextStep: () => void
  previousStep: () => void
  completeWizard: () => void
  cancelWizard: () => void
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
  isLoading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

// Wizard State Store
interface WizardStateStore {
  wizardId: string | null
  currentStepIndex: number
  data: any
  completedSteps: string[]
  startedAt: number | null
  lastActiveAt: number | null
  setWizardState: (wizardId: string, stepIndex: number, data: any) => void
  markStepCompleted: (stepId: string) => void
  clearWizardState: () => void
  canResumeWizard: () => boolean
  getResumeData: () => { stepIndex: number; data: any } | null
}

const useWizardStateStore = create<WizardStateStore>()(
  persist(
    (set, get) => ({
      wizardId: null,
      currentStepIndex: 0,
      data: {},
      completedSteps: [],
      startedAt: null,
      lastActiveAt: null,
      
      setWizardState: (wizardId, stepIndex, data) => {
        const now = Date.now()
        set({
          wizardId,
          currentStepIndex: stepIndex,
          data,
          lastActiveAt: now,
          startedAt: get().startedAt || now,
        })
      },
      
      markStepCompleted: (stepId) => {
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, stepId])]
        }))
      },
      
      clearWizardState: () => {
        set({
          wizardId: null,
          currentStepIndex: 0,
          data: {},
          completedSteps: [],
          startedAt: null,
          lastActiveAt: null,
        })
      },
      
      canResumeWizard: () => {
        const state = get()
        if (!state.wizardId || !state.lastActiveAt) return false
        
        // Allow resume within 24 hours
        const timeSinceLastActive = Date.now() - state.lastActiveAt
        return timeSinceLastActive < 24 * 60 * 60 * 1000
      },
      
      getResumeData: () => {
        const state = get()
        if (!state.canResumeWizard()) return null
        
        return {
          stepIndex: state.currentStepIndex,
          data: state.data
        }
      }
    }),
    {
      name: 'wizard-state',
      partialize: (state) => ({
        wizardId: state.wizardId,
        currentStepIndex: state.currentStepIndex,
        data: state.data,
        completedSteps: state.completedSteps,
        startedAt: state.startedAt,
        lastActiveAt: state.lastActiveAt,
      }),
    }
  )
)

// Wizard Configuration
export interface WizardConfig {
  id: string
  title: string
  description?: string
  steps: WizardStep[]
  onComplete: (data: any) => Promise<void> | void
  onCancel?: () => void
  enableStateRecovery?: boolean
  showProgress?: boolean
  showStepNumbers?: boolean
  allowStepSkipping?: boolean
  mobileOptimized?: boolean
  maxWidth?: string
}

// Resume Dialog Component
function ResumeWizardDialog({ 
  onResume, 
  onStartOver,
  resumeData 
}: {
  onResume: () => void
  onStartOver: () => void
  resumeData: { stepIndex: number; data: any }
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Resume Setup?</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            We found a previous setup session. Would you like to continue where you left off?
          </p>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Step {resumeData.stepIndex + 1} of your setup
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onStartOver}
              className="flex-1"
            >
              Start Over
            </Button>
            <Button 
              onClick={onResume}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Step Indicator Component
function StepIndicator({ 
  steps, 
  currentStepIndex, 
  completedSteps,
  showNumbers = true,
  isMobile = false 
}: {
  steps: WizardStep[]
  currentStepIndex: number
  completedSteps: string[]
  showNumbers?: boolean
  isMobile?: boolean
}) {
  if (isMobile) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentStepIndex 
                ? "bg-primary w-6" 
                : completedSteps.includes(step.id)
                  ? "bg-green-500"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex items-center">
            {/* Step Circle */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                index === currentStepIndex
                  ? "bg-primary border-primary text-primary-foreground"
                  : completedSteps.includes(step.id)
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-background border-muted text-muted-foreground"
              )}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : showNumbers ? (
                index + 1
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            
            {/* Step Label */}
            <div className="ml-2 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                index === currentStepIndex ? "text-primary" : "text-muted-foreground"
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-muted mx-4" />
          )}
        </div>
      ))}
    </div>
  )
}

// Progress Bar Component
function WizardProgress({ 
  progress, 
  currentStep, 
  totalSteps,
  showPercentage = true,
  animated = true 
}: {
  progress: number
  currentStep: number
  totalSteps: number
  showPercentage?: boolean
  animated?: boolean
}) {
  return (
    <div className="space-y-2">
      <Progress 
        value={progress} 
        className={cn(
          "h-2 transition-all duration-300",
          animated && "animate-pulse"
        )} 
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        {showPercentage && (
          <span>{Math.round(progress)}% complete</span>
        )}
      </div>
    </div>
  )
}

// Error Display Component
function WizardError({ 
  error, 
  onRetry,
  onDismiss 
}: {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
}) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2 ml-4">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-6 px-2 text-xs"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Main Wizard Component
export function OnboardingWizard({
  config,
  initialData = {},
  className
}: {
  config: WizardConfig
  initialData?: any
  className?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const stateStore = useWizardStateStore()
  const isMobile = useIsMobile()
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  // Check for resume data on mount
  useEffect(() => {
    if (config.enableStateRecovery) {
      const resumeData = stateStore.getResumeData()
      if (resumeData && stateStore.wizardId === config.id) {
        setShowResumeDialog(true)
      }
    }
  }, [config.id, config.enableStateRecovery, stateStore])

  // Save state on changes
  useEffect(() => {
    if (config.enableStateRecovery) {
      stateStore.setWizardState(config.id, currentStepIndex, data)
    }
  }, [config.id, config.enableStateRecovery, currentStepIndex, data, stateStore])

  const currentStep = config.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / config.steps.length) * 100
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === config.steps.length - 1

  // Validation logic
  const canProceed = useCallback(() => {
    if (!currentStep.validation) return true
    
    const result = currentStep.validation(data)
    if (typeof result === 'string') {
      setError(result)
      return false
    }
    
    if (result === false) {
      setError('Please complete all required fields')
      return false
    }
    
    setError(null)
    return true
  }, [currentStep, data])

  // Navigation handlers
  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= config.steps.length) return
    
    const targetStep = config.steps[stepIndex]
    
    // Call onExit for current step
    if (currentStep.onExit) {
      try {
        setIsLoading(true)
        await currentStep.onExit(data)
      } catch (error: any) {
        setError(error.message || 'Failed to exit step')
        return
      } finally {
        setIsLoading(false)
      }
    }
    
    // Call onEnter for target step
    if (targetStep.onEnter) {
      try {
        setIsLoading(true)
        await targetStep.onEnter(data)
      } catch (error: any) {
        setError(error.message || 'Failed to enter step')
        return
      } finally {
        setIsLoading(false)
      }
    }
    
    setCurrentStepIndex(stepIndex)
    setError(null)
  }, [config.steps, currentStep, data])

  const nextStep = useCallback(async () => {
    if (!canProceed()) return
    
    // Mark current step as completed
    stateStore.markStepCompleted(currentStep.id)
    
    if (isLastStep) {
      await completeWizard()
    } else {
      await goToStep(currentStepIndex + 1)
    }
  }, [canProceed, currentStep.id, isLastStep, currentStepIndex, goToStep, stateStore])

  const previousStep = useCallback(async () => {
    if (!isFirstStep) {
      await goToStep(currentStepIndex - 1)
    }
  }, [isFirstStep, currentStepIndex, goToStep])

  const completeWizard = useCallback(async () => {
    try {
      setIsLoading(true)
      await config.onComplete(data)
      
      // Clear state on successful completion
      if (config.enableStateRecovery) {
        stateStore.clearWizardState()
      }
      
      toast({
        title: 'Setup Complete!',
        description: 'Your configuration has been saved successfully.',
      })
    } catch (error: any) {
      setError(error.message || 'Failed to complete setup')
      toast({
        title: 'Setup Failed',
        description: error.message || 'There was an error completing your setup.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [config, data, stateStore, toast])

  const cancelWizard = useCallback(() => {
    if (config.enableStateRecovery) {
      stateStore.clearWizardState()
    }
    
    if (config.onCancel) {
      config.onCancel()
    } else {
      router.back()
    }
  }, [config, router, stateStore])

  const handleResume = useCallback(() => {
    const resumeData = stateStore.getResumeData()
    if (resumeData) {
      setCurrentStepIndex(resumeData.stepIndex)
      setData({ ...initialData, ...resumeData.data })
    }
    setShowResumeDialog(false)
  }, [stateStore, initialData])

  const handleStartOver = useCallback(() => {
    stateStore.clearWizardState()
    setCurrentStepIndex(0)
    setData(initialData)
    setError(null)
    setShowResumeDialog(false)
  }, [stateStore, initialData])

  // Wizard context
  const wizardContext: WizardContextType = {
    currentStepIndex,
    totalSteps: config.steps.length,
    progress,
    data,
    setData,
    goToStep,
    nextStep,
    previousStep,
    completeWizard,
    cancelWizard,
    isFirstStep,
    isLastStep,
    canProceed: canProceed(),
    isLoading,
    setLoading: setIsLoading,
    error,
    setError,
  }

  const CurrentStepComponent = currentStep.component

  // Use mobile wizard for mobile devices
  if (isMobile && config.mobileOptimized) {
    return (
      <OnboardingErrorBoundary>
        <MobileWizard 
          config={config}
          initialData={initialData}
          className={className}
        />
      </OnboardingErrorBoundary>
    )
  }

  return (
    <OnboardingErrorBoundary>
      <div className={cn(
        "mx-auto space-y-6",
        config.maxWidth || "max-w-4xl",
        className
      )}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{config.title}</h1>
          {config.description && (
            <p className="text-muted-foreground">{config.description}</p>
          )}
        </div>

        {/* Progress */}
        {config.showProgress && (
          <WizardProgress
            progress={progress}
            currentStep={currentStepIndex + 1}
            totalSteps={config.steps.length}
            animated={isLoading}
          />
        )}

        {/* Step Indicator */}
        <StepIndicator
          steps={config.steps}
          currentStepIndex={currentStepIndex}
          completedSteps={stateStore.completedSteps}
          showNumbers={config.showStepNumbers}
          isMobile={isMobile}
        />

        {/* Error Display */}
        {error && (
          <WizardError
            error={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Step Header */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold">{currentStep.title}</h2>
                  {currentStep.isOptional && (
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentStep.description}
                </p>
              </div>

              {/* Step Component */}
              <div className="min-h-[300px]">
                <CurrentStepComponent
                  data={data}
                  setData={setData}
                  onNext={nextStep}
                  onBack={previousStep}
                  canProceed={canProceed()}
                  isLoading={isLoading}
                  setLoading={setIsLoading}
                  wizard={wizardContext}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={isFirstStep ? cancelWizard : previousStep}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFirstStep ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center space-x-2">
            {currentStep.canSkip && config.allowStepSkipping && (
              <Button
                variant="ghost"
                onClick={nextStep}
                disabled={isLoading}
              >
                Skip
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
              {isLastStep && <Zap className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Resume Dialog */}
      {showResumeDialog && (
        <ResumeWizardDialog
          onResume={handleResume}
          onStartOver={handleStartOver}
          resumeData={stateStore.getResumeData()!}
        />
      )}
    </OnboardingErrorBoundary>
  )
}

// Export wizard hook for context access
export function useWizardContext(): WizardContextType {
  throw new Error('useWizardContext must be used within a WizardStep component')
}