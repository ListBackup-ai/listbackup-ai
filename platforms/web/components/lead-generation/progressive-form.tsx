'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Building,
  Target,
  Download,
  Mail,
  Calendar,
  Gift,
  Star
} from 'lucide-react'

interface FormData {
  // Step 1: Basic Info
  email: string
  firstName: string
  lastName: string
  
  // Step 2: Company Info
  company: string
  jobTitle: string
  companySize: string
  industry: string
  
  // Step 3: Use Case
  currentPlatforms: string[]
  primaryUseCase: string
  urgency: string
  challenges: string
  
  // Step 4: Contact Preferences
  communicationPreference: string
  timeZone: string
  bestTimeToContact: string
  interests: string[]
}

interface FormStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  fields: string[]
  completionMessage: string
}

const formSteps: FormStep[] = [
  {
    id: 'basic',
    title: 'Get Started',
    description: 'Just your basic info to get started',
    icon: Users,
    fields: ['email', 'firstName', 'lastName'],
    completionMessage: 'Great! Let\'s learn about your business.'
  },
  {
    id: 'company',
    title: 'About Your Business',
    description: 'Help us understand your organization',
    icon: Building,
    fields: ['company', 'jobTitle', 'companySize', 'industry'],
    completionMessage: 'Perfect! Now tell us about your data needs.'
  },
  {
    id: 'usecase',
    title: 'Your Data Needs',
    description: 'What platforms and use cases matter most?',
    icon: Target,
    fields: ['currentPlatforms', 'primaryUseCase', 'urgency', 'challenges'],
    completionMessage: 'Excellent! How would you like us to follow up?'
  },
  {
    id: 'preferences',
    title: 'Stay Connected',
    description: 'Choose how you\'d like to hear from us',
    icon: Mail,
    fields: ['communicationPreference', 'timeZone', 'bestTimeToContact', 'interests'],
    completionMessage: 'All set! Check your email for next steps.'
  }
]

const platforms = [
  'Keap/Infusionsoft', 'Stripe', 'GoHighLevel', 'HubSpot', 'Salesforce', 'Mailchimp',
  'ActiveCampaign', 'Shopify', 'QuickBooks', 'Zendesk', 'Pipedrive', 'Other'
]

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Retail/E-commerce', 'Real Estate',
  'Marketing Agency', 'Consulting', 'Manufacturing', 'Education', 'Non-profit', 'Other'
]

const companySizes = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-1000 employees', '1000+ employees'
]

const useCases = [
  'Data backup & recovery', 'Compliance & auditing', 'Platform migration',
  'Business analytics', 'Disaster recovery', 'Data archiving'
]

const urgencyLevels = [
  'Researching options', 'Need solution in 30 days', 'Need solution ASAP', 'Just curious'
]

const interests = [
  'Product updates', 'Industry insights', 'Best practices', 'Case studies',
  'Webinars & events', 'Technical content'
]

interface ProgressiveFormProps {
  onComplete?: (data: FormData) => void
  leadMagnet?: {
    title: string
    description: string
    downloadUrl: string
  }
}

export function ProgressiveForm({ onComplete, leadMagnet }: ProgressiveFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    companySize: '',
    industry: '',
    currentPlatforms: [],
    primaryUseCase: '',
    urgency: '',
    challenges: '',
    communicationPreference: '',
    timeZone: '',
    bestTimeToContact: '',
    interests: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayToggle = (field: keyof FormData, value: string) => {
    const currentArray = formData[field] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    handleInputChange(field, newArray)
  }

  const validateStep = (stepIndex: number): boolean => {
    const step = formSteps[stepIndex]
    return step.fields.every(field => {
      const value = formData[field as keyof FormData]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value && value.toString().trim() !== ''
    })
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      onComplete?.(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    const step = formSteps[currentStep]
    
    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Welcome! Let's get started</h3>
              <p className="text-muted-foreground">
                {leadMagnet ? leadMagnet.description : 'Tell us a bit about yourself to personalize your experience.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  className="mt-2"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@company.com"
                className="mt-2"
              />
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">About Your Business</h3>
              <p className="text-muted-foreground">
                Help us understand your organization to provide better recommendations.
              </p>
            </div>
            
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., IT Director, CEO, Marketing Manager"
                className="mt-2"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <select
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select company size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 'usecase':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Your Data Needs</h3>
              <p className="text-muted-foreground">
                Tell us about your current platforms and what you're looking to achieve.
              </p>
            </div>
            
            <div>
              <Label>Which platforms do you currently use? *</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {platforms.map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handleArrayToggle('currentPlatforms', platform)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      formData.currentPlatforms.includes(platform)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="primaryUseCase">Primary Use Case *</Label>
              <select
                id="primaryUseCase"
                value={formData.primaryUseCase}
                onChange={(e) => handleInputChange('primaryUseCase', e.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select primary use case</option>
                {useCases.map(useCase => (
                  <option key={useCase} value={useCase}>{useCase}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="urgency">Timeline *</Label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select timeline</option>
                {urgencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="challenges">Current Challenges (Optional)</Label>
              <textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                placeholder="What data protection challenges are you facing?"
                rows={3}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Stay Connected</h3>
              <p className="text-muted-foreground">
                Choose how you'd like to hear from us and what interests you most.
              </p>
            </div>
            
            <div>
              <Label>How would you like us to follow up? *</Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: 'email', label: 'Email only', icon: Mail },
                  { value: 'call', label: 'Schedule a call', icon: Calendar },
                  { value: 'demo', label: 'Book a demo', icon: Star }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('communicationPreference', option.value)}
                    className={`w-full p-3 text-left rounded-md border transition-colors flex items-center space-x-3 ${
                      formData.communicationPreference === option.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>What interests you most? (Optional)</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleArrayToggle('interests', interest)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            
            {leadMagnet && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    Your download will be ready!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  We'll email you "{leadMagnet.title}" plus personalized recommendations based on your responses.
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const currentStepData = formSteps[currentStep]
  const isCurrentStepValid = validateStep(currentStep)
  const progress = ((currentStep + 1) / formSteps.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {currentStep + 1} of {formSteps.length}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        {formSteps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              index === currentStep 
                ? 'bg-primary text-white' 
                : completedSteps.includes(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {completedSteps.includes(index) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <span className="text-xs mt-1 text-center hidden md:block">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <currentStepData.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{currentStepData.title}</h2>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid || isSubmitting}
          className="flex items-center space-x-2"
        >
          <span>
            {currentStep === formSteps.length - 1 
              ? (isSubmitting ? 'Submitting...' : 'Complete') 
              : 'Continue'
            }
          </span>
          {currentStep === formSteps.length - 1 ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>🔒 Your information is secure and will never be shared</p>
        <p>📧 You can unsubscribe at any time</p>
      </div>
    </div>
  )
}