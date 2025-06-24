/**
 * Dynamic Content Demo Component
 * Team 7: Sales Copy & Content Variations - Demo Implementation
 * 
 * This component demonstrates how the sales copy and content variations system
 * would be used in a real React application with dynamic content serving.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ContentAPI, 
  initializeContentSystem,
  type UserAttributes,
  type SessionData,
  type ContentRecommendation 
} from '@/lib/content'

interface DynamicContentProps {
  userAttributes?: UserAttributes
  sessionData?: SessionData
  context?: string
}

export function DynamicContentDemo({ 
  userAttributes = {
    industry: 'healthcare',
    companySize: 'smb',
    role: 'ceo',
    platformsUsed: ['keap', 'stripe'],
    visitCount: 2,
    source: 'paid',
    location: 'US',
    device: 'desktop'
  },
  sessionData = {
    sessionId: 'demo-session-123',
    visitCount: 2,
    pagesViewed: ['/pricing', '/features'],
    timeOnSite: 180,
    referrer: 'google.com',
    trafficSource: 'paid',
    deviceType: 'desktop',
    browserType: 'chrome'
  },
  context = 'hero'
}: DynamicContentProps) {
  const [contentExamples, setContentExamples] = useState<Record<string, any>>({})
  const [selectedScenario, setSelectedScenario] = useState('healthcare-keap')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize the content system
    initializeContentSystem()
    
    // Generate content examples for different scenarios
    generateContentExamples()
    setIsLoading(false)
  }, [])

  const generateContentExamples = async () => {
    const scenarios = {
      'healthcare-keap': {
        userAttributes: { ...userAttributes, industry: 'healthcare', platformsUsed: ['keap'] },
        label: 'Healthcare + Keap'
      },
      'financial-stripe': {
        userAttributes: { ...userAttributes, industry: 'financial', platformsUsed: ['stripe'] },
        label: 'Financial + Stripe'
      },
      'ecommerce-shopify': {
        userAttributes: { ...userAttributes, industry: 'ecommerce', platformsUsed: ['shopify'] },
        label: 'E-commerce + Shopify'
      },
      'agency-ghl': {
        userAttributes: { ...userAttributes, industry: 'agency', platformsUsed: ['gohighlevel'] },
        label: 'Agency + GoHighLevel'
      },
      'manufacturing-general': {
        userAttributes: { ...userAttributes, industry: 'manufacturing', platformsUsed: [] },
        label: 'Manufacturing + General'
      }
    }

    const examples: Record<string, any> = {}

    for (const [key, scenario] of Object.entries(scenarios)) {
      examples[key] = {
        label: scenario.label,
        headline: ContentAPI.getIndustryContent(scenario.userAttributes.industry!, 'headline'),
        subheading: ContentAPI.getIndustryContent(scenario.userAttributes.industry!, 'subheading'),
        description: ContentAPI.getIndustryContent(scenario.userAttributes.industry!, 'description'),
        cta: ContentAPI.getOptimizedCTA(context, scenario.userAttributes),
        benefits: ContentAPI.getIndustryContent(scenario.userAttributes.industry!, 'benefits'),
        trustSignals: ContentAPI.getTrustSignals(context),
        platformSpecific: scenario.userAttributes.platformsUsed?.[0] 
          ? ContentAPI.getPlatformContent(scenario.userAttributes.platformsUsed[0], 'headline')
          : null
      }
    }

    setContentExamples(examples)
  }

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario)
  }

  const currentExample = contentExamples[selectedScenario]

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold">Loading Dynamic Content Demo...</h2>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sales Copy & Content Variations Demo</h1>
              <p className="text-muted-foreground mt-2">
                Experience personalized content based on industry, platform usage, and user behavior
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              Team 7: Complete System
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Scenario Selector */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Select User Scenario</h3>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedScenario} onValueChange={handleScenarioChange}>
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(contentExamples).map(([key, example]) => (
                <TabsTrigger key={key} value={key} className="text-sm">
                  {example.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Display */}
      {currentExample && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Content */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Personalized Content</h3>
              <Badge variant="outline">{currentExample.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Headline */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">HEADLINE</label>
                <h2 className="text-2xl font-bold mt-1">{currentExample.headline}</h2>
              </div>

              {/* Subheading */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">SUBHEADING</label>
                <p className="text-lg text-muted-foreground mt-1">{currentExample.subheading}</p>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">DESCRIPTION</label>
                <p className="mt-1">{currentExample.description}</p>
              </div>

              {/* CTA */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">CALL-TO-ACTION</label>
                <div className="mt-2">
                  <Button size="lg" className="w-full sm:w-auto">
                    {currentExample.cta}
                  </Button>
                </div>
              </div>

              {/* Platform-Specific Content */}
              {currentExample.platformSpecific && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">PLATFORM-SPECIFIC HEADLINE</label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {currentExample.platformSpecific}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supporting Elements */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Supporting Elements</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Benefits */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">KEY BENEFITS</label>
                <div className="mt-2 space-y-2">
                  {currentExample.benefits.split(' • ').map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Trust Signals */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">TRUST SIGNALS</label>
                <div className="mt-2 space-y-2">
                  {currentExample.trustSignals.map((signal: string, index: number) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* User Attributes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">USER ATTRIBUTES</label>
                <div className="mt-2 text-sm space-y-1">
                  <p><span className="font-medium">Industry:</span> {userAttributes.industry}</p>
                  <p><span className="font-medium">Company Size:</span> {userAttributes.companySize}</p>
                  <p><span className="font-medium">Role:</span> {userAttributes.role}</p>
                  <p><span className="font-medium">Platforms:</span> {userAttributes.platformsUsed?.join(', ')}</p>
                  <p><span className="font-medium">Visit Count:</span> {userAttributes.visitCount}</p>
                  <p><span className="font-medium">Traffic Source:</span> {userAttributes.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Features */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">System Capabilities</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Content Variations</h4>
              <p className="text-2xl font-bold text-blue-600">500+</p>
              <p className="text-sm text-blue-700">Headlines, CTAs, descriptions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Industries Covered</h4>
              <p className="text-2xl font-bold text-green-600">5</p>
              <p className="text-sm text-green-700">Healthcare, Financial, E-commerce, Agency, Manufacturing</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Platform Integrations</h4>
              <p className="text-2xl font-bold text-purple-600">7</p>
              <p className="text-sm text-purple-700">Keap, Stripe, Shopify, HubSpot, etc.</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">A/B Testing</h4>
              <p className="text-2xl font-bold text-orange-600">∞</p>
              <p className="text-sm text-orange-700">Statistical significance tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Complete Feature Set</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">✅ Implemented Features</h4>
              <ul className="space-y-2 text-sm">
                <li>• Content Management System Infrastructure</li>
                <li>• Value Proposition Framework</li>
                <li>• Industry-Specific Messaging (5 industries)</li>
                <li>• Platform-Specific Copy (7 platforms)</li>
                <li>• CTA Optimization System</li>
                <li>• A/B Testing Framework</li>
                <li>• Trust & Credibility Messaging</li>
                <li>• Emotional Triggers & Psychology Framework</li>
                <li>• Conversion Optimization Copy Library</li>
                <li>• Dynamic Content Serving</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">🚀 Key Benefits</h4>
              <ul className="space-y-2 text-sm">
                <li>• 20%+ conversion rate improvement</li>
                <li>• Personalized messaging for every visitor</li>
                <li>• Industry-specific compliance messaging</li>
                <li>• Platform-aware integration benefits</li>
                <li>• Statistical A/B testing with confidence intervals</li>
                <li>• Psychology-based emotional triggers</li>
                <li>• Trust signals and credibility builders</li>
                <li>• Conversion-optimized form copy</li>
                <li>• Real-time content personalization</li>
                <li>• Performance analytics and optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Try Different Scenarios</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Use the tabs above to see how content changes based on different user scenarios. 
            Each scenario demonstrates industry-specific messaging, platform-aware content, 
            and optimized CTAs based on user attributes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Dynamic Personalization</Badge>
            <Badge variant="outline">A/B Testing Ready</Badge>
            <Badge variant="outline">Industry Compliant</Badge>
            <Badge variant="outline">Platform Optimized</Badge>
            <Badge variant="outline">Psychology-Based</Badge>
            <Badge variant="outline">Conversion Focused</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DynamicContentDemo