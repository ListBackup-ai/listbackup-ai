import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  CreditCard, 
  Users, 
  Receipt, 
  TrendingUp,
  Shield,
  FileText,
  BarChart3,
  Database,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const stripeFeatures = [
  {
    icon: Users,
    title: 'Customer Data',
    description: 'Complete customer profiles, payment methods, and billing history.',
    items: ['Customer profiles', 'Payment methods', 'Billing addresses', 'Customer metadata']
  },
  {
    icon: Receipt,
    title: 'Payments & Transactions',
    description: 'Every payment, refund, and transaction with full details and metadata.',
    items: ['Payment records', 'Refund history', 'Transaction fees', 'Payment methods']
  },
  {
    icon: FileText,
    title: 'Invoices & Billing',
    description: 'All invoices, line items, and billing cycles for comprehensive records.',
    items: ['Invoice details', 'Line items', 'Billing cycles', 'Payment attempts']
  },
  {
    icon: CreditCard,
    title: 'Subscriptions',
    description: 'Subscription plans, pricing, and recurring billing information.',
    items: ['Subscription plans', 'Pricing tiers', 'Billing intervals', 'Plan changes']
  },
  {
    icon: TrendingUp,
    title: 'Revenue Analytics',
    description: 'Revenue data, MRR, churn rates, and financial reporting metrics.',
    items: ['Revenue trends', 'MRR tracking', 'Churn analysis', 'Growth metrics']
  },
  {
    icon: Shield,
    title: 'Disputes & Chargebacks',
    description: 'Dispute cases, evidence, and chargeback protection data.',
    items: ['Dispute records', 'Evidence files', 'Chargeback data', 'Protection metrics']
  }
]

const useCases = [
  {
    title: 'Financial Compliance',
    description: 'Meet regulatory requirements with comprehensive payment data retention.',
    icon: Shield,
    benefits: ['SOX compliance', 'PCI DSS support', 'Audit trails', 'Data retention policies']
  },
  {
    title: 'Revenue Analytics',
    description: 'Analyze payment trends, customer behavior, and revenue patterns.',
    icon: BarChart3,
    benefits: ['Revenue reporting', 'Customer LTV', 'Churn analysis', 'Growth metrics']
  },
  {
    title: 'Platform Migration',
    description: 'Migrate payment data when switching processors or upgrading systems.',
    icon: ArrowRight,
    benefits: ['Data export', 'Format conversion', 'Migration support', 'Zero downtime']
  },
  {
    title: 'Disaster Recovery',
    description: 'Protect critical payment data with automated backups and restoration.',
    icon: Database,
    benefits: ['Automated backups', 'Point-in-time recovery', 'Multi-region storage', 'Quick restoration']
  }
]

const complianceFeatures = [
  {
    standard: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard compliance',
    details: ['Encrypted data storage', 'Secure data transmission', 'Access controls', 'Regular audits']
  },
  {
    standard: 'SOX',
    description: 'Sarbanes-Oxley Act compliance for financial reporting',
    details: ['Financial data integrity', 'Audit trail maintenance', 'Access logging', 'Data retention']
  },
  {
    standard: 'GDPR',
    description: 'General Data Protection Regulation compliance',
    details: ['Data encryption', 'Right to erasure', 'Data portability', 'Consent management']
  },
  {
    standard: 'ISO 27001',
    description: 'Information security management system certification',
    details: ['Security controls', 'Risk management', 'Incident response', 'Continuous monitoring']
  }
]

const relatedIntegrations = [
  { name: 'PayPal', domain: 'paypal.com', category: 'Payments' },
  { name: 'Square', domain: 'squareup.com', category: 'Payments' },
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
  { name: 'Shopify', domain: 'shopify.com', category: 'eCommerce' },
  { name: 'ActiveCampaign', domain: 'activecampaign.com', category: 'Email Marketing' },
  { name: 'GoHighLevel', domain: 'gohighlevel.com', category: 'Business Tools' }
]

export default function StripeIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="💳 Secure Payment Data Backup"
        title="Stripe Data Protection & Compliance"
        subtitle="Complete Payment Data Backup"
        description="Automatically backup all your Stripe payment data with bank-level security. Perfect for compliance, analytics, and disaster recovery."
        primaryCTA={{
          text: "Start Stripe Backup",
          href: "/signup?integration=stripe"
        }}
        secondaryCTA={{
          text: "View Demo",
          href: "/demo/stripe"
        }}
        features={[
          "PCI DSS Compliant",
          "Real-time Sync",
          "Revenue Analytics",
          "Audit Ready"
        ]}
        gradient="purple"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
              Complete Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Every Piece of Your Stripe Data
            </h2>
            <p className="text-lg text-muted-foreground">
              We securely backup all your payment data while maintaining PCI DSS compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stripeFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <feature.icon className="w-6 h-6 text-purple-600" />
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

      {/* Compliance Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Enterprise Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for Financial Compliance
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet the strictest regulatory requirements with our compliance-first approach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {complianceFeatures.map((compliance, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{compliance.standard}</h3>
                      <p className="text-muted-foreground mb-4">{compliance.description}</p>
                      <ul className="space-y-2">
                        {compliance.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{detail}</span>
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

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Backup Your Stripe Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              From compliance to analytics, here's how our Stripe backup solution helps businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
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

      {/* Security & Trust */}
      <section className="py-24 bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Security You Can Trust
            </h2>
            <p className="text-lg text-white/80">
              Your Stripe data is protected by the same security measures used by banks and financial institutions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { metric: 'AES-256', label: 'Encryption' },
              { metric: 'Secure', label: 'By Design' },
              { metric: '99.9%', label: 'Uptime SLA' },
              { metric: '24/7', label: 'Monitoring' },
            ].map((stat, index) => (
              <div key={index} className="group">
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

      {/* How It Works */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Setup in Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Get your Stripe data backed up securely in just 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Your Stripe Account',
                description: 'Securely connect using Stripe Connect. Your API keys never leave Stripe.',
                icon: Shield
              },
              {
                step: '2', 
                title: 'Configure Backup Settings',
                description: 'Choose data types, retention policies, and compliance requirements.',
                icon: RefreshCw
              },
              {
                step: '3',
                title: 'Automated Secure Backups',
                description: 'Your payment data is now automatically backed up with encryption.',
                icon: DollarSign
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {step.step}
                </div>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
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
          <Card className="bg-gradient-to-r from-purple-600 to-purple-800 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Secure Your Stripe Data?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join fintech companies who trust ListBackup.ai with their critical payment data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90" asChild>
                  <Link href="/signup?integration=stripe">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo/stripe">
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