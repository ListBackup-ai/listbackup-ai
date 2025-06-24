'use client'

import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Users,
  ArrowRight,
  Send,
  Building,
  CreditCard,
  HelpCircle,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help from our support team',
    contact: 'support@listbackup.ai',
    href: 'mailto:support@listbackup.ai',
    availability: '24/7 Response'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with us in real-time',
    contact: 'Available in dashboard',
    href: '/login',
    availability: 'Mon-Fri 9AM-6PM PST'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Enterprise customers only',
    contact: '+1 (555) 123-4567',
    href: 'tel:+15551234567',
    availability: 'Mon-Fri 9AM-6PM PST'
  },
  {
    icon: Calendar,
    title: 'Schedule Demo',
    description: 'Book a personalized demo',
    contact: 'Choose your time',
    href: '/demo',
    availability: 'Available 24/7'
  }
]

const contactReasons = [
  {
    icon: CreditCard,
    title: 'Sales Inquiry',
    description: 'Questions about pricing or plans',
    email: 'sales@listbackup.ai'
  },
  {
    icon: HelpCircle,
    title: 'Technical Support',
    description: 'Help with setup or troubleshooting',
    email: 'support@listbackup.ai'
  },
  {
    icon: Building,
    title: 'Enterprise Sales',
    description: 'Custom solutions for large organizations',
    email: 'enterprise@listbackup.ai'
  },
  {
    icon: Users,
    title: 'Partnership',
    description: 'Become an integration partner',
    email: 'partners@listbackup.ai'
  }
]

const offices = [
  {
    city: 'San Francisco',
    address: '123 Market Street, Suite 400',
    zipcode: 'San Francisco, CA 94105',
    type: 'Headquarters'
  },
  {
    city: 'New York',
    address: '456 Broadway, Floor 12',
    zipcode: 'New York, NY 10013',
    type: 'East Coast Office'
  },
  {
    city: 'London',
    address: '789 King\'s Road',
    zipcode: 'London, UK SW3 4RP',
    type: 'European Office'
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <LandingLayout>
      <HeroSection
        badge="💬 Get in Touch"
        title="We're Here to Help"
        subtitle="Contact Our Team"
        description="Have questions about ListBackup.ai? Our team is ready to help you find the perfect data backup solution for your business."
        primaryCTA={{
          text: "Start Live Chat",
          href: "/login"
        }}
        secondaryCTA={{
          text: "Schedule Demo",
          href: "/demo"
        }}
        gradient="green"
      />

      {/* Contact Methods */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Multiple Ways to Reach Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Choose Your Preferred Contact Method
            </h2>
            <p className="text-lg text-muted-foreground">
              We offer multiple support channels to ensure you get help when you need it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <method.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                  <p className="text-sm font-medium text-primary mb-2">{method.contact}</p>
                  <p className="text-xs text-muted-foreground mb-4">{method.availability}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={method.href}>
                      Contact Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Reasons */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
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
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Send Message
                  <Send className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </div>

            {/* Contact Reasons */}
            <div>
              <h2 className="text-3xl font-bold mb-6">What Can We Help With?</h2>
              <p className="text-muted-foreground mb-8">
                Choose the right team for your inquiry to get the fastest response.
              </p>

              <div className="space-y-4">
                {contactReasons.map((reason, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <reason.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{reason.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{reason.description}</p>
                          <Link 
                            href={`mailto:${reason.email}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {reason.email}
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Global Presence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Our Office Locations
            </h2>
            <p className="text-lg text-muted-foreground">
              We have offices around the world to serve our global customer base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                  <Badge className="mb-3 bg-blue-500/10 text-blue-600 border-blue-500/20">
                    {office.type}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2">{office.city}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{office.address}</p>
                  <p className="text-sm text-muted-foreground">{office.zipcode}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions. Can't find what you're looking for?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                question: "What's your average response time?",
                answer: "We respond to all inquiries within 24 hours, with most responses sent within 4 hours during business hours."
              },
              {
                question: "Do you offer phone support?",
                answer: "Phone support is available for Enterprise customers. All other customers can use email, chat, or schedule a demo."
              },
              {
                question: "Can I schedule a demo?",
                answer: "Yes! You can schedule a personalized demo at any time. We offer both live demos and self-guided tours."
              },
              {
                question: "How do I report a security issue?",
                answer: "Security issues should be reported immediately to security@listbackup.ai. We take all security reports seriously."
              },
              {
                question: "Do you have international support?",
                answer: "Yes, we have offices in San Francisco, New York, and London to provide global support coverage."
              },
              {
                question: "Can I get help with setup?",
                answer: "Absolutely! Our support team can help with setup, configuration, and best practices for your specific use case."
              }
            ].map((faq, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/help">
                View All FAQs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Don't wait - start protecting your business data today with a free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-white/90" asChild>
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