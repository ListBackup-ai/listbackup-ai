'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  Building,
  Users,
  Mail,
  Shield,
  Info
} from 'lucide-react'
import { api, CreateClientRequest } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClientCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientCreateDialog({ open, onOpenChange }: ClientCreateDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [sendInvitation, setSendInvitation] = useState(true)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentAccount } = useAccountContext()

  // Fetch available accounts (sub-accounts of current account)
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', currentAccount?.accountId],
    queryFn: () => api.account.getHierarchy(currentAccount?.accountId || ''),
    enabled: !!currentAccount?.accountId && open
  })

  // Fetch available teams
  const { data: teamsData } = useQuery({
    queryKey: ['teams', 'account', currentAccount?.accountId],
    queryFn: () => api.teams.list({ accountId: currentAccount?.accountId }),
    enabled: !!currentAccount?.accountId && open
  })

  const availableAccounts = accountsData?.subAccounts || []
  const availableTeams = teamsData?.teams || []

  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientRequest) => api.clients.create(data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: sendInvitation ? 'Invitation sent' : 'Client created',
        description: sendInvitation 
          ? `An invitation has been sent to ${client.email}`
          : `${client.name} has been added as a client.`,
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create client',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setEmail('')
    setName('')
    setCompany('')
    setSendInvitation(true)
    setSelectedAccounts(new Set())
    setSelectedTeams(new Set())
  }

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both email and name.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const accountAccess = Array.from(selectedAccounts).map(accountId => ({
        accountId,
        permissions: ['read', 'export', 'view-reports']
      }))

      const teamAccess = Array.from(selectedTeams).map(teamId => ({
        teamId,
        permissions: ['read', 'export']
      }))

      await createClientMutation.mutateAsync({
        email: email.trim(),
        name: name.trim(),
        company: company.trim() || undefined,
        sendInvitation,
        accountAccess: accountAccess.length > 0 ? accountAccess : undefined,
        teamAccess: teamAccess.length > 0 ? teamAccess : undefined
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev)
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Client</DialogTitle>
          <DialogDescription>
            Grant a client limited access to view reports and export data from specific accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">Email Address *</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-name">Full Name *</Label>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-company">Company</Label>
              <Input
                id="client-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp (optional)"
              />
            </div>
          </div>

          {/* Send Invitation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-invitation"
                  checked={sendInvitation}
                  onCheckedChange={(checked) => setSendInvitation(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="send-invitation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send email invitation
                  </label>
                  <p className="text-sm text-muted-foreground">
                    The client will receive an email to set up their password
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Access Configuration</h3>
            </div>

            {/* Account Access */}
            {availableAccounts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Account Access
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select which accounts this client can access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {availableAccounts.map((account: any) => (
                        <div key={account.accountId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`account-${account.accountId}`}
                            checked={selectedAccounts.has(account.accountId)}
                            onCheckedChange={() => toggleAccount(account.accountId)}
                          />
                          <label
                            htmlFor={`account-${account.accountId}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {account.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              {account.accountPath}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Team Access */}
            {availableTeams.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Access
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select which teams this client can access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {availableTeams.map((team) => (
                        <div key={team.teamId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${team.teamId}`}
                            checked={selectedTeams.has(team.teamId)}
                            onCheckedChange={() => toggleTeam(team.teamId)}
                          />
                          <label
                            htmlFor={`team-${team.teamId}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {team.name}
                            {team.description && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {team.description}
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Permissions Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Clients will have read-only access and can:
              <ul className="mt-2 ml-4 text-xs list-disc">
                <li>View backup reports and summaries</li>
                <li>Export data in approved formats</li>
                <li>Access activity logs for their accounts</li>
                <li>Receive scheduled reports via email</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !email.trim() || !name.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sendInvitation ? 'Send Invitation' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}