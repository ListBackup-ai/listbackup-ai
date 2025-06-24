import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  ArrowRight, 
  Package, 
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Truck,
  Gift,
  Star,
  TrendingUp,
  Shield,
  RefreshCw,
  Database
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const shopifyFeatures = [
  {
    icon: Package,
    title: 'Products & Inventory',
    description: 'Complete product catalog with variants, inventory levels, and pricing history.',
    items: ['Product details', 'Variants & options', 'Inventory tracking', 'Pricing history']
  },
  {
    icon: ShoppingCart,
    title: 'Orders & Transactions',
    description: 'All order data, transaction details, and fulfillment information.',
    items: ['Order details', 'Transaction records', 'Fulfillment data', 'Refund history']
  },
  {
    icon: Users,
    title: 'Customers & Profiles',
    description: 'Customer information, purchase history, and behavioral data.',
    items: ['Customer profiles', 'Purchase history', 'Address book', 'Customer tags']
  },
  {
    icon: CreditCard,
    title: 'Payment & Financial',
    description: 'Payment gateway data, financial reports, and tax information.',
    items: ['Payment details', 'Gateway records', 'Financial reports', 'Tax data']
  },
  {
    icon: Gift,
    title: 'Marketing & Discounts',
    description: 'Discount codes, promotions, gift cards, and marketing campaigns.',
    items: ['Discount codes', 'Promotions', 'Gift cards', 'Marketing data']
  },
  {
    icon: Truck,
    title: 'Shipping & Fulfillment',
    description: 'Shipping zones, rates, carrier data, and fulfillment services.',
    items: ['Shipping zones', 'Carrier rates', 'Fulfillment centers', 'Tracking data']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Sales analytics, customer insights, and performance metrics.',
    items: ['Sales reports', 'Customer analytics', 'Performance metrics', 'Custom reports']
  },
  {
    icon: Star,
    title: 'Reviews & Content',
    description: 'Product reviews, blog content, pages, and media assets.',
    items: ['Product reviews', 'Blog posts', 'Page content', 'Media library']
  }
]

const ecommerceUseCases = [
  {
    title: 'Store Migration',
    description: 'Migrate to another platform or upgrade your Shopify plan without losing data.',
    icon: RefreshCw,
    benefits: ['Complete data export', 'Platform migration', 'Shopify Plus upgrade', 'Zero data loss']
  },
  {
    title: 'Business Intelligence',
    description: 'Export data for advanced analytics, BI tools, and custom reporting.',
    icon: TrendingUp,
    benefits: ['BI tool integration', 'Custom analytics', 'Historical analysis', 'Performance insights']
  },
  {
    title: 'Compliance & Auditing',
    description: 'Meet financial and tax compliance requirements with complete transaction records.',
    icon: Shield,
    benefits: ['Tax compliance', 'Financial audits', 'Transaction records', 'Regulatory reporting']
  },
  {
    title: 'Disaster Recovery',
    description: 'Protect against data loss with comprehensive store backup and recovery.',
    icon: Database,
    benefits: ['Store backup', 'Quick recovery', 'Business continuity', 'Data protection']
  }
]

const dataCategories = [
  {
    category: 'Product Catalog',
    items: ['Products', 'Variants', 'Collections', 'Inventory', 'Pricing', 'Images'],
    color: 'bg-blue-500/10 text-blue-600'
  },
  {
    category: 'Order Management',
    items: ['Orders', 'Line Items', 'Fulfillments', 'Transactions', 'Refunds', 'Returns'],
    color: 'bg-green-500/10 text-green-600'
  },
  {
    category: 'Customer Data',
    items: ['Customer Profiles', 'Addresses', 'Order History', 'Tags', 'Metafields', 'Segments'],
    color: 'bg-purple-500/10 text-purple-600'
  },
  {
    category: 'Marketing',
    items: ['Discount Codes', 'Price Rules', 'Gift Cards', 'Marketing Events', 'Campaigns', 'Abandoned Carts'],
    color: 'bg-orange-500/10 text-orange-600'
  },
  {
    category: 'Financial',
    items: ['Payouts', 'Disputes', 'Charges', 'Balance', 'Tender Transactions', 'Tax Settings'],
    color: 'bg-red-500/10 text-red-600'
  },
  {
    category: 'Content & SEO',
    items: ['Blog Posts', 'Pages', 'Redirects', 'Themes', 'Assets', 'SEO Settings'],
    color: 'bg-indigo-500/10 text-indigo-600'
  }
]

const shopifyTiers = [
  {
    name: 'Shopify Basic',
    description: 'Perfect for small stores starting their backup journey',
    features: ['All store data', 'Daily backups', 'Basic analytics', '30-day retention'],
    price: '$29/month'
  },
  {
    name: 'Shopify Advanced',
    description: 'For growing stores with advanced backup needs',
    features: ['Real-time sync', 'Advanced analytics', '90-day retention', 'Priority support'],
    price: '$79/month',
    popular: true
  },
  {
    name: 'Shopify Plus',
    description: 'Enterprise-grade backup for high-volume stores',
    features: ['Multi-store support', 'Custom retention', 'API access', 'Dedicated support'],
    price: 'Custom'
  }
]

const relatedIntegrations = [
  { name: 'WooCommerce', domain: 'woocommerce.com', category: 'eCommerce' },
  { name: 'BigCommerce', domain: 'bigcommerce.com', category: 'eCommerce' },
  { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
  { name: 'PayPal', domain: 'paypal.com', category: 'Payments' },
  { name: 'Square', domain: 'squareup.com', category: 'Payments' },
  { name: 'Mailchimp', domain: 'mailchimp.com', category: 'Email Marketing' },
  { name: 'Keap', domain: 'keap.com', category: 'CRM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' }
]

export default function ShopifyIntegrationPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🛍️ Coming Soon"
        title="Shopify Store Protection"
        subtitle="Complete E-commerce Data Backup"
        description="Protect your entire Shopify store including products, orders, customers, and analytics. Comprehensive backup solution for e-commerce businesses of all sizes."
        primaryCTA={{
          text: "Join Waitlist",
          href: "/platforms/request?platform=shopify"
        }}
        secondaryCTA={{
          text: "Store Demo",
          href: "/demo/shopify"
        }}
        features={[
          "Complete Store Backup",
          "Order Protection",
          "Customer Data Safe",
          "Shopify Plus Ready"
        ]}
        gradient="green"
      />

      {/* What Gets Backed Up */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Complete Store Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Every Piece of Your Shopify Store
            </h2>
            <p className="text-lg text-muted-foreground">
              We backup everything in your Shopify store, from products to customer data and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {shopifyFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <feature.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.items.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-xs">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
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
              Every data type in your Shopify store is organized, backed up, and protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dataCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${category.color}`}>
                    {category.category}
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, idx) => (
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

      {/* E-commerce Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why E-commerce Businesses Choose Us
            </h2>
            <p className="text-lg text-muted-foreground">
              From store migrations to compliance, here's how our Shopify backup helps e-commerce businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ecommerceUseCases.map((useCase, index) => (
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

      {/* Shopify Tiers */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Pricing for Every Store Size
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Plans That Scale With Your Store
            </h2>
            <p className="text-lg text-muted-foreground">
              From small stores to enterprise operations, we have a plan that fits your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {shopifyTiers.map((tier, index) => (
              <Card key={index} className={`text-center ${tier.popular ? 'ring-2 ring-primary scale-105' : ''}`}>
                <CardContent className="p-8">
                  {tier.popular && (
                    <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
                  )}
                  <h3 className="font-bold text-xl mb-2">{tier.name}</h3>
                  <p className="text-3xl font-bold text-primary mb-2">{tier.price}</p>
                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
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
                    <Link href={tier.price === "Custom" ? "/contact?type=enterprise" : "/platforms/request?platform=shopify"}>
                      {tier.price === "Custom" ? "Contact Sales" : "Join Waitlist"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* E-commerce Stats */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Built for E-commerce Scale
            </h2>
            <p className="text-lg text-white/90">
              Handle any store size from startup to enterprise with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { metric: '10M+', label: 'Products Supported' },
              { metric: '1M+', label: 'Orders Per Day' },
              { metric: '99.9%', label: 'Uptime SLA' },
              { metric: '<5min', label: 'Sync Time' },
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

      {/* Shopify Plus Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
              Shopify Plus Ready
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Enterprise E-commerce Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Advanced features for Shopify Plus stores and high-volume merchants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Multi-Store Support",
                description: "Backup multiple Shopify stores from a single dashboard",
                features: ["Centralized management", "Cross-store analytics", "Bulk operations", "Unified reporting"]
              },
              {
                title: "Advanced API Access",
                description: "Full API access for custom integrations and workflows",
                features: ["REST API access", "Webhook integration", "Custom exports", "Real-time data"]
              },
              {
                title: "Enterprise Security",
                description: "Additional security features for enterprise compliance",
                features: ["SSO integration", "Advanced encryption", "Audit logging", "Compliance reporting"]
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-8 h-8 text-purple-600" />
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
      <section className="py-24 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Protect Your Shopify Store?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join the waitlist to be among the first to protect your e-commerce data with enterprise-grade backup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-white/90" asChild>
              <Link href="/platforms/request?platform=shopify">
                Join Waitlist
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/demo/shopify">
                Schedule Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}