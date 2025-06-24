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
  BarChart3,
  Workflow,
  Target,
  Camera,
  TrendingUp,
  Shield,
  RefreshCw,
  Download
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const mailchimpFeatures = [
  {
    icon: Users,
    title: 'Audiences & Segments',
    description: 'Complete audience data with segments, tags, and detailed subscriber information.',
    items: ['Subscriber profiles', 'Audience segments', 'Contact tags', 'Signup sources']
  },
  {
    icon: Mail,
    title: 'Campaigns & Templates',
    description: 'All email campaigns, templates, and design assets for complete campaign history.',
    items: ['Campaign content', 'Email templates', 'Design assets', 'Subject line tests']
  },
  {
    icon: Workflow,
    title: 'Automation Journeys',
    description: 'Customer journey automations, triggers, and behavioral email sequences.',
    items: ['Journey workflows', 'Trigger conditions', 'Email sequences', 'Goal tracking']
  },
  {
    icon: Target,
    title: 'Landing Pages & Forms',
    description: 'Signup forms, landing pages, and lead generation assets with performance data.',
    items: ['Signup forms', 'Landing pages', 'Pop-up forms', 'Form analytics']
  },
  {
    icon: Camera,
    title: 'Creative Assets',
    description: 'Image library, brand assets, and all creative content used in campaigns.',
    items: ['Image library', 'Brand assets', 'Template designs', 'Creative history']
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Comprehensive campaign analytics, audience insights, and performance metrics.',
    items: ['Campaign reports', 'Audience insights', 'Revenue tracking', 'A/B test results']
  }
]

const businessUseCases = [
  {
    title: 'E-commerce Analytics',
    description: 'Analyze customer behavior and purchase patterns from your email campaigns.',
    icon: TrendingUp,
    benefits: ['Customer lifetime value', 'Purchase behavior', 'Segment performance', 'Revenue attribution']
  },
  {
    title: 'Brand Asset Protection',
    description: 'Protect your creative assets, templates, and brand content from loss.',
    icon: Shield,
    benefits: ['Template backup', 'Image library protection', 'Brand asset security', 'Design history']
  },
  {
    title: 'Platform Migration',
    description: 'Migrate to another email platform while preserving all your data and assets.',
    icon: RefreshCw,
    benefits: ['Complete data export', 'Template migration', 'Audience transfer', 'History preservation']
  },
  {
    title: 'Advanced Reporting',
    description: 'Export data for custom analytics, BI tools, and advanced performance analysis.',
    icon: Download,
    benefits: ['Custom analytics', 'BI integration', 'Performance insights', 'ROI analysis']
  }
]

const dataCategories = [
  {
    category: 'Audience Data',
    items: ['Subscribers', 'Segments', 'Tags', 'Custom Fields', 'Signup Sources', 'Contact Activity']
  },
  {
    category: 'Campaign Content',
    items: ['Email Campaigns', 'Templates', 'Subject Lines', 'Content Blocks', 'A/B Tests', 'Send History']
  },
  {
    category: 'Automation',
    items: ['Customer Journeys', 'Triggered Emails', 'Behavioral Triggers', 'Goal Tracking', 'Workflow Logic']
  },
  {
    category: 'Assets & Forms',
    items: ['Landing Pages', 'Signup Forms', 'Pop-ups', 'Image Library', 'Brand Assets', 'Creative Files']
  },
  {
    category: 'Analytics',
    items: ['Campaign Reports', 'Audience Insights', 'Revenue Data', 'Engagement Metrics', 'Growth Reports']
  },
  {
    category: 'E-commerce',
    items: ['Product Data', 'Order Information', 'Customer Purchases', 'Revenue Tracking', 'Abandoned Carts']
  }
]

const integrationBenefits = [
  {
    title: 'Complete Data Protection',
    description: 'Every piece of your Mailchimp account is automatically backed up',
    features: ['Real-time synchronization', 'Complete data coverage', 'Automated backups', 'Version control']
  },
  {
    title: 'Business Continuity',
    description: 'Ensure your email marketing never stops, even in worst-case scenarios',
    features: ['Disaster recovery', 'Quick restoration', 'Minimal downtime', 'Business continuity']
  },
  {
    title: 'Compliance & Auditing',
    description: 'Meet regulatory requirements with comprehensive audit trails',
    features: ['GDPR compliance', 'Audit trails', 'Data retention', 'Consent tracking']
  }
]

const relatedIntegrations = [
  { name: 'ActiveCampaign', domain: 'activecampaign.com', category: 'Email Marketing' },
  { name: 'ConvertKit', domain: 'convertkit.com', category: 'Email Marketing' },
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Shopify', domain: 'shopify.com', category: 'eCommerce' },
  { name: 'WooCommerce', domain: 'woocommerce.com', category: 'eCommerce' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' }
]

export default function MailchimpIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🐵 #1 Email Platform"
        title="Mailchimp Data Backup"
        subtitle="Complete Email Marketing Protection"
        description="Protect all your Mailchimp data including audiences, campaigns, automations, and creative assets. Ensure your email marketing data is always safe and accessible."
        primaryCTA={{
          text: "Start Mailchimp Backup",
          href: "/signup?integration=mailchimp"
        }}
        secondaryCTA={{
          text: "View Demo",
          href: "/demo/mailchimp"
        }}
        features={[
          "Audience Protection",
          "Campaign History",
          "Asset Backup",
          "E-commerce Data"
        ]}
        gradient="default"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Complete Mailchimp Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Everything in Your Mailchimp Account
            </h2>
            <p className="text-lg text-muted-foreground">
              We backup every piece of data in your Mailchimp account, from subscribers to creative assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mailchimpFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <feature.icon className="w-6 h-6 text-yellow-600" />
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

      {/* Data Categories */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Comprehensive Data Categories
            </h2>
            <p className="text-lg text-muted-foreground">
              Every data type in Mailchimp is organized, backed up, and protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dataCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-center">{category.category}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />
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

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Backup Your Mailchimp Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              From e-commerce insights to brand protection, here's how our Mailchimp backup helps businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessUseCases.map((useCase, index) => (
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

      {/* Integration Benefits */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Why Choose ListBackup.ai
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for Mailchimp Success
            </h2>
            <p className="text-lg text-muted-foreground">
              Designed specifically for Mailchimp users with deep platform integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrationBenefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{benefit.description}</p>
                  <ul className="space-y-2">
                    {benefit.features.map((feature, idx) => (
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

      {/* E-commerce Focus */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Perfect for E-commerce Businesses
            </h2>
            <p className="text-lg text-muted-foreground">
              Mailchimp's e-commerce features are fully supported with complete data protection.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { metric: '100%', label: 'E-commerce Data' },
              { metric: 'Real-time', label: 'Order Sync' },
              { metric: 'Complete', label: 'Customer Journey' },
              { metric: 'Unlimited', label: 'Product Data' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-yellow-600 mb-2 group-hover:scale-110 transition-transform">
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

      {/* Setup Process */}
      <section className="py-24 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Setup in Under 3 Minutes
            </h2>
            <p className="text-lg text-white/90">
              Get your Mailchimp data protected with our simple setup process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Mailchimp',
                description: 'Authorize ListBackup.ai to access your Mailchimp account securely'
              },
              {
                step: '2', 
                title: 'Choose Data Types',
                description: 'Select which data to backup (or choose everything for complete protection)'
              },
              {
                step: '3',
                title: 'Automatic Protection',
                description: 'Your data is now automatically backed up and continuously protected'
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {step.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-white/80">{step.description}</p>
              </div>
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
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Your Mailchimp Data?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of businesses who trust ListBackup.ai with their email marketing data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-white/90" asChild>
                  <Link href="/signup?integration=mailchimp">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo/mailchimp">
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