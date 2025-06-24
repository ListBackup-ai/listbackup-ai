/**
 * Conversion Optimization Copy Library
 * Team 7: Sales Copy & Content Variations - Subtask 8
 * 
 * Landing page headlines with high conversion potential, form field labels that reduce friction,
 * error messages that guide users positively, confirmation and success messaging, retention and upsell messaging
 */

import { ContentVariation } from './content-manager'

export interface ConversionElement {
  id: string
  type: 'landing_headline' | 'form_label' | 'error_message' | 'success_message' | 'microcopy' | 'loading_message'
  context: 'signup' | 'pricing' | 'demo' | 'trial' | 'onboarding' | 'upgrade' | 'retention'
  content: string
  purpose: string
  psychologyPrinciple?: string
  frictionLevel: 'low' | 'medium' | 'high'
  conversionImpact: 'high' | 'medium' | 'low'
  testingNotes?: string
}

export interface FormOptimization {
  fieldType: 'email' | 'password' | 'name' | 'company' | 'phone' | 'credit_card' | 'address'
  optimizedLabel: string
  placeholder: string
  helpText?: string
  errorMessage: string
  successMessage: string
  validationRules: string[]
  frictionReduction: string[]
}

export interface ConversionFlow {
  stage: string
  objective: string
  barriers: string[]
  optimizations: string[]
  copyElements: ConversionElement[]
  successMetrics: string[]
}

// High-Converting Landing Page Headlines
export const landingPageHeadlines: ConversionElement[] = [
  {
    id: 'landing_headline_1',
    type: 'landing_headline',
    context: 'signup',
    content: 'Get Started in 60 Seconds - No Credit Card Required',
    purpose: 'Reduce barrier to entry with time promise and no-risk trial',
    psychologyPrinciple: 'Risk Reversal + Time Constraint',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test 60 seconds vs 2 minutes vs instant'
  },
  {
    id: 'landing_headline_2',
    type: 'landing_headline',
    context: 'pricing',
    content: 'Join 10,000+ Businesses Already Protected',
    purpose: 'Social proof to overcome decision paralysis',
    psychologyPrinciple: 'Social Proof + Bandwagon Effect',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test specific numbers vs rounded numbers'
  },
  {
    id: 'landing_headline_3',
    type: 'landing_headline',
    context: 'demo',
    content: 'See Your Data Protected Live in 3 Minutes',
    purpose: 'Specific time commitment reduces hesitation',
    psychologyPrinciple: 'Specificity + Time Constraint',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test different time commitments'
  },
  {
    id: 'landing_headline_4',
    type: 'landing_headline',
    context: 'trial',
    content: 'Start Your Free Trial - Upgrade Only When You\'re Ready',
    purpose: 'Removes pressure and commitment anxiety',
    psychologyPrinciple: 'Control + No Pressure',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test with/without upgrade mention'
  },
  {
    id: 'landing_headline_5',
    type: 'landing_headline',
    context: 'signup',
    content: 'Your First Backup Starts in Under 5 Minutes',
    purpose: 'Immediate value promise with specific timeframe',
    psychologyPrinciple: 'Immediate Gratification + Specificity',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test time variations and value promises'
  }
]

// Form Field Optimizations
export const formOptimizations: FormOptimization[] = [
  {
    fieldType: 'email',
    optimizedLabel: 'Email Address',
    placeholder: 'your@company.com',
    helpText: 'We\'ll send your login details here',
    errorMessage: 'Please enter a valid email address so we can send you access',
    successMessage: 'Perfect! We\'ll send your access details here',
    validationRules: ['Valid email format', 'No disposable emails for trials'],
    frictionReduction: [
      'Use business email placeholder',
      'Positive error messaging',
      'Clear purpose explanation'
    ]
  },
  {
    fieldType: 'password',
    optimizedLabel: 'Create Password',
    placeholder: '8+ characters with mix of letters & numbers',
    helpText: 'Must be at least 8 characters',
    errorMessage: 'Password needs at least 8 characters for security',
    successMessage: 'Strong password created!',
    validationRules: ['Minimum 8 characters', 'No common passwords'],
    frictionReduction: [
      'Show requirements upfront',
      'Positive reinforcement',
      'Security reasoning'
    ]
  },
  {
    fieldType: 'name',
    optimizedLabel: 'Full Name',
    placeholder: 'Your full name',
    helpText: 'How should we address you?',
    errorMessage: 'Please tell us your name so we can personalize your experience',
    successMessage: 'Nice to meet you!',
    validationRules: ['Minimum 2 characters', 'No special characters'],
    frictionReduction: [
      'Explain personalization benefit',
      'Friendly tone',
      'Personal connection'
    ]
  },
  {
    fieldType: 'company',
    optimizedLabel: 'Company Name',
    placeholder: 'Acme Corp',
    helpText: 'We\'ll customize your dashboard for your business',
    errorMessage: 'Company name helps us set up your workspace properly',
    successMessage: 'We\'ll get your company workspace ready!',
    validationRules: ['Minimum 2 characters'],
    frictionReduction: [
      'Explain customization benefit',
      'Business-focused messaging',
      'Value explanation'
    ]
  },
  {
    fieldType: 'phone',
    optimizedLabel: 'Phone Number (Optional)',
    placeholder: '(555) 123-4567',
    helpText: 'For urgent security alerts only',
    errorMessage: 'Please enter a valid phone number for security notifications',
    successMessage: 'We\'ve got your emergency contact info',
    validationRules: ['Valid phone format', 'US/International format'],
    frictionReduction: [
      'Mark as optional',
      'Explain limited use',
      'Security benefit focus'
    ]
  }
]

// Positive Error Messages
export const errorMessages: ConversionElement[] = [
  {
    id: 'error_email_invalid',
    type: 'error_message',
    context: 'signup',
    content: 'Almost there! Please enter a valid email so we can send your login details',
    purpose: 'Guide user positively while explaining benefit',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test encouragement vs direct instruction'
  },
  {
    id: 'error_password_weak',
    type: 'error_message',
    context: 'signup',
    content: 'Let\'s make that password a bit stronger - try adding a number or symbol',
    purpose: 'Helpful suggestion rather than criticism',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test specific suggestions vs general requirements'
  },
  {
    id: 'error_payment_failed',
    type: 'error_message',
    context: 'upgrade',
    content: 'Payment didn\'t go through - let\'s try a different card or contact your bank',
    purpose: 'Provide solution options to reduce abandonment',
    frictionLevel: 'medium',
    conversionImpact: 'high',
    testingNotes: 'Test different solution suggestions'
  },
  {
    id: 'error_connection_failed',
    type: 'error_message',
    context: 'onboarding',
    content: 'Connection hiccup! Click retry or check your internet connection',
    purpose: 'Minimize frustration with casual tone and clear action',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test technical vs casual language'
  },
  {
    id: 'error_session_expired',
    type: 'error_message',
    context: 'trial',
    content: 'For security, we logged you out. Just click here to get back in quickly',
    purpose: 'Explain reason and provide easy recovery',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test explanation vs simple action'
  }
]

// Success and Confirmation Messages
export const successMessages: ConversionElement[] = [
  {
    id: 'success_signup_complete',
    type: 'success_message',
    context: 'signup',
    content: 'Welcome aboard! Check your email for login details - your dashboard is ready',
    purpose: 'Celebration + clear next steps + value reinforcement',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test celebration level and next step clarity'
  },
  {
    id: 'success_payment_complete',
    type: 'success_message',
    context: 'upgrade',
    content: 'Payment successful! Your enhanced protection is now active',
    purpose: 'Confirm transaction + immediate value delivery',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test value confirmation vs simple confirmation'
  },
  {
    id: 'success_integration_connected',
    type: 'success_message',
    context: 'onboarding',
    content: 'Connected! Your data is now being protected automatically',
    purpose: 'Immediate value confirmation + peace of mind',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test immediate vs ongoing benefit language'
  },
  {
    id: 'success_backup_started',
    type: 'success_message',
    context: 'onboarding',
    content: 'First backup in progress! You\'ll never lose this data again',
    purpose: 'Progress indicator + emotional benefit',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test emotional vs technical messaging'
  },
  {
    id: 'success_trial_extended',
    type: 'success_message',
    context: 'retention',
    content: 'Trial extended! Continue exploring - upgrade whenever you\'re ready',
    purpose: 'Remove pressure while maintaining engagement',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test pressure vs no-pressure messaging'
  }
]

// Microcopy for Friction Reduction
export const microcopy: ConversionElement[] = [
  {
    id: 'microcopy_no_spam',
    type: 'microcopy',
    context: 'signup',
    content: 'No spam, ever. Unsubscribe anytime.',
    purpose: 'Address email privacy concerns',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test placement and wording variations'
  },
  {
    id: 'microcopy_secure_payment',
    type: 'microcopy',
    context: 'pricing',
    content: '🔒 SSL secured • Cancel anytime • 30-day guarantee',
    purpose: 'Address payment security and commitment concerns',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test with/without emoji and order of assurances'
  },
  {
    id: 'microcopy_setup_time',
    type: 'microcopy',
    context: 'demo',
    content: 'Setup takes 2 minutes • No technical knowledge required',
    purpose: 'Address time and complexity concerns',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test different time estimates and skill requirements'
  },
  {
    id: 'microcopy_data_privacy',
    type: 'microcopy',
    context: 'signup',
    content: 'Your data stays private • We never sell or share information',
    purpose: 'Address data privacy concerns',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test specific vs general privacy statements'
  },
  {
    id: 'microcopy_support_available',
    type: 'microcopy',
    context: 'trial',
    content: 'Questions? Our team responds in under 2 hours',
    purpose: 'Provide support confidence',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test response time promises and contact methods'
  }
]

// Loading and Processing Messages
export const loadingMessages: ConversionElement[] = [
  {
    id: 'loading_creating_account',
    type: 'loading_message',
    context: 'signup',
    content: 'Creating your secure account...',
    purpose: 'Set expectations during account creation',
    frictionLevel: 'low',
    conversionImpact: 'low',
    testingNotes: 'Test progress indication vs simple message'
  },
  {
    id: 'loading_connecting_data',
    type: 'loading_message',
    context: 'onboarding',
    content: 'Connecting to your data sources... This may take up to 30 seconds',
    purpose: 'Set realistic time expectations',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test time estimates and progress bars'
  },
  {
    id: 'loading_first_backup',
    type: 'loading_message',
    context: 'onboarding',
    content: 'Starting your first backup... Your data will be protected in moments',
    purpose: 'Build anticipation for value delivery',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test value promise vs simple status'
  },
  {
    id: 'loading_analyzing_data',
    type: 'loading_message',
    context: 'demo',
    content: 'Analyzing your data security... Preparing your personalized report',
    purpose: 'Create value anticipation during processing',
    frictionLevel: 'low',
    conversionImpact: 'medium',
    testingNotes: 'Test personalization mention vs generic message'
  },
  {
    id: 'loading_payment_processing',
    type: 'loading_message',
    context: 'upgrade',
    content: 'Processing your payment securely... Almost done!',
    purpose: 'Reassure about security and progress',
    frictionLevel: 'low',
    conversionImpact: 'high',
    testingNotes: 'Test security emphasis vs speed emphasis'
  }
]

// Conversion Flow Optimization
export const conversionFlows: ConversionFlow[] = [
  {
    stage: 'Landing Page to Signup',
    objective: 'Convert visitors to trial users',
    barriers: [
      'Trust concerns about data security',
      'Unclear value proposition',
      'Friction in signup process',
      'Commitment anxiety'
    ],
    optimizations: [
      'Social proof prominently displayed',
      'Clear value proposition with specifics',
      'Minimal signup form (email + password only)',
      'No credit card required messaging'
    ],
    copyElements: [
      {
        id: 'signup_flow_headline',
        type: 'landing_headline',
        context: 'signup',
        content: 'Start Your Free Trial - No Credit Card Required',
        purpose: 'Remove barrier and encourage trial',
        frictionLevel: 'low',
        conversionImpact: 'high'
      }
    ],
    successMetrics: ['Signup conversion rate', 'Form completion rate', 'Email verification rate']
  },
  {
    stage: 'Trial to Paid Conversion',
    objective: 'Convert trial users to paying customers',
    barriers: [
      'Haven\'t experienced full value',
      'Price sensitivity',
      'Feature uncertainty',
      'Timing concerns'
    ],
    optimizations: [
      'Progressive value delivery during trial',
      'Clear pricing with value justification',
      'Feature demonstrations and tutorials',
      'Flexible upgrade timing'
    ],
    copyElements: [
      {
        id: 'upgrade_flow_headline',
        type: 'landing_headline',
        context: 'upgrade',
        content: 'Upgrade to Keep Your Data Protected',
        purpose: 'Create urgency without pressure',
        frictionLevel: 'medium',
        conversionImpact: 'high'
      }
    ],
    successMetrics: ['Trial to paid conversion', 'Upgrade timing', 'Payment completion rate']
  },
  {
    stage: 'Onboarding Completion',
    objective: 'Get users to complete setup and see value',
    barriers: [
      'Complex setup process',
      'Technical integration challenges',
      'Unclear next steps',
      'Value not immediately obvious'
    ],
    optimizations: [
      'Step-by-step guided onboarding',
      'One-click integration options',
      'Clear progress indicators',
      'Immediate value demonstration'
    ],
    copyElements: [
      {
        id: 'onboarding_progress',
        type: 'microcopy',
        context: 'onboarding',
        content: 'Step 2 of 3 - Almost done!',
        purpose: 'Show progress and encourage completion',
        frictionLevel: 'low',
        conversionImpact: 'medium'
      }
    ],
    successMetrics: ['Onboarding completion rate', 'Time to first value', 'Integration success rate']
  }
]

// Retention and Upsell Messaging
export const retentionUpsellMessages = {
  trialExpiring: [
    {
      subject: 'Your trial ends tomorrow - keep your protection active',
      message: 'Don\'t lose the peace of mind you\'ve gained. Upgrade now to keep your data protected.',
      cta: 'Continue My Protection',
      urgency: 'high',
      tone: 'helpful_reminder'
    },
    {
      subject: 'Love your data protection? Make it permanent',
      message: 'You\'ve experienced the confidence that comes with bulletproof data protection. Keep it going.',
      cta: 'Make It Permanent',
      urgency: 'medium',
      tone: 'positive_reinforcement'
    }
  ],
  
  featureDiscovery: [
    {
      trigger: 'User hasn\'t used advanced features',
      message: 'Did you know you can also backup your email campaigns and customer data?',
      cta: 'Explore All Features',
      value: 'Discover hidden protection opportunities'
    },
    {
      trigger: 'User has basic plan',
      message: 'Your business is growing - your data protection should grow with it.',
      cta: 'See Pro Features',
      value: 'Advanced features for growing businesses'
    }
  ],
  
  valueReinforcement: [
    'Your data has been safely backed up 47 times this month',
    'We\'ve prevented 3 potential data loss incidents for you',
    'Your business continuity score: 98% - excellent protection level',
    'You\'re in the top 10% of data-protected businesses'
  ],
  
  winBackCampaign: [
    {
      subject: 'Your data is at risk - let\'s fix that',
      message: 'Since canceling, your data has been unprotected. One system failure could be devastating.',
      cta: 'Restore Protection',
      urgency: 'high',
      emotion: 'fear_of_loss'
    },
    {
      subject: 'We miss protecting your business',
      message: 'Come back and get 50% off your first month. Your data deserves protection.',
      cta: 'Get 50% Off',
      urgency: 'medium',
      emotion: 'value_incentive'
    }
  ]
}

// Generate conversion optimization content variations
export function generateConversionOptimizationVariations(): ContentVariation[] {
  const variations: ContentVariation[] = []

  // Landing page headlines
  landingPageHeadlines.forEach((element, index) => {
    variations.push({
      id: `conversion_${element.id}`,
      name: `Conversion - ${element.context} - ${element.id}`,
      content: element.content,
      type: 'headline',
      category: 'value_proposition',
      isActive: true,
      priority: element.conversionImpact === 'high' ? 10 : element.conversionImpact === 'medium' ? 8 : 6,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })

  // Success messages
  successMessages.forEach((element, index) => {
    variations.push({
      id: `conversion_${element.id}`,
      name: `Conversion - ${element.context} - ${element.id}`,
      content: element.content,
      type: 'description',
      category: 'value_proposition',
      isActive: true,
      priority: element.conversionImpact === 'high' ? 9 : element.conversionImpact === 'medium' ? 7 : 5,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })

  // Microcopy as benefits
  microcopy.forEach((element, index) => {
    variations.push({
      id: `conversion_${element.id}`,
      name: `Conversion - ${element.context} - ${element.id}`,
      content: element.content,
      type: 'benefits',
      category: 'trust_building',
      isActive: true,
      priority: element.conversionImpact === 'high' ? 8 : element.conversionImpact === 'medium' ? 6 : 4,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })

  return variations
}

// Conversion optimization utility functions
export class ConversionOptimizer {
  static getOptimizedFormLabels(context: string): FormOptimization[] {
    return formOptimizations.filter(form => 
      // Return all optimizations - can be filtered by context if needed
      true
    )
  }

  static getErrorMessage(fieldType: string, context: string): string {
    const field = formOptimizations.find(f => f.fieldType === fieldType as any)
    return field?.errorMessage || 'Please check this field and try again'
  }

  static getSuccessMessage(context: string): string {
    const message = successMessages.find(m => m.context === context as any)
    return message?.content || 'Success! Your request has been processed.'
  }

  static getMicrocopy(context: string, purpose: string): string[] {
    return microcopy
      .filter(m => m.context === context as any)
      .map(m => m.content)
  }

  static getLoadingMessage(context: string): string {
    const message = loadingMessages.find(m => m.context === context as any)
    return message?.content || 'Processing...'
  }

  static getRetentionMessage(scenario: string): any {
    switch (scenario) {
      case 'trial_expiring':
        return retentionUpsellMessages.trialExpiring[0]
      case 'feature_discovery':
        return retentionUpsellMessages.featureDiscovery[0]
      case 'win_back':
        return retentionUpsellMessages.winBackCampaign[0]
      default:
        return null
    }
  }
}

// A/B testing scenarios for conversion optimization
export const conversionTestingScenarios = [
  {
    name: 'Signup Form Length Test',
    description: 'Test minimal vs comprehensive signup forms',
    variants: [
      'Email + Password only',
      'Email + Password + Name',
      'Email + Password + Name + Company'
    ],
    hypothesis: 'Shorter forms will have higher completion rates but potentially lower qualification',
    metrics: ['Form completion rate', 'Trial activation rate', 'Trial to paid conversion']
  },
  {
    name: 'Error Message Tone Test',
    description: 'Test friendly vs direct error messaging',
    variants: [
      'Friendly/encouraging tone',
      'Direct/instructional tone',
      'Technical/precise tone'
    ],
    hypothesis: 'Friendly tone will reduce form abandonment after errors',
    metrics: ['Error recovery rate', 'Form completion after error', 'User satisfaction']
  },
  {
    name: 'Loading Message Test',
    description: 'Test different loading message strategies',
    variants: [
      'Simple progress indicator',
      'Value-building messages',
      'Time estimates with progress'
    ],
    hypothesis: 'Value-building messages will reduce abandonment during loading',
    metrics: ['Process completion rate', 'Abandonment during loading', 'Perceived wait time']
  }
]