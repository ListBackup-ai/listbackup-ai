/**
 * A/B Testing Framework for Content Variations
 * Team 7: Sales Copy & Content Variations - Subtask 5
 * 
 * Complete A/B testing system with statistical significance calculation,
 * content variation management, and performance tracking
 */

import { ContentVariation, ABTest, ABTestVariant, UserAttributes } from './content-manager'

export interface TestConfig {
  name: string
  description: string
  hypothesis: string
  successMetric: 'conversion_rate' | 'click_through_rate' | 'engagement_rate' | 'retention_rate'
  trafficSplit: number[] // Percentage allocation for each variant
  minimumSampleSize: number
  confidenceLevel: number // 90, 95, or 99
  maxDuration: number // Maximum test duration in days
  audience?: {
    industry?: string[]
    platform?: string[]
    companySize?: string[]
    trafficSource?: string[]
  }
}

export interface TestResult {
  testId: string
  status: 'running' | 'completed' | 'inconclusive' | 'stopped'
  winningVariant?: string
  liftPercentage?: number
  confidence: number
  pValue?: number
  sampleSizes: Record<string, number>
  conversionRates: Record<string, number>
  significance: boolean
  recommendations: string[]
  startDate: Date
  endDate?: Date
  duration: number
}

export interface VariantPerformance {
  variantId: string
  impressions: number
  conversions: number
  conversionRate: number
  clicks?: number
  clickThroughRate?: number
  bounceRate?: number
  timeOnPage?: number
  revenueGenerated?: number
  confidence: number
  isWinner?: boolean
  lift?: number
}

export class ABTestingFramework {
  private activeTests: Map<string, ABTest> = new Map()
  private testResults: Map<string, TestResult> = new Map()
  private userAssignments: Map<string, Record<string, string>> = new Map() // userId -> testId -> variantId

  /**
   * Create a new A/B test
   */
  createTest(
    config: TestConfig,
    variants: { name: string; content: ContentVariation[] }[]
  ): string {
    const testId = this.generateTestId()
    
    // Validate traffic split
    const totalSplit = config.trafficSplit.reduce((sum, split) => sum + split, 0)
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new Error('Traffic split must total 100%')
    }

    if (variants.length !== config.trafficSplit.length) {
      throw new Error('Number of variants must match traffic split array length')
    }

    // Create test variants
    const testVariants: ABTestVariant[] = variants.map((variant, index) => ({
      id: `${testId}_variant_${index}`,
      testId,
      name: variant.name,
      content: variant.content,
      weight: config.trafficSplit[index],
      isControl: index === 0, // First variant is always control
      performance: {
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
        confidence: 0
      }
    }))

    const test: ABTest = {
      id: testId,
      name: config.name,
      description: config.description,
      variants: testVariants,
      status: 'running',
      startDate: new Date(),
      confidenceLevel: config.confidenceLevel,
      minimumSampleSize: config.minimumSampleSize,
      currentSampleSize: 0
    }

    this.activeTests.set(testId, test)
    
    return testId
  }

  /**
   * Get variant for user (with consistent assignment)
   */
  getVariantForUser(testId: string, userId: string, userAttributes?: UserAttributes): ABTestVariant | null {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'running') {
      return null
    }

    // Check if user is already assigned to a variant
    const userTests = this.userAssignments.get(userId) || {}
    if (userTests[testId]) {
      const variantId = userTests[testId]
      return test.variants.find(v => v.id === variantId) || null
    }

    // Check audience targeting
    if (userAttributes && !this.matchesAudience(test, userAttributes)) {
      return null
    }

    // Assign user to variant based on hash and traffic split
    const variant = this.assignUserToVariant(test, userId)
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, {})
    }
    this.userAssignments.get(userId)![testId] = variant.id

    return variant
  }

  /**
   * Record impression for test variant
   */
  recordImpression(testId: string, variantId: string, userId: string): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    const variant = test.variants.find(v => v.id === variantId)
    if (!variant) return

    variant.performance.impressions++
    test.currentSampleSize++

    this.updateTestStatistics(testId)
  }

  /**
   * Record conversion for test variant
   */
  recordConversion(
    testId: string, 
    variantId: string, 
    userId: string, 
    value?: number
  ): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    const variant = test.variants.find(v => v.id === variantId)
    if (!variant) return

    variant.performance.conversions++
    variant.performance.conversionRate = variant.performance.conversions / variant.performance.impressions

    this.updateTestStatistics(testId)
  }

  /**
   * Get test results and analysis
   */
  getTestResults(testId: string): TestResult | null {
    const test = this.activeTests.get(testId)
    if (!test) return null

    const control = test.variants.find(v => v.isControl)
    if (!control) return null

    const treatments = test.variants.filter(v => !v.isControl)
    
    // Calculate statistical significance for each treatment vs control
    const variantAnalysis = treatments.map(treatment => {
      const significance = this.calculateStatisticalSignificance(
        control.performance,
        treatment.performance,
        test.confidenceLevel
      )
      
      const lift = control.performance.conversionRate > 0 
        ? ((treatment.performance.conversionRate - control.performance.conversionRate) / control.performance.conversionRate) * 100
        : 0

      return {
        variantId: treatment.id,
        significance: significance.isSignificant,
        confidence: significance.confidence,
        pValue: significance.pValue,
        lift,
        conversionRate: treatment.performance.conversionRate
      }
    })

    // Determine winning variant
    const significantWinners = variantAnalysis.filter(v => 
      v.significance && v.lift > 0 && v.confidence >= test.confidenceLevel
    )
    
    const winningVariant = significantWinners.length > 0
      ? significantWinners.reduce((best, current) => 
          current.lift > best.lift ? current : best
        )
      : null

    // Generate recommendations
    const recommendations = this.generateRecommendations(test, variantAnalysis)

    const result: TestResult = {
      testId,
      status: this.determineTestStatus(test, variantAnalysis),
      winningVariant: winningVariant?.variantId,
      liftPercentage: winningVariant?.lift,
      confidence: winningVariant?.confidence || 0,
      pValue: winningVariant?.pValue,
      sampleSizes: test.variants.reduce((acc, v) => {
        acc[v.id] = v.performance.impressions
        return acc
      }, {} as Record<string, number>),
      conversionRates: test.variants.reduce((acc, v) => {
        acc[v.id] = v.performance.conversionRate
        return acc
      }, {} as Record<string, number>),
      significance: winningVariant?.significance || false,
      recommendations,
      startDate: test.startDate,
      endDate: test.endDate,
      duration: test.endDate 
        ? Math.floor((test.endDate.getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((new Date().getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    this.testResults.set(testId, result)
    return result
  }

  /**
   * Stop a running test
   */
  stopTest(testId: string, reason?: string): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    test.status = 'stopped'
    test.endDate = new Date()

    // Generate final results
    this.getTestResults(testId)
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'running')
  }

  /**
   * Get test performance summary
   */
  getTestPerformanceSummary(testId: string): VariantPerformance[] {
    const test = this.activeTests.get(testId)
    if (!test) return []

    return test.variants.map(variant => {
      const control = test.variants.find(v => v.isControl)
      const lift = control && control.performance.conversionRate > 0
        ? ((variant.performance.conversionRate - control.performance.conversionRate) / control.performance.conversionRate) * 100
        : 0

      return {
        variantId: variant.id,
        impressions: variant.performance.impressions,
        conversions: variant.performance.conversions,
        conversionRate: variant.performance.conversionRate,
        confidence: variant.performance.confidence,
        lift: variant.isControl ? 0 : lift,
        isWinner: false // Will be determined by statistical analysis
      }
    })
  }

  /**
   * Private helper methods
   */

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private assignUserToVariant(test: ABTest, userId: string): ABTestVariant {
    // Create consistent hash for user
    const hash = this.hashString(userId + test.id)
    const percentage = hash % 100

    // Assign based on traffic split
    let cumulative = 0
    for (const variant of test.variants) {
      cumulative += variant.weight
      if (percentage < cumulative) {
        return variant
      }
    }

    // Fallback to control
    return test.variants.find(v => v.isControl) || test.variants[0]
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private matchesAudience(test: ABTest, userAttributes: UserAttributes): boolean {
    // Implement audience targeting logic
    // This is a simplified version - expand based on needs
    return true
  }

  private updateTestStatistics(testId: string): void {
    const test = this.activeTests.get(testId)
    if (!test) return

    const control = test.variants.find(v => v.isControl)
    if (!control) return

    // Update confidence for each treatment variant
    test.variants.filter(v => !v.isControl).forEach(treatment => {
      if (treatment.performance.impressions >= 100 && control.performance.impressions >= 100) {
        const significance = this.calculateStatisticalSignificance(
          control.performance,
          treatment.performance,
          test.confidenceLevel
        )
        treatment.performance.confidence = significance.confidence
      }
    })

    // Check if test should be completed
    if (test.currentSampleSize >= test.minimumSampleSize) {
      const hasSignificantResult = test.variants.some(v => 
        !v.isControl && v.performance.confidence >= test.confidenceLevel
      )

      if (hasSignificantResult) {
        test.status = 'completed'
        test.endDate = new Date()
      }
    }
  }

  private calculateStatisticalSignificance(
    control: ABTestVariant['performance'],
    treatment: ABTestVariant['performance'],
    confidenceLevel: number
  ): { isSignificant: boolean; confidence: number; pValue: number } {
    // Simplified statistical significance calculation
    // In production, use proper statistical libraries
    
    const n1 = control.impressions
    const n2 = treatment.impressions
    const p1 = control.conversionRate
    const p2 = treatment.conversionRate

    if (n1 < 30 || n2 < 30) {
      return { isSignificant: false, confidence: 0, pValue: 1 }
    }

    // Pooled probability
    const pPool = (control.conversions + treatment.conversions) / (n1 + n2)
    
    // Standard error
    const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2))
    
    if (se === 0) {
      return { isSignificant: false, confidence: 0, pValue: 1 }
    }

    // Z-score
    const z = Math.abs(p2 - p1) / se
    
    // Convert to confidence level (simplified)
    const confidence = Math.min(99, Math.max(0, (1 - Math.exp(-z)) * 100))
    
    // P-value approximation
    const pValue = Math.max(0.001, 2 * (1 - this.normalCDF(Math.abs(z))))
    
    const isSignificant = confidence >= confidenceLevel

    return { isSignificant, confidence, pValue }
  }

  private normalCDF(x: number): number {
    // Simplified normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  private erf(x: number): number {
    // Simplified error function approximation
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  private determineTestStatus(test: ABTest, analysis: any[]): TestResult['status'] {
    if (test.status === 'stopped') return 'stopped'

    const hasSignificantResult = analysis.some(a => a.significance)
    
    if (hasSignificantResult && test.currentSampleSize >= test.minimumSampleSize) {
      return 'completed'
    }

    // Check if test has been running too long without results
    const daysSinceStart = (new Date().getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceStart > 30 && !hasSignificantResult) {
      return 'inconclusive'
    }

    return 'running'
  }

  private generateRecommendations(test: ABTest, analysis: any[]): string[] {
    const recommendations: string[] = []

    const significantWinners = analysis.filter(a => a.significance && a.lift > 0)
    
    if (significantWinners.length > 0) {
      const bestWinner = significantWinners.reduce((best, current) => 
        current.lift > best.lift ? current : best
      )
      recommendations.push(`Implement variant ${bestWinner.variantId} - shows ${bestWinner.lift.toFixed(1)}% improvement`)
    } else if (test.currentSampleSize < test.minimumSampleSize) {
      recommendations.push('Continue test - sample size too small for conclusive results')
    } else {
      recommendations.push('No significant difference found - consider testing more dramatic variations')
    }

    // Check for low conversion rates
    const avgConversion = analysis.reduce((sum, a) => sum + a.conversionRate, 0) / analysis.length
    if (avgConversion < 0.02) {
      recommendations.push('Consider improving overall conversion optimization before testing variations')
    }

    // Check for high variance
    const conversionRates = analysis.map(a => a.conversionRate)
    const variance = this.calculateVariance(conversionRates)
    if (variance > 0.001) {
      recommendations.push('High variance detected - consider segmenting audience for more targeted tests')
    }

    return recommendations
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }
}

// Test configuration templates for common scenarios
export const testTemplates: Record<string, Partial<TestConfig>> = {
  headline_test: {
    name: 'Headline Variation Test',
    description: 'Test different headline approaches for conversion optimization',
    successMetric: 'conversion_rate',
    trafficSplit: [50, 50],
    minimumSampleSize: 1000,
    confidenceLevel: 95,
    maxDuration: 14
  },

  cta_test: {
    name: 'CTA Button Test',
    description: 'Test different call-to-action button copy and styles',
    successMetric: 'click_through_rate',
    trafficSplit: [33, 33, 34],
    minimumSampleSize: 1500,
    confidenceLevel: 95,
    maxDuration: 7
  },

  value_prop_test: {
    name: 'Value Proposition Test',
    description: 'Test different value proposition messaging approaches',
    successMetric: 'conversion_rate',
    trafficSplit: [25, 25, 25, 25],
    minimumSampleSize: 2000,
    confidenceLevel: 95,
    maxDuration: 21
  },

  industry_messaging_test: {
    name: 'Industry-Specific Messaging Test',
    description: 'Test industry-specific vs generic messaging',
    successMetric: 'conversion_rate',
    trafficSplit: [50, 50],
    minimumSampleSize: 800,
    confidenceLevel: 90,
    maxDuration: 14
  },

  platform_messaging_test: {
    name: 'Platform-Specific Messaging Test',
    description: 'Test platform-specific vs generic messaging',
    successMetric: 'conversion_rate',
    trafficSplit: [50, 50],
    minimumSampleSize: 600,
    confidenceLevel: 90,
    maxDuration: 10
  }
}

// Singleton instance
export const abTestingFramework = new ABTestingFramework()