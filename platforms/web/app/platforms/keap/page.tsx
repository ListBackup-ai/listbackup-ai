import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  Database, 
  Users, 
  Mail, 
  ShoppingCart,
  Tag,
  Workflow,
  BarChart3,
  Shield,
  Clock,
  Download
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const keapFeatures = [
  {
    icon: Users,
    title: 'Complete Contact Database',
    description: 'Backup all contacts with custom fields, tags, lead scores, and interaction history.',
    items: ['Contact profiles', 'Custom fields', 'Lead scores', 'Interaction timeline']
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce & Orders',
    description: 'Secure backup of all order data, payment information, and transaction history.',
    items: ['Order details', 'Payment records', 'Product information', 'Transaction history']
  },
  {
    icon: Mail,
    title: 'Email Campaigns',
    description: 'Preserve all email campaigns, templates, sequences, and performance metrics.',
    items: ['Campaign content', 'Email templates', 'Automation sequences', 'Performance data']
  },
  {
    icon: Tag,
    title: 'Tags & Segmentation',
    description: 'Backup all tags, categories, and segmentation rules for precise data organization.',
    items: ['Contact tags', 'Categories', 'Smart lists', 'Segmentation rules']
  },
  {
    icon: Workflow,
    title: 'Marketing Automation',
    description: 'Complete backup of all automation workflows, triggers, and campaign sequences.',
    items: ['Campaign workflows', 'Trigger conditions', 'Action sequences', 'Decision trees']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Preserve historical analytics data and custom reports for business intelligence.',
    items: ['Performance metrics', 'Custom reports', 'Revenue tracking', 'Conversion data']
  }
]

const useCases = [
  {
    title: 'Platform Migration',
    description: 'Moving from Keap to another CRM? We ensure zero data loss during migration.',
    icon: ArrowRight,
    benefits: ['Complete data export', 'Format conversion', 'Migration assistance', 'Data validation']
  },
  {
    title: 'Compliance & Legal',
    description: 'Meet regulatory requirements with comprehensive data retention and audit trails.',
    icon: Shield,
    benefits: ['GDPR compliance', 'Audit trails', 'Data retention policies', 'Legal documentation']
  },
  {
    title: 'Business Analytics',
    description: 'Analyze historical data trends and make data-driven business decisions.',
    icon: BarChart3,
    benefits: ['Historical analysis', 'Trend identification', 'Performance insights', 'ROI tracking']
  },
  {
    title: 'Disaster Recovery',
    description: 'Protect against data loss with automated backups and quick restoration.',
    icon: Database,
    benefits: ['Automated backups', 'Quick restoration', 'Multiple storage locations', 'Version control']
  }
]

const testimonials = [
  {
    quote: "ListBackup.ai saved us when our Keap account was accidentally corrupted. We restored 50,000 contacts in minutes.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechStart Solutions"
  },
  {
    quote: "The migration from Keap to HubSpot was seamless thanks to ListBackup.ai's data export features.",
    author: "Mike Chen",
    role: "Operations Manager", 
    company: "Growth Agency Pro"
  }
]

const relatedIntegrations = [
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Pipedrive', domain: 'pipedrive.com', category: 'CRM' },
  { name: 'ActiveCampaign', domain: 'activecampaign.com', category: 'Email Marketing' },
  { name: 'Mailchimp', domain: 'mailchimp.com', category: 'Email Marketing' },
  { name: 'ConvertKit', domain: 'convertkit.com', category: 'Email Marketing' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
  { name: 'PayPal', domain: 'paypal.com', category: 'Payments' }
]

export default function KeapIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="⭐ Most Popular Integration"
        title="Keap (Infusionsoft) Data Backup"
        subtitle="Complete CRM Protection & Migration"
        description="Automatically backup all your Keap data including contacts, campaigns, orders, and automation sequences. Perfect for compliance, migration, and disaster recovery."
        primaryCTA={{
          text: "Start Keap Backup",
          href: "/signup?integration=keap"
        }}
        secondaryCTA={{
          text: "View Demo",
          href: "/demo/keap"
        }}
        features={[
          "Complete Data Backup",
          "Real-time Sync",
          "Migration Ready",
          "Compliance Tools"
        ]}
        gradient="blue"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Complete Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Everything in Your Keap Account
            </h2>
            <p className="text-lg text-muted-foreground">
              We backup every piece of data in your Keap account, ensuring nothing is left behind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keapFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
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

      {/* Use Cases */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Backup Your Keap Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              From migrations to compliance, here's how our Keap backup solution helps businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
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

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Trusted by Keap Users Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-background to-muted/20">
                <CardContent className="p-8">
                  <blockquote className="text-lg mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Setup in Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Get your Keap data backed up in just 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Your Keap Account',
                description: 'Securely connect using your Keap API credentials. We use OAuth for maximum security.'
              },
              {
                step: '2', 
                title: 'Configure Backup Settings',
                description: 'Choose what data to backup and how often. Set retention policies and storage preferences.'
              },
              {
                step: '3',
                title: 'Automatic Backups Begin',
                description: 'Sit back and relax. Your data is now automatically backed up and protected.'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
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
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Your Keap Data?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of businesses who trust ListBackup.ai with their critical data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link href="/signup?integration=keap">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo/keap">
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