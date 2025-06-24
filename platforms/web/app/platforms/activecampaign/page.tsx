import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  Users, 
  Mail, 
  Workflow,
  BarChart3,
  Tag,
  MessageCircle,
  TrendingUp,
  Shield,
  RefreshCw,
  Download
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const acFeatures = [
  {
    icon: Users,
    title: 'Contacts & Lists',
    description: 'Complete contact database with custom fields, segments, and engagement history.',
    items: ['Contact profiles', 'Custom fields', 'List segments', 'Engagement scores']
  },
  {
    icon: Mail,
    title: 'Email Campaigns',
    description: 'All email campaigns, templates, and performance metrics for comprehensive analysis.',
    items: ['Campaign content', 'Email templates', 'A/B test results', 'Delivery statistics']
  },
  {
    icon: Workflow,
    title: 'Automation Workflows',
    description: 'Complete automation sequences including triggers, conditions, and actions.',
    items: ['Automation logic', 'Trigger conditions', 'Action sequences', 'Goal tracking']
  },
  {
    icon: Tag,
    title: 'Tags & Custom Fields',
    description: 'All tags, custom fields, and data organization for precise segmentation.',
    items: ['Contact tags', 'Custom field data', 'Field definitions', 'Tag automation']
  },
  {
    icon: MessageCircle,
    title: 'Conversations & Messages',
    description: 'Site messaging, chat conversations, and customer interaction history.',
    items: ['Chat conversations', 'Site messages', 'Message templates', 'Response tracking']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Performance analytics, campaign reports, and revenue attribution data.',
    items: ['Campaign analytics', 'Revenue tracking', 'Engagement metrics', 'Custom reports']
  }
]

const marketingUseCases = [
  {
    title: 'Campaign Performance Analysis',
    description: 'Analyze historical campaign data to optimize future email marketing strategies.',
    icon: TrendingUp,
    benefits: ['Historical analysis', 'A/B test insights', 'Performance trends', 'ROI optimization']
  },
  {
    title: 'Compliance & Data Protection',
    description: 'Meet GDPR and marketing compliance requirements with complete data records.',
    icon: Shield,
    benefits: ['GDPR compliance', 'Consent tracking', 'Data retention', 'Audit trails']
  },
  {
    title: 'Platform Migration',
    description: 'Seamlessly migrate to another email marketing platform without losing data.',
    icon: RefreshCw,
    benefits: ['Complete data export', 'Contact migration', 'Campaign templates', 'Zero data loss']
  },
  {
    title: 'Data Export & Integration',
    description: 'Export data for business intelligence, CRM integration, or custom analytics.',
    icon: Download,
    benefits: ['Custom exports', 'API integration', 'BI tool compatibility', 'Real-time sync']
  }
]

const dataTypes = [
  'Contacts & Custom Fields',
  'Email Campaigns & Templates',
  'Automation Workflows',
  'Lists & Segments',
  'Tags & Categories',
  'Forms & Landing Pages',
  'Goals & Conversions',
  'Deals & Pipeline',
  'Site Messages & Chat',
  'Campaign Analytics',
  'A/B Test Results',
  'Revenue Attribution'
]

const complianceFeatures = [
  {
    title: 'GDPR Compliance',
    description: 'Full GDPR compliance with consent tracking and data portability',
    features: ['Consent records', 'Data portability', 'Right to erasure', 'Processing logs']
  },
  {
    title: 'CAN-SPAM Compliance',
    description: 'Maintain CAN-SPAM compliance with complete subscription records',
    features: ['Subscription history', 'Unsubscribe tracking', 'Opt-in records', 'Bounce management']
  },
  {
    title: 'Data Retention Policies',
    description: 'Flexible data retention policies to meet industry requirements',
    features: ['Custom retention periods', 'Automated purging', 'Legal hold options', 'Audit reporting']
  }
]

const relatedIntegrations = [
  { name: 'Mailchimp', domain: 'mailchimp.com', category: 'Email Marketing' },
  { name: 'ConvertKit', domain: 'convertkit.com', category: 'Email Marketing' },
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Pipedrive', domain: 'pipedrive.com', category: 'CRM' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
  { name: 'GoHighLevel', domain: 'gohighlevel.com', category: 'Business Tools' }
]

export default function ActiveCampaignIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="📧 Email Marketing Leader"
        title="ActiveCampaign Data Backup"
        subtitle="Complete Email Marketing Protection"
        description="Protect all your ActiveCampaign data including contacts, campaigns, automations, and analytics. Ensure compliance and never lose your marketing data."
        primaryCTA={{
          text: "Start AC Backup",
          href: "/signup?integration=activecampaign"
        }}
        secondaryCTA={{
          text: "View Demo",
          href: "/demo/activecampaign"
        }}
        features={[
          "Campaign Analytics",
          "Automation Backup",
          "GDPR Compliant",
          "Real-time Sync"
        ]}
        gradient="blue"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Complete AC Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Every Piece of Your ActiveCampaign Data
            </h2>
            <p className="text-lg text-muted-foreground">
              We backup everything in your ActiveCampaign account, from contacts to complex automation workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {acFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Types */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Complete Data Protection
            </h2>
            <p className="text-lg text-muted-foreground">
              Every data type in ActiveCampaign is automatically backed up and protected.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dataTypes.map((dataType, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">{dataType}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Backup Your ActiveCampaign Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              From compliance to optimization, here's how our ActiveCampaign backup helps marketers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {marketingUseCases.map((useCase, index) => (
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
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Marketing Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for Marketing Compliance
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet all marketing compliance requirements with comprehensive data protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {complianceFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Insights */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Unlock Historical Insights
            </h2>
            <p className="text-lg text-muted-foreground">
              Access years of campaign data for deep marketing analytics and optimization.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { metric: '5+ Years', label: 'Data History' },
              { metric: '24/7', label: 'Real-time Sync' },
              { metric: '100%', label: 'Data Accuracy' },
              { metric: '<1 Min', label: 'Recovery Time' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                  {stat.metric}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Choose ListBackup.ai for ActiveCampaign?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Marketing Focused",
                description: "Built specifically for email marketing platforms with deep ActiveCampaign integration"
              },
              {
                title: "Compliance Ready", 
                description: "GDPR, CAN-SPAM, and industry compliance built-in from day one"
              },
              {
                title: "Analytics Preservation",
                description: "Preserve years of campaign analytics for long-term marketing insights"
              }
            ].map((benefit, index) => (
              <Card key={index} className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-white/80">{benefit.description}</p>
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
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Your Email Marketing Data?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join marketing teams who trust ListBackup.ai with their ActiveCampaign data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-white/90" asChild>
                  <Link href="/signup?integration=activecampaign">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo/activecampaign">
                    Schedule Demo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingLayout>
  )
}