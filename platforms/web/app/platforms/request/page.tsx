'use client'

import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Star, 
  Clock, 
  Users,
  Check,
  ArrowRight,
  Zap,
  Building,
  Code,
  Database
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const popularRequests = [
  { name: 'Notion', votes: 234, category: 'Productivity' },
  { name: 'Airtable', votes: 189, category: 'Database' },
  { name: 'Calendly', votes: 156, category: 'Scheduling' },
  { name: 'Slack', votes: 143, category: 'Communication' },
  { name: 'Trello', votes: 128, category: 'Project Management' },
  { name: 'QuickBooks', votes: 112, category: 'Accounting' },
  { name: 'Asana', votes: 98, category: 'Project Management' },
  { name: 'Monday.com', votes: 87, category: 'Project Management' }
]

const categories = [
  'CRM & Sales',
  'Email Marketing', 
  'E-commerce',
  'Accounting',
  'Project Management',
  'Communication',
  'Productivity',
  'Analytics',
  'HR & Recruiting',
  'Customer Support',
  'Social Media',
  'Other'
]

const developmentProcess = [
  {
    step: '1',
    title: 'Request Review',
    description: 'We review your integration request and assess technical requirements',
    timeframe: '1-2 days'
  },
  {
    step: '2',
    title: 'Development Planning',
    description: 'Our team creates a development plan and timeline',
    timeframe: '1 week'
  },
  {
    step: '3',
    title: 'Integration Development',
    description: 'We build and test the integration with comprehensive data coverage',
    timeframe: '2-6 weeks'
  },
  {
    step: '4',
    title: 'Beta Testing',
    description: 'You get early access to test the integration with your data',
    timeframe: '1-2 weeks'
  },
  {
    step: '5',
    title: 'General Availability',
    description: 'Integration is released to all customers',
    timeframe: '1 week'
  }
]

export default function IntegrationRequestPage() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    platform: '',
    category: '',
    name: '',
    email: '',
    company: '',
    priority: 'medium',
    useCase: '',
    dataTypes: '',
    urgency: '',
    currentSolution: ''
  })

  useEffect(() => {
    const platform = searchParams.get('platform')
    if (platform) {
      setFormData(prev => ({ ...prev, platform: platform }))
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle integration request submission
    console.log('Integration request submitted:', formData)
  }

  const handleVote = (platformName: string) => {
    // Handle voting for existing requests
    console.log('Voted for:', platformName)
  }

  return (
    <LandingLayout>
      <HeroSection
        badge="🚀 Request Integration"
        title="Need a New Integration?"
        subtitle="We'll Build It for You"
        description="Don't see your platform in our list? Request a new integration and we'll prioritize it based on demand. Most integrations are built within 4-8 weeks."
        primaryCTA={{
          text: "Submit Request",
          href: "#request-form"
        }}
        secondaryCTA={{
          text: "View Roadmap",
          href: "/roadmap"
        }}
        gradient="purple"
      />

      {/* Popular Requests */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Community Requests
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Most Requested Integrations
            </h2>
            <p className="text-lg text-muted-foreground">
              See what other users are requesting and vote for your favorites to help us prioritize.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRequests.map((request, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{request.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{request.category}</p>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{request.votes} votes</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleVote(request.name)}
                  >
                    Vote for This
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section id="request-form" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Request a New Integration
              </h2>
              <p className="text-lg text-muted-foreground">
                Tell us about the platform you need and we'll get it built for you.
              </p>
            </div>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-xl">Integration Request Details</h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="platform">Platform Name *</Label>
                      <Input
                        id="platform"
                        name="platform"
                        value={formData.platform}
                        onChange={handleInputChange}
                        placeholder="e.g., Notion, Airtable, QuickBooks"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority Level *</Label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        required
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="low">Low - Nice to have</option>
                        <option value="medium">Medium - Important for workflow</option>
                        <option value="high">High - Critical for business</option>
                        <option value="urgent">Urgent - Blocking our adoption</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="useCase">Use Case & Business Need *</Label>
                    <textarea
                      id="useCase"
                      name="useCase"
                      value={formData.useCase}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe how you use this platform and why you need it backed up. What business problem does this solve?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataTypes">What data needs to be backed up?</Label>
                    <textarea
                      id="dataTypes"
                      name="dataTypes"
                      value={formData.dataTypes}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="e.g., Customer records, transactions, documents, configurations, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="urgency">When do you need this?</Label>
                      <select
                        id="urgency"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select timeframe</option>
                        <option value="immediate">Immediately</option>
                        <option value="1month">Within 1 month</option>
                        <option value="3months">Within 3 months</option>
                        <option value="6months">Within 6 months</option>
                        <option value="flexible">Flexible timeline</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="currentSolution">Current backup solution?</Label>
                      <Input
                        id="currentSolution"
                        name="currentSolution"
                        value={formData.currentSolution}
                        onChange={handleInputChange}
                        placeholder="e.g., Manual exports, other tools, none"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" size="lg" className="flex-1">
                      Submit Integration Request
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button type="button" variant="outline" size="lg" asChild>
                      <Link href="/contact">
                        Discuss with Sales
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Our Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              How We Build Integrations
            </h2>
            <p className="text-lg text-muted-foreground">
              From request to release, here's our proven integration development process.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Process line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary/20"></div>
              
              {developmentProcess.map((step, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Step number */}
                  <div className="absolute left-8 md:left-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm transform -translate-x-1/2 z-10">
                    {step.step}
                  </div>
                  
                  {/* Content */}
                  <div className={`ml-20 md:ml-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'} md:w-1/2`}>
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {step.timeframe}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Our Integration Guarantee
            </h2>
            <p className="text-lg text-muted-foreground">
              We're committed to building the integrations you need for your business success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Fast Development",
                description: "Most integrations completed within 4-8 weeks of approval"
              },
              {
                icon: Building,
                title: "Enterprise Quality",
                description: "Built to enterprise standards with comprehensive data coverage"
              },
              {
                icon: Code,
                title: "Full API Support",
                description: "Complete API integration with all available data endpoints"
              }
            ].map((guarantee, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <guarantee.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{guarantee.title}</h3>
                  <p className="text-sm text-muted-foreground">{guarantee.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Your Integration Built?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Submit your request today and we'll get started on building the integration you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90" asChild>
              <Link href="#request-form">
                Submit Request
                <Plus className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/contact">
                Talk to Our Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}