'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Info, 
  AlertTriangle,
  Users,
  Database,
  FileText,
  Bell,
  Settings,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAccountContext } from '@/lib/providers/account-context-provider'
import { cn } from '@listbackup/shared/utils'

interface ClientRegistrationData {
  // Company Information
  companyName: string
  industry: string
  website?: string
  description?: string
  
  // Primary Contact
  contactName: string
  contactEmail: string
  contactPhone?: string
  contactTitle?: string
  
  // Address
  address: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  
  // Account Settings
  subdomain?: string
  timezone: string
  language: string
  
  // Access & Permissions
  dataAccess: {
    allowedAccountIds: string[]
    permissions: string[]
    restrictToOwnData: boolean
  }
  
  // Branding
  branding?: {
    logoUrl?: string
    primaryColor?: string
    customDomain?: string
  }
  
  // Notification Preferences
  notifications: {
    email: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    types: string[]
  }
  
  // Security Settings
  security: {
    requireTwoFactor: boolean
    allowApiAccess: boolean
    sessionTimeout: number
  }
}

interface ClientRegistrationFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: (client: any) => void
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Legal',
  'Marketing & Advertising',
  'Consulting',
  'Non-profit',
  'Government',
  'Other'
]

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
]

const availablePermissions = [
  { id: 'data.view', name: 'View Data', description: 'View backed up data and reports' },
  { id: 'data.export', name: 'Export Data', description: 'Download and export data' },
  { id: 'reports.view', name: 'View Reports', description: 'Access analytics and reports' },
  { id: 'reports.export', name: 'Export Reports', description: 'Download report data' },
  { id: 'sources.view', name: 'View Sources', description: 'See connected data sources' },
]

const notificationTypes = [
  { id: 'backup.complete', name: 'Backup Completed', description: 'When backups finish successfully' },
  { id: 'backup.failed', name: 'Backup Failed', description: 'When backups encounter errors' },
  { id: 'reports.ready', name: 'Reports Ready', description: 'When scheduled reports are generated' },
  { id: 'security.alerts', name: 'Security Alerts', description: 'Important security notifications' },
  { id: 'system.maintenance', name: 'System Maintenance', description: 'Planned maintenance notifications' },
]

export function ClientRegistrationFlow({ 
  open, 
  onOpenChange, 
  onClientCreated 
}: ClientRegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [clientData, setClientData] = useState<ClientRegistrationData>({
    companyName: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    address: {},
    timezone: 'UTC',
    language: 'en',
    dataAccess: {
      allowedAccountIds: [],
      permissions: ['data.view', 'reports.view'],
      restrictToOwnData: true
    },
    notifications: {
      email: true,
      frequency: 'weekly',
      types: ['backup.complete', 'backup.failed', 'security.alerts']
    },
    security: {
      requireTwoFactor: false,
      allowApiAccess: false,
      sessionTimeout: 480
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const { toast } = useToast()
  const { currentAccount, availableAccounts } = useAccountContext()

  // Fetch available accounts for data access
  const { data: accountsData } = useQuery({
    queryKey: ['available-accounts'],
    queryFn: () => Promise.resolve({ accounts: availableAccounts || [] })
  })

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (data: ClientRegistrationData) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            clientId: 'client_' + Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            status: 'active'
          })
        }, 2000)
      })
    },
    onSuccess: (client) => {
      toast({
        title: 'Client registered successfully',
        description: `${clientData.companyName} has been registered and can now access their portal.`,
      })
      onClientCreated?.(client)
      onOpenChange(false)
      resetForm()
    },
    onError: () => {
      toast({
        title: 'Registration failed',
        description: 'Failed to register client. Please try again.',
        variant: 'destructive',
      })
    }
  })

  const resetForm = () => {
    setCurrentStep(1)
    setClientData({
      companyName: '',
      industry: '',
      contactName: '',
      contactEmail: '',
      address: {},
      timezone: 'UTC',
      language: 'en',
      dataAccess: {
        allowedAccountIds: [],
        permissions: ['data.view', 'reports.view'],
        restrictToOwnData: true
      },
      notifications: {
        email: true,
        frequency: 'weekly',
        types: ['backup.complete', 'backup.failed', 'security.alerts']
      },
      security: {
        requireTwoFactor: false,
        allowApiAccess: false,
        sessionTimeout: 480
      }
    })
    setValidationErrors({})
  }

  const updateClientData = (updates: Partial<ClientRegistrationData>) => {
    setClientData(prev => ({ ...prev, ...updates }))
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      updatedFields.forEach(field => delete newErrors[field])
      return newErrors
    })
  }

  const updateNestedData = (key: keyof ClientRegistrationData, updates: any) => {
    setClientData(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1: // Company Information
        if (!clientData.companyName.trim()) {
          errors.companyName = 'Company name is required'
        }
        if (!clientData.industry) {
          errors.industry = 'Industry is required'
        }
        if (!clientData.contactName.trim()) {
          errors.contactName = 'Contact name is required'
        }
        if (!clientData.contactEmail.trim()) {
          errors.contactEmail = 'Contact email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.contactEmail)) {
          errors.contactEmail = 'Please enter a valid email address'
        }
        break

      case 2: // Account Access
        if (clientData.dataAccess.allowedAccountIds.length === 0) {
          errors.dataAccess = 'Please select at least one account for data access'
        }
        if (clientData.dataAccess.permissions.length === 0) {
          errors.permissions = 'Please select at least one permission'
        }
        break

      case 3: // Settings
        if (clientData.subdomain && !/^[a-z0-9-]+$/.test(clientData.subdomain)) {
          errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens'
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      await createClientMutation.mutateAsync(clientData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepProgress = () => {
    return ((currentStep - 1) / 3) * 100
  }

  const steps = [
    { id: 1, name: 'Company Info', icon: Building },
    { id: 2, name: 'Data Access', icon: Database },
    { id: 3, name: 'Settings', icon: Settings },
    { id: 4, name: 'Review', icon: CheckCircle },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Client</DialogTitle>
          <DialogDescription>
            Create a new client account with access to your data and reports
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  currentStep >= step.id 
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.name}
          </div>
          <Progress value={getStepProgress()} className="mt-2" />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={clientData.companyName}
                    onChange={(e) => updateClientData({ companyName: e.target.value })}
                    placeholder="Acme Corporation"
                    className={validationErrors.companyName ? 'border-red-500' : ''}
                  />
                  {validationErrors.companyName && (
                    <p className="text-sm text-red-600">{validationErrors.companyName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select 
                    value={clientData.industry} 
                    onValueChange={(value) => updateClientData({ industry: value })}
                  >
                    <SelectTrigger className={validationErrors.industry ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.industry && (
                    <p className="text-sm text-red-600">{validationErrors.industry}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={clientData.website || ''}
                  onChange={(e) => updateClientData({ website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={clientData.description || ''}
                  onChange={(e) => updateClientData({ description: e.target.value })}
                  placeholder="Brief description of the company"
                  rows={3}
                />
              </div>

              <Separator />

              <h4 className="font-semibold">Primary Contact</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={clientData.contactName}
                    onChange={(e) => updateClientData({ contactName: e.target.value })}
                    placeholder="John Smith"
                    className={validationErrors.contactName ? 'border-red-500' : ''}
                  />
                  {validationErrors.contactName && (
                    <p className="text-sm text-red-600">{validationErrors.contactName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactTitle">Title</Label>
                  <Input
                    id="contactTitle"
                    value={clientData.contactTitle || ''}
                    onChange={(e) => updateClientData({ contactTitle: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={clientData.contactEmail}
                    onChange={(e) => updateClientData({ contactEmail: e.target.value })}
                    placeholder="john@acme.com"
                    className={validationErrors.contactEmail ? 'border-red-500' : ''}
                  />
                  {validationErrors.contactEmail && (
                    <p className="text-sm text-red-600">{validationErrors.contactEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={clientData.contactPhone || ''}
                    onChange={(e) => updateClientData({ contactPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Access & Permissions</h3>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure which accounts and data the client can access through their portal.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Account Access *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {accountsData?.accounts?.map((account: any) => (
                    <div key={account.accountId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`account-${account.accountId}`}
                        checked={clientData.dataAccess.allowedAccountIds.includes(account.accountId)}
                        onChange={(e) => {
                          const updatedIds = e.target.checked
                            ? [...clientData.dataAccess.allowedAccountIds, account.accountId]
                            : clientData.dataAccess.allowedAccountIds.filter(id => id !== account.accountId)
                          updateNestedData('dataAccess', {
                            ...clientData.dataAccess,
                            allowedAccountIds: updatedIds
                          })
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`account-${account.accountId}`} className="flex-1">
                        {account.name}
                        {account.accountPath && (
                          <span className="text-xs text-muted-foreground block">
                            {account.accountPath}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                {validationErrors.dataAccess && (
                  <p className="text-sm text-red-600">{validationErrors.dataAccess}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Permissions *</Label>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        id={`permission-${permission.id}`}
                        checked={clientData.dataAccess.permissions.includes(permission.id)}
                        onChange={(e) => {
                          const updatedPermissions = e.target.checked
                            ? [...clientData.dataAccess.permissions, permission.id]
                            : clientData.dataAccess.permissions.filter(id => id !== permission.id)
                          updateNestedData('dataAccess', {
                            ...clientData.dataAccess,
                            permissions: updatedPermissions
                          })
                        }}
                        className="rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {validationErrors.permissions && (
                  <p className="text-sm text-red-600">{validationErrors.permissions}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Restrict to Own Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Only show data related to this client
                  </p>
                </div>
                <Switch
                  checked={clientData.dataAccess.restrictToOwnData}
                  onCheckedChange={(checked) => updateNestedData('dataAccess', {
                    ...clientData.dataAccess,
                    restrictToOwnData: checked
                  })}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Portal Settings</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Portal Subdomain</Label>
                  <div className="flex items-center">
                    <Input
                      id="subdomain"
                      value={clientData.subdomain || ''}
                      onChange={(e) => updateClientData({ subdomain: e.target.value.toLowerCase() })}
                      placeholder="acme"
                      className={cn("rounded-r-none", validationErrors.subdomain ? 'border-red-500' : '')}
                    />
                    <div className="bg-muted px-3 py-2 border border-l-0 rounded-r text-sm text-muted-foreground">
                      .portal.listbackup.ai
                    </div>
                  </div>
                  {validationErrors.subdomain && (
                    <p className="text-sm text-red-600">{validationErrors.subdomain}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use a generated subdomain
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={clientData.timezone} 
                      onValueChange={(value) => updateClientData({ timezone: value })}
                    >
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
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={clientData.language} 
                      onValueChange={(value) => updateClientData({ language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <h4 className="font-semibold">Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to the primary contact
                    </p>
                  </div>
                  <Switch
                    checked={clientData.notifications.email}
                    onCheckedChange={(checked) => updateNestedData('notifications', {
                      ...clientData.notifications,
                      email: checked
                    })}
                  />
                </div>

                {clientData.notifications.email && (
                  <div className="space-y-4 ml-4 border-l-2 border-muted pl-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={clientData.notifications.frequency} 
                        onValueChange={(value: any) => updateNestedData('notifications', {
                          ...clientData.notifications,
                          frequency: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notification Types</Label>
                      <div className="space-y-2">
                        {notificationTypes.map((type) => (
                          <div key={type.id} className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id={`notification-${type.id}`}
                              checked={clientData.notifications.types.includes(type.id)}
                              onChange={(e) => {
                                const updatedTypes = e.target.checked
                                  ? [...clientData.notifications.types, type.id]
                                  : clientData.notifications.types.filter(id => id !== type.id)
                                updateNestedData('notifications', {
                                  ...clientData.notifications,
                                  types: updatedTypes
                                })
                              }}
                              className="rounded mt-0.5"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`notification-${type.id}`} className="text-sm">
                                {type.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <h4 className="font-semibold">Security</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Force 2FA for enhanced security
                      </p>
                    </div>
                    <Switch
                      checked={clientData.security.requireTwoFactor}
                      onCheckedChange={(checked) => updateNestedData('security', {
                        ...clientData.security,
                        requireTwoFactor: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow API Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable programmatic access to data
                      </p>
                    </div>
                    <Switch
                      checked={clientData.security.allowApiAccess}
                      onCheckedChange={(checked) => updateNestedData('security', {
                        ...clientData.security,
                        allowApiAccess: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Confirm</h3>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review the client information before creating the account.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Company:</span> {clientData.companyName}
                      </div>
                      <div>
                        <span className="font-medium">Industry:</span> {clientData.industry}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {clientData.contactName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {clientData.contactEmail}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Data Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Accounts:</span> {clientData.dataAccess.allowedAccountIds.length} selected
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {clientData.dataAccess.permissions.map((permId) => {
                          const perm = availablePermissions.find(p => p.id === permId)
                          return (
                            <Badge key={permId} variant="secondary" className="text-xs">
                              {perm?.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Portal Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Portal URL:</span> 
                        <br />
                        <code className="text-xs bg-muted px-1 rounded">
                          {clientData.subdomain || 'auto-generated'}.portal.listbackup.ai
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Timezone:</span> {clientData.timezone}
                      </div>
                      <div>
                        <span className="font-medium">Notifications:</span> {clientData.notifications.email ? 'Enabled' : 'Disabled'}
                      </div>
                      <div>
                        <span className="font-medium">2FA Required:</span> {clientData.security.requireTwoFactor ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Client
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}