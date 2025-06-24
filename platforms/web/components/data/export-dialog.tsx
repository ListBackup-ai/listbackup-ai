'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Download,
  FileText,
  Archive,
  Calendar,
  Filter,
  HardDrive,
  Cloud,
  Mail,
  Check,
  AlertCircle,
  Loader2,
  FileCode,
  FileSpreadsheet,
  FileJson
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@listbackup/shared/utils'
import { format } from 'date-fns'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedFiles?: string[]
  sourceId?: string
}

const exportFormats = [
  {
    value: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation',
    icon: FileJson,
    extensions: ['.json']
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values',
    icon: FileSpreadsheet,
    extensions: ['.csv']
  },
  {
    value: 'xml',
    label: 'XML',
    description: 'Extensible Markup Language',
    icon: FileCode,
    extensions: ['.xml']
  },
  {
    value: 'excel',
    label: 'Excel',
    description: 'Microsoft Excel format',
    icon: FileSpreadsheet,
    extensions: ['.xlsx', '.xls']
  }
]

const compressionOptions = [
  { value: 'none', label: 'No compression' },
  { value: 'zip', label: 'ZIP' },
  { value: 'gzip', label: 'GZIP' },
  { value: 'tar', label: 'TAR' }
]

const deliveryMethods = [
  {
    value: 'download',
    label: 'Direct Download',
    description: 'Download to your device',
    icon: Download
  },
  {
    value: 'email',
    label: 'Email',
    description: 'Send download link to email',
    icon: Mail
  },
  {
    value: 's3',
    label: 'Amazon S3',
    description: 'Export to S3 bucket',
    icon: Cloud
  },
  {
    value: 'drive',
    label: 'Google Drive',
    description: 'Save to Google Drive',
    icon: HardDrive
  }
]

export function ExportDialog({ isOpen, onClose, selectedFiles = [], sourceId }: ExportDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [exportData, setExportData] = useState({
    format: 'json',
    compression: 'zip',
    delivery: 'download',
    email: '',
    includeMetadata: true,
    dateRange: {
      enabled: false,
      start: '',
      end: ''
    },
    filters: {
      fileTypes: [] as string[],
      minSize: '',
      maxSize: ''
    },
    s3Config: {
      bucket: '',
      path: ''
    }
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 3000))
      return { exportId: 'exp_' + Date.now(), downloadUrl: 'https://example.com/download' }
    },
    onSuccess: (data) => {
      toast({
        title: 'Export started',
        description: 'Your data export is being prepared. You\'ll be notified when it\'s ready.',
      })
      if (exportData.delivery === 'download' && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
      onClose()
    },
    onError: () => {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data',
        variant: 'destructive',
      })
    },
  })

  const handleExport = () => {
    exportMutation.mutate()
  }

  const selectedFormat = exportFormats.find(f => f.value === exportData.format)
  const selectedDelivery = deliveryMethods.find(d => d.value === exportData.delivery)

  const totalSteps = 3

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export your backup data in your preferred format
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                step >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > i ? <Check className="h-4 w-4" /> : i}
              </div>
              {i < totalSteps && (
                <div className={cn(
                  "w-16 h-0.5 mx-2 transition-all duration-200",
                  step > i ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6 py-4">
          {/* Step 1: Format & Options */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <Label className="text-base font-semibold mb-3 block">Export Format</Label>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((format) => {
                    const Icon = format.icon
                    return (
                      <div
                        key={format.value}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                          exportData.format === format.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setExportData({ ...exportData, format: format.value })}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{format.label}</p>
                            <p className="text-xs text-muted-foreground">{format.description}</p>
                          </div>
                          {exportData.format === format.value && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Compression</Label>
                <Select 
                  value={exportData.compression} 
                  onValueChange={(value) => setExportData({ ...exportData, compression: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {compressionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metadata"
                    checked={exportData.includeMetadata}
                    onCheckedChange={(checked) => 
                      setExportData({ ...exportData, includeMetadata: !!checked })
                    }
                  />
                  <Label 
                    htmlFor="metadata"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include file metadata (size, dates, checksums)
                  </Label>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">{selectedFiles.length} files selected</p>
                      <p className="text-xs mt-1">Only selected files will be exported</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Filters */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <Label className="text-base font-semibold mb-3 block">Date Range (Optional)</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="dateRange"
                      checked={exportData.dateRange.enabled}
                      onCheckedChange={(checked) => 
                        setExportData({ 
                          ...exportData, 
                          dateRange: { ...exportData.dateRange, enabled: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="dateRange" className="text-sm font-normal cursor-pointer">
                      Filter by date range
                    </Label>
                  </div>

                  {exportData.dateRange.enabled && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={exportData.dateRange.start}
                          onChange={(e) => setExportData({
                            ...exportData,
                            dateRange: { ...exportData.dateRange, start: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={exportData.dateRange.end}
                          onChange={(e) => setExportData({
                            ...exportData,
                            dateRange: { ...exportData.dateRange, end: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">File Type Filter (Optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['Images', 'Documents', 'Spreadsheets', 'Archives', 'Videos', 'Other'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={type}
                        checked={exportData.filters.fileTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportData({
                              ...exportData,
                              filters: {
                                ...exportData.filters,
                                fileTypes: [...exportData.filters.fileTypes, type]
                              }
                            })
                          } else {
                            setExportData({
                              ...exportData,
                              filters: {
                                ...exportData.filters,
                                fileTypes: exportData.filters.fileTypes.filter(t => t !== type)
                              }
                            })
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm font-normal cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">File Size Filter (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="minSize">Minimum Size (MB)</Label>
                    <Input
                      id="minSize"
                      type="number"
                      placeholder="0"
                      value={exportData.filters.minSize}
                      onChange={(e) => setExportData({
                        ...exportData,
                        filters: { ...exportData.filters, minSize: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxSize">Maximum Size (MB)</Label>
                    <Input
                      id="maxSize"
                      type="number"
                      placeholder="No limit"
                      value={exportData.filters.maxSize}
                      onChange={(e) => setExportData({
                        ...exportData,
                        filters: { ...exportData.filters, maxSize: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Delivery */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <Label className="text-base font-semibold mb-3 block">Delivery Method</Label>
                <RadioGroup value={exportData.delivery} onValueChange={(value) => setExportData({ ...exportData, delivery: value })}>
                  <div className="grid gap-3">
                    {deliveryMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <label
                          key={method.value}
                          htmlFor={method.value}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                            exportData.delivery === method.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={method.value} id={method.value} />
                          <Icon className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{method.label}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </RadioGroup>
              </div>

              {/* Delivery-specific options */}
              {exportData.delivery === 'email' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={exportData.email}
                    onChange={(e) => setExportData({ ...exportData, email: e.target.value })}
                  />
                </div>
              )}

              {exportData.delivery === 's3' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <Label htmlFor="bucket">S3 Bucket Name</Label>
                    <Input
                      id="bucket"
                      placeholder="my-backup-bucket"
                      value={exportData.s3Config.bucket}
                      onChange={(e) => setExportData({
                        ...exportData,
                        s3Config: { ...exportData.s3Config, bucket: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="path">Path (Optional)</Label>
                    <Input
                      id="path"
                      placeholder="/exports/2024/"
                      value={exportData.s3Config.path}
                      onChange={(e) => setExportData({
                        ...exportData,
                        s3Config: { ...exportData.s3Config, path: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Export Summary</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Format: {selectedFormat?.label}</p>
                  <p>Compression: {compressionOptions.find(c => c.value === exportData.compression)?.label}</p>
                  {selectedFiles.length > 0 && <p>Files: {selectedFiles.length} selected</p>}
                  {exportData.dateRange.enabled && (
                    <p>Date range: {exportData.dateRange.start} to {exportData.dateRange.end}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={step === 1 ? onClose : () => setStep(step - 1)}
              disabled={exportMutation.isPending}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={step === 3 ? handleExport : () => setStep(step + 1)}
              disabled={exportMutation.isPending || 
                (step === 3 && exportData.delivery === 'email' && !exportData.email) ||
                (step === 3 && exportData.delivery === 's3' && !exportData.s3Config.bucket)
              }
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : step === 3 ? (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}