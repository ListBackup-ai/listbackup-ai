'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { 
  Building2,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react'
import { api, Account } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'

interface CreateSubAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentAccount: Account | null
}

interface CreateSubAccountFormData {
  parentAccountId: string
  name: string
  company?: string
  description?: string
  accountType: 'subsidiary' | 'division' | 'location'
  settings: {
    allowSubAccounts: boolean
    maxSubAccounts: number
    timezone: string
  }
}

export function CreateSubAccountDialog({ 
  open, 
  onOpenChange,
  parentAccount
}: CreateSubAccountDialogProps) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [accountType, setAccountType] = useState<'subsidiary' | 'division' | 'location'>('division')
  const [allowSubAccounts, setAllowSubAccounts] = useState(false)
  const [maxSubAccounts, setMaxSubAccounts] = useState(5)
  const [timezone, setTimezone] = useState(parentAccount?.settings?.timezone || 'UTC')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { refreshAccounts } = useAccountContext()

  // Create sub-account mutation
  const createSubAccountMutation = useMutation({
    mutationFn: (data: CreateSubAccountFormData) => api.account.createSubAccount(data),
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] })
      queryClient.invalidateQueries({ queryKey: ['available-accounts'] })
      refreshAccounts()
      toast({
        title: 'Sub-account created',
        description: `${newAccount.name} has been created successfully.`,
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Creation failed',
        description: error.message || 'Failed to create sub-account',
        variant: 'destructive',
      })
    }
  })

  const resetForm = () => {
    setName('')
    setCompany('')
    setDescription('')
    setAccountType('division')
    setAllowSubAccounts(false)
    setMaxSubAccounts(5)
    setTimezone(parentAccount?.settings?.timezone || 'UTC')
  }

  const handleSubmit = async () => {
    if (!parentAccount) {
      toast({
        title: 'Parent account required',
        description: 'A parent account must be selected to create a sub-account.',
        variant: 'destructive',
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for the sub-account.',
        variant: 'destructive',
      })
      return
    }

    await createSubAccountMutation.mutateAsync({
      parentAccountId: parentAccount.accountId,
      name: name.trim(),
      company: company.trim() || undefined,
      description: description.trim() || undefined,
      accountType,
      settings: {
        allowSubAccounts,
        maxSubAccounts: allowSubAccounts ? maxSubAccounts : 0,
        timezone
      }
    })
  }

  const getMaxLevel = () => {
    if (!parentAccount) return 0
    return parentAccount.level + 1
  }

  const getAccountTypeOptions = () => {
    const level = getMaxLevel()
    if (level === 1) {
      return [
        { value: 'subsidiary', label: 'Subsidiary' },
        { value: 'division', label: 'Division' }
      ]
    } else if (level === 2) {
      return [
        { value: 'division', label: 'Division' },
        { value: 'location', label: 'Location' }
      ]
    } else {
      return [
        { value: 'location', label: 'Location' }
      ]
    }
  }

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ]

  if (!parentAccount) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Sub-Account</DialogTitle>
          <DialogDescription>
            Create a new sub-account under {parentAccount.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parent Account Info */}
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Parent Account:</strong> {parentAccount.name}
              <br />
              <strong>Path:</strong> <span className="font-mono text-xs">{parentAccount.accountPath}</span>
            </AlertDescription>
          </Alert>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., East Coast Division"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Acme East Coast LLC"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this account"
              rows={3}
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAccountTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allow Sub-Accounts */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowSubAccounts">Allow Sub-Accounts</Label>
              <p className="text-sm text-muted-foreground">
                Allow this account to create its own sub-accounts
              </p>
            </div>
            <Switch
              id="allowSubAccounts"
              checked={allowSubAccounts}
              onCheckedChange={setAllowSubAccounts}
            />
          </div>

          {/* Max Sub-Accounts */}
          {allowSubAccounts && (
            <div className="space-y-2">
              <Label htmlFor="maxSubAccounts">Maximum Sub-Accounts</Label>
              <Input
                id="maxSubAccounts"
                type="number"
                value={maxSubAccounts}
                onChange={(e) => setMaxSubAccounts(parseInt(e.target.value) || 5)}
                min={1}
                max={50}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of sub-accounts this account can create
              </p>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The new account will inherit permissions and billing from its parent account.
              Users with access to the parent account will automatically have access to this sub-account.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createSubAccountMutation.isPending || !name.trim()}
          >
            {createSubAccountMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Sub-Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}