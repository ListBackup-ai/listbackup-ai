'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { JobBuilder } from './job-builder'

interface CreateJobDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  sourceId?: string
}

export function CreateJobDialog({ isOpen, onClose, onSuccess, sourceId }: CreateJobDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createJobMutation = useMutation({
    mutationFn: api.jobs.create,
    onSuccess: () => {
      toast({
        title: 'Job created',
        description: 'Your backup job has been created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      onSuccess?.()
      onClose()
    },
    onError: () => {
      toast({
        title: 'Failed to create job',
        description: 'There was an error creating your backup job',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (jobConfig: any) => {
    // Transform the job config from the builder to the API format
    const apiPayload = {
      sources: [{ sourceId: jobConfig.sourceId }],
      name: jobConfig.name,
      description: jobConfig.description,
      type: jobConfig.type,
      schedule: jobConfig.schedule.frequency === 'manual' ? undefined : {
        enabled: true,
        frequency: jobConfig.schedule.frequency,
        time: jobConfig.schedule.time,
        timezone: jobConfig.schedule.timezone,
        dayOfWeek: jobConfig.schedule.dayOfWeek,
        dayOfMonth: jobConfig.schedule.dayOfMonth,
      },
      config: {
        filters: jobConfig.filters,
        export: jobConfig.export,
        storage: jobConfig.storage,
        advanced: jobConfig.advanced,
      },
    }

    createJobMutation.mutate(apiPayload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create Backup Job</DialogTitle>
          <DialogDescription>
            Configure your automated data backup with our step-by-step builder
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <JobBuilder 
            sourceId={sourceId}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}