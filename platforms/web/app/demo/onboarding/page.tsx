import { Metadata } from 'next'
import { OnboardingDemo } from '@/components/onboarding/onboarding-demo'

export const metadata: Metadata = {
  title: 'Onboarding Flow Demo | ListBackup',
  description: 'Experience our streamlined onboarding process that gets users from platform selection to successful backup in under 5 minutes.',
}

export default function OnboardingDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <OnboardingDemo />
    </main>
  )
}