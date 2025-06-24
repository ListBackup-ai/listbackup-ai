'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowRight, Sparkles, Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PricingPlan {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: string[]
  limitations?: string[]
  cta: string
  href: string
  popular?: boolean
  enterprise?: boolean
  icon: React.ElementType
  gradient: string
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: { monthly: 29, yearly: 24 },
    description: 'Perfect for small businesses getting started with data backup.',
    features: [
      'Up to 5 integrations',
      '10GB storage included',
      'Daily backups',
      'Email support',
      'Basic analytics',
      '30-day data retention',
      'Standard security'
    ],
    limitations: [
      'No real-time sync',
      'No custom retention',
      'No priority support'
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=starter',
    icon: Sparkles,
    gradient: 'from-blue-500/20 to-blue-600/20'
  },
  {
    name: 'Professional',
    price: { monthly: 79, yearly: 65 },
    description: 'Advanced features for growing businesses and agencies.',
    features: [
      'Up to 25 integrations',
      '100GB storage included',
      'Real-time sync',
      'Priority support',
      'Advanced analytics',
      '90-day data retention',
      'Enhanced security',
      'Custom webhooks',
      'API access',
      'Data export tools'
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=professional',
    popular: true,
    icon: Zap,
    gradient: 'from-purple-500/20 to-purple-600/20'
  },
  {
    name: 'Enterprise',
    price: { monthly: 299, yearly: 249 },
    description: 'Full-scale solution for large organizations with complex needs.',
    features: [
      'Unlimited integrations',
      '1TB+ storage',
      'Real-time sync',
      'Dedicated support',
      'Custom analytics',
      'Custom retention policies',
      'Enterprise security',
      'Custom webhooks',
      'Full API access',
      'Data migration services',
      'SSO integration',
      'Custom integrations',
      'SLA guarantees',
      'White-label options'
    ],
    cta: 'Contact Sales',
    href: '/contact?type=enterprise',
    enterprise: true,
    icon: Crown,
    gradient: 'from-yellow-500/20 to-orange-500/20'
  }
]

const enterpriseFeatures = [
  'Custom data retention policies',
  'Dedicated account manager',
  'Priority feature development',
  'Custom integration development',
  'Advanced compliance reporting',
  'Multi-region data storage'
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start with a 14-day free trial. No credit card required. Upgrade or downgrade anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden transition-all duration-500 border-0 bg-gradient-to-br from-background to-muted/20 ${
                plan.popular 
                  ? 'scale-105 md:scale-110 shadow-2xl shadow-primary/20 ring-2 ring-primary/20' 
                  : 'hover:shadow-xl hover:shadow-primary/10'
              } ${plan.enterprise ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="px-4 py-1 bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <CardHeader className="relative pb-8 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.gradient}`}>
                    <plan.icon className="w-6 h-6 text-foreground" />
                  </div>
                  {plan.enterprise && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Enterprise
                    </Badge>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /month
                  </span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-1">
                    Save ${(plan.price.monthly - plan.price.yearly) * 12}/year
                  </p>
                )}
              </CardHeader>

              <CardContent className="relative">
                <Button
                  size="lg"
                  className={`w-full mb-6 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Everything included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3 text-muted-foreground">Not included:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start space-x-3">
                            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full mt-1.5" />
                            </div>
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-background to-muted/20 border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Enterprise Add-ons</h3>
                <p className="text-muted-foreground">
                  Additional features available for Enterprise customers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">
            Questions about pricing?
          </h3>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you choose the right plan for your needs.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">
              Contact Sales
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}