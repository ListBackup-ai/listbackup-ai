'use client'

import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Check, 
  ArrowRight, 
  Search, 
  Star, 
  Clock,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo } from 'react'

interface Platform {
  name: string
  category: string
  description: string
  domain: string
  popular?: boolean
  comingSoon?: boolean
  featured?: boolean
  features: string[]
  useCases: string[]
  gradient: string
  setupTime: string
  dataTypes: string[]
}

const allPlatforms: Platform[] = [
  // CRM & Marketing
  {
    name: 'Keap (Infusionsoft)',
    category: 'CRM & Marketing',
    description: 'Complete CRM backup including contacts, campaigns, orders, and automation sequences.',
    domain: 'keap.com',
    popular: true,
    featured: true,
    setupTime: '5 min',
    features: ['Contacts & Companies', 'Orders & Transactions', 'Email Campaigns', 'Tags & Custom Fields'],
    useCases: ['Data Migration', 'Compliance Backup', 'Analytics Export'],
    dataTypes: ['Contacts', 'Orders', 'Campaigns', 'Tags'],
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    name: 'HubSpot',
    category: 'CRM & Marketing',
    description: 'Backup your HubSpot CRM, marketing campaigns, and sales pipelines.',
    domain: 'hubspot.com',
    comingSoon: true,
    setupTime: '3 min',
    features: ['Contacts & Deals', 'Marketing Campaigns', 'Sales Pipelines', 'Custom Properties'],
    useCases: ['CRM Backup', 'Sales Analytics', 'Marketing ROI'],
    dataTypes: ['Contacts', 'Deals', 'Companies', 'Tickets'],
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    name: 'Salesforce',
    category: 'CRM & Marketing',
    description: 'Enterprise CRM backup with complete data protection for all Salesforce objects.',
    domain: 'salesforce.com',
    comingSoon: true,
    setupTime: '10 min',
    features: ['All Standard Objects', 'Custom Objects', 'Attachments', 'Reports & Dashboards'],
    useCases: ['Enterprise Backup', 'Compliance', 'Data Migration'],
    dataTypes: ['Accounts', 'Contacts', 'Opportunities', 'Cases'],
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    name: 'Pipedrive',
    category: 'CRM & Marketing',
    description: 'Sales pipeline backup with complete deal and contact management data.',
    domain: 'pipedrive.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Deals & Pipelines', 'Contacts & Organizations', 'Activities', 'Products'],
    useCases: ['Sales Backup', 'Pipeline Analysis', 'Team Migration'],
    dataTypes: ['Deals', 'Persons', 'Organizations', 'Activities'],
    gradient: 'from-green-500/20 to-teal-500/20'
  },

  // Payment Processing
  {
    name: 'Stripe',
    category: 'Payment Processing',
    description: 'Secure backup of payment data, customer information, and transaction history.',
    domain: 'stripe.com',
    popular: true,
    featured: true,
    setupTime: '3 min',
    features: ['Customers & Subscriptions', 'Payments & Invoices', 'Products & Prices', 'Webhooks & Events'],
    useCases: ['Financial Reporting', 'Compliance', 'Data Analysis'],
    dataTypes: ['Customers', 'Payments', 'Subscriptions', 'Invoices'],
    gradient: 'from-purple-500/20 to-blue-500/20'
  },
  {
    name: 'PayPal',
    category: 'Payment Processing',
    description: 'Complete PayPal transaction backup for business accounts.',
    domain: 'paypal.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Transactions', 'Disputes', 'Subscriptions', 'Invoices'],
    useCases: ['Payment Analytics', 'Dispute Management', 'Financial Records'],
    dataTypes: ['Transactions', 'Disputes', 'Refunds', 'Invoices'],
    gradient: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    name: 'Square',
    category: 'Payment Processing',
    description: 'Point-of-sale and online payment data backup for Square merchants.',
    domain: 'squareup.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Payments', 'Customers', 'Inventory', 'Orders'],
    useCases: ['POS Backup', 'Inventory Management', 'Customer Analytics'],
    dataTypes: ['Payments', 'Customers', 'Items', 'Orders'],
    gradient: 'from-gray-500/20 to-slate-500/20'
  },

  // Email Marketing
  {
    name: 'Mailchimp',
    category: 'Email Marketing',
    description: 'Backup your Mailchimp audiences, campaigns, and marketing automation data.',
    domain: 'mailchimp.com',
    popular: true,
    setupTime: '3 min',
    features: ['Audiences & Segments', 'Campaigns & Templates', 'Automation Journeys', 'Reports & Analytics'],
    useCases: ['Data Export', 'Campaign Backup', 'Audience Analysis'],
    dataTypes: ['Lists', 'Campaigns', 'Automations', 'Reports'],
    gradient: 'from-yellow-500/20 to-orange-500/20'
  },
  {
    name: 'ActiveCampaign',
    category: 'Email Marketing',
    description: 'Comprehensive backup of your email marketing campaigns and customer data.',
    domain: 'activecampaign.com',
    featured: true,
    setupTime: '5 min',
    features: ['Contacts & Lists', 'Email Campaigns', 'Automation Workflows', 'Custom Fields & Tags'],
    useCases: ['Campaign Analysis', 'Data Migration', 'Compliance Backup'],
    dataTypes: ['Contacts', 'Campaigns', 'Automations', 'Lists'],
    gradient: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    name: 'ConvertKit',
    category: 'Email Marketing',
    description: 'Creator-focused email marketing platform backup for subscribers and sequences.',
    domain: 'convertkit.com',
    comingSoon: true,
    setupTime: '3 min',
    features: ['Subscribers', 'Email Sequences', 'Forms', 'Tags'],
    useCases: ['Creator Backup', 'Subscriber Management', 'Content Migration'],
    dataTypes: ['Subscribers', 'Sequences', 'Forms', 'Tags'],
    gradient: 'from-pink-500/20 to-rose-500/20'
  },

  // All-in-One Marketing
  {
    name: 'GoHighLevel',
    category: 'All-in-One Marketing',
    description: 'Backup your entire GHL workspace including funnels, contacts, and automations.',
    domain: 'gohighlevel.com',
    featured: true,
    setupTime: '7 min',
    features: ['Contacts & Opportunities', 'Funnels & Websites', 'Calendars & Appointments', 'SMS & Email Campaigns'],
    useCases: ['Agency Backups', 'Client Data Export', 'Platform Migration'],
    dataTypes: ['Contacts', 'Funnels', 'Calendars', 'Campaigns'],
    gradient: 'from-green-500/20 to-teal-500/20'
  },

  // Customer Support
  {
    name: 'Zendesk',
    category: 'Customer Support',
    description: 'Complete backup of tickets, customer data, and support knowledge base.',
    domain: 'zendesk.com',
    setupTime: '5 min',
    features: ['Tickets & Conversations', 'Users & Organizations', 'Knowledge Base', 'Satisfaction Ratings'],
    useCases: ['Support Analytics', 'Compliance', 'Data Migration'],
    dataTypes: ['Tickets', 'Users', 'Articles', 'Organizations'],
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    name: 'Intercom',
    category: 'Customer Support',
    description: 'Customer messaging and support platform data backup.',
    domain: 'intercom.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Conversations', 'Users', 'Articles', 'Product Tours'],
    useCases: ['Support Data', 'User Analytics', 'Content Backup'],
    dataTypes: ['Conversations', 'Users', 'Articles', 'Events'],
    gradient: 'from-blue-500/20 to-purple-500/20'
  },
  {
    name: 'Freshdesk',
    category: 'Customer Support',
    description: 'Help desk and customer support data backup solution.',
    domain: 'freshworks.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Tickets', 'Contacts', 'Knowledge Base', 'Forums'],
    useCases: ['Support Backup', 'Ticket Analysis', 'Knowledge Preservation'],
    dataTypes: ['Tickets', 'Contacts', 'Articles', 'Companies'],
    gradient: 'from-green-500/20 to-lime-500/20'
  },

  // eCommerce
  {
    name: 'Shopify',
    category: 'eCommerce',
    description: 'Complete eCommerce backup including products, orders, and customer data.',
    domain: 'shopify.com',
    comingSoon: true,
    popular: true,
    setupTime: '5 min',
    features: ['Products & Inventory', 'Orders & Customers', 'Discounts & Gift Cards', 'Analytics Data'],
    useCases: ['Store Migration', 'Inventory Analysis', 'Customer Insights'],
    dataTypes: ['Products', 'Orders', 'Customers', 'Discounts'],
    gradient: 'from-green-500/20 to-teal-500/20'
  },
  {
    name: 'WooCommerce',
    category: 'eCommerce',
    description: 'WordPress eCommerce platform backup for products and orders.',
    domain: 'woocommerce.com',
    comingSoon: true,
    setupTime: '7 min',
    features: ['Products', 'Orders', 'Customers', 'Coupons'],
    useCases: ['Store Backup', 'Migration', 'Analytics'],
    dataTypes: ['Products', 'Orders', 'Customers', 'Reviews'],
    gradient: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    name: 'BigCommerce',
    category: 'eCommerce',
    description: 'Enterprise eCommerce platform data backup and protection.',
    domain: 'bigcommerce.com',
    comingSoon: true,
    setupTime: '5 min',
    features: ['Catalog', 'Orders', 'Customers', 'Marketing'],
    useCases: ['Enterprise Backup', 'Data Migration', 'Analytics'],
    dataTypes: ['Products', 'Orders', 'Customers', 'Categories'],
    gradient: 'from-blue-500/20 to-cyan-500/20'
  }
]

const categories = ['All', 'CRM & Marketing', 'Payment Processing', 'Email Marketing', 'All-in-One Marketing', 'Customer Support', 'eCommerce']

export default function PlatformsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showComingSoon, setShowComingSoon] = useState(true)

  const filteredPlatforms = useMemo(() => {
    return allPlatforms.filter(platform => {
      const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          platform.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || platform.category === selectedCategory
      const matchesStatus = showComingSoon || !platform.comingSoon
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [searchTerm, selectedCategory, showComingSoon])

  const featuredPlatforms = allPlatforms.filter(i => i.featured && !i.comingSoon)
  const popularPlatforms = allPlatforms.filter(i => i.popular && !i.comingSoon)

  return (
    <LandingLayout>
      <HeroSection
        badge="🔌 50+ Platforms"
        title="Connect All Your Business Tools"
        subtitle="One Platform, Every Integration"
        description="Backup data from all your favorite business platforms. From CRMs to payment processors, we support the tools you use every day."
        primaryCTA={{
          text: "Start Free Trial",
          href: "/signup"
        }}
        secondaryCTA={{
          text: "Request Integration",
          href: "/platforms/request"
        }}
        gradient="purple"
      />

      {/* Featured Integrations */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Featured Platforms
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Most Popular Platforms
            </h2>
            <p className="text-muted-foreground">
              Get started with these top-rated platforms that our customers love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredPlatforms.map((platform, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm overflow-hidden">
                    <Image
                      src={`https://logo.clearbit.com/${platform.domain}`}
                      alt={`${platform.name} logo`}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{platform.setupTime} setup</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/platforms/${platform.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      Learn More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search platforms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Coming Soon Toggle */}
            <div className="flex items-center space-x-2 mb-8">
              <input
                type="checkbox"
                id="showComingSoon"
                checked={showComingSoon}
                onChange={(e) => setShowComingSoon(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="showComingSoon" className="text-sm text-muted-foreground">
                Show coming soon platforms
              </label>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-6">
              Showing {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''}
            </p>

            {/* Platforms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlatforms.map((platform, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                  <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg`} />
                  
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
                            <Clock className="w-3 h-3 mr-1" />
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
                        <h4 className="text-xs font-medium text-foreground mb-2">Data Types:</h4>
                        <div className="flex flex-wrap gap-1">
                          {platform.dataTypes.slice(0, 3).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {platform.dataTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{platform.dataTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Setup: {platform.setupTime}</span>
                        <span>{platform.features.length} features</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group/btn"
                        disabled={platform.comingSoon}
                        asChild={!platform.comingSoon}
                      >
                        {platform.comingSoon ? (
                          <>
                            Coming Soon
                          </>
                        ) : (
                          <Link href={`/platforms/${platform.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlatforms.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No platforms found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Request Platform CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Don't See Your Platform?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                We're constantly adding new platforms. Request yours and we'll prioritize it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link href="/platforms/request">
                    Request Platform
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/contact">
                    Contact Sales
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