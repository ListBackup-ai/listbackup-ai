import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  Users, 
  Globe, 
  Calendar,
  MessageSquare,
  BarChart3,
  Workflow,
  Building,
  Shield,
  RefreshCw,
  Database
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const ghlFeatures = [
  {
    icon: Users,
    title: 'Contacts & Opportunities',
    description: 'Complete contact database with opportunities, pipelines, and lead scoring.',
    items: ['Contact profiles', 'Opportunity pipelines', 'Lead scores', 'Custom fields']
  },
  {
    icon: Globe,
    title: 'Funnels & Websites',
    description: 'Backup all funnels, landing pages, and website content with complete structure.',
    items: ['Funnel pages', 'Website content', 'Forms & surveys', 'A/B test data']
  },
  {
    icon: Calendar,
    title: 'Calendars & Appointments',
    description: 'Appointment scheduling data, calendar settings, and booking history.',
    items: ['Calendar configurations', 'Appointment history', 'Booking rules', 'Availability settings']
  },
  {
    icon: MessageSquare,
    title: 'Communications',
    description: 'SMS campaigns, email sequences, and all communication templates.',
    items: ['SMS campaigns', 'Email templates', 'Conversation history', 'Automation workflows']
  },
  {
    icon: Workflow,
    title: 'Automation Workflows',
    description: 'Complete workflow backups including triggers, actions, and conditions.',
    items: ['Workflow logic', 'Trigger conditions', 'Action sequences', 'Decision trees']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Performance metrics, conversion data, and custom reporting dashboards.',
    items: ['Performance metrics', 'Conversion tracking', 'Custom reports', 'ROI analytics']
  }
]

const agencyUseCases = [
  {
    title: 'Agency Client Backups',
    description: 'Protect all client data across multiple GHL sub-accounts.',
    icon: Building,
    benefits: ['Multi-client management', 'Bulk backup operations', 'Client data isolation', 'Agency-wide reporting']
  },
  {
    title: 'White-Label Protection',
    description: 'Secure backup solution that maintains your agency branding.',
    icon: Shield,
    benefits: ['White-label dashboard', 'Custom branding', 'Client-facing reports', 'Agency compliance']
  },
  {
    title: 'Platform Migration',
    description: 'Seamlessly migrate clients between GHL instances or to other platforms.',
    icon: RefreshCw,
    benefits: ['Complete data export', 'Migration templates', 'Zero data loss', 'Minimal downtime']
  },
  {
    title: 'Compliance & Auditing',
    description: 'Meet client compliance requirements with comprehensive audit trails.',
    icon: Database,
    benefits: ['Audit trail logging', 'Compliance reporting', 'Data retention policies', 'GDPR compliance']
  }
]

const ghlDataTypes = [
  'Contacts & Leads',
  'Opportunities & Pipelines', 
  'Funnels & Landing Pages',
  'Email & SMS Campaigns',
  'Calendars & Appointments',
  'Workflows & Automations',
  'Forms & Surveys',
  'Custom Fields & Tags',
  'Conversations & Chat',
  'Analytics & Reports',
  'Users & Permissions',
  'Integration Settings'
]

const testimonials = [
  {
    quote: "As an agency managing 50+ GHL accounts, ListBackup.ai gives us peace of mind. We've recovered critical client data multiple times.",
    author: "Marcus Johnson",
    role: "Agency Owner",
    company: "Digital Growth Agency"
  },
  {
    quote: "The white-label solution is perfect for our client deliverables. They see our branding while getting enterprise-grade backup.",
    author: "Sarah Williams", 
    role: "Operations Director",
    company: "Scale Marketing Group"
  }
]

const relatedIntegrations = [
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Pipedrive', domain: 'pipedrive.com', category: 'CRM' },
  { name: 'ActiveCampaign', domain: 'activecampaign.com', category: 'Email Marketing' },
  { name: 'Mailchimp', domain: 'mailchimp.com', category: 'Email Marketing' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
  { name: 'Zendesk', domain: 'zendesk.com', category: 'Business Tools' }
]

export default function GoHighLevelIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🚀 Agency Favorite"
        title="GoHighLevel Data Protection"
        subtitle="Complete Agency & Client Backup"
        description="Protect all your GoHighLevel data including funnels, contacts, workflows, and client accounts. Perfect for agencies managing multiple GHL instances."
        primaryCTA={{
          text: "Start GHL Backup",
          href: "/signup?integration=gohighlevel"
        }}
        secondaryCTA={{
          text: "Agency Demo",
          href: "/demo/gohighlevel"
        }}
        features={[
          "Multi-Account Support",
          "White-Label Ready",
          "Agency Compliance",
          "Bulk Operations"
        ]}
        gradient="green"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Complete GHL Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Every Piece of Your GHL Workspace
            </h2>
            <p className="text-lg text-muted-foreground">
              We backup everything in your GoHighLevel account, from contacts to complex automation workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ghlFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <feature.icon className="w-6 h-6 text-green-600" />
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

      {/* Data Types Grid */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Complete Data Type Coverage
            </h2>
            <p className="text-lg text-muted-foreground">
              Every data type in your GoHighLevel account is automatically backed up and protected.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ghlDataTypes.map((dataType, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">{dataType}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agency Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Built for Agencies
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Agencies Choose ListBackup.ai
            </h2>
            <p className="text-lg text-muted-foreground">
              Designed specifically for agencies managing multiple GoHighLevel accounts and clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {agencyUseCases.map((useCase, index) => (
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

      {/* Agency Testimonials */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Trusted by Top GHL Agencies
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
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-600">
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

      {/* Pricing for Agencies */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Agency-Friendly Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Volume discounts and white-label options available for agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                plan: "Agency Starter",
                price: "$199/month",
                accounts: "Up to 10 GHL accounts",
                features: ["Multi-account backup", "Basic reporting", "Email support", "Standard retention"]
              },
              {
                plan: "Agency Pro",
                price: "$499/month", 
                accounts: "Up to 50 GHL accounts",
                features: ["White-label dashboard", "Priority support", "Custom retention", "Advanced analytics"],
                popular: true
              },
              {
                plan: "Agency Enterprise",
                price: "Custom",
                accounts: "Unlimited accounts",
                features: ["Full white-label", "Dedicated support", "Custom integrations", "SLA guarantees"]
              }
            ].map((tier, index) => (
              <Card key={index} className={`text-center ${tier.popular ? 'ring-2 ring-primary scale-105' : ''}`}>
                <CardContent className="p-8">
                  {tier.popular && (
                    <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
                  )}
                  <h3 className="font-bold text-xl mb-2">{tier.plan}</h3>
                  <p className="text-3xl font-bold text-primary mb-2">{tier.price}</p>
                  <p className="text-sm text-muted-foreground mb-6">{tier.accounts}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={tier.price === "Custom" ? "/contact?type=enterprise" : "/signup?plan=agency"}>
                      {tier.price === "Custom" ? "Contact Sales" : "Start Trial"}
                    </Link>
                  </Button>
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
      <section className="py-24 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Protect Your GHL Data?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join hundreds of agencies who trust ListBackup.ai with their GoHighLevel data protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-white/90" asChild>
              <Link href="/signup?integration=gohighlevel">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/demo/gohighlevel">
                Schedule Agency Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}