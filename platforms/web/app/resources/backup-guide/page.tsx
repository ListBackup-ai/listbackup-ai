'use client'

import { useState } from 'react'
import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { ProgressiveForm } from '@/components/lead-generation/progressive-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Download,
  FileText,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  Star
} from 'lucide-react'
import Link from 'next/link'

const guideFeatures = [
  {
    icon: Shield,
    title: 'Security Best Practices',
    description: 'Learn enterprise-grade security measures for data protection'
  },
  {
    icon: Zap,
    title: 'Automation Strategies',
    description: 'Set up automated workflows for seamless data backup'
  },
  {
    icon: BarChart3,
    title: 'Compliance Framework',
    description: 'Meet regulatory requirements with our proven compliance approach'
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Best practices for organizing backup responsibilities across teams'
  }
]

const tableOfContents = [
  { chapter: '1', title: 'Introduction to Business Data Backup', pages: '3-8' },
  { chapter: '2', title: 'Platform-Specific Backup Strategies', pages: '9-24' },
  { chapter: '3', title: 'Security & Compliance Requirements', pages: '25-35' },
  { chapter: '4', title: 'Automation & Workflow Setup', pages: '36-45' },
  { chapter: '5', title: 'Disaster Recovery Planning', pages: '46-55' },
  { chapter: '6', title: 'ROI & Cost Optimization', pages: '56-62' },
  { chapter: '7', title: 'Implementation Checklist', pages: '63-68' }
]

const testimonials = [
  {
    quote: "This guide saved us months of research. The platform-specific strategies alone were worth the download.",
    author: "Sarah Chen",
    role: "IT Director",
    company: "TechStart Inc"
  },
  {
    quote: "The compliance section helped us achieve SOC 2 certification 6 months ahead of schedule.",
    author: "Michael Torres",
    role: "Security Manager",
    company: "Financial Partners"
  }
]

const leadMagnet = {
  title: "The Complete Business Data Backup Guide",
  description: "Get our 68-page comprehensive guide with platform-specific strategies, compliance frameworks, and implementation checklists.",
  downloadUrl: "/downloads/business-data-backup-guide.pdf"
}

export default function BackupGuidePage() {
  const [showForm, setShowForm] = useState(false)
  const [downloadReady, setDownloadReady] = useState(false)

  const handleFormComplete = (formData: any) => {
    console.log('Form completed:', formData)
    setDownloadReady(true)
    // Here you would typically:
    // 1. Send data to your CRM/email marketing platform
    // 2. Trigger email with download link
    // 3. Track conversion in analytics
  }

  if (downloadReady) {
    return (
      <LandingLayout>
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your download is ready and we've sent you a copy via email.
              </p>
              
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{leadMagnet.title}</h3>
                      <p className="text-sm text-muted-foreground">68 pages • PDF • 4.2 MB</p>
                    </div>
                    <Button asChild>
                      <a href={leadMagnet.downloadUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-semibold">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/demo/live">
                      Try Interactive Demo
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </LandingLayout>
    )
  }

  if (showForm) {
    return (
      <LandingLayout>
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Almost There!</h1>
              <p className="text-lg text-muted-foreground">
                Just a few quick questions to personalize your guide and send you the download link.
              </p>
            </div>
            
            <ProgressiveForm 
              onComplete={handleFormComplete}
              leadMagnet={leadMagnet}
            />
          </div>
        </section>
      </LandingLayout>
    )
  }

  return (
    <LandingLayout>
      <HeroSection
        badge="📚 Free Resource"
        title="The Complete Business Data Backup Guide"
        subtitle="68-Page Comprehensive Resource"
        description="Everything you need to implement enterprise-grade data backup for your business. Platform-specific strategies, compliance frameworks, and step-by-step implementation guides."
        primaryCTA={{
          text: "Download Free Guide",
          href: "#download"
        }}
        secondaryCTA={{
          text: "Preview Contents",
          href: "#preview"
        }}
        features={[
          "68 Pages of Expert Content",
          "Platform-Specific Strategies", 
          "Compliance Frameworks",
          "Implementation Checklists"
        ]}
        gradient="green"
      />

      {/* Guide Overview */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Comprehensive Resource
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What You'll Learn
            </h2>
            <p className="text-lg text-muted-foreground">
              Written by data protection experts with decades of experience helping businesses secure their critical data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {guideFeatures.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents Preview */}
      <section id="preview" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Table of Contents
            </h2>
            <p className="text-lg text-muted-foreground">
              Seven comprehensive chapters covering everything from basics to advanced implementation.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {tableOfContents.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-muted last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-sm font-bold text-green-600">
                          {item.chapter}
                        </div>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      <span className="text-sm text-muted-foreground">Pages {item.pages}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">
                        Bonus: Implementation Templates
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Includes downloadable checklists, compliance templates, and workflow diagrams you can use immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              What IT Leaders Are Saying
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
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-600">
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

      {/* Download CTA */}
      <section id="download" className="py-24 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Secure Your Business Data?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Download our comprehensive guide and start implementing enterprise-grade data protection today.
          </p>
          
          <div className="space-y-6">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-green-600 hover:bg-white/90"
              onClick={() => setShowForm(true)}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Free Guide
            </Button>
            
            <div className="text-sm text-white/80">
              <p>✓ 68 pages of expert content</p>
              <p>✓ No spam, unsubscribe anytime</p>
              <p>✓ Instant download + email delivery</p>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}