'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  Zap,
  Key,
  Link2
} from 'lucide-react'
import { api, Platform, PlatformConnection, CreatePlatformConnectionRequest } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { OAuthButton } from './oauth-button'

interface ConnectionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editConnection?: PlatformConnection | null
  preselectedPlatformId?: string
}

export function ConnectionCreateDialog({ 
  open, 
  onOpenChange,
  editConnection,
  preselectedPlatformId
}: ConnectionCreateDialogProps) {
  const [selectedPlatformId, setSelectedPlatformId] = useState(preselectedPlatformId || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [authType, setAuthType] = useState<'oauth' | 'apikey' | 'custom'>('oauth')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch platforms
  const { data: platformsData, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: api.platforms.list,
  })

  const platforms = platformsData?.platforms || []
  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId)

  // Update form when editing
  useEffect(() => {
    if (editConnection) {
      setSelectedPlatformId(editConnection.platformId)
      setName(editConnection.name)
      setDescription(editConnection.description || '')
      setAuthType(editConnection.authType)
      // Note: We don't populate credentials for security
    } else {
      // Reset form
      setName('')
      setDescription('')
      setAuthType('oauth')
      setCredentials({})
    }
  }, [editConnection, open])

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: (data: CreatePlatformConnectionRequest) => api.platformConnections.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] })
      toast({
        title: 'Connection created',
        description: 'Your platform connection has been created successfully.',
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to create connection',
        variant: 'destructive',
      })
    },
  })

  // Update connection mutation
  const updateConnectionMutation = useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: any }) => 
      api.platformConnections.update(connectionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] })
      toast({
        title: 'Connection updated',
        description: 'Your platform connection has been updated successfully.',
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update connection',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setSelectedPlatformId('')
    setName('')
    setDescription('')
    setAuthType('oauth')
    setCredentials({})
    setShowSecrets({})
  }

  const handleSubmit = async () => {
    if (!selectedPlatformId || !name || !authType) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    if (authType === 'apikey' && (!credentials.apiKey || credentials.apiKey.trim() === '')) {
      toast({
        title: 'Missing API key',
        description: 'Please provide an API key for this connection.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (editConnection) {
        // Update existing connection
        await updateConnectionMutation.mutateAsync({
          connectionId: editConnection.connectionId,
          data: {
            name,
            description,
            credentials: authType === 'apikey' ? credentials : undefined,
          },
        })
      } else {
        // Create new connection
        await createConnectionMutation.mutateAsync({
          platformId: selectedPlatformId,
          name,
          description,
          authType,
          credentials: authType === 'apikey' ? credentials : undefined,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuthSuccess = (connectionId: string) => {
    onOpenChange(false)
    resetForm()
    queryClient.invalidateQueries({ queryKey: ['platform-connections'] })
    toast({
      title: 'Connection successful',
      description: 'Your OAuth connection has been established.',
    })
  }

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const getAuthTypeIcon = (type: typeof authType) => {
    switch (type) {
      case 'oauth':
        return <Zap className="h-4 w-4" />
      case 'apikey':
        return <Key className="h-4 w-4" />
      default:
        return <Link2 className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {editConnection ? 'Edit Connection' : 'Create Platform Connection'}
          </DialogTitle>
          <DialogDescription>
            {editConnection 
              ? 'Update your platform connection details.'
              : 'Connect to a platform to start backing up your data.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection */}
          {!editConnection && (
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.platformId || platform.id || ''} value={platform.platformId || platform.id || ''}>
                      <div className="flex items-center space-x-2">
                        <img
                          src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase() + '.com'}`}
                          alt={platform.displayName || platform.title || platform.name}
                          className="w-4 h-4 object-contain"
                        />
                        <span>{platform.displayName || platform.title || platform.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Account"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this connection"
              rows={3}
            />
          </div>

          {/* Auth Type Selection */}
          {selectedPlatform && !editConnection && (
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {(selectedPlatform.authType === 'oauth2' || selectedPlatform.requiresOAuth) && (
                  <Button
                    type="button"
                    variant={authType === 'oauth' ? 'default' : 'outline'}
                    onClick={() => setAuthType('oauth')}
                    className="justify-start"
                  >
                    {getAuthTypeIcon('oauth')}
                    <span className="ml-2">OAuth</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant={authType === 'apikey' ? 'default' : 'outline'}
                  onClick={() => setAuthType('apikey')}
                  className="justify-start"
                >
                  {getAuthTypeIcon('apikey')}
                  <span className="ml-2">API Key</span>
                </Button>
              </div>
            </div>
          )}

          {/* OAuth Button */}
          {selectedPlatform && authType === 'oauth' && !editConnection && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to {selectedPlatform.displayName || selectedPlatform.title || selectedPlatform.name} to authorize the connection.
              </AlertDescription>
            </Alert>
          )}

          {/* API Key Fields */}
          {authType === 'apikey' && selectedPlatform && (
            <div className="space-y-4">
              {selectedPlatform.fields?.filter(field => field.required).map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} *
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={showSecrets[field.name] ? 'text' : field.type}
                      value={credentials[field.name] || ''}
                      onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowSecret(field.name)}
                      >
                        {showSecrets[field.name] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                </div>
              )) || (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showSecrets.apiKey ? 'text' : 'password'}
                      value={credentials.apiKey || ''}
                      onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                      placeholder="Enter your API key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret('apiKey')}
                    >
                      {showSecrets.apiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {selectedPlatform && authType === 'oauth' && !editConnection ? (
            <OAuthButton
              platformType={selectedPlatform.platformId || selectedPlatform.id || ''}
              onSuccess={handleOAuthSuccess}
            >
              Connect with {selectedPlatform.displayName || selectedPlatform.title || selectedPlatform.name}
            </OAuthButton>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedPlatformId || !name}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editConnection ? 'Update' : 'Create'} Connection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}