'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Zap, 
  Cloud, 
  RefreshCw, 
  Brain, 
  Lock,
  ArrowUpRight,
  Database,
  Workflow,
  BarChart3,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  gradient: string
  delay: number
  roi?: {
    metric: string
    value: string
    savings: string
    description: string
  }
}

const features: Feature[] = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Military-grade encryption with comprehensive security controls and end-to-end data protection.',
    badge: 'Secure',
    gradient: 'from-blue-500/20 to-blue-600/20',
    delay: 0,
    roi: {
      metric: 'Security Incidents Prevented',
      value: '99.9%',
      savings: '$250K+',
      description: 'Average cost savings from preventing data breaches'
    }
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Intelligent data analysis and automated recommendations for optimal backup strategies.',
    badge: 'Smart',
    gradient: 'from-purple-500/20 to-purple-600/20',
    delay: 100,
    roi: {
      metric: 'Business Intelligence',
      value: '3x better',
      savings: '$75K+',
      description: 'Improved decision making from AI-driven insights'
    }
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized sync algorithms that process millions of records in minutes, not hours.',
    badge: 'Fast',
    gradient: 'from-yellow-500/20 to-yellow-600/20',
    delay: 200,
    roi: {
      metric: 'Time Saved Monthly',
      value: '40+ hours',
      savings: '$50K+',
      description: 'Reduced time spent on manual backup processes'
    }
  },
  {
    icon: Cloud,
    title: 'Multi-Cloud Storage',
    description: 'Store backups across multiple cloud providers with automatic failover protection.',
    gradient: 'from-green-500/20 to-green-600/20',
    delay: 300,
    roi: {
      metric: 'Downtime Reduction',
      value: '95%',
      savings: '$100K+',
      description: 'Avoided costs from system failures and data loss'
    }
  },
  {
    icon: RefreshCw,
    title: 'Real-time Sync',
    description: 'Continuous data synchronization ensures your backups are always up-to-date.',
    gradient: 'from-cyan-500/20 to-cyan-600/20',
    delay: 400,
    roi: {
      metric: 'Data Accuracy',
      value: '99.99%',
      savings: '$35K+',
      description: 'Reduced errors from outdated backup data'
    }
  },
  {
    icon: Database,
    title: 'Universal Compatibility',
    description: 'Works with 50+ platforms including CRMs, eCommerce, marketing tools, and more.',
    gradient: 'from-indigo-500/20 to-indigo-600/20',
    delay: 500,
    roi: {
      metric: 'Integration Costs',
      value: '80% less',
      savings: '$60K+',
      description: 'Savings compared to custom integration development'
    }
  }
]

export function FeaturesShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showROI, setShowROI] = useState(false)

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
            Why Choose ListBackup.ai
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Built for Modern Businesses
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Experience the future of data backup with our cutting-edge platform designed for scale, security, and simplicity.
          </p>
          
          {/* Toggle ROI View */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant={!showROI ? "default" : "outline"}
              size="sm"
              onClick={() => setShowROI(false)}
            >
              Features
            </Button>
            <Button
              variant={showROI ? "default" : "outline"}
              size="sm"
              onClick={() => setShowROI(true)}
              className="gap-2"
            >
              <DollarSign className="w-4 h-4" />
              ROI Calculator
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-2xl hover:shadow-primary/10 ${
                hoveredIndex === index ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-full w-full rounded-lg bg-background m-[1px]" />
              </div>

              <CardContent className="relative p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                {!showROI ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                ) : (
                  feature.roi && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            {feature.roi.metric}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-green-700 dark:text-green-300 mb-1">
                          {feature.roi.value}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            {feature.roi.savings} saved annually
                          </span>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          {feature.roi.description}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* Hover arrow */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ROI Summary */}
        {showROI && (
          <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 text-primary">
                Total Annual ROI: $570,000+
              </h3>
              <p className="text-muted-foreground mb-6">
                Based on average enterprise customer usage. Your actual savings may vary.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/pricing">
                    Calculate Your ROI
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">
                    Schedule ROI Review
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '50+', label: 'Integrations' },
            { value: '10TB+', label: 'Data Processed Daily' },
            { value: '24/7', label: 'Support' },
          ].map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Experience These Features?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your free trial today and see how our features can transform your data protection strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}