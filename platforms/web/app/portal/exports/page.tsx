'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Database, 
  Download,
  Calendar,
  Filter,
  FileText,
  FileSpreadsheet,
  FileJson,
  Search,
  Clock,
  HardDrive,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@listbackup/shared/utils'
import { useToast } from '@/components/ui/use-toast'

export default function ClientPortalExports() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedFormat, setSelectedFormat] = useState<string>('all')

  const { data: accountsData } = useQuery({
    queryKey: ['client-portal-accounts'],
    queryFn: api.clients.getPortalAccounts,
  })

  const { data: exportsData, isLoading } = useQuery({
    queryKey: ['client-portal-exports', selectedAccount, selectedSource],
    queryFn: () => api.clients.getPortalExports({
      accountId: selectedAccount === 'all' ? undefined : selectedAccount,
      sourceId: selectedSource === 'all' ? undefined : selectedSource,
    }),
  })

  const accounts = accountsData?.accounts || []
  const exports = exportsData?.exports || []

  const filteredExports = exports.filter(export_ => {
    const matchesSearch = !searchQuery || 
      export_.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFormat = selectedFormat === 'all' // || export_.format === selectedFormat
    
    return matchesSearch && matchesFormat
  })

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'json':
        return <FileJson className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="text-xs">Ready</Badge>
      case 'preparing':
        return <Badge variant="secondary" className="text-xs">Preparing</Badge>
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const handleDownload = async (export_: any) => {
    if (export_.status !== 'available') {
      toast({
        title: 'Export not ready',
        description: 'This export is still being processed or has expired',
        variant: 'destructive',
      })
      return
    }

    try {
      window.open(export_.downloadUrl, '_blank')
      toast({
        title: 'Download started',
        description: `Downloading ${export_.sourceName} ${export_.dataType} export`,
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download the export file',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Exports</h2>
          <p className="text-muted-foreground">
            Download your backed up data in various formats
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {exports.length} {exports.length === 1 ? 'Export' : 'Exports'} Available
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.accountId} value={account.accountId}>
                      {account.account?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Request New Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exports Grid */}
      {filteredExports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExports.map((export_) => (
            <Card 
              key={export_.exportId} 
              className={cn(
                "hover:shadow-md transition-shadow",
                export_.status === 'expired' && "opacity-60"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded">
                      {getFormatIcon('json')}
                    </div>
                    <div>
                      <CardTitle className="text-base">{export_.sourceName}</CardTitle>
                      <CardDescription className="text-xs">
                        Export • Account {export_.accountId}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(export_.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Export Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      Size
                    </span>
                    <span className="font-medium">{export_.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created
                    </span>
                    <span className="font-medium">
                      {format(new Date(export_.exportedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires
                    </span>
                    <span className={cn(
                      "font-medium",
                      export_.status === 'expired' ? "text-red-600" : ""
                    )}>
                      {export_.expiresAt 
                        ? formatDistanceToNow(new Date(export_.expiresAt), { addSuffix: true })
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>

                {/* Metadata section removed - not in interface */}

                {/* Security */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Shield className="h-3 w-3" />
                  <span>Encrypted • Compressed</span>
                </div>

                {/* Actions */}
                <Button 
                  variant={export_.status === 'available' ? 'default' : 'outline'}
                  className="w-full"
                  disabled={export_.status !== 'available'}
                  onClick={() => handleDownload(export_)}
                >
                  {export_.status === 'available' ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  ) : export_.status === 'preparing' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Expired
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Database className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No exports found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedAccount !== 'all' || selectedFormat !== 'all'
                  ? 'Try adjusting your filters' 
                  : 'No data exports are available yet'}
              </p>
            </div>
            <Button variant="outline">
              Request Export
            </Button>
          </div>
        </Card>
      )}

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Export Information</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Exports are available for download for 30 days</li>
                <li>• All exports are encrypted and compressed for security</li>
                <li>• Large exports may take some time to process</li>
                <li>• Contact your administrator to request specific data exports</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}