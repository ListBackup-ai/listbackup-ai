'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  Globe, 
  Award, 
  Users, 
  CheckCircle,
  Clock,
  Server
} from 'lucide-react'
import Image from 'next/image'

const securityBadges = [
  {
    name: 'SOC 2 Type II',
    description: 'Audited security controls',
    icon: Shield,
    color: 'text-blue-600'
  },
  {
    name: 'GDPR Compliant',
    description: 'European data protection',
    icon: Globe,
    color: 'text-green-600'
  },
  {
    name: 'Bank-Level Encryption',
    description: 'AES-256 data encryption',
    icon: Lock,
    color: 'text-purple-600'
  },
  {
    name: 'ISO 27001',
    description: 'Information security management',
    icon: Award,
    color: 'text-orange-600'
  }
]

const trustMetrics = [
  {
    number: '10,000+',
    label: 'Active Users',
    description: 'Businesses trust us with their data',
    icon: Users
  },
  {
    number: '99.9%',
    label: 'Uptime SLA',
    description: 'Guaranteed service availability',
    icon: Server
  },
  {
    number: '< 2 min',
    label: 'Support Response',
    description: 'Average response time',
    icon: Clock
  },
  {
    number: '5TB+',
    label: 'Data Protected',
    description: 'Across all platforms daily',
    icon: CheckCircle
  }
]

const customerLogos = [
  { name: 'TechCorp', domain: 'techcorp.com' },
  { name: 'DataFlow', domain: 'dataflow.io' },
  { name: 'CloudSync', domain: 'cloudsync.com' },
  { name: 'SecureBackup', domain: 'securebackup.com' },
  { name: 'Enterprise Solutions', domain: 'enterprisesolutions.com' },
  { name: 'ScaleUp Inc', domain: 'scaleup.com' }
]

const certifications = [
  { name: 'AWS Partner', logo: '/images/aws-partner.png' },
  { name: 'Google Cloud Partner', logo: '/images/gcp-partner.png' },
  { name: 'Microsoft Partner', logo: '/images/azure-partner.png' },
  { name: 'Stripe Verified', logo: '/images/stripe-verified.png' }
]

export function TrustIndicators() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Security Badges */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
            Enterprise Security
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Your Data is Safe with Us
          </h2>
          <p className="text-lg text-muted-foreground">
            We maintain the highest security standards with comprehensive compliance certifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityBadges.map((badge, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center`}>
                  <badge.icon className={`w-6 h-6 ${badge.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{badge.name}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {trustMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <metric.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{metric.number}</div>
              <div className="font-semibold mb-1">{metric.label}</div>
              <div className="text-sm text-muted-foreground">{metric.description}</div>
            </div>
          ))}
        </div>

        {/* Customer Logos */}
        <div className="text-center mb-12">
          <h3 className="text-xl font-semibold mb-8 text-muted-foreground">
            Trusted by Leading Companies Worldwide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60">
            {customerLogos.map((customer, index) => (
              <div 
                key={index}
                className="h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
              >
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm border">
                  <span className="text-sm font-medium text-gray-800">{customer.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-6 text-muted-foreground">
            Certified Partners & Integrations
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="h-8 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
              >
                <div className="px-3 py-1 bg-white rounded border text-xs font-medium text-gray-700">
                  {cert.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}