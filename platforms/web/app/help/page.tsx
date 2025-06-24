import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchBox } from '@/components/ui/search'
import { 
  Book, 
  MessageCircle, 
  Video,
  HelpCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  Database,
  Zap
} from 'lucide-react'
import Link from 'next/link'

const helpCategories = [
  {
    title: 'Getting Started',
    description: 'Set up your account and first backup',
    icon: Zap,
    articles: [
      'Creating your ListBackup.ai account',
      'Connecting your first integration',
      'Understanding backup schedules',
      'Setting up notifications'
    ]
  },
  {
    title: 'Integrations',
    description: 'Connect and manage your platforms',
    icon: Settings,
    articles: [
      'Supported integrations list',
      'Connecting Stripe accounts',
      'Setting up Keap backups',
      'GoHighLevel integration guide'
    ]
  },
  {
    title: 'Data Management',
    description: 'Manage your backed up data',
    icon: Database,
    articles: [
      'Browsing your backed up data',
      'Exporting data for analysis',
      'Data retention policies',
      'Understanding backup formats'
    ]
  },
  {
    title: 'Security & Compliance',
    description: 'Security features and compliance',
    icon: Shield,
    articles: [
      'How we protect your data',
      'GDPR compliance features',
      'Enterprise security standards',
      'Data encryption explained'
    ]
  }
]

const faqs = [
  {
    question: "How often are backups performed?",
    answer: "Backup frequency depends on your plan. Professional plans include real-time sync, while Starter plans backup daily. You can see your specific backup schedule in your dashboard."
  },
  {
    question: "What happens if an integration fails?",
    answer: "We automatically retry failed backups and send you notifications. Our system monitors all integrations 24/7 and will alert you to any issues that need attention."
  },
  {
    question: "Can I export my data in different formats?",
    answer: "Yes! You can export data in JSON, CSV, and XML formats. Enterprise customers also get API access for custom export scripts and integrations."
  },
  {
    question: "How long is data retained?",
    answer: "Data retention varies by plan: Starter (30 days), Professional (90 days), Enterprise (custom). You can upgrade for longer retention at any time."
  },
  {
    question: "Is my data encrypted?",
    answer: "Yes, all data is encrypted with AES-256 encryption both in transit and at rest. We follow industry best practices and maintain comprehensive security standards."
  },
  {
    question: "Can I restore data to my original platform?",
    answer: "We provide data export capabilities. While we don't directly restore to platforms, our exports are formatted for easy import into most systems."
  },
  {
    question: "What if I need help with setup?",
    answer: "We offer setup assistance for all plans. Professional and Enterprise customers get priority support with dedicated setup calls available."
  },
  {
    question: "Do you support custom integrations?",
    answer: "Yes! Enterprise customers can request custom integrations. We also accept integration requests from all users and prioritize based on demand."
  }
]

const supportChannels = [
  {
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    icon: MessageCircle,
    availability: 'Mon-Fri 9AM-6PM PST',
    response: 'Instant',
    action: 'Start Chat',
    href: '/login'
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message',
    icon: HelpCircle,
    availability: '24/7',
    response: '< 4 hours',
    action: 'Send Email',
    href: 'mailto:support@listbackup.ai'
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step guides',
    icon: Video,
    availability: 'Always available',
    response: 'Self-service',
    action: 'Watch Videos',
    href: '/tutorials'
  },
  {
    title: 'Knowledge Base',
    description: 'Browse detailed documentation',
    icon: Book,
    availability: 'Always available', 
    response: 'Self-service',
    action: 'Browse Docs',
    href: '/docs'
  }
]

const statusItems = [
  { component: 'API Services', status: 'operational', uptime: '99.98%' },
  { component: 'Backup Processing', status: 'operational', uptime: '99.95%' },
  { component: 'Dashboard', status: 'operational', uptime: '99.99%' },
  { component: 'Integrations', status: 'minor-issue', uptime: '99.87%' }
]

export default function HelpPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="💡 Help Center"
        title="How Can We Help You?"
        subtitle="Find Answers & Get Support"
        description="Everything you need to know about using ListBackup.ai effectively. From getting started to advanced features, we've got you covered."
        primaryCTA={{
          text: "Contact Support",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Browse Docs",
          href: "/docs"
        }}
        gradient="blue"
      />

      {/* Search */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <SearchBox 
              placeholder="Search for help articles, guides, or FAQs..." 
              className="h-14 text-lg"
            />
            <p className="text-center text-sm text-muted-foreground mt-3">
              Popular searches: setup guide, export data, billing, integrations
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Get Support
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Multiple Ways to Get Help
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the support channel that works best for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <channel.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{channel.availability}</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Response: {channel.response}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={channel.href}>
                      {channel.action}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Browse by Topic
            </h2>
            <p className="text-lg text-muted-foreground">
              Find detailed guides and tutorials organized by topic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.articles.map((article, idx) => (
                      <li key={idx}>
                        <Link 
                          href={`/docs/${article.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex items-center space-x-2 text-sm hover:text-primary transition-colors group/item"
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                          <span>{article}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to the most common questions.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 group-hover:text-primary transition-colors">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              System Status
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              All Systems Operational
            </h2>
            <p className="text-lg text-muted-foreground">
              Real-time status of our services and infrastructure.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {statusItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'operational' ? 'bg-green-500' : 
                          item.status === 'minor-issue' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{item.component}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {item.uptime} uptime
                        </span>
                        <div className="flex items-center space-x-2">
                          {item.status === 'operational' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-sm capitalize">
                            {item.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button variant="outline" asChild>
                    <Link href="/status">
                      View Full Status Page
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Still Need Help?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link href="/contact">
                    Contact Support
                    <MessageCircle className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/demo">
                    Schedule Demo
                    <Video className="w-5 h-5 ml-2" />
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