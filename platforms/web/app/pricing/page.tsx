import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, HelpCircle, Star } from 'lucide-react'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata(
  'Pricing - Simple, Transparent Plans',
  'Choose the perfect data backup plan for your business. Start with a 14-day free trial. No credit card required.',
  '/pricing'
)

const faqs = [
  {
    question: "What's included in the free trial?",
    answer: "Your 14-day free trial includes full access to all features in your chosen plan. No credit card required to start."
  },
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains accessible for 30 days after cancellation. You can export all your data during this period."
  },
  {
    question: "Do you offer custom pricing for large organizations?",
    answer: "Yes, we offer custom pricing for organizations with unique needs. Contact our sales team for a personalized quote."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees ever. You only pay for your monthly or yearly subscription."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers, and can arrange invoice billing for Enterprise customers."
  },
  {
    question: "How secure is my billing information?",
    answer: "All billing is processed through Stripe with PCI DSS Level 1 compliance. We never store your payment information."
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not satisfied."
  }
]

const addOns = [
  {
    name: 'Priority Support',
    price: '$49/month',
    description: 'Dedicated support channel with guaranteed 2-hour response time',
    features: ['Dedicated support channel', '2-hour response SLA', 'Phone support', 'Account manager']
  },
  {
    name: 'Extended Storage',
    price: '$0.10/GB/month', 
    description: 'Additional storage beyond your plan limit',
    features: ['Pay per GB used', 'Automatic scaling', 'No commitment', 'Instant provisioning']
  },
  {
    name: 'Custom Integration',
    price: 'Starting at $2,500',
    description: 'Build a custom integration for your specific platform',
    features: ['Full API development', 'Testing & validation', 'Documentation', '6 months support']
  },
  {
    name: 'Professional Services',
    price: '$200/hour',
    description: 'Get help with migration, setup, and optimization',
    features: ['Migration assistance', 'Custom workflows', 'Training sessions', 'Best practices review']
  }
]

const testimonials = [
  {
    quote: "The pricing is incredibly transparent and fair. We started with Starter and upgraded to Professional as we grew.",
    author: "Jessica Wang",
    role: "IT Director",
    company: "TechFlow Inc",
    rating: 5
  },
  {
    quote: "Enterprise plan saves us over $50k/year compared to building our own backup solution.",
    author: "Mark Rodriguez", 
    role: "CTO",
    company: "DataCorp Solutions",
    rating: 5
  },
  {
    quote: "The value we get from the Professional plan is incredible. ROI paid for itself in the first month.",
    author: "Sarah Kim",
    role: "Operations Manager",
    company: "Growth Marketing Pro",
    rating: 5
  }
]

export default function PricingPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="💰 Transparent Pricing"
        title="Simple, Predictable Pricing"
        subtitle="No Hidden Fees, No Surprises"
        description="Choose the plan that fits your business. Start with a 14-day free trial, upgrade anytime, and only pay for what you use."
        primaryCTA={{
          text: "Start Free Trial",
          href: "/signup"
        }}
        secondaryCTA={{
          text: "Contact Sales",
          href: "/contact"
        }}
        features={[
          "14-day free trial",
          "No setup fees",
          "Cancel anytime",
          "30-day money back"
        ]}
        gradient="green"
      />

      <PricingSection />

      {/* Add-ons Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Add-ons & Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Extend Your Plan
            </h2>
            <p className="text-lg text-muted-foreground">
              Additional services and add-ons to maximize your ListBackup.ai experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {addOns.map((addon, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{addon.name}</h3>
                      <p className="text-2xl font-bold text-primary">{addon.price}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">{addon.description}</p>
                  <ul className="space-y-2 mb-6">
                    {addon.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Customer Reviews
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What Our Customers Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Don't just take our word for it - see what real customers think about our pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-background to-muted/20">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
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

      {/* FAQ Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Frequently Asked Questions
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Got Questions?
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about our pricing and billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Contact Support
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of businesses who trust ListBackup.ai with their critical data. Start your free trial today.
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