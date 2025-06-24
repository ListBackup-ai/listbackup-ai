import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Target, 
  Award, 
  Shield, 
  Globe, 
  Heart,
  ArrowRight,
  Lightbulb,
  Rocket,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata(
  'About Us - Our Mission & Team',
  'Learn about ListBackup.ai\'s mission to democratize enterprise data protection. Meet our team and discover our values.',
  '/about'
)

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'We believe data security is not optional. Every feature is built with security as the foundation.'
  },
  {
    icon: Heart,
    title: 'Customer Obsessed',
    description: 'Our customers\' success is our success. We listen, adapt, and deliver solutions that matter.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We constantly push boundaries to create the most advanced data backup platform available.'
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Enterprise-grade data protection should be accessible to businesses of all sizes.'
  }
]

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former VP of Engineering at a Fortune 500 company. 15+ years in enterprise data systems.',
    initials: 'SC'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CTO & Co-Founder', 
    bio: 'Ex-Google senior engineer. Led data infrastructure teams serving billions of users.',
    initials: 'MR'
  },
  {
    name: 'Dr. Emily Watson',
    role: 'VP of Security',
    bio: 'Former NSA cybersecurity specialist. PhD in Cryptography from MIT.',
    initials: 'EW'
  },
  {
    name: 'David Kim',
    role: 'VP of Product',
    bio: 'Previously led product at three successful SaaS startups. Expert in B2B workflows.',
    initials: 'DK'
  }
]

const stats = [
  { value: '10TB+', label: 'Data Protected Daily' },
  { value: '500+', label: 'Enterprise Customers' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24/7', label: 'Global Support' }
]

const timeline = [
  {
    year: '2023',
    title: 'Company Founded',
    description: 'ListBackup.ai was founded to solve the growing data backup challenges faced by modern businesses.'
  },
  {
    year: '2023',
    title: 'First 10 Integrations',
    description: 'Launched with support for the most popular business platforms including Stripe, Keap, and Mailchimp.'
  },
  {
    year: '2024',
    title: 'Series A Funding',
    description: 'Raised $15M Series A to accelerate product development and international expansion.'
  },
  {
    year: '2024',
    title: '50+ Integrations',
    description: 'Expanded to support over 50 platforms with AI-powered data insights and analytics.'
  },
  {
    year: '2025',
    title: 'Global Enterprise',
    description: 'Serving Fortune 500 companies with hierarchical account management and custom integrations.'
  }
]

export default function AboutPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🏢 About ListBackup.ai"
        title="Protecting Business Data, Worldwide"
        subtitle="Our Mission, Values & Team"
        description="We're building the future of business data protection. From startups to Fortune 500 companies, we believe every business deserves enterprise-grade data security."
        primaryCTA={{
          text: "Get Started",
          href: "/pricing"
        }}
        secondaryCTA={{
          text: "Contact Us",
          href: "/contact"
        }}
        gradient="blue"
      />

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
                Our Mission
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Democratizing Enterprise Data Protection
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                In an increasingly digital world, business data is more valuable than ever. Yet traditional backup solutions are complex, expensive, and built for yesterday's challenges.
              </p>
              <p className="text-lg text-muted-foreground">
                We're changing that. ListBackup.ai makes enterprise-grade data protection accessible to businesses of all sizes, with the intelligence of AI and the simplicity of modern design.
              </p>
            </div>
            <div>
              <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                Our Vision
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                A World Where Data Loss Is History
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We envision a future where businesses never worry about data loss, compliance violations, or platform migrations.
              </p>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform will predict and prevent data issues before they happen, making data protection proactive rather than reactive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Our Values
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What Drives Us Every Day
            </h2>
            <p className="text-lg text-muted-foreground">
              These core values guide every decision we make and every feature we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Trusted by Businesses Worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              From startups to Fortune 500 companies, businesses trust us with their most critical data.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
              Leadership Team
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Meet the People Behind ListBackup.ai
            </h2>
            <p className="text-lg text-muted-foreground">
              Our team combines decades of experience in enterprise software, security, and data systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary group-hover:scale-110 transition-transform">
                    {member.initials}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Our Journey
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Building the Future of Data Protection
            </h2>
            <p className="text-lg text-muted-foreground">
              From startup to enterprise platform - here's how we got here.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary/20"></div>
              
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 z-10"></div>
                  
                  {/* Content */}
                  <div className={`ml-16 md:ml-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'} md:w-1/2`}>
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
                          {item.year}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Protect Your Data?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of businesses who trust ListBackup.ai to protect their most critical data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href="/pricing">
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}