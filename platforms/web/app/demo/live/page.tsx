import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { InteractiveDemo } from '@/components/demo/interactive-demo'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Play,
  Clock,
  Users,
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata(
  'Live Interactive Demo - See ListBackup.ai in Action',
  'Experience our platform with real sample data. See how easy it is to backup and protect your business data from 50+ platforms.',
  '/demo/live'
)

const demoFeatures = [
  {
    icon: Play,
    title: 'Interactive Experience',
    description: 'Navigate through real platform interfaces with sample data'
  },
  {
    icon: Clock,
    title: '5-Minute Walkthrough',
    description: 'Complete guided tour of all major features and capabilities'
  },
  {
    icon: Shield,
    title: 'Real Security Features',
    description: 'See actual compliance and security measures in action'
  },
  {
    icon: Users,
    title: 'Multiple Platform Views',
    description: 'Experience Keap, Stripe, and GoHighLevel integrations'
  }
]

const testimonials = [
  {
    quote: "The live demo convinced me immediately. Seeing the actual data backup process in real-time was impressive.",
    author: "Jennifer Walsh",
    role: "IT Director",
    company: "TechFlow Solutions"
  },
  {
    quote: "I love how the demo shows real compliance features. Made it easy to get stakeholder buy-in.",
    author: "David Rodriguez",
    role: "Compliance Manager", 
    company: "Financial Partners Group"
  }
]

export default function LiveDemoPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🎬 Interactive Experience"
        title="See ListBackup.ai in Action"
        subtitle="Live Interactive Demo"
        description="Experience our platform with real sample data. Navigate through actual interfaces and see how easy it is to protect your business data."
        primaryCTA={{
          text: "Start Demo Below",
          href: "#interactive-demo"
        }}
        secondaryCTA={{
          text: "Schedule Personal Demo",
          href: "/demo"
        }}
        features={[
          "Real Sample Data",
          "Interactive Navigation", 
          "5-Minute Experience",
          "No Registration Required"
        ]}
        gradient="blue"
      />

      {/* Demo Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Interactive Experience
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What You'll Experience
            </h2>
            <p className="text-lg text-muted-foreground">
              Our interactive demo uses real sample data to show you exactly how ListBackup.ai works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="interactive-demo" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Interactive Demo Environment
            </h2>
            <p className="text-lg text-muted-foreground">
              Click play to start your guided tour, or navigate through the steps manually.
            </p>
          </div>

          <InteractiveDemo />
        </div>
      </section>

      {/* What You'll See */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What You'll Discover
            </h2>
            <p className="text-lg text-muted-foreground">
              Our demo covers all the key features that make ListBackup.ai the best choice for business data protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Platform Integrations',
                description: 'See how easily we connect to Keap, Stripe, GoHighLevel, and 50+ other platforms',
                items: ['One-click connections', 'OAuth security', 'Real-time sync', 'Auto-discovery']
              },
              {
                title: 'Data Security',
                description: 'Experience our bank-level security measures and compliance features',
                items: ['AES-256 encryption', 'PCI DSS compliance', 'SOC 2 certification', 'Audit trails']
              },
              {
                title: 'Agency Features',
                description: 'Explore white-label solutions and multi-client management capabilities',
                items: ['White-label dashboard', 'Bulk operations', 'Client isolation', 'Agency reporting']
              },
              {
                title: 'Analytics Dashboard',
                description: 'View comprehensive analytics and performance monitoring tools',
                items: ['Backup performance', 'Data insights', 'Custom reports', 'Health monitoring']
              },
              {
                title: 'Automation Workflows',
                description: 'See intelligent automation and backup scheduling in action',
                items: ['Smart scheduling', 'Auto-retry logic', 'Failure notifications', 'Custom rules']
              },
              {
                title: 'Recovery Features',
                description: 'Learn about our disaster recovery and data restoration capabilities',
                items: ['Point-in-time recovery', 'Selective restore', 'Migration tools', 'Export options']
              }
            ].map((section, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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

      {/* Testimonials */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What People Say About Our Demo
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

      {/* Next Steps */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Your Business Data?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                You've seen how easy it is. Now experience it with your actual data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-white/90" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo">
                    Schedule Personal Demo
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-white/80 mt-4">
                No credit card required • 14-day free trial • Setup in minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingLayout>
  )
}