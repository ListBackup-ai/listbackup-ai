import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText,
  Users,
  Globe,
  Database,
  Zap,
  CheckCircle,
  ArrowRight,
  Award,
  Activity,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

const securityFeatures = [
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'Military-grade encryption for data at rest and in transit',
    details: [
      'End-to-end encryption pipeline',
      'Unique encryption keys per customer',
      'Hardware security modules (HSM)',
      'Regular key rotation policies'
    ]
  },
  {
    icon: Shield,
    title: 'Zero-Trust Architecture',
    description: 'Every request verified, nothing trusted by default',
    details: [
      'Multi-factor authentication required',
      'Role-based access controls (RBAC)',
      'Principle of least privilege',
      'Continuous verification'
    ]
  },
  {
    icon: Eye,
    title: 'Continuous Monitoring',
    description: '24/7 security monitoring and threat detection',
    details: [
      'Real-time threat detection',
      'Automated incident response',
      'Security event correlation',
      'Advanced persistent threat (APT) detection'
    ]
  },
  {
    icon: Database,
    title: 'Data Isolation',
    description: 'Complete logical and physical data separation',
    details: [
      'Tenant-isolated databases',
      'Network segmentation',
      'Dedicated encryption keys',
      'Isolated backup storage'
    ]
  }
]

const certifications = [
  {
    name: 'Enterprise Security Program',
    description: 'Comprehensive security, availability, and confidentiality controls',
    icon: Award,
    status: 'Current',
    details: [
      'Regular security audits',
      'Advanced security controls',
      'Availability requirements',
      'Confidentiality protections'
    ]
  },
  {
    name: 'ISO 27001',
    description: 'International information security management standards',
    icon: Globe,
    status: 'In Progress',
    details: [
      'Information security policies',
      'Risk management framework',
      'Incident response procedures',
      'Business continuity planning'
    ]
  },
  {
    name: 'GDPR Compliant',
    description: 'European data protection regulation compliance',
    icon: FileText,
    status: 'Current',
    details: [
      'Data subject rights support',
      'Privacy by design principles',
      'Data processing transparency',
      'Cross-border transfer protections'
    ]
  },
  {
    name: 'CCPA Compliant',
    description: 'California Consumer Privacy Act compliance',
    icon: Users,
    status: 'Current',
    details: [
      'Consumer rights management',
      'Data transparency reporting',
      'Opt-out mechanisms',
      'Third-party disclosure tracking'
    ]
  }
]

const securityPractices = [
  {
    category: 'Data Protection',
    practices: [
      'End-to-end encryption (AES-256)',
      'Data minimization principles',
      'Regular data purging',
      'Backup encryption and testing',
      'Geographic data residency controls'
    ]
  },
  {
    category: 'Access Control',
    practices: [
      'Multi-factor authentication (MFA)',
      'Single sign-on (SSO) integration',
      'Role-based permissions',
      'Regular access reviews',
      'Privileged access management'
    ]
  },
  {
    category: 'Infrastructure Security',
    practices: [
      'AWS security best practices',
      'Network isolation and VPCs',
      'Web application firewalls (WAF)',
      'DDoS protection and mitigation',
      'Regular vulnerability scanning'
    ]
  },
  {
    category: 'Operational Security',
    practices: [
      'Security incident response plan',
      'Regular security training',
      'Vendor security assessments',
      'Change management controls',
      'Business continuity planning'
    ]
  }
]

const incidentResponse = [
  {
    step: '1',
    title: 'Detection',
    description: 'Automated monitoring systems detect potential security incidents 24/7',
    time: '< 5 minutes'
  },
  {
    step: '2',
    title: 'Assessment',
    description: 'Security team evaluates the scope and severity of the incident',
    time: '< 15 minutes'
  },
  {
    step: '3',
    title: 'Containment',
    description: 'Immediate steps taken to contain and isolate the threat',
    time: '< 30 minutes'
  },
  {
    step: '4',
    title: 'Notification',
    description: 'Affected customers and stakeholders are notified per legal requirements',
    time: '< 24 hours'
  },
  {
    step: '5',
    title: 'Recovery',
    description: 'Systems restored and additional security measures implemented',
    time: 'Varies'
  }
]

const trustMetrics = [
  { metric: '99.9%', label: 'Uptime SLA' },
  { metric: '< 5min', label: 'Incident Detection' },
  { metric: '24/7', label: 'Security Monitoring' },
  { metric: '0', label: 'Data Breaches' }
]

export default function SecurityPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="🔒 Enterprise Security"
        title="Security You Can Trust"
        subtitle="Bank-Level Protection for Your Data"
        description="We implement the highest security standards to protect your business data. From encryption to compliance, every aspect of our platform is designed with security first."
        primaryCTA={{
          text: "View Security Docs",
          href: "/docs/security"
        }}
        secondaryCTA={{
          text: "Contact Security Team",
          href: "/contact?type=security"
        }}
        gradient="blue"
      />

      {/* Trust Metrics */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {trustMetrics.map((metric, index) => (
              <div key={index} className="group">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                  {metric.metric}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              Core Security Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Defense in Depth Strategy
            </h2>
            <p className="text-lg text-muted-foreground">
              Multiple layers of security controls protect your data at every level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-green-500/10 text-green-600 border-green-500/20">
              Certifications & Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Industry-Standard Certifications
            </h2>
            <p className="text-lg text-muted-foreground">
              We maintain the highest industry certifications and compliance standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certifications.map((cert, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <cert.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">{cert.description}</p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        cert.status === 'Current' 
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {cert.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Comprehensive Security Practices
            </h2>
            <p className="text-lg text-muted-foreground">
              Our security program covers every aspect of data protection and system security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityPractices.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-center">{category.category}</h3>
                  <ul className="space-y-3">
                    {category.practices.map((practice, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-red-500/10 text-red-600 border-red-500/20">
              Incident Response
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Rapid Response Protocol
            </h2>
            <p className="text-lg text-muted-foreground">
              Our security incident response plan ensures swift action and transparent communication.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-red-500/20"></div>
              
              {incidentResponse.map((step, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Step number */}
                  <div className="absolute left-8 md:left-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm transform -translate-x-1/2 z-10">
                    {step.step}
                  </div>
                  
                  {/* Content */}
                  <div className={`ml-20 md:ml-0 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'} md:w-1/2`}>
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {step.time}
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

      {/* Security Team */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
              Security Team
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Dedicated Security Experts
            </h2>
            <p className="text-lg text-muted-foreground">
              Our security team brings decades of experience from top-tier security organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Security Leadership",
                description: "Former NSA and Fortune 500 security executives",
                credentials: ["CISSP certified", "20+ years experience", "Incident response expertise"]
              },
              {
                title: "Security Engineering",
                description: "Engineers specializing in secure system design",
                credentials: ["Cloud security experts", "Cryptography specialists", "Threat modeling"]
              },
              {
                title: "Compliance Team",
                description: "Specialists in regulatory compliance and auditing",
                credentials: ["Security auditors", "GDPR specialists", "Risk assessment experts"]
              }
            ].map((team, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{team.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                  <ul className="space-y-2">
                    {team.credentials.map((cred, idx) => (
                      <li key={idx} className="flex items-center justify-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{cred}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-2">Responsible Disclosure Program</h3>
                    <p className="text-muted-foreground mb-4">
                      We welcome security researchers to help us maintain the highest security standards. 
                      If you discover a security vulnerability, please report it responsibly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild>
                        <Link href="mailto:security@listbackup.ai">
                          Report Security Issue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/security/disclosure-policy">
                          View Disclosure Policy
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Questions About Our Security?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Our security team is available to answer any questions about our practices, certifications, or compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-white/90" asChild>
              <Link href="/contact?type=security">
                Contact Security Team
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/docs/security">
                View Security Docs
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}