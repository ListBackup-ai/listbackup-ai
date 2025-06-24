'use client'

import { SourceCreationWizard } from '@/components/sources/source-creation-wizard'
import { useRouter } from 'next/navigation'

export default function NewSourcePage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Backup Source</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new data backup source in a few simple steps
        </p>
      </div>

      <SourceCreationWizard
        onComplete={(sourceId) => {
          router.push(`/dashboard/sources/${sourceId}`)
        }}
        onCancel={() => {
          router.push('/dashboard/sources')
        }}
      />
    </div>
  )
}