'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Platform {
  name: string
  category: string
  description: string
  domain: string // For Clearbit logo API
  popular?: boolean
  comingSoon?: boolean
  features: string[]
  useCases: string[]
  gradient: string
}

const platforms: Platform[] = [
  {
    name: 'Keap (Infusionsoft)',
    category: 'CRM & Marketing',
    description: 'Complete CRM backup including contacts, campaigns, orders, and automation sequences.',
    domain: 'keap.com',
    popular: true,
    features: ['Contacts & Companies', 'Orders & Transactions', 'Email Campaigns', 'Tags & Custom Fields'],
    useCases: ['Data Migration', 'Compliance Backup', 'Analytics Export'],
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    name: 'Stripe',
    category: 'Payment Processing',
    description: 'Secure backup of payment data, customer information, and transaction history.',
    domain: 'stripe.com',
    popular: true,
    features: ['Customers & Subscriptions', 'Payments & Invoices', 'Products & Prices', 'Webhooks & Events'],
    useCases: ['Financial Reporting', 'Compliance', 'Data Analysis'],
    gradient: 'from-purple-500/20 to-blue-500/20'
  },
  {
    name: 'GoHighLevel',
    category: 'All-in-One Marketing',
    description: 'Backup your entire GHL workspace including funnels, contacts, and automations.',
    domain: 'gohighlevel.com',
    features: ['Contacts & Opportunities', 'Funnels & Websites', 'Calendars & Appointments', 'SMS & Email Campaigns'],
    useCases: ['Agency Backups', 'Client Data Export', 'Platform Migration'],
    gradient: 'from-green-500/20 to-teal-500/20'
  },
  {
    name: 'ActiveCampaign',
    category: 'Email Marketing',
    description: 'Comprehensive backup of your email marketing campaigns and customer data.',
    domain: 'activecampaign.com',
    features: ['Contacts & Lists', 'Email Campaigns', 'Automation Workflows', 'Custom Fields & Tags'],
    useCases: ['Campaign Analysis', 'Data Migration', 'Compliance Backup'],
    gradient: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    name: 'Mailchimp',
    category: 'Email Marketing',
    description: 'Backup your Mailchimp audiences, campaigns, and marketing automation data.',
    domain: 'mailchimp.com',
    features: ['Audiences & Segments', 'Campaigns & Templates', 'Automation Journeys', 'Reports & Analytics'],
    useCases: ['Data Export', 'Campaign Backup', 'Audience Analysis'],
    gradient: 'from-yellow-500/20 to-orange-500/20'
  },
  {
    name: 'Zendesk',
    category: 'Customer Support',
    description: 'Complete backup of tickets, customer data, and support knowledge base.',
    domain: 'zendesk.com',
    features: ['Tickets & Conversations', 'Users & Organizations', 'Knowledge Base', 'Satisfaction Ratings'],
    useCases: ['Support Analytics', 'Compliance', 'Data Migration'],
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    name: 'HubSpot',
    category: 'CRM & Marketing',
    description: 'Backup your HubSpot CRM, marketing campaigns, and sales pipelines.',
    domain: 'hubspot.com',
    comingSoon: true,
    features: ['Contacts & Deals', 'Marketing Campaigns', 'Sales Pipelines', 'Custom Properties'],
    useCases: ['CRM Backup', 'Sales Analytics', 'Marketing ROI'],
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    name: 'Shopify',
    category: 'eCommerce',
    description: 'Complete eCommerce backup including products, orders, and customer data.',
    domain: 'shopify.com',
    comingSoon: true,
    features: ['Products & Inventory', 'Orders & Customers', 'Discounts & Gift Cards', 'Analytics Data'],
    useCases: ['Store Migration', 'Inventory Analysis', 'Customer Insights'],
    gradient: 'from-green-500/20 to-teal-500/20'
  }
]

const categories = ['All', 'CRM & Marketing', 'Payment Processing', 'All-in-One Marketing', 'Email Marketing', 'Customer Support', 'eCommerce']

export function PlatformsShowcase() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
            50+ Integrations & Growing
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Connect Everything You Use
          </h2>
          <p className="text-lg text-muted-foreground">
            Backup data from all your favorite tools and platforms with our growing library of platforms.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Integrations grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-0 bg-gradient-to-br from-background to-muted/20"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                      <Image
                        src={`https://logo.clearbit.com/${platform.domain}`}
                        alt={`${platform.name} logo`}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          // Fallback to gradient background if logo fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/40 rounded"></div>';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {platform.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {platform.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {platform.popular && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {platform.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {platform.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {platform.features.slice(0, 2).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {platform.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{platform.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-2">Use Cases:</h4>
                    <div className="text-xs text-muted-foreground">
                      {platform.useCases.join(' • ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full group/btn"
                    asChild
                  >
                    <Link href={`/platforms/${platform.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Don't see your platform?
            </h3>
            <p className="text-muted-foreground mb-6">
              We're constantly adding new platforms. Request yours and we'll prioritize it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/platforms/request">
                  Request Integration
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/platforms">
                  View All Integrations
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}