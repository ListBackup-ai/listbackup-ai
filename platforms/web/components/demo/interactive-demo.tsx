'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight,
  Database,
  Shield,
  Zap,
  BarChart3,
  Users,
  Globe,
  Calendar,
  MessageSquare,
  CreditCard,
  FileText,
  TrendingUp
} from 'lucide-react'

interface DemoStep {
  id: string
  title: string
  description: string
  duration: number
  component: React.ReactNode
  highlight?: string
}

const sampleData = {
  keap: {
    contacts: 15429,
    campaigns: 47,
    orders: 8394,
    revenue: '$1,247,892'
  },
  stripe: {
    customers: 5832,
    transactions: 12847,
    revenue: '$2,847,293',
    subscriptions: 1429
  },
  ghl: {
    leads: 9847,
    funnels: 23,
    appointments: 1293,
    workflows: 15
  }
}

const demoSteps: DemoStep[] = [
  {
    id: 'overview',
    title: 'Platform Overview',
    description: 'Welcome to ListBackup.ai - see how easy it is to protect your business data',
    duration: 3000,
    component: (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Your Data Dashboard</h3>
          <p className="text-muted-foreground">Monitor all your integrated platforms from one place</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Keap', icon: Users, color: 'bg-orange-500', status: 'Connected' },
            { name: 'Stripe', icon: CreditCard, color: 'bg-purple-500', status: 'Connected' },
            { name: 'GoHighLevel', icon: Globe, color: 'bg-green-500', status: 'Connected' }
          ].map((platform, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <platform.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold">{platform.name}</h4>
                <Badge variant="secondary" className="text-xs mt-1">{platform.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'keap-data',
    title: 'Keap Data Backup',
    description: 'See how we automatically backup all your Keap CRM data',
    duration: 4000,
    component: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Keap CRM Backup</h3>
            <p className="text-sm text-muted-foreground">Real-time synchronization active</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Contacts', value: sampleData.keap.contacts.toLocaleString(), icon: Users },
            { label: 'Campaigns', value: sampleData.keap.campaigns.toString(), icon: MessageSquare },
            { label: 'Orders', value: sampleData.keap.orders.toLocaleString(), icon: FileText },
            { label: 'Revenue', value: sampleData.keap.revenue, icon: TrendingUp }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Last backup: 2 minutes ago</span>
        </div>
      </div>
    )
  },
  {
    id: 'stripe-security',
    title: 'Stripe Security',
    description: 'Your payment data is protected with bank-level encryption',
    duration: 4000,
    component: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Stripe Payment Data</h3>
            <p className="text-sm text-muted-foreground">PCI DSS Compliant Backup</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Customers', value: sampleData.stripe.customers.toLocaleString(), icon: Users },
            { label: 'Transactions', value: sampleData.stripe.transactions.toLocaleString(), icon: CreditCard },
            { label: 'Revenue', value: sampleData.stripe.revenue, icon: TrendingUp },
            { label: 'Subscriptions', value: sampleData.stripe.subscriptions.toLocaleString(), icon: RotateCcw }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-2">
          {[
            'AES-256 Encryption Active',
            'PCI DSS Level 1 Compliant',
            'SOC 2 Type II Certified'
          ].map((security, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>{security}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'ghl-agency',
    title: 'GoHighLevel Agency Features',
    description: 'Manage multiple client accounts with white-label solutions',
    duration: 4000,
    component: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">GoHighLevel Agency Dashboard</h3>
            <p className="text-sm text-muted-foreground">Multi-client backup management</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads', value: sampleData.ghl.leads.toLocaleString(), icon: Users },
            { label: 'Funnels', value: sampleData.ghl.funnels.toString(), icon: Globe },
            { label: 'Appointments', value: sampleData.ghl.appointments.toLocaleString(), icon: Calendar },
            { label: 'Workflows', value: sampleData.ghl.workflows.toString(), icon: Zap }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Agency Benefits</h4>
          <ul className="space-y-1 text-sm">
            {[
              'White-label dashboard for clients',
              'Bulk backup operations across accounts',
              'Agency-wide compliance reporting',
              'Volume pricing discounts'
            ].map((benefit, index) => (
              <li key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Gain insights into your data patterns and backup performance',
    duration: 4000,
    component: (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">Data insights and performance metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h4 className="font-semibold">Backup Performance</h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-bold text-green-600">99.97%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Backup Time</span>
                  <span className="font-bold">2.3 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Processed</span>
                  <span className="font-bold">247 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h4 className="font-semibold">Platform Health</h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { platform: 'Keap', status: 'Healthy', color: 'text-green-600' },
                  { platform: 'Stripe', status: 'Healthy', color: 'text-green-600' },
                  { platform: 'GoHighLevel', status: 'Healthy', color: 'text-green-600' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.platform}</span>
                    <span className={`font-bold ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'completion',
    title: 'Demo Complete',
    description: 'Ready to protect your business data? Start your free trial today!',
    duration: 5000,
    component: (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Demo Complete!</h3>
          <p className="text-muted-foreground">
            You've seen how ListBackup.ai can protect your business data with enterprise-grade security and automation.
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              '✓ 50+ Platform Integrations',
              '✓ Bank-Level Security',
              '✓ Real-time Synchronization',
              '✓ Compliance Ready',
              '✓ White-Label Solutions',
              '✓ 24/7 Expert Support'
            ].map((feature, index) => (
              <div key={index} className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
]

export function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentStep < demoSteps.length) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (demoSteps[currentStep].duration / 100))
          if (newProgress >= 100) {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep(currentStep + 1)
              return 0
            } else {
              setIsPlaying(false)
              return 100
            }
          }
          return newProgress
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep])

  const handlePlay = () => setIsPlaying(!isPlaying)
  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setProgress(0)
    }
  }
  const handleReset = () => {
    setCurrentStep(0)
    setProgress(0)
    setIsPlaying(false)
  }

  const currentStepData = demoSteps[currentStep]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Demo Controls */}
      <div className="mb-8 p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Interactive Demo</h3>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {demoSteps.length}: {currentStepData.title}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handlePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={handleNext} disabled={currentStep >= demoSteps.length - 1}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Step Navigation */}
        <div className="flex items-center justify-between mt-4">
          {demoSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => {
                setCurrentStep(index)
                setProgress(0)
                setIsPlaying(false)
              }}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index === currentStep 
                  ? 'bg-primary text-white' 
                  : index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
            <Badge variant="outline">
              {Math.ceil((demoSteps[currentStep].duration - (progress * demoSteps[currentStep].duration / 100)) / 1000)}s
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentStepData.component}
        </CardContent>
      </Card>

      {/* Call to Action */}
      {currentStep === demoSteps.length - 1 && (
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/contact">
                Schedule Personal Demo
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      )}
    </div>
  )
}