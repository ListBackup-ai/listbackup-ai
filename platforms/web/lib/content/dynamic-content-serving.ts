/**
 * Dynamic Content Serving System
 * Team 7: Sales Copy & Content Variations - Subtask 9
 * 
 * Dynamic content serving based on user attributes, content personalization engine,
 * real-time content optimization, and adaptive messaging system
 */

import { ContentVariation, UserAttributes, contentManager } from './content-manager'
import { industryMessagingFramework } from './industry-messaging'
import { platformMessagingFramework } from './platform-messaging'
import { ctaVariationsByTrigger, CTAOptimizer } from './cta-optimization'
import { emotionalTriggerRecommendations } from './emotional-triggers'
import { abTestingFramework } from './ab-testing-framework'

export interface ContentRequest {
  type: ContentVariation['type']
  category: ContentVariation['category']
  context: string
  userAttributes: UserAttributes
  sessionData?: SessionData
  pageData?: PageData
  testingEnabled?: boolean
}

export interface SessionData {
  sessionId: string
  visitCount: number
  pagesViewed: string[]
  timeOnSite: number
  referrer: string
  trafficSource: 'organic' | 'paid' | 'referral' | 'direct' | 'email' | 'social'
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browserType: string
  location?: {
    country: string
    region: string
    city: string
  }
  previousSessions?: {
    lastVisit: Date
    totalVisits: number
    totalTimeOnSite: number
  }
}

export interface PageData {
  pageType: 'landing' | 'pricing' | 'features' | 'signup' | 'demo' | 'about' | 'contact'
  pagePath: string
  utmParams?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
  experimentId?: string
  variantId?: string
}

export interface PersonalizationRule {
  id: string
  name: string
  conditions: PersonalizationCondition[]
  action: PersonalizationAction
  priority: number
  isActive: boolean
  analytics: {
    impressions: number
    conversions: number
    conversionRate: number
  }
}

export interface PersonalizationCondition {
  attribute: keyof UserAttributes | keyof SessionData | keyof PageData
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  weight: number
}

export interface PersonalizationAction {
  type: 'replace_content' | 'show_banner' | 'change_cta' | 'adjust_messaging' | 'redirect'
  contentVariationId?: string
  customContent?: string
  targetUrl?: string
  duration?: number
}

export interface ContentRecommendation {
  content: ContentVariation
  confidence: number
  reasoning: string[]
  alternatives: ContentVariation[]
  testingOpportunity?: {
    testType: string
    expectedLift: number
    recommendedDuration: number
  }
}

export class DynamicContentServer {
  private personalizationRules: Map<string, PersonalizationRule> = new Map()
  private contentCache: Map<string, { content: ContentVariation; timestamp: number; ttl: number }> = new Map()
  private performanceMetrics: Map<string, any> = new Map()

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Get personalized content based on user attributes and context
   */
  async getPersonalizedContent(request: ContentRequest): Promise<ContentRecommendation> {
    // Check for A/B test assignment first
    if (request.testingEnabled && request.sessionData?.sessionId) {
      const testContent = await this.getTestVariant(request)
      if (testContent) {
        return testContent
      }
    }

    // Apply personalization rules
    const personalizedContent = this.applyPersonalizationRules(request)
    if (personalizedContent) {
      return personalizedContent
    }

    // Fall back to intelligent content selection
    return this.getIntelligentContent(request)
  }

  /**
   * Get content variation for A/B testing
   */
  private async getTestVariant(request: ContentRequest): Promise<ContentRecommendation | null> {
    // Check if user is in an active test
    const activeTests = abTestingFramework.getActiveTests()
    
    for (const test of activeTests) {
      const variant = abTestingFramework.getVariantForUser(
        test.id,
        request.sessionData!.sessionId,
        request.userAttributes
      )
      
      if (variant) {
        const content = variant.content.find(c => 
          c.type === request.type && c.category === request.category
        )
        
        if (content) {
          // Track impression
          abTestingFramework.recordImpression(test.id, variant.id, request.sessionData!.sessionId)
          
          return {
            content,
            confidence: 0.8, // Test variant has high confidence
            reasoning: [`A/B Test: ${test.name} - Variant: ${variant.name}`],
            alternatives: []
          }
        }
      }
    }

    return null
  }

  /**
   * Apply personalization rules to content selection
   */
  private applyPersonalizationRules(request: ContentRequest): ContentRecommendation | null {
    const applicableRules = Array.from(this.personalizationRules.values())
      .filter(rule => rule.isActive)
      .filter(rule => this.evaluateConditions(rule.conditions, request))
      .sort((a, b) => b.priority - a.priority)

    if (applicableRules.length === 0) {
      return null
    }

    const topRule = applicableRules[0]
    
    if (topRule.action.type === 'replace_content' && topRule.action.contentVariationId) {
      const content = contentManager.getContent(
        request.type,
        request.category,
        request.userAttributes
      )

      return {
        content,
        confidence: 0.9,
        reasoning: [`Personalization Rule: ${topRule.name}`],
        alternatives: []
      }
    }

    return null
  }

  /**
   * Get intelligent content based on user attributes and context
   */
  private getIntelligentContent(request: ContentRequest): ContentRecommendation {
    const { type, category, context, userAttributes, sessionData, pageData } = request

    // Calculate content scores based on multiple factors
    const scoringFactors = this.calculateScoringFactors(request)
    
    // Get content based on primary factors
    let content = contentManager.getContent(type, category, userAttributes)
    let confidence = 0.7
    const reasoning: string[] = []

    // Industry-specific optimization
    if (userAttributes.industry && this.hasIndustrySpecificContent(userAttributes.industry)) {
      content = this.getIndustryOptimizedContent(request)
      confidence += 0.1
      reasoning.push(`Industry-specific content for ${userAttributes.industry}`)
    }

    // Platform-specific optimization
    if (userAttributes.platformsUsed && userAttributes.platformsUsed.length > 0) {
      const platformContent = this.getPlatformOptimizedContent(request)
      if (platformContent) {
        content = platformContent
        confidence += 0.1
        reasoning.push(`Platform-specific content for ${userAttributes.platformsUsed[0]}`)
      }
    }

    // Context-specific optimization
    if (context && this.hasContextOptimization(context)) {
      const contextContent = this.getContextOptimizedContent(request)
      if (contextContent) {
        content = contextContent
        confidence += 0.1
        reasoning.push(`Context-optimized for ${context}`)
      }
    }

    // Emotional trigger optimization
    const emotionalTrigger = this.getOptimalEmotionalTrigger(request)
    if (emotionalTrigger) {
      reasoning.push(`Emotional trigger: ${emotionalTrigger}`)
      confidence += 0.05
    }

    // Behavioral optimization
    if (sessionData) {
      const behavioralAdjustment = this.getBehavioralAdjustment(sessionData)
      if (behavioralAdjustment) {
        reasoning.push(behavioralAdjustment.reason)
        confidence += behavioralAdjustment.confidenceBoost
      }
    }

    // Get alternatives for potential testing
    const alternatives = this.getAlternativeContent(request, content)

    // Suggest testing opportunities
    const testingOpportunity = this.identifyTestingOpportunity(request, content, alternatives)

    return {
      content,
      confidence: Math.min(confidence, 1.0),
      reasoning,
      alternatives,
      testingOpportunity
    }
  }

  /**
   * Calculate scoring factors for content selection
   */
  private calculateScoringFactors(request: ContentRequest): Record<string, number> {
    const factors: Record<string, number> = {}

    // Industry relevance
    if (request.userAttributes.industry) {
      factors.industryRelevance = this.hasIndustrySpecificContent(request.userAttributes.industry) ? 1.0 : 0.0
    }

    // Platform relevance
    if (request.userAttributes.platformsUsed?.length) {
      factors.platformRelevance = request.userAttributes.platformsUsed.some(p => 
        this.hasPlatformSpecificContent(p)
      ) ? 1.0 : 0.0
    }

    // Company size fit
    const companySizeFit = this.getCompanySizeFit(request.userAttributes.companySize)
    factors.companySizeFit = companySizeFit

    // Context relevance
    factors.contextRelevance = this.getContextRelevance(request.context)

    // Urgency level based on traffic source and behavior
    factors.urgencyLevel = this.getUrgencyLevel(request.sessionData)

    return factors
  }

  /**
   * Get industry-optimized content
   */
  private getIndustryOptimizedContent(request: ContentRequest): ContentVariation {
    const industry = request.userAttributes.industry!
    const industryFramework = industryMessagingFramework[industry]
    
    if (!industryFramework) {
      return contentManager.getContent(request.type, request.category, request.userAttributes)
    }

    // Create optimized content based on industry framework
    const optimizedContent: ContentVariation = {
      id: `dynamic_industry_${industry}_${request.type}`,
      name: `Dynamic ${industry} ${request.type}`,
      content: this.selectIndustryContent(industryFramework, request.type),
      type: request.type,
      category: 'industry_specific',
      industry: industry as any,
      isActive: true,
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return optimizedContent
  }

  /**
   * Get platform-optimized content
   */
  private getPlatformOptimizedContent(request: ContentRequest): ContentVariation | null {
    const platforms = request.userAttributes.platformsUsed
    if (!platforms || platforms.length === 0) return null

    const primaryPlatform = platforms[0]
    const platformFramework = platformMessagingFramework[primaryPlatform]
    
    if (!platformFramework) return null

    const optimizedContent: ContentVariation = {
      id: `dynamic_platform_${primaryPlatform}_${request.type}`,
      name: `Dynamic ${primaryPlatform} ${request.type}`,
      content: this.selectPlatformContent(platformFramework, request.type),
      type: request.type,
      category: 'platform_specific',
      platform: primaryPlatform as any,
      isActive: true,
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return optimizedContent
  }

  /**
   * Get context-optimized content
   */
  private getContextOptimizedContent(request: ContentRequest): ContentVariation | null {
    // Context-specific optimization logic
    const contextOptimizations: Record<string, any> = {
      pricing: {
        emphasis: 'value_and_guarantee',
        urgency: 'medium',
        trust_signals: 'high'
      },
      signup: {
        emphasis: 'ease_and_speed',
        urgency: 'low',
        friction_reduction: 'high'
      },
      demo: {
        emphasis: 'capability_and_results',
        urgency: 'medium',
        proof_elements: 'high'
      }
    }

    const contextConfig = contextOptimizations[request.context]
    if (!contextConfig) return null

    // Generate context-optimized content
    return this.generateContextOptimizedContent(request, contextConfig)
  }

  /**
   * Get optimal emotional trigger for user
   */
  private getOptimalEmotionalTrigger(request: ContentRequest): string | null {
    const { userAttributes, sessionData } = request

    // Determine audience segment
    let audienceSegment = 'general'
    if (userAttributes.companySize) {
      audienceSegment = userAttributes.companySize
    }

    // Get recommended triggers for audience
    const triggers = emotionalTriggerRecommendations[audienceSegment] || 
                    emotionalTriggerRecommendations.smb

    // Adjust based on session behavior
    if (sessionData) {
      if (sessionData.visitCount === 1) {
        return triggers.includes('curiosity') ? 'curiosity' : triggers[0]
      } else if (sessionData.visitCount > 3) {
        return triggers.includes('fear_of_loss') ? 'fear_of_loss' : triggers[0]
      }
    }

    return triggers[0] || null
  }

  /**
   * Get behavioral adjustment based on session data
   */
  private getBehavioralAdjustment(sessionData: SessionData): { reason: string; confidenceBoost: number } | null {
    // Return visitor - increase urgency
    if (sessionData.visitCount > 2) {
      return {
        reason: 'Return visitor - increased urgency messaging',
        confidenceBoost: 0.1
      }
    }

    // Long session time - show detailed content
    if (sessionData.timeOnSite > 300) { // 5 minutes
      return {
        reason: 'Engaged visitor - detailed content preferred',
        confidenceBoost: 0.1
      }
    }

    // Mobile user - prefer concise content
    if (sessionData.deviceType === 'mobile') {
      return {
        reason: 'Mobile user - concise content optimized',
        confidenceBoost: 0.05
      }
    }

    // Paid traffic - higher intent
    if (sessionData.trafficSource === 'paid') {
      return {
        reason: 'Paid traffic - high intent optimization',
        confidenceBoost: 0.1
      }
    }

    return null
  }

  /**
   * Get alternative content for testing
   */
  private getAlternativeContent(request: ContentRequest, primaryContent: ContentVariation): ContentVariation[] {
    const alternatives: ContentVariation[] = []

    // Get variations with different emotional triggers
    const emotionalVariations = this.getEmotionalVariations(request, primaryContent)
    alternatives.push(...emotionalVariations)

    // Get style variations (e.g., benefit-focused vs feature-focused)
    const styleVariations = this.getStyleVariations(request, primaryContent)
    alternatives.push(...styleVariations)

    // Get length variations (short vs long form)
    const lengthVariations = this.getLengthVariations(request, primaryContent)
    alternatives.push(...lengthVariations)

    return alternatives.slice(0, 3) // Limit to 3 alternatives
  }

  /**
   * Identify testing opportunities
   */
  private identifyTestingOpportunity(
    request: ContentRequest,
    primaryContent: ContentVariation,
    alternatives: ContentVariation[]
  ): ContentRecommendation['testingOpportunity'] {
    if (alternatives.length < 2) return undefined

    // High-impact testing scenarios
    const highImpactContexts = ['pricing', 'signup', 'hero']
    if (highImpactContexts.includes(request.context)) {
      return {
        testType: 'headline_optimization',
        expectedLift: 15,
        recommendedDuration: 14
      }
    }

    // Industry-specific testing
    if (request.userAttributes.industry) {
      return {
        testType: 'industry_messaging',
        expectedLift: 10,
        recommendedDuration: 10
      }
    }

    // Emotional trigger testing
    return {
      testType: 'emotional_trigger',
      expectedLift: 8,
      recommendedDuration: 7
    }
  }

  /**
   * Evaluate personalization conditions
   */
  private evaluateConditions(conditions: PersonalizationCondition[], request: ContentRequest): boolean {
    return conditions.every(condition => {
      const value = this.getAttributeValue(condition.attribute, request)
      return this.evaluateCondition(value, condition.operator, condition.value)
    })
  }

  /**
   * Get attribute value from request
   */
  private getAttributeValue(attribute: string, request: ContentRequest): any {
    if (attribute in request.userAttributes) {
      return (request.userAttributes as any)[attribute]
    }
    if (request.sessionData && attribute in request.sessionData) {
      return (request.sessionData as any)[attribute]
    }
    if (request.pageData && attribute in request.pageData) {
      return (request.pageData as any)[attribute]
    }
    return undefined
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(value: any, operator: PersonalizationCondition['operator'], targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue
      case 'not_equals':
        return value !== targetValue
      case 'contains':
        return Array.isArray(value) ? value.includes(targetValue) : String(value).includes(String(targetValue))
      case 'not_contains':
        return Array.isArray(value) ? !value.includes(targetValue) : !String(value).includes(String(targetValue))
      case 'greater_than':
        return Number(value) > Number(targetValue)
      case 'less_than':
        return Number(value) < Number(targetValue)
      case 'in':
        return Array.isArray(targetValue) ? targetValue.includes(value) : false
      case 'not_in':
        return Array.isArray(targetValue) ? !targetValue.includes(value) : true
      default:
        return false
    }
  }

  /**
   * Helper methods for content selection
   */
  private hasIndustrySpecificContent(industry: string): boolean {
    return Object.keys(industryMessagingFramework).includes(industry)
  }

  private hasPlatformSpecificContent(platform: string): boolean {
    return Object.keys(platformMessagingFramework).includes(platform)
  }

  private hasContextOptimization(context: string): boolean {
    const optimizedContexts = ['pricing', 'signup', 'demo', 'features', 'hero']
    return optimizedContexts.includes(context)
  }

  private getCompanySizeFit(companySize?: string): number {
    // Implementation depends on business rules
    return companySize ? 0.8 : 0.5
  }

  private getContextRelevance(context: string): number {
    // Implementation depends on context importance
    return this.hasContextOptimization(context) ? 1.0 : 0.5
  }

  private getUrgencyLevel(sessionData?: SessionData): number {
    if (!sessionData) return 0.5
    
    let urgency = 0.5
    
    // Increase urgency for return visitors
    if (sessionData.visitCount > 2) urgency += 0.2
    
    // Increase urgency for paid traffic
    if (sessionData.trafficSource === 'paid') urgency += 0.1
    
    // Decrease urgency for first-time visitors
    if (sessionData.visitCount === 1) urgency -= 0.1
    
    return Math.max(0, Math.min(1, urgency))
  }

  private selectIndustryContent(framework: any, type: ContentVariation['type']): string {
    const messaging = framework.messaging
    switch (type) {
      case 'headline':
        return messaging.headlines[0] || 'Default headline'
      case 'subheading':
        return messaging.subheadings[0] || 'Default subheading'
      case 'description':
        return messaging.descriptions[0] || 'Default description'
      case 'cta':
        return messaging.ctas[0] || 'Get Started'
      default:
        return 'Default content'
    }
  }

  private selectPlatformContent(framework: any, type: ContentVariation['type']): string {
    const messaging = framework.messaging
    switch (type) {
      case 'headline':
        return messaging.headlines[0] || 'Default headline'
      case 'subheading':
        return messaging.subheadings[0] || 'Default subheading'
      case 'description':
        return messaging.descriptions[0] || 'Default description'
      case 'cta':
        return messaging.ctas[0] || 'Get Started'
      default:
        return 'Default content'
    }
  }

  private generateContextOptimizedContent(request: ContentRequest, contextConfig: any): ContentVariation {
    // Generate content based on context configuration
    return {
      id: `dynamic_context_${request.context}_${request.type}`,
      name: `Dynamic Context ${request.context} ${request.type}`,
      content: `Context-optimized content for ${request.context}`,
      type: request.type,
      category: 'value_proposition',
      isActive: true,
      priority: 9,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private getEmotionalVariations(request: ContentRequest, primary: ContentVariation): ContentVariation[] {
    // Implementation for emotional variations
    return []
  }

  private getStyleVariations(request: ContentRequest, primary: ContentVariation): ContentVariation[] {
    // Implementation for style variations
    return []
  }

  private getLengthVariations(request: ContentRequest, primary: ContentVariation): ContentVariation[] {
    // Implementation for length variations
    return []
  }

  private initializeDefaultRules(): void {
    // Initialize default personalization rules
    const defaultRules: PersonalizationRule[] = [
      {
        id: 'healthcare_compliance_focus',
        name: 'Healthcare Industry - Compliance Focus',
        conditions: [
          {
            attribute: 'industry',
            operator: 'equals',
            value: 'healthcare',
            weight: 1.0
          }
        ],
        action: {
          type: 'replace_content',
          contentVariationId: 'healthcare_compliance_content'
        },
        priority: 10,
        isActive: true,
        analytics: { impressions: 0, conversions: 0, conversionRate: 0 }
      },
      {
        id: 'return_visitor_urgency',
        name: 'Return Visitor - Increase Urgency',
        conditions: [
          {
            attribute: 'visitCount',
            operator: 'greater_than',
            value: 2,
            weight: 1.0
          }
        ],
        action: {
          type: 'adjust_messaging',
          contentVariationId: 'urgency_focused_content'
        },
        priority: 8,
        isActive: true,
        analytics: { impressions: 0, conversions: 0, conversionRate: 0 }
      }
    ]

    defaultRules.forEach(rule => {
      this.personalizationRules.set(rule.id, rule)
    })
  }

  /**
   * Track content performance
   */
  trackContentPerformance(contentId: string, event: 'impression' | 'click' | 'conversion', sessionId: string): void {
    const key = `${contentId}_${event}`
    const current = this.performanceMetrics.get(key) || 0
    this.performanceMetrics.set(key, current + 1)

    // Update content variation performance if it exists
    const content = Array.from(contentManager['variations'].values()).find(v => v.id === contentId)
    if (content) {
      if (event === 'impression') {
        content.impressions = (content.impressions || 0) + 1
      } else if (event === 'conversion') {
        content.conversions = (content.conversions || 0) + 1
      }
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): Record<string, any> {
    return Object.fromEntries(this.performanceMetrics.entries())
  }
}

// Singleton instance
export const dynamicContentServer = new DynamicContentServer()

// Utility functions for React components
export function usePersonalizedContent(
  type: ContentVariation['type'],
  category: ContentVariation['category'],
  context: string,
  userAttributes: UserAttributes,
  sessionData?: SessionData
): ContentRecommendation {
  return dynamicContentServer.getPersonalizedContent({
    type,
    category,
    context,
    userAttributes,
    sessionData,
    testingEnabled: true
  }) as any // In real implementation, this would be async
}

// Content serving utilities
export const ContentServingUtils = {
  /**
   * Get industry-optimized headline
   */
  getIndustryHeadline(industry: string, context: string = 'hero'): string {
    const framework = industryMessagingFramework[industry]
    return framework?.messaging.headlines[0] || 'Secure Your Business Data with AI-Powered Backup'
  },

  /**
   * Get platform-specific CTA
   */
  getPlatformCTA(platform: string): string {
    const framework = platformMessagingFramework[platform]
    return framework?.messaging.ctas[0] || 'Start Free Trial'
  },

  /**
   * Get audience-appropriate emotional trigger
   */
  getEmotionalTrigger(audienceSegment: string): string {
    const triggers = emotionalTriggerRecommendations[audienceSegment] || ['security']
    return triggers[0]
  },

  /**
   * Get context-appropriate microcopy
   */
  getContextMicrocopy(context: string): string[] {
    const microcopies: Record<string, string[]> = {
      signup: ['No spam, ever', 'Unsubscribe anytime', 'Setup takes 2 minutes'],
      pricing: ['Cancel anytime', '30-day guarantee', 'No setup fees'],
      demo: ['No obligation', 'See live results', 'Personalized for you']
    }
    return microcopies[context] || []
  }
}