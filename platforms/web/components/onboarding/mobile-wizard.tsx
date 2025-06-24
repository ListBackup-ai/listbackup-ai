'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardConfig, WizardStepProps } from './onboarding-wizard'

interface MobileWizardProps {
  config: WizardConfig
  initialData?: any
  className?: string
}

export function MobileWizard({
  config,
  initialData = {},
  className
}: MobileWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStepList, setShowStepList] = useState(false)

  const currentStep = config.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / config.steps.length) * 100
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === config.steps.length - 1

  const canProceed = () => {
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
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= config.steps.length) return
    setCurrentStepIndex(stepIndex)
    setError(null)
    setShowStepList(false)
  }

  const nextStep = async () => {
    if (!canProceed()) return
    
    if (isLastStep) {
      try {
        setIsLoading(true)
        await config.onComplete(data)
      } catch (error: any) {
        setError(error.message || 'Failed to complete setup')
      } finally {
        setIsLoading(false)
      }
    } else {
      goToStep(currentStepIndex + 1)
    }
  }

  const previousStep = () => {
    if (!isFirstStep) {
      goToStep(currentStepIndex - 1)
    }
  }

  const CurrentStepComponent = currentStep.component

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={isFirstStep ? config.onCancel : previousStep}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFirstStep ? 'Cancel' : 'Back'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStepList(!showStepList)}
          >
            {showStepList ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {config.steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Step List Overlay */}
      {showStepList && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Steps</h3>
              <div className="space-y-2">
                {config.steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    disabled={index > currentStepIndex}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      index === currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : index < currentStepIndex
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {index < currentStepIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs opacity-75">{step.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Step Header */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold">{currentStep.title}</h1>
            <p className="text-sm text-muted-foreground">
              {currentStep.description}
            </p>
            {currentStep.isOptional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          <div className="pb-20">
            <CurrentStepComponent
              data={data}
              setData={setData}
              onNext={nextStep}
              onBack={previousStep}
              canProceed={canProceed()}
              isLoading={isLoading}
              setLoading={setIsLoading}
              wizard={{
                currentStepIndex,
                totalSteps: config.steps.length,
                progress,
                data,
                setData,
                goToStep,
                nextStep,
                previousStep,
                completeWizard: () => config.onComplete(data),
                cancelWizard: () => config.onCancel?.() || (() => {}),
                isFirstStep,
                isLastStep,
                canProceed: canProceed(),
                isLoading,
                setLoading: setIsLoading,
                error,
                setError,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex items-center justify-between gap-4">
          {currentStep.canSkip && config.allowStepSkipping && (
            <Button
              variant="ghost"
              onClick={nextStep}
              disabled={isLoading}
              className="text-sm"
            >
              Skip
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button
            onClick={nextStep}
            disabled={!canProceed() || isLoading}
            className="min-w-24"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && !isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook to detect mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}