import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users,
  ArrowRight,
  Heart,
  Zap,
  Shield,
  Globe,
  Coffee,
  Home,
  Plane,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'

const openPositions = [
  {
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    remote: true,
    experience: '5+ years',
    description: 'Build and scale our core backup platform and integrations.',
    requirements: ['React/TypeScript', 'Node.js', 'AWS', 'Database design'],
    salary: '$150k - $200k'
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    remote: true,
    experience: '3+ years',
    description: 'Drive product strategy and roadmap for data backup solutions.',
    requirements: ['Product management', 'B2B SaaS', 'Data analytics', 'Customer research'],
    salary: '$130k - $180k'
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    remote: true,
    experience: '4+ years',
    description: 'Scale our infrastructure and ensure 99.9% uptime.',
    requirements: ['AWS/GCP', 'Kubernetes', 'Terraform', 'Monitoring'],
    salary: '$140k - $190k'
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'New York, NY / Remote',
    type: 'Full-time',
    remote: true,
    experience: '2+ years',
    description: 'Help customers achieve success with our backup solutions.',
    requirements: ['Customer success', 'B2B SaaS', 'Technical aptitude', 'Communication'],
    salary: '$80k - $120k'
  },
  {
    title: 'Security Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    remote: false,
    experience: '4+ years',
    description: 'Lead security initiatives and compliance for enterprise customers.',
    requirements: ['Security engineering', 'Compliance frameworks', 'Penetration testing', 'Risk assessment'],
    salary: '$160k - $210k'
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'San Francisco, CA',
    type: 'Full-time',
    remote: false,
    experience: '1+ years',
    description: 'Generate qualified leads and build our sales pipeline.',
    requirements: ['Sales experience', 'B2B outreach', 'CRM tools', 'Communication'],
    salary: '$60k - $80k + commission'
  }
]

const benefits = [
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision insurance plus wellness stipend'
  },
  {
    icon: Home,
    title: 'Remote-First Culture',
    description: 'Work from anywhere with flexible hours and home office setup budget'
  },
  {
    icon: Plane,
    title: 'Unlimited PTO',
    description: 'Take the time you need to recharge with unlimited vacation policy'
  },
  {
    icon: GraduationCap,
    title: 'Learning & Development',
    description: '$2,000 annual learning budget for conferences, courses, and books'
  },
  {
    icon: DollarSign,
    title: 'Competitive Compensation',
    description: 'Market-rate salaries plus equity participation in company growth'
  },
  {
    icon: Coffee,
    title: 'Team Gatherings',
    description: 'Quarterly team retreats and monthly virtual social events'
  }
]

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'We prioritize data security and privacy in everything we build'
  },
  {
    icon: Users,
    title: 'Customer Obsessed',
    description: 'Our customers success drives every decision we make'
  },
  {
    icon: Zap,
    title: 'Move Fast',
    description: 'We ship quickly, iterate rapidly, and learn from feedback'
  },
  {
    icon: Globe,
    title: 'Think Global',
    description: 'We build for businesses worldwide with diverse needs'
  }
]

const perks = [
  'Equity participation',
  'Top-tier equipment',
  'Flexible work hours',
  'Mental health support',
  'Commuter benefits',
  'Team lunches',
  'Conference attendance',
  'Book allowance',
  'Gym membership',
  'Sabbatical program'
]

const departments = [
  { name: 'Engineering', count: 8, openings: 3 },
  { name: 'Product', count: 3, openings: 1 },
  { name: 'Sales', count: 5, openings: 1 },
  { name: 'Marketing', count: 2, openings: 0 },
  { name: 'Customer Success', count: 4, openings: 1 },
  { name: 'Operations', count: 2, openings: 0 }
]

export default function CareersPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🚀 Join Our Team"
        title="Build the Future of Data Protection"
        subtitle="Careers at ListBackup.ai"
        description="Join a team of passionate engineers, designers, and business professionals building the next generation of data backup solutions for businesses worldwide."
        primaryCTA={{
          text: "View Open Positions",
          href: "#positions"
        }}
        secondaryCTA={{
          text: "Learn About Culture",
          href: "#culture"
        }}
        gradient="purple"
      />

      {/* Company Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { metric: '24', label: 'Team Members' },
              { metric: '$15M', label: 'Series A Raised' },
              { metric: '500+', label: 'Customers' },
              { metric: '6', label: 'Open Positions' },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                  {stat.metric}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section id="culture" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Our Culture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Values That Guide Us
            </h2>
            <p className="text-lg text-muted-foreground">
              These core values shape how we work, make decisions, and treat each other.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Benefits & Perks
            </h2>
            <p className="text-lg text-muted-foreground">
              We believe in taking care of our team with comprehensive benefits and unique perks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Perks */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <h3 className="font-semibold text-xl mb-6 text-center">Plus Many More Perks</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {perks.map((perk, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Team Structure */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Our Team Structure
            </h2>
            <p className="text-lg text-muted-foreground">
              We're organized into focused teams that collaborate closely to deliver exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <span>{dept.count} team members</span>
                    {dept.openings > 0 && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        {dept.openings} opening{dept.openings > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              We're Hiring
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Open Positions
            </h2>
            <p className="text-lg text-muted-foreground">
              Join our growing team and help build the future of data protection.
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                            {position.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{position.department}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{position.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{position.type}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{position.salary}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {position.remote && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              Remote OK
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {position.experience}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {position.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {position.requirements.map((req, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 lg:mt-0 lg:ml-8">
                      <Button className="w-full lg:w-auto" asChild>
                        <Link href={`/careers/${position.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          Apply Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don't see the right position for you?
            </p>
            <Button variant="outline" asChild>
              <Link href="mailto:careers@listbackup.ai">
                Send Us Your Resume
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Our Hiring Process
            </h2>
            <p className="text-lg text-muted-foreground">
              We believe in a fair, transparent hiring process that respects your time.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Application',
                  description: 'Submit your application and we\'ll review it within 48 hours'
                },
                {
                  step: '2',
                  title: 'Phone Screen',
                  description: '30-minute conversation with our recruiting team'
                },
                {
                  step: '3',
                  title: 'Technical Interview',
                  description: 'Role-specific interview with the hiring manager'
                },
                {
                  step: '4',
                  title: 'Final Interview',
                  description: 'Meet the team and discuss culture fit'
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Join Our Mission?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Help us build the future of data protection and make a real impact on businesses worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90" asChild>
              <Link href="#positions">
                View Open Positions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="mailto:careers@listbackup.ai">
                Get in Touch
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}