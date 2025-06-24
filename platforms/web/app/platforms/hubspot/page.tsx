import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  Users, 
  Building,
  DollarSign,
  Mail,
  Phone,
  BarChart3,
  FileText,
  Calendar,
  Workflow,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const hubspotFeatures = [
  {
    icon: Users,
    title: 'Contacts & People',
    description: 'Complete contact database with all interactions, properties, and engagement history.',
    items: ['Contact profiles', 'Custom properties', 'Interaction timeline', 'Lead scores']
  },
  {
    icon: Building,
    title: 'Companies & Accounts',
    description: 'Company records, hierarchies, and account-based marketing data.',
    items: ['Company profiles', 'Account hierarchies', 'Firmographic data', 'Account scores']
  },
  {
    icon: DollarSign,
    title: 'Deals & Revenue',
    description: 'Sales pipeline data, deal records, and revenue tracking information.',
    items: ['Deal records', 'Pipeline stages', 'Revenue data', 'Forecasting info']
  },
  {
    icon: Phone,
    title: 'Sales Activities',
    description: 'Calls, meetings, tasks, and all sales team interactions with prospects.',
    items: ['Call records', 'Meeting notes', 'Task history', 'Sales sequences']
  },
  {
    icon: Mail,
    title: 'Marketing Campaigns',
    description: 'Email campaigns, landing pages, forms, and marketing automation data.',
    items: ['Email campaigns', 'Landing pages', 'Forms & CTAs', 'Campaign analytics']
  },
  {
    icon: FileText,
    title: 'Content & Assets',
    description: 'Blog posts, pages, files, and all content marketing assets.',
    items: ['Blog content', 'Website pages', 'File manager', 'Content analytics']
  },
  {
    icon: Calendar,
    title: 'Service & Support',
    description: 'Tickets, knowledge base, customer feedback, and service interactions.',
    items: ['Support tickets', 'Knowledge articles', 'Customer feedback', 'Service analytics']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Custom reports, dashboards, and business intelligence data.',
    items: ['Custom reports', 'Dashboard data', 'Attribution reports', 'ROI analytics']
  }
]

const enterpriseUseCases = [
  {
    title: 'Enterprise Compliance',
    description: 'Meet enterprise compliance requirements with comprehensive HubSpot data retention.',
    icon: Shield,
    benefits: ['SOX compliance', 'Data governance', 'Audit trails', 'Retention policies']
  },
  {
    title: 'Business Intelligence',
    description: 'Export historical data for advanced analytics and business intelligence platforms.',
    icon: TrendingUp,
    benefits: ['Historical analysis', 'BI integration', 'Custom analytics', 'Trend analysis']
  },
  {
    title: 'Migration & Consolidation',
    description: 'Migrate between HubSpot portals or consolidate multiple instances.',
    icon: Workflow,
    benefits: ['Portal migration', 'Data consolidation', 'Merge operations', 'Zero data loss']
  },
  {
    title: 'Disaster Recovery',
    description: 'Ensure business continuity with comprehensive HubSpot disaster recovery.',
    icon: Clock,
    benefits: ['Rapid recovery', 'Point-in-time restore', 'Business continuity', 'Minimal downtime']
  }
]

const hubspotModules = [
  {
    module: 'Marketing Hub',
    features: ['Email Marketing', 'Landing Pages', 'Forms & CTAs', 'Social Media', 'SEO Tools', 'Marketing Automation'],
    icon: Mail
  },
  {
    module: 'Sales Hub', 
    features: ['Contact Management', 'Deal Pipeline', 'Email Sequences', 'Meeting Scheduler', 'Sales Analytics', 'Playbooks'],
    icon: DollarSign
  },
  {
    module: 'Service Hub',
    features: ['Ticketing System', 'Knowledge Base', 'Customer Feedback', 'Live Chat', 'Service Analytics', 'Customer Portal'],
    icon: Phone
  },
  {
    module: 'CMS Hub',
    features: ['Website Pages', 'Blog Content', 'File Manager', 'Themes & Templates', 'Membership Content', 'Website Analytics'],
    icon: FileText
  },
  {
    module: 'Operations Hub',
    features: ['Data Sync', 'Workflows', 'Custom Objects', 'Data Quality', 'Integrations', 'Reporting'],
    icon: Workflow
  }
]

const complianceStandards = [
  {
    standard: 'SOX Compliance',
    description: 'Sarbanes-Oxley compliance for financial data and revenue reporting',
    requirements: ['Financial data integrity', 'Revenue audit trails', 'Access controls', 'Change tracking']
  },
  {
    standard: 'GDPR Compliance',
    description: 'European data protection regulation compliance',
    requirements: ['Data portability', 'Right to erasure', 'Consent tracking', 'Processing records']
  },
  {
    standard: 'CCPA Compliance',
    description: 'California Consumer Privacy Act compliance',
    requirements: ['Data transparency', 'Opt-out rights', 'Data deletion', 'Consumer requests']
  }
]

const relatedIntegrations = [
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Pipedrive', domain: 'pipedrive.com', category: 'CRM' },
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'ActiveCampaign', domain: 'activecampaign.com', category: 'Email Marketing' },
  { name: 'Mailchimp', domain: 'mailchimp.com', category: 'Email Marketing' },
  { name: 'ConvertKit', domain: 'convertkit.com', category: 'Email Marketing' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
  { name: 'GoHighLevel', domain: 'gohighlevel.com', category: 'Business Tools' }
]

export default function HubSpotIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🧡 Coming Soon"
        title="HubSpot Data Protection"
        subtitle="Complete CRM & Marketing Platform Backup"
        description="Protect all your HubSpot data across Marketing, Sales, Service, and CMS Hubs. Comprehensive backup solution for the entire HubSpot ecosystem."
        primaryCTA={{
          text: "Join Waitlist",
          href: "/platforms/request?platform=hubspot"
        }}
        secondaryCTA={{
          text: "Enterprise Demo",
          href: "/demo/hubspot"
        }}
        features={[
          "All HubSpot Hubs",
          "Enterprise Ready", 
          "SOX Compliant",
          "Custom Objects"
        ]}
        gradient="default"
      />

      {/* HubSpot Modules Coverage */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
              Complete HubSpot Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Every HubSpot Hub Protected
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive backup coverage across all HubSpot Hubs and modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hubspotModules.map((module, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <module.icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold">{module.module}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Comprehensive Data Protection
            </h2>
            <p className="text-lg text-muted-foreground">
              Every data type in your HubSpot portal is automatically backed up and protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {hubspotFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <feature.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-xs">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {feature.items.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{feature.items.length - 3} more...
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Enterprise Ready
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for Enterprise HubSpot Users
            </h2>
            <p className="text-lg text-muted-foreground">
              Advanced features and compliance capabilities for large organizations using HubSpot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enterpriseUseCases.map((useCase, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground mb-4">{useCase.description}</p>
                      <ul className="space-y-2">
                        {useCase.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Enterprise Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Meet All Compliance Requirements
            </h2>
            <p className="text-lg text-muted-foreground">
              Built-in compliance features for enterprise HubSpot users across all industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {complianceStandards.map((standard, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{standard.standard}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{standard.description}</p>
                  <ul className="space-y-2">
                    {standard.requirements.map((requirement, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Stats */}
      <section className="py-24 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Enterprise-Grade Performance
            </h2>
            <p className="text-lg text-white/90">
              Built to handle the largest HubSpot deployments with enterprise-grade performance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { metric: '100M+', label: 'Records Supported' },
              { metric: '99.99%', label: 'Uptime SLA' },
              { metric: '<30s', label: 'Backup Speed' },
              { metric: '24/7', label: 'Enterprise Support' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                  {stat.metric}
                </div>
                <div className="text-sm text-white/80 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Access */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Get Early Access
            </h2>
            <p className="text-lg text-muted-foreground">
              HubSpot integration is coming soon. Join the waitlist for early access and special pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                benefit: "Early Access",
                description: "Be among the first to protect your HubSpot data",
                icon: Clock
              },
              {
                benefit: "Special Pricing", 
                description: "Exclusive launch pricing for early adopters",
                icon: DollarSign
              },
              {
                benefit: "Priority Support",
                description: "Dedicated support during beta and launch",
                icon: Shield
              }
            ].map((item, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.benefit}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Related Integrations */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              More Integrations
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              We Also Backup These Platforms
            </h2>
            <p className="text-lg text-muted-foreground">
              Protect all your business data with our comprehensive integration suite.
            </p>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center">
            {relatedIntegrations.map((integration, index) => (
              <div 
                key={index} 
                className="group relative flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <Image
                  src={`https://logo.clearbit.com/${integration.domain}`}
                  alt={`${integration.name} logo`}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain mb-1"
                />
                <span className="text-xs text-muted-foreground text-center px-1">
                  {integration.name}
                </span>
                {/* Tooltip with category */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {integration.category}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Plus 40+ more integrations available
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/integrations">
                  View All Integrations
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/platforms/request">
                  Request Integration
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready for HubSpot Data Protection?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join the waitlist to be notified when HubSpot integration launches with early access pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-white/90" asChild>
              <Link href="/platforms/request?platform=hubspot">
                Join Waitlist
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/demo/hubspot">
                Enterprise Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}