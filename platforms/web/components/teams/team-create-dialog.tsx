'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Loader2,
  Users,
  Shield,
  Bell
} from 'lucide-react'
import { api, CreateTeamRequest } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TeamCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamCreateDialog({ open, onOpenChange }: TeamCreateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [requireApproval, setRequireApproval] = useState(true)
  const [allowSelfJoin, setAllowSelfJoin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createTeamMutation = useMutation({
    mutationFn: (data: CreateTeamRequest) => api.teams.create(data),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({
        title: 'Team created',
        description: `${team.name} has been created successfully.`,
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create team',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setRequireApproval(true)
    setAllowSelfJoin(false)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your team.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      await createTeamMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        settings: {
          requireApproval,
          allowSelfJoin,
          defaultPermissions: ['read', 'export'] // Default permissions for new members
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Teams allow you to collaborate with others across multiple accounts and sources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team for?"
              rows={3}
            />
          </div>

          {/* Team Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team Settings</CardTitle>
              <CardDescription className="text-sm">
                Configure how members can join and interact with the team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Require Approval */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="require-approval">Require Approval</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    New members must be approved by an admin
                  </p>
                </div>
                <Switch
                  id="require-approval"
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                />
              </div>

              {/* Allow Self Join */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="allow-self-join">Allow Self Join</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Users with access to linked accounts can join
                  </p>
                </div>
                <Switch
                  id="allow-self-join"
                  checked={allowSelfJoin}
                  onCheckedChange={setAllowSelfJoin}
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Bell className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    What happens next?
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>You'll be the team owner with full permissions</li>
                    <li>You can invite members via email</li>
                    <li>Grant the team access to specific accounts</li>
                    <li>Set custom permissions for team members</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}