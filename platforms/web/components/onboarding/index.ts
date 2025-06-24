// Main onboarding components
export { OnboardingWizard } from './onboarding-wizard'
export { StreamlinedOnboardingFlow } from './streamlined-onboarding-flow'
export { MobileWizard, useIsMobile } from './mobile-wizard'

// Individual step components
export { PlatformSelectionStep } from './steps/platform-selection-step'
export { OAuthConnectionStep } from './steps/oauth-connection-step'
export { DataSourceSelectionStep } from './steps/data-source-selection-step'
export { BackupConfigurationStep } from './steps/backup-configuration-step'
export { ReviewAndCreateStep } from './steps/review-and-create-step'

// Error handling and utilities
export { OnboardingErrorBoundary, OnboardingErrorDisplay } from './error-boundary'
export { OnboardingDemo } from './onboarding-demo'

// Types
export type {
  WizardStep,
  WizardStepProps,
  WizardContextType,
  WizardConfig
} from './onboarding-wizard'