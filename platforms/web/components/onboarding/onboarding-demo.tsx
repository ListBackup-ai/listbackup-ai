'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play,
  Smartphone,
  Monitor,
  Zap,
  CheckCircle2,
  Info,
  Settings,
  Users,
  Clock
} from 'lucide-react'
import { StreamlinedOnboardingFlow } from './streamlined-onboarding-flow'
import { cn } from '@/lib/utils'

interface OnboardingDemoProps {
  className?: string
}

export function OnboardingDemo({ className }: OnboardingDemoProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [demoMode, setDemoMode] = useState<'desktop' | 'mobile'>('desktop')
  const [completedDemo, setCompletedDemo] = useState(false)

  const handleStartDemo = () => {
    setShowOnboarding(true)
    setCompletedDemo(false)
  }

  const handleCompleteDemo = (sourceId: string) => {
    console.log('Demo completed with source ID:', sourceId)
    setCompletedDemo(true)
    setShowOnboarding(false)
  }

  const handleCancelDemo = () => {
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return (
      <div className={cn(
        "min-h-screen",
        demoMode === 'mobile' && "max-w-sm mx-auto border-x border-muted",
        className
      )}>
        <StreamlinedOnboardingFlow
          onComplete={handleCompleteDemo}
          onCancel={handleCancelDemo}
          initialData={{
            // Pre-populate some demo data for faster testing
            sourceName: 'Demo Backup',
            sourceDescription: 'This is a demonstration backup configuration'
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn("container mx-auto py-8 space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Onboarding Flow Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the streamlined onboarding process that gets users from platform selection 
          to successful backup in under 5 minutes.
        </p>
      </div>

      {/* Success State */}
      {completedDemo && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Demo completed successfully!</strong> The onboarding flow created a backup source 
            and would normally redirect to the dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Lightning Fast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete setup in under 5 minutes with our streamlined wizard flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Mobile Optimized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fully responsive design with mobile-specific UI patterns and gestures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              Smart Defaults
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Intelligent defaults based on platform type and user preferences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              OAuth Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Secure OAuth2 flows with real-time connection status and error handling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              State Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Resume interrupted setups with automatic state persistence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Real-time progress indicators and step validation with clear feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Try the Demo
          </CardTitle>
          <CardDescription>
            Experience the complete onboarding flow in different modes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Demo Mode:</label>
            <div className="flex gap-2">
              <Button
                variant={demoMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDemoMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={demoMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDemoMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Start Demo */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Ready to start?</h4>
              <p className="text-sm text-muted-foreground">
                This will launch the {demoMode} onboarding experience
              </p>
            </div>
            <Button onClick={handleStartDemo}>
              <Play className="h-4 w-4 mr-2" />
              Start Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Highlights</CardTitle>
          <CardDescription>
            Key features and technical details of the onboarding system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Wizard Framework</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reusable wizard component system</li>
                <li>• Type-safe step definitions</li>
                <li>• Built-in validation and error handling</li>
                <li>• Zustand-based state management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Mobile Experience</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Responsive design patterns</li>
                <li>• Touch-optimized interactions</li>
                <li>• Mobile-specific navigation</li>
                <li>• Progressive enhancement</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">User Experience</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Step-by-step guidance</li>
                <li>• Real-time progress tracking</li>
                <li>• Contextual help and tooltips</li>
                <li>• Error recovery mechanisms</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Code splitting for each step</li>
                <li>• Optimistic UI updates</li>
                <li>• Efficient state persistence</li>
                <li>• Minimal bundle size impact</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This demo showcases the core onboarding flow. In production, it would integrate 
              with real OAuth providers, platform APIs, and backend services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}