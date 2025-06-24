/**
 * Sales Copy & Content Variations System
 * Team 7: Complete Integration
 * 
 * This is the main integration file that exports all the sales copy and content variation
 * systems for easy use throughout the application.
 */

// Core content management
export { 
  ContentManager, 
  contentManager, 
  type ContentVariation, 
  type ABTest, 
  type ABTestVariant, 
  type UserAttributes 
} from './content-manager'

// Value propositions and messaging frameworks
export { 
  primaryValuePropositions, 
  generateValuePropositionVariations,
  headlineVariations,
  ctaVariations,
  type ValueProposition
} from './value-propositions'

// Industry-specific messaging
export { 
  industryMessagingFramework,
  generateIndustryContentVariations,
  industryUrgencyMessaging,
  industrySocialProofTemplates,
  type IndustryMessaging
} from './industry-messaging'

// Platform-specific messaging
export { 
  platformMessagingFramework,
  generatePlatformContentVariations,
  platformUrgencyMessaging,
  platformValueProps,
  type PlatformMessaging
} from './platform-messaging'

// CTA optimization
export { 
  ctaVariationsByTrigger,
  industrySpecificCTAs,
  platformSpecificCTAs,
  contextualCTARecommendations,
  CTAOptimizer,
  generateCTAContentVariations,
  type CTAVariation,
  type CTAContext
} from './cta-optimization'

// A/B testing framework
export { 
  ABTestingFramework,
  abTestingFramework,
  testTemplates,
  type TestConfig,
  type TestResult,
  type VariantPerformance
} from './ab-testing-framework'

// Trust and credibility
export { 
  securityTrustSignals,
  customerSuccessStories,
  expertiseCredibility,
  partnershipCredibility,
  guaranteeMessaging,
  generateTrustCredibilityVariations,
  trustSignalRecommendations,
  socialProofStats,
  industryTrustSignals,
  type TrustSignal,
  type TestimonialFramework,
  type SecurityMessaging
} from './trust-credibility'

// Emotional triggers and psychology
export { 
  fearOfLossTrigger,
  achievementTrigger,
  belongingTrigger,
  convenienceTrigger,
  securityTrigger,
  curiosityTrigger,
  psychologyPrinciples,
  generateEmotionalTriggerVariations,
  emotionalTriggerRecommendations,
  contextEmotionalMapping,
  type EmotionalTrigger,
  type PsychologyFramework
} from './emotional-triggers'

// Conversion optimization
export { 
  landingPageHeadlines,
  formOptimizations,
  errorMessages,
  successMessages,
  microcopy,
  loadingMessages,
  conversionFlows,
  retentionUpsellMessages,
  generateConversionOptimizationVariations,
  ConversionOptimizer,
  conversionTestingScenarios,
  type ConversionElement,
  type FormOptimization,
  type ConversionFlow
} from './conversion-optimization'

// Dynamic content serving
export { 
  DynamicContentServer,
  dynamicContentServer,
  usePersonalizedContent,
  ContentServingUtils,
  type ContentRequest,
  type SessionData,
  type PageData,
  type PersonalizationRule,
  type ContentRecommendation
} from './dynamic-content-serving'

/**
 * Main Content API
 * 
 * This is the primary interface for accessing all content variations and personalization features.
 */
export class ContentAPI {
  /**
   * Get personalized content for a specific context
   */
  static async getContent(
    type: 'headline' | 'subheading' | 'description' | 'cta' | 'benefits' | 'features',
    context: string,
    userAttributes: UserAttributes,
    sessionData?: SessionData
  ): Promise<ContentRecommendation> {
    return dynamicContentServer.getPersonalizedContent({
      type,
      category: 'value_proposition',
      context,
      userAttributes,
      sessionData,
      testingEnabled: true
    })
  }

  /**
   * Get industry-specific content
   */
  static getIndustryContent(
    industry: string,
    type: 'headline' | 'subheading' | 'description' | 'cta' | 'benefits' | 'features'
  ): string {
    const framework = industryMessagingFramework[industry]
    if (!framework) return 'Default content'

    switch (type) {
      case 'headline':
        return framework.messaging.headlines[0]
      case 'subheading':
        return framework.messaging.subheadings[0]
      case 'description':
        return framework.messaging.descriptions[0]
      case 'cta':
        return framework.messaging.ctas[0]
      case 'benefits':
        return framework.benefits.join(' • ')
      case 'features':
        return framework.messaging.features.join(' • ')
      default:
        return 'Default content'
    }
  }

  /**
   * Get platform-specific content
   */
  static getPlatformContent(
    platform: string,
    type: 'headline' | 'subheading' | 'description' | 'cta' | 'benefits' | 'features'
  ): string {
    const framework = platformMessagingFramework[platform]
    if (!framework) return 'Default content'

    switch (type) {
      case 'headline':
        return framework.messaging.headlines[0]
      case 'subheading':
        return framework.messaging.subheadings[0]
      case 'description':
        return framework.messaging.descriptions[0]
      case 'cta':
        return framework.messaging.ctas[0]
      case 'benefits':
        return framework.integrationBenefits.join(' • ')
      case 'features':
        return framework.messaging.features.join(' • ')
      default:
        return 'Default content'
    }
  }

  /**
   * Get optimized CTA for context and user
   */
  static getOptimizedCTA(
    context: string,
    userAttributes: UserAttributes
  ): string {
    const ctaContext = {
      placement: context,
      surroundingContent: '',
      userJourney: 'consideration' as const,
      pageType: 'landing' as const,
      trafficSource: 'organic' as const
    }

    const cta = CTAOptimizer.getOptimalCTA(
      ctaContext,
      userAttributes.industry,
      userAttributes.platformsUsed,
      userAttributes.companySize
    )

    return cta.text
  }

  /**
   * Get trust signals for context
   */
  static getTrustSignals(context: string): string[] {
    const recommendations = trustSignalRecommendations[context] || trustSignalRecommendations.hero
    
    return recommendations.map(signal => {
      switch (signal) {
        case 'security':
          return securityTrustSignals.certifications[0]
        case 'certification':
          return securityTrustSignals.certifications[1]
        case 'social_proof':
          return socialProofStats.customers
        case 'guarantee':
          return securityTrustSignals.guarantees[0]
        default:
          return 'Trusted by thousands of businesses'
      }
    })
  }

  /**
   * Create A/B test for content variations
   */
  static createContentTest(
    name: string,
    variants: { name: string; content: ContentVariation[] }[],
    config: Partial<TestConfig> = {}
  ): string {
    const testConfig: TestConfig = {
      name,
      description: config.description || `A/B test for ${name}`,
      hypothesis: config.hypothesis || 'Variant will outperform control',
      successMetric: config.successMetric || 'conversion_rate',
      trafficSplit: config.trafficSplit || [50, 50],
      minimumSampleSize: config.minimumSampleSize || 1000,
      confidenceLevel: config.confidenceLevel || 95,
      maxDuration: config.maxDuration || 14,
      audience: config.audience
    }

    return abTestingFramework.createTest(testConfig, variants)
  }

  /**
   * Track content performance
   */
  static trackContentEvent(
    contentId: string,
    event: 'impression' | 'click' | 'conversion',
    sessionId: string
  ): void {
    dynamicContentServer.trackContentPerformance(contentId, event, sessionId)
  }

  /**
   * Get content analytics
   */
  static getContentAnalytics(): {
    topPerforming: ContentVariation[]
    underPerforming: ContentVariation[]
    activeTests: ABTest[]
    conversionRates: Record<string, number>
  } {
    return contentManager.getContentAnalytics()
  }
}

/**
 * React Hooks for Content
 */

// Hook for personalized content
export function usePersonalizedContent(
  type: ContentVariation['type'],
  context: string,
  userAttributes: UserAttributes,
  sessionData?: SessionData
) {
  // In a real React app, this would use useEffect and useState
  // For now, return the synchronous version
  return {
    content: ContentAPI.getIndustryContent(userAttributes.industry || 'general', type),
    isLoading: false,
    error: null
  }
}

// Hook for A/B testing
export function useABTestContent(
  testId: string,
  userId: string,
  userAttributes: UserAttributes
) {
  const variant = abTestingFramework.getVariantForUser(testId, userId, userAttributes)
  
  return {
    variant,
    isLoading: false,
    trackImpression: () => {
      if (variant) {
        abTestingFramework.recordImpression(testId, variant.id, userId)
      }
    },
    trackConversion: () => {
      if (variant) {
        abTestingFramework.recordConversion(testId, variant.id, userId)
      }
    }
  }
}

/**
 * Utility Functions
 */

// Initialize all content variations
export function initializeContentSystem(): void {
  // Generate and load all content variations
  const allVariations = [
    ...generateValuePropositionVariations(),
    ...generateIndustryContentVariations(),
    ...generatePlatformContentVariations(),
    ...generateCTAContentVariations(),
    ...generateTrustCredibilityVariations(),
    ...generateEmotionalTriggerVariations(),
    ...generateConversionOptimizationVariations()
  ]

  // Add all variations to content manager
  allVariations.forEach(variation => {
    contentManager.addVariation(variation)
  })

  console.log(`Initialized content system with ${allVariations.length} content variations`)
}

// Get content recommendations for optimization
export function getContentOptimizationRecommendations(
  userAttributes: UserAttributes,
  currentContent: string,
  context: string
): {
  recommendations: string[]
  testingOpportunities: string[]
  improvementAreas: string[]
} {
  const recommendations: string[] = []
  const testingOpportunities: string[] = []
  const improvementAreas: string[] = []

  // Industry-specific recommendations
  if (userAttributes.industry) {
    recommendations.push(`Consider industry-specific messaging for ${userAttributes.industry}`)
    testingOpportunities.push(`Test industry-specific vs generic messaging`)
  }

  // Platform-specific recommendations
  if (userAttributes.platformsUsed?.length) {
    recommendations.push(`Leverage platform-specific messaging for ${userAttributes.platformsUsed[0]}`)
    testingOpportunities.push(`Test platform-specific vs generic messaging`)
  }

  // Emotional trigger recommendations
  const optimalTrigger = emotionalTriggerRecommendations[userAttributes.companySize || 'smb']?.[0]
  if (optimalTrigger) {
    recommendations.push(`Consider ${optimalTrigger} emotional trigger for your audience`)
    testingOpportunities.push(`Test different emotional triggers`)
  }

  // Context-specific recommendations
  const contextRecommendations = contextEmotionalMapping[context]
  if (contextRecommendations) {
    recommendations.push(`Optimize for ${context} context with ${contextRecommendations[0]} messaging`)
  }

  return {
    recommendations,
    testingOpportunities,
    improvementAreas
  }
}

// Export the main ContentAPI as default
export default ContentAPI