import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesShowcase } from '@/components/landing/features-showcase'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Brain, 
  Zap, 
  Cloud, 
  Database, 
  Workflow, 
  BarChart3,
  Lock,
  RefreshCw,
  Download,
  ArrowRight,
  Check,
  Globe,
  Smartphone,
  Bell,
  Settings,
  Users,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata(
  'Features - Enterprise Data Backup & Protection',
  'Discover 50+ powerful features including AI-powered analytics, real-time sync, enterprise security, and automated backups for all your business data.',
  '/features'
)

const securityFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security Controls',
    description: 'Comprehensive security framework with regular third-party audits'
  },
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'Military-grade encryption for data at rest and in transit'
  },
  {
    icon: Globe,
    title: 'Multi-Region Storage',
    description: 'Data stored across multiple geographic regions for redundancy'
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Granular permissions and access controls for team members'
  }
]

const aiFeatures = [
  {
    icon: Brain,
    title: 'Intelligent Data Mapping',
    description: 'AI automatically maps and organizes data from different sources',
    badge: 'AI Powered'
  },
  {
    icon: BarChart3,
    title: 'Predictive Analytics',
    description: 'Get insights on data growth, usage patterns, and optimization opportunities',
    badge: 'New'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'AI-powered notifications for data anomalies, failures, or important changes',
    badge: 'Smart'
  },
  {
    icon: Workflow,
    title: 'Automated Workflows',
    description: 'Set up complex backup and sync workflows with intelligent triggers'
  }
]

const integrationFeatures = [
  {
    category: 'CRM & Sales',
    tools: ['Keap (Infusionsoft)', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM'],
    icon: Users,
    count: 12
  },
  {
    category: 'Payment Processing',
    tools: ['Stripe', 'PayPal', 'Square', 'Authorize.net', 'Braintree'],
    icon: Database,
    count: 8
  },
  {
    category: 'Email Marketing',
    tools: ['Mailchimp', 'ActiveCampaign', 'ConvertKit', 'Constant Contact'],
    icon: BarChart3,
    count: 15
  },
  {
    category: 'eCommerce',
    tools: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento'],
    icon: Cloud,
    count: 10
  }
]

const featuredIntegrations = [
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Keap', domain: 'keap.com' },
  { name: 'GoHighLevel', domain: 'gohighlevel.com' },
  { name: 'ActiveCampaign', domain: 'activecampaign.com' },
  { name: 'Mailchimp', domain: 'mailchimp.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Shopify', domain: 'shopify.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'PayPal', domain: 'paypal.com' },
  { name: 'Square', domain: 'squareup.com' },
  { name: 'WooCommerce', domain: 'woocommerce.com' },
  { name: 'ConvertKit', domain: 'convertkit.com' },
  { name: 'Pipedrive', domain: 'pipedrive.com' },
  { name: 'Zoho', domain: 'zoho.com' },
  { name: 'BigCommerce', domain: 'bigcommerce.com' },
  { name: 'Zendesk', domain: 'zendesk.com' }
]

const advancedFeatures = [
  {
    title: 'Real-time Data Sync',
    description: 'Changes in your source systems are reflected in backups within minutes',
    icon: RefreshCw,
    features: ['Webhook-based updates', 'Delta sync optimization', 'Conflict resolution', 'Retry mechanisms']
  },
  {
    title: 'Multi-Format Export',
    description: 'Export your data in any format you need for analysis or migration',
    icon: Download,
    features: ['JSON, CSV, XML formats', 'Custom field mapping', 'Batch processing', 'API access']
  },
  {
    title: 'Historical Versioning',
    description: 'Access previous versions of your data with complete change tracking',
    icon: Clock,
    features: ['Point-in-time recovery', 'Change audit trails', 'Version comparison', 'Rollback capabilities']
  },
  {
    title: 'Custom Integrations',
    description: 'Need a specific integration? Our team can build it for you',
    icon: Settings,
    features: ['API development', 'Custom connectors', 'Webhook setup', 'Testing & validation']
  }
]

export default function FeaturesPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🔥 50+ Features & Growing"
        title="Powerful Features for Modern Businesses"
        subtitle="Everything You Need for Data Protection"
        description="From AI-powered insights to enterprise-grade security, discover all the features that make ListBackup.ai the most comprehensive data backup platform."
        primaryCTA={{
          text: "Start Free Trial",
          href: "/signup"
        }}
        secondaryCTA={{
          text: "View Pricing",
          href: "/pricing"
        }}
        gradient="purple"
      />

      <FeaturesShowcase />

      {/* Security Features */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Enterprise Security
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Bank-Level Security Standards
            </h2>
            <p className="text-lg text-muted-foreground">
              Your data is protected by the same security measures used by financial institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
              AI-Powered Intelligence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Smart Automation & Insights
            </h2>
            <p className="text-lg text-muted-foreground">
              Let AI handle the complexity while you focus on your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="relative p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <feature.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    {feature.badge && (
                      <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              50+ Integrations
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Connect All Your Business Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              We support the most popular business platforms across every category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrationFeatures.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary">
                      {category.count}+
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{category.category}</h3>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.tools.slice(0, 4).map((tool, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{tool}</span>
                      </li>
                    ))}
                    {category.tools.length > 4 && (
                      <li className="text-sm text-muted-foreground">
                        +{category.tools.length - 4} more...
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/integrations">
                View All Integrations
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Integration Logo Showcase */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Trusted Platforms
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Seamlessly Connect With Your Favorite Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              From CRM to payments, we integrate with all the platforms that power your business.
            </p>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center">
            {featuredIntegrations.map((integration, index) => (
              <div 
                key={index} 
                className="group relative flex items-center justify-center w-20 h-20 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-110"
              >
                <Image
                  src={`https://logo.clearbit.com/${integration.domain}`}
                  alt={`${integration.name} logo`}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain filter group-hover:scale-110 transition-transform"
                />
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {integration.name}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Plus 30+ more integrations and growing every month
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

      {/* Advanced Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Advanced Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for Power Users
            </h2>
            <p className="text-lg text-muted-foreground">
              Advanced features for teams that need maximum control and flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Start your free trial today and see why thousands of businesses trust ListBackup.ai with their critical data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/demo">
                Schedule Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}