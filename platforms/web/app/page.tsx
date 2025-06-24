import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesShowcase } from '@/components/landing/features-showcase'
import { PlatformsShowcase } from '@/components/landing/platforms-showcase'
import { StatsSection } from '@/components/landing/stats-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TrustIndicators } from '@/components/landing/trust-indicators'
import { 
  generatePageMetadata, 
  generateOrganizationSchema, 
  generateSoftwareApplicationSchema 
} from '@/lib/seo/metadata'
import Script from 'next/script'

export const metadata = generatePageMetadata(
  'AI-Powered Data Backup for Modern Businesses',
  'Automatically backup, sync, and protect data from 50+ business tools. Enterprise-grade security, real-time sync, and intelligent automation.',
  '/'
)

const organizationSchema = generateOrganizationSchema()
const softwareApplicationSchema = generateSoftwareApplicationSchema()

export default function Home() {
  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <LandingLayout>
        <HeroSection
          badge="🚀 Now Supporting 50+ Integrations"
          title="Your Data, Backed Up Intelligently"
          subtitle="AI-Powered Business Data Protection"
          description="Automatically backup, sync, and protect data from all your business tools. From CRMs to payment processors, we've got you covered with enterprise-grade security and intelligent automation."
          primaryCTA={{
            text: "Start Free Trial",
            href: "/signup"
          }}
          secondaryCTA={{
            text: "Watch Demo",
            href: "/demo"
          }}
          features={[
            "Enterprise Security",
            "50+ Integrations",
            "Real-time Sync",
            "99.9% Uptime SLA"
          ]}
          showVideo={true}
        />
        
        <FeaturesShowcase />
        
        <PlatformsShowcase />
        
        <TrustIndicators />
        
        <StatsSection />
        
        <TestimonialsSection />
        
        <PricingSection />
      </LandingLayout>
    </>
  )
}