/**
 * Emotional Triggers and Psychology-Based Copy Framework
 * Team 7: Sales Copy & Content Variations - Subtask 7
 * 
 * Fear-of-loss messaging, achievement and success-oriented copy, belonging and community-focused messaging,
 * convenience and time-saving benefits, peace-of-mind and security-focused copy
 */

import { ContentVariation } from './content-manager'

export interface EmotionalTrigger {
  id: string
  name: string
  type: 'fear_of_loss' | 'achievement' | 'belonging' | 'convenience' | 'security' | 'curiosity' | 'urgency' | 'pride'
  description: string
  psychologyPrinciple: string
  targetEmotion: string
  effectiveness: 'high' | 'medium' | 'low'
  audienceFit: string[]
  messaging: {
    headlines: string[]
    subheadings: string[]
    descriptions: string[]
    benefits: string[]
    ctas: string[]
    urgencyPhrases: string[]
  }
}

export interface PsychologyFramework {
  principle: string
  description: string
  applicationMethod: string
  copyExamples: string[]
  effectiveness: number // 1-10 scale
  contexts: string[]
}

// Fear of Loss (Loss Aversion) - Most powerful psychological trigger
export const fearOfLossTrigger: EmotionalTrigger = {
  id: 'fear_of_loss',
  name: 'Fear of Loss',
  type: 'fear_of_loss',
  description: 'Leverages loss aversion psychology - people fear losing something more than they value gaining something',
  psychologyPrinciple: 'Loss Aversion (Kahneman & Tversky)',
  targetEmotion: 'Fear, anxiety, protection need',
  effectiveness: 'high',
  audienceFit: ['enterprise', 'smb', 'agency', 'healthcare', 'financial'],
  messaging: {
    headlines: [
      'Don\'t Let Data Loss Destroy Your Business',
      'Stop Gambling with Your Company\'s Future',
      'What Would Happen If You Lost Everything Tomorrow?',
      'Your Competitors Are One Data Breach Away from Winning',
      'Every Minute of Delay Increases Your Risk',
      'One System Failure Could Cost You Everything',
      'Don\'t Be the Next Data Loss Victim',
      'Protect What You\'ve Built Before It\'s Too Late'
    ],
    subheadings: [
      'Data loss isn\'t a matter of if, but when',
      'Your business reputation hangs by a digital thread',
      'Competitors are gaining while you\'re vulnerable',
      'Customer trust, once lost, is nearly impossible to recover',
      'Every day without protection is a day of unnecessary risk'
    ],
    descriptions: [
      'Every day you delay data protection, you\'re rolling the dice with your business\'s future. One system failure, one cyberattack, one human error could wipe out years of hard work and customer relationships.',
      'Your competitors are one data breach away from capturing your customers, your market share, and your revenue. Don\'t give them that opportunity by leaving your data unprotected.',
      'Data loss doesn\'t just mean lost files - it means lost customers, lost revenue, lost reputation, and potentially lost business. The average data breach costs companies $4.35 million.'
    ],
    benefits: [
      'Avoid devastating data loss that could destroy your business',
      'Prevent customers from fleeing to competitors after a breach',
      'Protect years of business relationships and customer trust',
      'Avoid regulatory fines that could reach millions of dollars',
      'Prevent revenue loss from downtime and system failures'
    ],
    ctas: [
      'Protect My Business Now',
      'Stop Data Loss Before It Happens',
      'Don\'t Risk It - Get Protected',
      'Secure My Future Today',
      'Prevent Disaster Now'
    ],
    urgencyPhrases: [
      'Every minute of delay increases your risk',
      'Don\'t wait until it\'s too late',
      'Your data is at risk right now',
      'Hackers don\'t wait for convenient times',
      'The next data breach could be yours'
    ]
  }
}

// Achievement and Success Orientation
export const achievementTrigger: EmotionalTrigger = {
  id: 'achievement',
  name: 'Achievement and Success',
  type: 'achievement',
  description: 'Appeals to desire for success, growth, and accomplishment',
  psychologyPrinciple: 'Achievement Motivation Theory',
  targetEmotion: 'Ambition, pride, accomplishment',
  effectiveness: 'high',
  audienceFit: ['startup', 'smb', 'agency', 'entrepreneur'],
  messaging: {
    headlines: [
      'Transform Your Business Into a Data-Driven Success Story',
      'Join the Elite Companies That Never Lose Data',
      'Achieve Enterprise-Level Success with Smart Data Protection',
      'Unlock Your Business Potential with Bulletproof Data',
      'Build the Business Empire You\'ve Always Envisioned',
      'Rise Above Competitors with Superior Data Intelligence',
      'Achieve What Others Only Dream Of',
      'Turn Your Vision Into Unstoppable Reality'
    ],
    subheadings: [
      'Data intelligence that separates winners from wannabes',
      'Success requires more than hope - it requires protection',
      'Elite businesses don\'t leave success to chance',
      'Transform data chaos into competitive advantage',
      'Build your empire on unshakeable foundations'
    ],
    descriptions: [
      'Successful businesses don\'t just hope their data stays safe - they ensure it. Join the ranks of elite companies that have built their success on bulletproof data protection and intelligent automation.',
      'Every successful business has one thing in common: they protect what they\'ve built. Transform your scattered data into a strategic asset that drives growth, efficiency, and competitive advantage.',
      'The difference between businesses that thrive and those that merely survive is how they handle their data. Build your success story on foundations that can\'t be shaken.'
    ],
    benefits: [
      'Build competitive advantages that others can\'t match',
      'Achieve enterprise-level capabilities at any size',
      'Transform data into your most valuable business asset',
      'Gain the confidence to scale without limits',
      'Join the ranks of industry leaders and innovators'
    ],
    ctas: [
      'Build My Success Story',
      'Achieve Elite Status',
      'Join the Winners',
      'Unlock My Potential',
      'Start My Transformation'
    ],
    urgencyPhrases: [
      'Success waits for no one',
      'Your competitors are building advantages now',
      'Today\'s leaders started yesterday',
      'The best time to build success is now',
      'Opportunity doesn\'t wait'
    ]
  }
}

// Belonging and Community
export const belongingTrigger: EmotionalTrigger = {
  id: 'belonging',
  name: 'Belonging and Community',
  type: 'belonging',
  description: 'Creates sense of community and belonging with successful peers',
  psychologyPrinciple: 'Social Identity Theory',
  targetEmotion: 'Acceptance, connection, status',
  effectiveness: 'medium',
  audienceFit: ['enterprise', 'agency', 'smb'],
  messaging: {
    headlines: [
      'Join 10,000+ Smart Businesses That Choose Security First',
      'You\'re in Good Company with Industry Leaders',
      'Welcome to the Community of Data-Protected Businesses',
      'Join the Elite Circle of Forward-Thinking Companies',
      'Become Part of the Smart Business Movement',
      'You Belong with Businesses That Take Data Seriously',
      'Join Your Peers in the Data Protection Revolution',
      'Smart Leaders Protect Smart - Just Like You'
    ],
    subheadings: [
      'Join the community of businesses that prioritize protection',
      'You\'re among peers who understand the value of data security',
      'Connect with like-minded leaders who refuse to take risks',
      'Be part of the movement transforming business data protection',
      'Join industry leaders who choose intelligence over chance'
    ],
    descriptions: [
      'You\'re not alone in understanding the critical importance of data protection. Join thousands of smart business leaders who refuse to gamble with their company\'s future and have chosen proactive protection.',
      'The most successful businesses in your industry are already here, protecting their data and building competitive advantages. Join the community of forward-thinking leaders who prioritize security.',
      'Smart leaders recognize smart solutions. That\'s why over 10,000 businesses have joined our community of data-protected companies, ensuring their success is built on solid foundations.'
    ],
    benefits: [
      'Connect with a community of security-conscious leaders',
      'Learn from peers who have solved similar challenges',
      'Access exclusive insights from industry experts',
      'Join discussions with fellow forward-thinking executives',
      'Participate in the future of business data protection'
    ],
    ctas: [
      'Join the Community',
      'Connect with Peers',
      'Join Smart Leaders',
      'Be Part of the Movement',
      'Join Your Industry Leaders'
    ],
    urgencyPhrases: [
      'Join the growing community',
      'Your peers are already here',
      'Don\'t be left behind',
      'Leaders are connecting now',
      'The community is waiting'
    ]
  }
}

// Convenience and Time-Saving
export const convenienceTrigger: EmotionalTrigger = {
  id: 'convenience',
  name: 'Convenience and Efficiency',
  type: 'convenience',
  description: 'Appeals to desire for simplicity, automation, and time savings',
  psychologyPrinciple: 'Cognitive Load Theory',
  targetEmotion: 'Relief, efficiency, simplicity',
  effectiveness: 'high',
  audienceFit: ['smb', 'startup', 'agency', 'busy_executives'],
  messaging: {
    headlines: [
      'Set It Once, Forget About Data Loss Forever',
      'Finally, Data Protection That Actually Works',
      'Stop Worrying About Data - We\'ve Got You Covered',
      'Data Protection So Simple, It Runs Itself',
      'Get Your Weekends Back with Automated Protection',
      'Never Think About Backups Again',
      'Peace of Mind in Just 5 Minutes',
      'The Last Data Protection Tool You\'ll Ever Need'
    ],
    subheadings: [
      'Setup once, protected forever - no ongoing maintenance required',
      'Intelligent automation that works while you sleep',
      'From complex problem to simple solution in minutes',
      'No technical expertise required - we handle everything',
      'Focus on growing your business, not managing backups'
    ],
    descriptions: [
      'Stop spending hours managing backups and worrying about data loss. Our intelligent system works 24/7 in the background, automatically protecting your data so you can focus on what really matters - growing your business.',
      'Finally, a data protection solution that doesn\'t require a technical degree to operate. Set it up once in under 5 minutes, and never worry about data loss again. It\'s that simple.',
      'Your time is too valuable to waste on complex backup procedures. Get enterprise-grade protection that runs itself, freeing you to focus on revenue-generating activities instead of IT headaches.'
    ],
    benefits: [
      'Save hours every week with complete automation',
      'Eliminate the stress and worry of manual data management',
      'Focus on growth instead of maintenance and troubleshooting',
      'Get enterprise results without enterprise complexity',
      'Reduce IT overhead while increasing data protection'
    ],
    ctas: [
      'Make My Life Easier',
      'Automate My Protection',
      'Save My Time',
      'Simplify My Business',
      'Get Peace of Mind'
    ],
    urgencyPhrases: [
      'Start saving time today',
      'Simplify your life now',
      'Automation starts immediately',
      'Relief is just minutes away',
      'Simplicity is waiting'
    ]
  }
}

// Security and Peace of Mind
export const securityTrigger: EmotionalTrigger = {
  id: 'security',
  name: 'Security and Peace of Mind',
  type: 'security',
  description: 'Provides emotional security and peace of mind',
  psychologyPrinciple: 'Security Motivation Theory',
  targetEmotion: 'Safety, confidence, calm',
  effectiveness: 'high',
  audienceFit: ['enterprise', 'healthcare', 'financial', 'conservative_buyers'],
  messaging: {
    headlines: [
      'Sleep Soundly Knowing Your Data Is Fortress-Protected',
      'Finally, Complete Peace of Mind for Your Business Data',
      'Your Data Fortress: Unbreachable, Unstoppable, Unworried',
      'Rest Easy with Bank-Level Data Protection',
      'Confidence That Comes from Bulletproof Security',
      'Never Lose Sleep Over Data Security Again',
      'The Security Blanket Your Business Deserves',
      'Absolute Confidence in Your Data Protection'
    ],
    subheadings: [
      'Rest assured with military-grade protection watching over your data',
      'Peace of mind comes from knowing you\'re completely protected',
      'Sleep well knowing your business is safe and secure',
      'Confidence that comes from enterprise-grade security',
      'The calm that comes from bulletproof data protection'
    ],
    descriptions: [
      'There\'s nothing quite like the peace of mind that comes from knowing your business data is completely secure. Our military-grade protection means you can focus on growth instead of worrying about security threats.',
      'Stop lying awake at night worrying about data breaches and system failures. Our comprehensive protection provides the emotional security that comes from knowing your business is bulletproof.',
      'Confidence is knowing that no matter what happens - system failures, cyberattacks, or human errors - your business data remains completely safe and instantly recoverable.'
    ],
    benefits: [
      'Sleep peacefully knowing your data is completely secure',
      'Gain confidence from military-grade protection systems',
      'Eliminate anxiety about data loss and security breaches',
      'Feel secure knowing experts are protecting your business',
      'Experience the calm that comes from bulletproof security'
    ],
    ctas: [
      'Get Peace of Mind',
      'Secure My Confidence',
      'Protect My Sleep',
      'Get Bulletproof Security',
      'Find My Calm'
    ],
    urgencyPhrases: [
      'Peace of mind is available now',
      'Security is just minutes away',
      'Confidence starts today',
      'Protection is waiting',
      'Your peace of mind matters'
    ]
  }
}

// Curiosity and Discovery
export const curiosityTrigger: EmotionalTrigger = {
  id: 'curiosity',
  name: 'Curiosity and Discovery',
  type: 'curiosity',
  description: 'Sparks curiosity and desire to discover hidden insights',
  psychologyPrinciple: 'Information Gap Theory',
  targetEmotion: 'Curiosity, intrigue, discovery',
  effectiveness: 'medium',
  audienceFit: ['data_curious', 'analysts', 'tech_savvy'],
  messaging: {
    headlines: [
      'Discover What Your Data Has Been Hiding',
      'The Hidden Insights Your Competitors Don\'t Want You to Find',
      'What Would You Discover with Perfect Data Visibility?',
      'Uncover the Intelligence Hidden in Your Business Data',
      'See Your Business Like Never Before',
      'The Data Secrets That Could Transform Your Business',
      'What Are You Missing in Your Data?',
      'Discover Your Hidden Business Potential'
    ],
    subheadings: [
      'Uncover insights that have been hiding in plain sight',
      'Discover patterns and opportunities you never knew existed',
      'See your business data in ways you never imagined',
      'Find the intelligence that drives breakthrough growth',
      'Explore the hidden potential in your business data'
    ],
    descriptions: [
      'Your business data contains hidden insights that could transform your operations, boost your revenue, and give you competitive advantages. But only if you can see them clearly and connect the dots.',
      'Most businesses are sitting on goldmines of data intelligence without even knowing it. Discover what insights are hiding in your systems and how they could revolutionize your decision-making.',
      'What would change about your business if you could see every pattern, every trend, and every opportunity hidden in your data? The discoveries waiting for you might surprise you.'
    ],
    benefits: [
      'Discover hidden patterns that reveal new opportunities',
      'Uncover insights that competitors can\'t see',
      'Find the intelligence needed for breakthrough growth',
      'Explore data connections that drive innovation',
      'See opportunities others miss completely'
    ],
    ctas: [
      'Discover My Insights',
      'Uncover Hidden Value',
      'Explore My Data',
      'Find My Opportunities',
      'See What\'s Hidden'
    ],
    urgencyPhrases: [
      'Discoveries are waiting',
      'Hidden insights await',
      'Your data secrets are ready',
      'Explore now before competitors do',
      'The mystery is about to be solved'
    ]
  }
}

// Psychology Principles Framework
export const psychologyPrinciples: PsychologyFramework[] = [
  {
    principle: 'Loss Aversion',
    description: 'People fear losing something more than they value gaining something equivalent',
    applicationMethod: 'Emphasize what customers risk losing without your solution',
    copyExamples: [
      'Don\'t lose years of customer data to one system failure',
      'Your competitors are one breach away from winning your customers',
      'Every day without protection risks everything you\'ve built'
    ],
    effectiveness: 9,
    contexts: ['hero', 'pricing', 'objection_handling']
  },
  {
    principle: 'Social Proof',
    description: 'People look to others\' behavior to guide their own decisions',
    applicationMethod: 'Show how many others have chosen your solution and their results',
    copyExamples: [
      'Join 10,000+ businesses that choose us for data protection',
      'Trusted by Fortune 500 companies and industry leaders',
      'See why smart businesses choose our solution'
    ],
    effectiveness: 8,
    contexts: ['testimonials', 'pricing', 'features']
  },
  {
    principle: 'Scarcity',
    description: 'Items appear more valuable when their availability is limited',
    applicationMethod: 'Create urgency through limited time offers or exclusive access',
    copyExamples: [
      'Limited spots available in our Enterprise Beta program',
      'Early bird pricing expires at the end of this month',
      'Only 50 custom integration slots available this quarter'
    ],
    effectiveness: 7,
    contexts: ['pricing', 'signup', 'special_offers']
  },
  {
    principle: 'Authority',
    description: 'People defer to experts and authority figures',
    applicationMethod: 'Showcase expertise, credentials, and industry recognition',
    copyExamples: [
      'Built by former Google and Microsoft security engineers',
      'Recommended by top cybersecurity experts',
      'Trusted by Fortune 500 security teams'
    ],
    effectiveness: 8,
    contexts: ['about', 'team', 'credibility']
  },
  {
    principle: 'Reciprocity',
    description: 'People feel obligated to return favors and give back',
    applicationMethod: 'Provide value upfront before asking for commitment',
    copyExamples: [
      'Get a free security assessment of your current data protection',
      'Download our comprehensive data protection guide',
      'Free 30-day trial with full enterprise features'
    ],
    effectiveness: 7,
    contexts: ['lead_magnets', 'trials', 'freemium']
  },
  {
    principle: 'Anchoring',
    description: 'People rely heavily on the first piece of information encountered',
    applicationMethod: 'Present high-value anchor before showing your actual price',
    copyExamples: [
      'Data breaches cost an average of $4.35 million - protect yourself for $99/month',
      'Enterprise security consultants charge $500/hour - get 24/7 protection for less',
      'The average cost of data loss is $150,000 - prevent it for $1,200/year'
    ],
    effectiveness: 6,
    contexts: ['pricing', 'value_prop', 'cost_comparison']
  }
]

// Generate emotional trigger content variations
export function generateEmotionalTriggerVariations(): ContentVariation[] {
  const variations: ContentVariation[] = []
  const triggers = [fearOfLossTrigger, achievementTrigger, belongingTrigger, convenienceTrigger, securityTrigger, curiosityTrigger]

  triggers.forEach(trigger => {
    // Headlines
    trigger.messaging.headlines.forEach((headline, index) => {
      variations.push({
        id: `emotion_${trigger.type}_headline_${index}`,
        name: `${trigger.name} - Headline ${index + 1}`,
        content: headline,
        type: 'headline',
        category: 'emotional_trigger',
        emotionTrigger: trigger.type,
        isActive: true,
        priority: trigger.effectiveness === 'high' ? 9 : 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    // Subheadings
    trigger.messaging.subheadings.forEach((subheading, index) => {
      variations.push({
        id: `emotion_${trigger.type}_subheading_${index}`,
        name: `${trigger.name} - Subheading ${index + 1}`,
        content: subheading,
        type: 'subheading',
        category: 'emotional_trigger',
        emotionTrigger: trigger.type,
        isActive: true,
        priority: trigger.effectiveness === 'high' ? 9 : 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    // Descriptions
    trigger.messaging.descriptions.forEach((description, index) => {
      variations.push({
        id: `emotion_${trigger.type}_description_${index}`,
        name: `${trigger.name} - Description ${index + 1}`,
        content: description,
        type: 'description',
        category: 'emotional_trigger',
        emotionTrigger: trigger.type,
        isActive: true,
        priority: trigger.effectiveness === 'high' ? 9 : 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    // Benefits
    variations.push({
      id: `emotion_${trigger.type}_benefits`,
      name: `${trigger.name} - Benefits`,
      content: trigger.messaging.benefits.join(' • '),
      type: 'benefits',
      category: 'emotional_trigger',
      emotionTrigger: trigger.type,
      isActive: true,
      priority: trigger.effectiveness === 'high' ? 10 : 8,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // CTAs
    trigger.messaging.ctas.forEach((cta, index) => {
      variations.push({
        id: `emotion_${trigger.type}_cta_${index}`,
        name: `${trigger.name} - CTA ${index + 1}`,
        content: cta,
        type: 'cta',
        category: 'emotional_trigger',
        emotionTrigger: trigger.type,
        isActive: true,
        priority: trigger.effectiveness === 'high' ? 9 : 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
  })

  return variations
}

// Emotional trigger recommendations by audience
export const emotionalTriggerRecommendations = {
  enterprise: ['security', 'achievement', 'authority'],
  smb: ['fear_of_loss', 'convenience', 'achievement'],
  startup: ['achievement', 'convenience', 'curiosity'],
  agency: ['fear_of_loss', 'belonging', 'achievement'],
  healthcare: ['security', 'fear_of_loss', 'compliance'],
  financial: ['security', 'fear_of_loss', 'authority'],
  ecommerce: ['fear_of_loss', 'achievement', 'convenience']
}

// Context-specific emotional trigger mapping
export const contextEmotionalMapping = {
  hero: ['fear_of_loss', 'achievement', 'security'],
  pricing: ['fear_of_loss', 'convenience', 'belonging'],
  features: ['curiosity', 'achievement', 'convenience'],
  testimonials: ['belonging', 'achievement', 'security'],
  objections: ['security', 'fear_of_loss', 'authority'],
  exit_intent: ['fear_of_loss', 'curiosity', 'urgency']
}