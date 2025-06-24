/**
 * Content Management System for Sales Copy & Content Variations
 * Team 7: Sales Copy & Content Variations
 * 
 * This system manages all sales copy variations, A/B testing, and dynamic content serving
 */

export interface ContentVariation {
  id: string
  name: string
  content: string
  type: 'headline' | 'subheading' | 'cta' | 'description' | 'benefits' | 'features'
  category: 'value_proposition' | 'industry_specific' | 'platform_specific' | 'trust_building' | 'emotional_trigger'
  industry?: 'healthcare' | 'financial' | 'ecommerce' | 'agency' | 'manufacturing' | 'general'
  platform?: 'keap' | 'stripe' | 'gohighlevel' | 'hubspot' | 'activecampaign' | 'mailchimp' | 'shopify' | 'general'
  audienceSegment?: 'enterprise' | 'smb' | 'startup' | 'agency' | 'freelancer'
  emotionTrigger?: 'fear_of_loss' | 'achievement' | 'belonging' | 'convenience' | 'security'
  isActive: boolean
  priority: number
  performanceScore?: number
  conversions?: number
  impressions?: number
  createdAt: Date
  updatedAt: Date
}

export interface ABTestVariant {
  id: string
  testId: string
  name: string
  content: ContentVariation[]
  weight: number // Percentage of traffic to receive this variant
  isControl: boolean
  performance: {
    impressions: number
    conversions: number
    conversionRate: number
    confidence: number
  }
}

export interface ABTest {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate: Date
  endDate?: Date
  winningVariant?: string
  confidenceLevel: number
  minimumSampleSize: number
  currentSampleSize: number
}

export interface UserAttributes {
  industry?: string
  companySize?: 'startup' | 'smb' | 'enterprise'
  role?: 'ceo' | 'cto' | 'marketing' | 'operations' | 'it'
  platformsUsed?: string[]
  visitCount: number
  source: 'organic' | 'paid' | 'referral' | 'direct'
  location?: string
  device: 'desktop' | 'mobile' | 'tablet'
}

export class ContentManager {
  private variations: Map<string, ContentVariation> = new Map()
  private activeTests: Map<string, ABTest> = new Map()
  private userSegments: Map<string, UserAttributes> = new Map()

  constructor() {
    this.loadDefaultContent()
  }

  private loadDefaultContent() {
    // Load default content variations
    const defaultVariations = this.getDefaultVariations()
    defaultVariations.forEach(variation => {
      this.variations.set(variation.id, variation)
    })
  }

  /**
   * Get content variation based on user attributes and active A/B tests
   */
  getContent(
    type: ContentVariation['type'],
    category: ContentVariation['category'],
    userAttributes: UserAttributes,
    testId?: string
  ): ContentVariation {
    // Check if user is in an active A/B test
    if (testId && this.activeTests.has(testId)) {
      const testVariant = this.getTestVariant(testId, userAttributes)
      if (testVariant) {
        const content = testVariant.content.find(c => c.type === type && c.category === category)
        if (content) return content
      }
    }

    // Get best matching content based on user attributes
    return this.getBestMatchingContent(type, category, userAttributes)
  }

  /**
   * Get the best matching content based on user attributes
   */
  private getBestMatchingContent(
    type: ContentVariation['type'],
    category: ContentVariation['category'],
    userAttributes: UserAttributes
  ): ContentVariation {
    const candidates = Array.from(this.variations.values()).filter(v => 
      v.type === type && 
      v.category === category && 
      v.isActive
    )

    // Score each candidate based on relevance to user attributes
    const scoredCandidates = candidates.map(candidate => ({
      content: candidate,
      score: this.calculateRelevanceScore(candidate, userAttributes)
    }))

    // Sort by score (highest first) and return the best match
    scoredCandidates.sort((a, b) => b.score - a.score)
    
    return scoredCandidates[0]?.content || this.getFallbackContent(type, category)
  }

  /**
   * Calculate how relevant a content variation is to user attributes
   */
  private calculateRelevanceScore(content: ContentVariation, userAttributes: UserAttributes): number {
    let score = 0

    // Industry match (highest weight)
    if (content.industry && content.industry === userAttributes.industry) {
      score += 100
    } else if (content.industry === 'general') {
      score += 20
    }

    // Platform match (high weight)
    if (content.platform && userAttributes.platformsUsed?.includes(content.platform)) {
      score += 80
    } else if (content.platform === 'general') {
      score += 15
    }

    // Audience segment match (medium weight)
    if (content.audienceSegment === userAttributes.companySize) {
      score += 60
    }

    // Performance score (medium weight)
    if (content.performanceScore) {
      score += content.performanceScore * 0.5
    }

    // Priority boost (low weight)
    score += content.priority * 10

    return score
  }

  /**
   * Get A/B test variant for user
   */
  private getTestVariant(testId: string, userAttributes: UserAttributes): ABTestVariant | null {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'running') return null

    // Use deterministic assignment based on user attributes hash
    const userHash = this.hashUserAttributes(userAttributes)
    const variantIndex = userHash % test.variants.length
    
    return test.variants[variantIndex]
  }

  /**
   * Create a simple hash from user attributes for consistent variant assignment
   */
  private hashUserAttributes(userAttributes: UserAttributes): number {
    const str = JSON.stringify(userAttributes)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get fallback content when no matches found
   */
  private getFallbackContent(type: ContentVariation['type'], category: ContentVariation['category']): ContentVariation {
    // Return a basic fallback
    return {
      id: 'fallback',
      name: 'Fallback Content',
      content: this.getDefaultContentText(type, category),
      type,
      category,
      isActive: true,
      priority: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Get default content text based on type and category
   */
  private getDefaultContentText(type: ContentVariation['type'], category: ContentVariation['category']): string {
    const defaults: Record<string, Record<string, string>> = {
      value_proposition: {
        headline: 'Secure Your Business Data with AI-Powered Backup',
        subheading: 'Never Lose Critical Data Again',
        cta: 'Start Free Trial',
        description: 'Automatically backup and protect data from all your business tools with enterprise-grade security.',
        benefits: 'Enterprise Security • Real-time Sync • 50+ Integrations',
        features: 'AI-powered automation, real-time sync, enterprise security'
      },
      industry_specific: {
        headline: 'Industry-Specific Data Protection',
        subheading: 'Built for Your Industry',
        cta: 'See How It Works',
        description: 'Specialized data backup solutions designed for your industry requirements.',
        benefits: 'Compliance Ready • Industry Standards • Specialized Features',
        features: 'Compliance monitoring, industry-specific integrations'
      },
      platform_specific: {
        headline: 'Seamless Platform Integration',
        subheading: 'Works with Your Favorite Tools',
        cta: 'Connect Now',
        description: 'Native integrations with the platforms you already use.',
        benefits: 'Native Integrations • Real-time Sync • Easy Setup',
        features: 'One-click setup, automatic sync, comprehensive coverage'
      }
    }

    return defaults[category]?.[type] || 'Default Content'
  }

  /**
   * Add new content variation
   */
  addVariation(variation: Omit<ContentVariation, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId()
    const newVariation: ContentVariation = {
      ...variation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.variations.set(id, newVariation)
    return id
  }

  /**
   * Update existing content variation
   */
  updateVariation(id: string, updates: Partial<ContentVariation>): boolean {
    const existing = this.variations.get(id)
    if (!existing) return false

    const updated = {
      ...existing,
      ...updates,
      id, // Prevent ID changes
      updatedAt: new Date()
    }

    this.variations.set(id, updated)
    return true
  }

  /**
   * Create new A/B test
   */
  createABTest(test: Omit<ABTest, 'id'>): string {
    const id = this.generateId()
    const newTest: ABTest = {
      ...test,
      id
    }

    this.activeTests.set(id, newTest)
    return id
  }

  /**
   * Track conversion for A/B test
   */
  trackConversion(testId: string, variantId: string, userAttributes: UserAttributes): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    const variant = test.variants.find(v => v.id === variantId)
    if (!variant) return

    variant.performance.conversions++
    variant.performance.conversionRate = variant.performance.conversions / variant.performance.impressions
    
    // Update test statistics
    this.updateTestStatistics(testId)
  }

  /**
   * Track impression for A/B test
   */
  trackImpression(testId: string, variantId: string): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    const variant = test.variants.find(v => v.id === variantId)
    if (!variant) return

    variant.performance.impressions++
    variant.performance.conversionRate = variant.performance.conversions / variant.performance.impressions
    
    // Update test statistics
    this.updateTestStatistics(testId)
  }

  /**
   * Update A/B test statistics and determine statistical significance
   */
  private updateTestStatistics(testId: string): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    // Calculate statistical significance between variants
    const control = test.variants.find(v => v.isControl)
    const treatments = test.variants.filter(v => !v.isControl)

    if (!control || treatments.length === 0) return

    treatments.forEach(treatment => {
      const confidence = this.calculateStatisticalSignificance(
        control.performance,
        treatment.performance
      )
      treatment.performance.confidence = confidence
    })

    // Update current sample size
    test.currentSampleSize = test.variants.reduce((sum, v) => sum + v.performance.impressions, 0)

    // Check if test should be stopped
    if (test.currentSampleSize >= test.minimumSampleSize) {
      const winningVariant = this.determineWinningVariant(test)
      if (winningVariant && winningVariant.performance.confidence >= test.confidenceLevel) {
        test.status = 'completed'
        test.winningVariant = winningVariant.id
        test.endDate = new Date()
      }
    }
  }

  /**
   * Calculate statistical significance between two variants
   */
  private calculateStatisticalSignificance(
    control: ABTestVariant['performance'],
    treatment: ABTestVariant['performance']
  ): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical methods (t-test, chi-square, etc.)
    
    if (control.impressions < 100 || treatment.impressions < 100) {
      return 0 // Not enough data
    }

    const controlRate = control.conversionRate
    const treatmentRate = treatment.conversionRate
    
    if (controlRate === 0 && treatmentRate === 0) {
      return 0
    }

    // Simple confidence calculation based on sample size and difference
    const sampleSizeBonus = Math.min(
      (control.impressions + treatment.impressions) / 1000, 
      1
    )
    
    const improvementRatio = treatmentRate / (controlRate || 0.001)
    const improvement = Math.abs(improvementRatio - 1)
    
    return Math.min(improvement * sampleSizeBonus * 100, 99)
  }

  /**
   * Determine winning variant in A/B test
   */
  private determineWinningVariant(test: ABTest): ABTestVariant | null {
    return test.variants.reduce((winner, variant) => {
      if (!winner) return variant
      
      if (variant.performance.conversionRate > winner.performance.conversionRate &&
          variant.performance.confidence >= test.confidenceLevel) {
        return variant
      }
      
      return winner
    }, null as ABTestVariant | null)
  }

  /**
   * Get performance analytics for content variations
   */
  getContentAnalytics(): {
    topPerforming: ContentVariation[]
    underPerforming: ContentVariation[]
    activeTests: ABTest[]
    conversionRates: Record<string, number>
  } {
    const allVariations = Array.from(this.variations.values())
    
    // Sort by performance score
    const topPerforming = allVariations
      .filter(v => v.performanceScore && v.performanceScore > 70)
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, 10)

    const underPerforming = allVariations
      .filter(v => v.performanceScore && v.performanceScore < 30)
      .sort((a, b) => (a.performanceScore || 0) - (b.performanceScore || 0))
      .slice(0, 10)

    const activeTests = Array.from(this.activeTests.values())
      .filter(test => test.status === 'running')

    const conversionRates: Record<string, number> = {}
    allVariations.forEach(variation => {
      if (variation.conversions && variation.impressions) {
        conversionRates[variation.id] = variation.conversions / variation.impressions
      }
    })

    return {
      topPerforming,
      underPerforming,
      activeTests,
      conversionRates
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get default content variations
   */
  private getDefaultVariations(): ContentVariation[] {
    // This will be populated with comprehensive default content
    return []
  }
}

// Singleton instance
export const contentManager = new ContentManager()