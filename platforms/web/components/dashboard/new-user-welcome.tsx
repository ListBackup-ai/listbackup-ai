'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Zap, 
  Shield, 
  Users, 
  ArrowRight,
  Database,
  CreditCard,
  Mail,
  MessageSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NewUserWelcome() {
  const router = useRouter()

  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure Data Backup',
      description: 'Enterprise-grade encryption for all your business data'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Automated Syncing',
      description: 'Set it and forget it - automatic daily backups'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Multiple Integrations',
      description: 'Connect Keap, Stripe, GoHighLevel, and more'
    }
  ]

  const quickStartSteps = [
    {
      icon: <Database className="h-6 w-6 text-blue-600" />,
      title: 'Connect Your First Integration',
      description: 'Start with Keap, Stripe, or any supported platform',
      action: () => router.push('/dashboard/sources?tab=integrations')
    },
    {
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      title: 'Stripe Integration',
      description: 'Backup your payment data and customer records',
      action: () => router.push('/dashboard/sources?tab=integrations')
    },
    {
      icon: <Mail className="h-6 w-6 text-green-600" />,
      title: 'Email Marketing Data',
      description: 'Connect ActiveCampaign or MailChimp',
      action: () => router.push('/dashboard/sources?tab=integrations')
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-blue-500" />,
      title: 'CRM Data Backup',
      description: 'Secure your Keap or GoHighLevel data',
      action: () => router.push('/dashboard/sources?tab=integrations')
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ListBackup.ai!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Secure, automated backups for your business-critical data. Get started in minutes with our easy setup process.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Choose your integration to start backing up your data in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickStartSteps.map((step, index) => (
              <div 
                key={index}
                onClick={step.action}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex-shrink-0 mt-1">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => router.push('/dashboard/sources?tab=integrations')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Database className="h-5 w-5 mr-2" />
          Connect Your First Integration
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Start with any platform - setup takes less than 2 minutes
        </p>
      </div>
    </div>
  )
}