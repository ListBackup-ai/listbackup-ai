import { Metadata } from 'next'
import { StreamlinedOnboardingFlow } from '@/components/onboarding/streamlined-onboarding-flow'

export const metadata: Metadata = {
  title: 'Setup Your First Backup | ListBackup',
  description: 'Get started with ListBackup by setting up your first automated backup in minutes.',
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <StreamlinedOnboardingFlow />
    </main>
  )
}