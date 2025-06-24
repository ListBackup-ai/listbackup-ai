'use client'

import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  Check,
  ArrowRight,
  Phone,
  Monitor,
  Shield,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const demoTypes = [
  {
    title: 'Quick Overview',
    duration: '15 minutes',
    description: 'Perfect for getting started and understanding core features',
    features: ['Platform overview', 'Key features demo', 'Pricing discussion', 'Q&A session'],
    icon: Zap,
    recommended: false
  },
  {
    title: 'Full Product Demo',
    duration: '30 minutes', 
    description: 'Comprehensive walkthrough of all features and capabilities',
    features: ['Complete feature tour', 'Integration examples', 'Custom use cases', 'Technical Q&A'],
    icon: Monitor,
    recommended: true
  },
  {
    title: 'Enterprise Consultation',
    duration: '45 minutes',
    description: 'Deep dive for enterprise needs with security and compliance focus',
    features: ['Enterprise features', 'Security review', 'Compliance discussion', 'Custom solutions'],
    icon: Shield,
    recommended: false
  }
]

const availableSlots = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: false },
  { time: '12:00 PM', available: true },
  { time: '1:00 PM', available: false },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: true },
  { time: '4:00 PM', available: false },
  { time: '5:00 PM', available: true }
]

const demoFeatures = [
  {
    title: 'Live Integration Setup',
    description: 'Watch us connect and backup your actual data in real-time',
    icon: Video
  },
  {
    title: 'Custom Use Case Review',
    description: 'Discuss your specific backup needs and compliance requirements',
    icon: Users
  },
  {
    title: 'Security Walkthrough',
    description: 'Deep dive into our security measures and compliance features',
    icon: Shield
  },
  {
    title: 'Pricing & Implementation',
    description: 'Get custom pricing and implementation timeline for your needs',
    icon: Calendar
  }
]

export default function DemoPage() {
  const [selectedDemo, setSelectedDemo] = useState('Full Product Demo')
  const [selectedTime, setSelectedTime] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    useCase: '',
    integrations: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle demo scheduling
    console.log('Demo scheduled:', { selectedDemo, selectedTime, formData })
  }

  return (
    <LandingLayout>
      <HeroSection
        badge="📅 Schedule Your Demo"
        title="See ListBackup.ai in Action"
        subtitle="Personalized Demo Just for You"
        description="Get a live demonstration of how ListBackup.ai can protect your business data. Our team will show you exactly how it works with your specific integrations."
        primaryCTA={{
          text: "Schedule Now",
          href: "#booking"
        }}
        secondaryCTA={{
          text: "Watch Video Demo",
          href: "/demo/video"
        }}
        gradient="purple"
      />

      {/* Demo Types */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Choose Your Demo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Pick the Perfect Demo for Your Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you need a quick overview or deep enterprise consultation, we have the right demo for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {demoTypes.map((demo, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedDemo === demo.title ? 'ring-2 ring-primary bg-primary/5' : ''
                } ${demo.recommended ? 'scale-105 shadow-lg' : ''}`}
                onClick={() => setSelectedDemo(demo.title)}
              >
                <CardContent className="p-8 text-center">
                  {demo.recommended && (
                    <Badge className="mb-4 bg-primary text-white">Recommended</Badge>
                  )}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <demo.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{demo.title}</h3>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{demo.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{demo.description}</p>
                  <ul className="space-y-2">
                    {demo.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What to Expect in Your Demo
            </h2>
            <p className="text-lg text-muted-foreground">
              Every demo is tailored to your specific needs and includes hands-on examples.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Schedule Your {selectedDemo}
              </h2>
              <p className="text-lg text-muted-foreground">
                Fill out the form below and we'll send you a calendar invite.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Booking Form */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-xl">Your Information</h3>
                </CardHeader>
                <CardContent>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Your Role</Label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select your role</option>
                          <option value="ceo">CEO/Founder</option>
                          <option value="cto">CTO/Technical Lead</option>
                          <option value="marketing">Marketing Manager</option>
                          <option value="operations">Operations Manager</option>
                          <option value="it">IT Administrator</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="integrations">Which integrations are you interested in?</Label>
                      <Input
                        id="integrations"
                        name="integrations"
                        value={formData.integrations}
                        onChange={handleInputChange}
                        placeholder="e.g., Stripe, Keap, GoHighLevel"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="useCase">Tell us about your use case</Label>
                      <textarea
                        id="useCase"
                        name="useCase"
                        value={formData.useCase}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="What's your main goal for data backup? Any specific compliance requirements?"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Schedule Demo
                      <Calendar className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Time Selection */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-xl">Select Your Preferred Time</h3>
                  <p className="text-sm text-muted-foreground">All times shown in PST</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Preferred Date</Label>
                      <Input type="date" className="mt-2" />
                    </div>

                    <div>
                      <Label>Available Time Slots</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            size="sm"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className="justify-start"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Demo Details</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>Video call via Google Meet</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {demoTypes.find(d => d.title === selectedDemo)?.duration || '30 minutes'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>1-on-1 with our team</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">What You'll Get</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Calendar invite with meeting link</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Demo recording for your team</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Custom pricing proposal</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Implementation timeline</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Options */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              Can't Find a Good Time?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We have other options to help you get started with ListBackup.ai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo/video">
                  Watch Video Demo
                  <Video className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Contact Sales Team
                  <Phone className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}