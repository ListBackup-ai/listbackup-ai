/**
 * Call-to-Action Optimization System
 * Team 7: Sales Copy & Content Variations - Subtask 4
 * 
 * CTA button copy variations, urgency-driven messaging, benefit-focused descriptions,
 * social proof CTAs, and risk-reversal CTAs with guarantees
 */

import { ContentVariation } from './content-manager'

export interface CTAVariation {
  id: string
  text: string
  type: 'primary' | 'secondary' | 'tertiary'
  style: 'button' | 'link' | 'banner'
  psychologyTrigger: 'urgency' | 'benefit' | 'social' | 'curiosity' | 'risk_reversal' | 'authority'
  context: 'hero' | 'pricing' | 'features' | 'testimonials' | 'footer' | 'popup' | 'exit_intent'
  audience: 'enterprise' | 'smb' | 'startup' | 'agency' | 'general'
  industry?: 'healthcare' | 'financial' | 'ecommerce' | 'agency' | 'manufacturing'
  platform?: 'keap' | 'stripe' | 'gohighlevel' | 'hubspot' | 'activecampaign' | 'mailchimp' | 'shopify'
  performanceScore?: number
  conversionRate?: number
  description?: string
  supportingText?: string
}

export interface CTAContext {
  placement: string
  surroundingContent: string
  userJourney: 'awareness' | 'consideration' | 'decision' | 'retention'
  pageType: 'landing' | 'pricing' | 'features' | 'product' | 'signup' | 'demo'
  trafficSource: 'organic' | 'paid' | 'referral' | 'direct' | 'email' | 'social'
}

// Primary CTA variations by psychology trigger
export const ctaVariationsByTrigger: Record<string, CTAVariation[]> = {
  urgency: [
    {
      id: 'urgency_1',
      text: 'Start Free Trial Now',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      description: 'Immediate action with time sensitivity',
      supportingText: '14-day trial • No credit card required'
    },
    {
      id: 'urgency_2',
      text: 'Protect My Data Today',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      description: 'Immediate protection with urgency',
      supportingText: 'Setup takes less than 5 minutes'
    },
    {
      id: 'urgency_3',
      text: 'Get Instant Protection',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'enterprise',
      description: 'Enterprise-focused immediate action',
      supportingText: 'Enterprise security activated instantly'
    },
    {
      id: 'urgency_4',
      text: 'Secure My Business Now',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'pricing',
      audience: 'smb',
      description: 'Business-focused urgency for SMBs',
      supportingText: 'Join 10,000+ protected businesses'
    },
    {
      id: 'urgency_5',
      text: 'Stop Data Loss Today',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'features',
      audience: 'general',
      description: 'Problem-solving urgency',
      supportingText: 'Zero data loss guarantee'
    }
  ],

  benefit: [
    {
      id: 'benefit_1',
      text: 'See How It Works',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'hero',
      audience: 'general',
      description: 'Educational benefit-focused approach',
      supportingText: 'Watch 2-minute demo video'
    },
    {
      id: 'benefit_2',
      text: 'Get Free Assessment',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'enterprise',
      description: 'Value-driven assessment offer',
      supportingText: 'Discover your data vulnerabilities'
    },
    {
      id: 'benefit_3',
      text: 'Calculate My Savings',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'pricing',
      audience: 'general',
      description: 'ROI-focused benefit calculation',
      supportingText: 'See potential cost savings'
    },
    {
      id: 'benefit_4',
      text: 'View My Dashboard',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'demo',
      audience: 'general',
      description: 'Preview of actual product benefit',
      supportingText: 'Live demo with your data'
    },
    {
      id: 'benefit_5',
      text: 'Try Risk-Free',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'pricing',
      audience: 'general',
      description: 'Risk-free trial benefit',
      supportingText: '30-day money-back guarantee'
    }
  ],

  social: [
    {
      id: 'social_1',
      text: 'Join 10,000+ Protected Businesses',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'social',
      context: 'testimonials',
      audience: 'general',
      description: 'Social proof with specific numbers',
      supportingText: 'Trusted by industry leaders'
    },
    {
      id: 'social_2',
      text: 'See Why Leaders Choose Us',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'social',
      context: 'features',
      audience: 'enterprise',
      description: 'Authority-based social proof',
      supportingText: 'Fortune 500 companies trust us'
    },
    {
      id: 'social_3',
      text: 'Get Enterprise-Grade Protection',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'social',
      context: 'pricing',
      audience: 'enterprise',
      description: 'Enterprise social positioning',
      supportingText: 'Used by Fortune 500 companies'
    },
    {
      id: 'social_4',
      text: 'Start Like the Pros',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'social',
      context: 'hero',
      audience: 'smb',
      description: 'Aspirational social proof',
      supportingText: 'Professional-grade data protection'
    },
    {
      id: 'social_5',
      text: 'Protect Like the Big Players',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'social',
      context: 'features',
      audience: 'startup',
      description: 'Competitive social positioning',
      supportingText: 'Enterprise security for growing businesses'
    }
  ],

  curiosity: [
    {
      id: 'curiosity_1',
      text: 'Discover Hidden Data Risks',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'curiosity',
      context: 'features',
      audience: 'general',
      description: 'Curiosity-driven risk assessment',
      supportingText: 'Free security audit included'
    },
    {
      id: 'curiosity_2',
      text: 'See Your Data Vulnerabilities',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'curiosity',
      context: 'hero',
      audience: 'enterprise',
      description: 'Security-focused curiosity trigger',
      supportingText: 'Comprehensive security assessment'
    },
    {
      id: 'curiosity_3',
      text: 'Uncover Your Data Blind Spots',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'curiosity',
      context: 'features',
      audience: 'general',
      description: 'Discovery-oriented curiosity',
      supportingText: 'See what you\'re missing'
    },
    {
      id: 'curiosity_4',
      text: 'Reveal Your Risk Score',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'curiosity',
      context: 'popup',
      audience: 'general',
      description: 'Gamified curiosity with scoring',
      supportingText: 'Get your data protection score'
    },
    {
      id: 'curiosity_5',
      text: 'Check Your Data Health',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'curiosity',
      context: 'exit_intent',
      audience: 'general',
      description: 'Health metaphor curiosity trigger',
      supportingText: 'Free data health checkup'
    }
  ],

  risk_reversal: [
    {
      id: 'risk_reversal_1',
      text: 'Try 100% Risk-Free',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'risk_reversal',
      context: 'pricing',
      audience: 'general',
      description: 'Complete risk elimination',
      supportingText: '30-day money-back guarantee'
    },
    {
      id: 'risk_reversal_2',
      text: 'Start with Zero Risk',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'risk_reversal',
      context: 'hero',
      audience: 'startup',
      description: 'Startup-friendly risk removal',
      supportingText: 'No contracts • Cancel anytime'
    },
    {
      id: 'risk_reversal_3',
      text: 'Get Money-Back Guarantee',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'risk_reversal',
      context: 'pricing',
      audience: 'general',
      description: 'Explicit guarantee mention',
      supportingText: 'Full refund if not satisfied'
    },
    {
      id: 'risk_reversal_4',
      text: 'Try Before You Buy',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'risk_reversal',
      context: 'demo',
      audience: 'general',
      description: 'Trial before commitment',
      supportingText: '14-day free trial • No credit card'
    },
    {
      id: 'risk_reversal_5',
      text: 'Start with Our Promise',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'risk_reversal',
      context: 'testimonials',
      audience: 'general',
      description: 'Promise-based risk reversal',
      supportingText: 'We guarantee your satisfaction'
    }
  ],

  authority: [
    {
      id: 'authority_1',
      text: 'Get Expert Consultation',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'features',
      audience: 'enterprise',
      description: 'Expert authority positioning',
      supportingText: 'Talk to our data protection experts'
    },
    {
      id: 'authority_2',
      text: 'Schedule Enterprise Demo',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'pricing',
      audience: 'enterprise',
      description: 'Enterprise authority and exclusivity',
      supportingText: 'Custom demo with solutions architect'
    },
    {
      id: 'authority_3',
      text: 'Get Professional Assessment',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'hero',
      audience: 'general',
      description: 'Professional authority credentials',
      supportingText: 'Certified data protection analysis'
    },
    {
      id: 'authority_4',
      text: 'Consult with Specialists',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'features',
      audience: 'general',
      description: 'Specialist expertise authority',
      supportingText: 'Industry-certified consultants'
    },
    {
      id: 'authority_5',
      text: 'Get Certified Solution',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'testimonials',
      audience: 'general',
      description: 'Certification-based authority',
      supportingText: 'SOC 2 certified • Enterprise compliant'
    }
  ]
}

// Industry-specific CTA variations
export const industrySpecificCTAs: Record<string, CTAVariation[]> = {
  healthcare: [
    {
      id: 'healthcare_1',
      text: 'Protect Patient Data Now',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      industry: 'healthcare',
      description: 'HIPAA-focused urgency',
      supportingText: 'HIPAA compliant • BAA included'
    },
    {
      id: 'healthcare_2',
      text: 'Get HIPAA Compliance',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'general',
      industry: 'healthcare',
      description: 'Compliance-focused benefit',
      supportingText: 'Automated compliance monitoring'
    },
    {
      id: 'healthcare_3',
      text: 'Secure My Practice',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'pricing',
      audience: 'smb',
      industry: 'healthcare',
      description: 'Practice-specific protection',
      supportingText: 'Trusted by 500+ healthcare practices'
    }
  ],

  financial: [
    {
      id: 'financial_1',
      text: 'Secure Financial Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      industry: 'financial',
      description: 'Financial data urgency',
      supportingText: 'Bank-grade security • PCI compliant'
    },
    {
      id: 'financial_2',
      text: 'Get Compliance Demo',
      type: 'secondary',
      style: 'button',
      psychologyTrigger: 'authority',
      context: 'features',
      audience: 'enterprise',
      industry: 'financial',
      description: 'Compliance demonstration',
      supportingText: 'SOX & PCI compliance verified'
    },
    {
      id: 'financial_3',
      text: 'Protect Customer Trust',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'testimonials',
      audience: 'general',
      industry: 'financial',
      description: 'Trust protection benefit',
      supportingText: 'Zero breaches • 200+ institutions trust us'
    }
  ],

  ecommerce: [
    {
      id: 'ecommerce_1',
      text: 'Protect My Store Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      industry: 'ecommerce',
      description: 'Store data protection',
      supportingText: 'Customer data • Order history • Analytics'
    },
    {
      id: 'ecommerce_2',
      text: 'Unify My Sales Channels',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'general',
      industry: 'ecommerce',
      description: 'Multi-channel unification',
      supportingText: 'All platforms • Real-time sync'
    },
    {
      id: 'ecommerce_3',
      text: 'Scale My Business',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'pricing',
      audience: 'startup',
      industry: 'ecommerce',
      description: 'Growth-focused scaling',
      supportingText: 'Enterprise features • Startup pricing'
    }
  ],

  agency: [
    {
      id: 'agency_1',
      text: 'Unify My Client Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'hero',
      audience: 'agency',
      industry: 'agency',
      description: 'Client data unification',
      supportingText: 'All clients • All platforms • One dashboard'
    },
    {
      id: 'agency_2',
      text: 'Impress My Clients',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'agency',
      industry: 'agency',
      description: 'Client impression benefit',
      supportingText: 'White-label reports • Professional dashboards'
    },
    {
      id: 'agency_3',
      text: 'Win More Clients',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'testimonials',
      audience: 'agency',
      industry: 'agency',
      description: 'Client acquisition benefit',
      supportingText: 'Show data intelligence advantage'
    }
  ],

  manufacturing: [
    {
      id: 'manufacturing_1',
      text: 'Optimize My Operations',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'hero',
      audience: 'general',
      industry: 'manufacturing',
      description: 'Operations optimization',
      supportingText: 'Production • Quality • Supply chain'
    },
    {
      id: 'manufacturing_2',
      text: 'Reduce My Waste',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'general',
      industry: 'manufacturing',
      description: 'Waste reduction benefit',
      supportingText: 'Average 25% waste reduction'
    },
    {
      id: 'manufacturing_3',
      text: 'Ensure My Quality',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'pricing',
      audience: 'general',
      industry: 'manufacturing',
      description: 'Quality assurance urgency',
      supportingText: 'ISO compliant • Quality tracking'
    }
  ]
}

// Platform-specific CTA variations
export const platformSpecificCTAs: Record<string, CTAVariation[]> = {
  keap: [
    {
      id: 'keap_1',
      text: 'Protect My Keap Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      platform: 'keap',
      description: 'Keap-specific data protection',
      supportingText: 'Contacts • Campaigns • Order history'
    },
    {
      id: 'keap_2',
      text: 'Backup My Contacts Now',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'features',
      audience: 'general',
      platform: 'keap',
      description: 'Contact-focused urgency',
      supportingText: 'Real-time contact synchronization'
    },
    {
      id: 'keap_3',
      text: 'Secure My Campaigns',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'pricing',
      audience: 'general',
      platform: 'keap',
      description: 'Campaign security benefit',
      supportingText: 'Automation sequences protected'
    }
  ],

  stripe: [
    {
      id: 'stripe_1',
      text: 'Protect My Revenue Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      platform: 'stripe',
      description: 'Revenue data protection',
      supportingText: 'Payments • Customers • Analytics'
    },
    {
      id: 'stripe_2',
      text: 'Secure My Payments',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'features',
      audience: 'general',
      platform: 'stripe',
      description: 'Payment security urgency',
      supportingText: 'PCI compliant • Bank-grade security'
    },
    {
      id: 'stripe_3',
      text: 'Backup Stripe Now',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'pricing',
      audience: 'general',
      platform: 'stripe',
      description: 'Direct Stripe backup urgency',
      supportingText: 'Real-time transaction backup'
    }
  ],

  shopify: [
    {
      id: 'shopify_1',
      text: 'Protect My Store Data',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'hero',
      audience: 'general',
      platform: 'shopify',
      description: 'Store data protection',
      supportingText: 'Customers • Orders • Products'
    },
    {
      id: 'shopify_2',
      text: 'Secure My Customers',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'benefit',
      context: 'features',
      audience: 'general',
      platform: 'shopify',
      description: 'Customer data security',
      supportingText: 'Customer relationships protected'
    },
    {
      id: 'shopify_3',
      text: 'Backup My Store',
      type: 'primary',
      style: 'button',
      psychologyTrigger: 'urgency',
      context: 'pricing',
      audience: 'general',
      platform: 'shopify',
      description: 'Complete store backup',
      supportingText: 'Complete store backup solution'
    }
  ]
}

// Context-specific CTA recommendations
export const contextualCTARecommendations: Record<string, {
  primary: string[]
  secondary: string[]
  tertiary?: string[]
}> = {
  hero: {
    primary: ['urgency', 'benefit'],
    secondary: ['social', 'curiosity'],
    tertiary: ['risk_reversal']
  },
  
  pricing: {
    primary: ['risk_reversal', 'urgency'],
    secondary: ['social', 'benefit'],
    tertiary: ['authority']
  },
  
  features: {
    primary: ['benefit', 'curiosity'],
    secondary: ['social', 'authority'],
    tertiary: ['urgency']
  },
  
  testimonials: {
    primary: ['social', 'risk_reversal'],
    secondary: ['benefit', 'authority'],
    tertiary: ['urgency']
  },
  
  demo: {
    primary: ['benefit', 'authority'],
    secondary: ['risk_reversal', 'curiosity'],
    tertiary: ['social']
  },
  
  exit_intent: {
    primary: ['curiosity', 'risk_reversal'],
    secondary: ['urgency', 'benefit'],
    tertiary: ['social']
  }
}

// CTA optimization utility functions
export class CTAOptimizer {
  /**
   * Get optimal CTA for specific context and user attributes
   */
  static getOptimalCTA(
    context: CTAContext,
    userIndustry?: string,
    userPlatforms?: string[],
    userAudience?: string
  ): CTAVariation {
    // First try industry-specific CTAs
    if (userIndustry && industrySpecificCTAs[userIndustry]) {
      const industryCTAs = industrySpecificCTAs[userIndustry].filter(cta => 
        cta.context === context.placement || cta.context === 'hero'
      )
      if (industryCTAs.length > 0) {
        return industryCTAs[0]
      }
    }

    // Then try platform-specific CTAs
    if (userPlatforms && userPlatforms.length > 0) {
      for (const platform of userPlatforms) {
        if (platformSpecificCTAs[platform]) {
          const platformCTAs = platformSpecificCTAs[platform].filter(cta =>
            cta.context === context.placement || cta.context === 'hero'
          )
          if (platformCTAs.length > 0) {
            return platformCTAs[0]
          }
        }
      }
    }

    // Fall back to psychology-based CTAs
    const recommendations = contextualCTARecommendations[context.placement] || 
                          contextualCTARecommendations.hero
    
    for (const trigger of recommendations.primary) {
      const triggerCTAs = ctaVariationsByTrigger[trigger]?.filter(cta =>
        (cta.context === context.placement || cta.context === 'hero') &&
        (cta.audience === userAudience || cta.audience === 'general')
      )
      
      if (triggerCTAs && triggerCTAs.length > 0) {
        return triggerCTAs[0]
      }
    }

    // Ultimate fallback
    return ctaVariationsByTrigger.urgency[0]
  }

  /**
   * Get CTA variations for A/B testing
   */
  static getCTAVariationsForTesting(
    context: CTAContext,
    userAttributes: any,
    count: number = 3
  ): CTAVariation[] {
    const variations: CTAVariation[] = []
    const recommendations = contextualCTARecommendations[context.placement] || 
                          contextualCTARecommendations.hero

    // Get variations from recommended triggers
    const allTriggers = [...recommendations.primary, ...recommendations.secondary]
    
    for (const trigger of allTriggers) {
      const triggerCTAs = ctaVariationsByTrigger[trigger]?.filter(cta =>
        cta.context === context.placement || cta.context === 'hero'
      )
      
      if (triggerCTAs) {
        variations.push(...triggerCTAs.slice(0, Math.ceil(count / allTriggers.length)))
      }
      
      if (variations.length >= count) break
    }

    return variations.slice(0, count)
  }

  /**
   * Generate supporting text for CTA based on context
   */
  static generateSupportingText(
    cta: CTAVariation,
    userIndustry?: string,
    userPlatforms?: string[]
  ): string {
    if (cta.supportingText) {
      return cta.supportingText
    }

    // Generate context-appropriate supporting text
    const supportingTexts: Record<string, string[]> = {
      urgency: [
        'Setup takes less than 5 minutes',
        'Instant protection activated',
        'No credit card required'
      ],
      benefit: [
        'See immediate results',
        'Free assessment included',
        '30-day money-back guarantee'
      ],
      social: [
        'Join 10,000+ protected businesses',
        'Trusted by Fortune 500 companies',
        'Recommended by industry experts'
      ],
      risk_reversal: [
        '30-day money-back guarantee',
        'No contracts • Cancel anytime',
        'Try completely risk-free'
      ],
      authority: [
        'Speak with certified experts',
        'Enterprise-grade solution',
        'Industry-leading security'
      ],
      curiosity: [
        'Free security assessment',
        'Discover hidden vulnerabilities',
        'See your risk score'
      ]
    }

    const texts = supportingTexts[cta.psychologyTrigger] || supportingTexts.benefit
    return texts[Math.floor(Math.random() * texts.length)]
  }
}

// Generate all CTA content variations
export function generateCTAContentVariations(): ContentVariation[] {
  const variations: ContentVariation[] = []
  
  // Process all trigger-based CTAs
  Object.entries(ctaVariationsByTrigger).forEach(([trigger, ctas]) => {
    ctas.forEach((cta, index) => {
      variations.push({
        id: `cta_${trigger}_${index}`,
        name: `CTA - ${trigger} - ${cta.text}`,
        content: cta.text,
        type: 'cta',
        category: 'value_proposition',
        emotionTrigger: cta.psychologyTrigger as any,
        audienceSegment: cta.audience as any,
        isActive: true,
        priority: cta.type === 'primary' ? 10 : cta.type === 'secondary' ? 8 : 6,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
  })

  // Process industry-specific CTAs
  Object.entries(industrySpecificCTAs).forEach(([industry, ctas]) => {
    ctas.forEach((cta, index) => {
      variations.push({
        id: `cta_industry_${industry}_${index}`,
        name: `CTA - ${industry} - ${cta.text}`,
        content: cta.text,
        type: 'cta',
        category: 'industry_specific',
        industry: industry as any,
        emotionTrigger: cta.psychologyTrigger as any,
        isActive: true,
        priority: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
  })

  // Process platform-specific CTAs
  Object.entries(platformSpecificCTAs).forEach(([platform, ctas]) => {
    ctas.forEach((cta, index) => {
      variations.push({
        id: `cta_platform_${platform}_${index}`,
        name: `CTA - ${platform} - ${cta.text}`,
        content: cta.text,
        type: 'cta',
        category: 'platform_specific',
        platform: platform as any,
        emotionTrigger: cta.psychologyTrigger as any,
        isActive: true,
        priority: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
  })

  return variations
}