'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Copy, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Globe,
  Mail,
  Shield,
  Server,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'

interface DNSInstructionsDialogProps {
  domainId: string
  domainName: string
  domainType: 'site' | 'api' | 'mail'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DNSInstructionsDialog({
  domainId,
  domainName,
  domainType,
  open,
  onOpenChange
}: DNSInstructionsDialogProps) {
  const { toast } = useToast()
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('generic')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dns-instructions', domainId],
    queryFn: () => api.domains.getDNSInstructions(domainId),
    enabled: open && !!domainId,
  })

  const copyToClipboard = async (text: string, recordId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedRecord(recordId)
      setTimeout(() => setCopiedRecord(null), 2000)
      toast({
        title: 'Copied to clipboard',
        description: 'DNS record value copied successfully',
      })
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the value manually',
        variant: 'destructive',
      })
    }
  }

  const getRecordIcon = (recordType: string) => {
    switch (recordType) {
      case 'A':
      case 'AAAA':
      case 'CNAME':
        return <Globe className="h-4 w-4" />
      case 'MX':
        return <Mail className="h-4 w-4" />
      case 'TXT':
        return <Shield className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Pending</Badge>
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>DNS Configuration for {domainName}</DialogTitle>
          <DialogDescription>
            Follow these instructions to configure your domain DNS settings
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Domain Verification Status</p>
                  <p className="text-sm text-muted-foreground">{data.estimatedTime}</p>
                </div>
                {getStatusBadge(data.verificationStatus)}
              </div>

              <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generic">DNS Records</TabsTrigger>
                  <TabsTrigger value="providers">Provider Guides</TabsTrigger>
                </TabsList>

                <TabsContent value="generic" className="space-y-4">
                  {/* Primary DNS Records */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Required DNS Records</CardTitle>
                      <CardDescription>
                        Add these records to your DNS provider
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.instructions.filter(r => r.required).map((record, index) => (
                        <div
                          key={`${record.recordType}-${index}`}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getRecordIcon(record.recordType)}
                              <Badge variant="outline">{record.recordType}</Badge>
                              <span className="text-sm font-medium">{record.purpose}</span>
                            </div>
                          </div>
                          
                          <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-[100px,1fr] gap-2">
                              <span className="text-muted-foreground">Type:</span>
                              <code className="bg-muted px-2 py-1 rounded">{record.recordType}</code>
                            </div>
                            <div className="grid grid-cols-[100px,1fr] gap-2">
                              <span className="text-muted-foreground">Name:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded flex-1 break-all">
                                  {record.recordName}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(record.recordName, `name-${index}`)}
                                >
                                  {copiedRecord === `name-${index}` ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-[100px,1fr] gap-2">
                              <span className="text-muted-foreground">Value:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded flex-1 break-all">
                                  {record.recordValue}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(record.recordValue, `value-${index}`)}
                                >
                                  {copiedRecord === `value-${index}` ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            {record.priority !== undefined && (
                              <div className="grid grid-cols-[100px,1fr] gap-2">
                                <span className="text-muted-foreground">Priority:</span>
                                <code className="bg-muted px-2 py-1 rounded">{record.priority}</code>
                              </div>
                            )}
                            <div className="grid grid-cols-[100px,1fr] gap-2">
                              <span className="text-muted-foreground">TTL:</span>
                              <code className="bg-muted px-2 py-1 rounded">{record.ttl} seconds</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Optional Records */}
                  {data.instructions.filter(r => !r.required).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Optional DNS Records</CardTitle>
                        <CardDescription>
                          Additional records for enhanced functionality
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {data.instructions.filter(r => !r.required).map((record, index) => (
                          <div
                            key={`optional-${record.recordType}-${index}`}
                            className="p-4 border rounded-lg space-y-2 opacity-75"
                          >
                            <div className="flex items-center gap-2">
                              {getRecordIcon(record.recordType)}
                              <Badge variant="outline">{record.recordType}</Badge>
                              <span className="text-sm">{record.purpose}</span>
                            </div>
                            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                              {record.recordName} → {record.recordValue}
                            </code>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Alternative Setup (Nameservers) */}
                  {data.alternativeSetup && (
                    <Alert>
                      <Server className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Alternative: Use ListBackup Nameservers</p>
                        <p className="text-sm mb-3">{data.alternativeSetup.instructions}</p>
                        <div className="space-y-1">
                          {data.alternativeSetup.nameservers?.map((ns, index) => (
                            <code key={index} className="block text-xs bg-muted px-2 py-1 rounded">
                              {ns}
                            </code>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="providers" className="space-y-4">
                  {data.supportedProviders.map((provider) => (
                    <Card key={provider.name}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          {provider.name}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(provider.helpUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Help Guide
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm whitespace-pre-wrap">{provider.instructions}</pre>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check Verification
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Failed to load DNS instructions
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}