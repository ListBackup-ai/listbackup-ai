'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  Database,
  Calendar,
  Clock,
  Filter,
  Settings2,
  Shield,
  HardDrive,
  Globe,
  FileArchive,
  AlertCircle,
  Info,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Zap,
  FileJson,
  FileText,
  Table,
  Archive,
  Cloud,
  Server,
  Folder,
  Mail,
  CreditCard,
  Users,
  Package,
  ShoppingCart,
  BarChart,
  FileSearch,
  Lock,
  Unlock,
  Download,
  Upload,
  Play,
  Plus
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { cn } from '@listbackup/shared/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface JobBuilderProps {
  sourceId?: string
  onSubmit: (jobConfig: any) => void
  onCancel: () => void
  initialConfig?: any
}

// Data type configurations
const dataTypes = {
  keap: [
    { id: 'contacts', label: 'Contacts', icon: Users, description: 'Customer contact information' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Sales orders and transactions' },
    { id: 'products', label: 'Products', icon: Package, description: 'Product catalog' },
    { id: 'invoices', label: 'Invoices', icon: FileText, description: 'Billing invoices' },
    { id: 'opportunities', label: 'Opportunities', icon: BarChart, description: 'Sales opportunities' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Contact notes and history' },
    { id: 'tasks', label: 'Tasks', icon: Check, description: 'Tasks and to-dos' },
    { id: 'emails', label: 'Emails', icon: Mail, description: 'Email communications' },
    { id: 'tags', label: 'Tags', icon: FileSearch, description: 'Contact tags and segments' },
  ],
  stripe: [
    { id: 'customers', label: 'Customers', icon: Users, description: 'Customer profiles' },
    { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Payment transactions' },
    { id: 'invoices', label: 'Invoices', icon: FileText, description: 'Invoices and receipts' },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw, description: 'Recurring subscriptions' },
    { id: 'products', label: 'Products', icon: Package, description: 'Product and pricing data' },
    { id: 'charges', label: 'Charges', icon: Zap, description: 'Charge history' },
    { id: 'refunds', label: 'Refunds', icon: RefreshCw, description: 'Refund records' },
    { id: 'disputes', label: 'Disputes', icon: AlertCircle, description: 'Dispute cases' },
  ],
  gohighlevel: [
    { id: 'contacts', label: 'Contacts', icon: Users, description: 'CRM contacts' },
    { id: 'opportunities', label: 'Opportunities', icon: BarChart, description: 'Sales pipelines' },
    { id: 'calendars', label: 'Calendars', icon: Calendar, description: 'Appointments and events' },
    { id: 'conversations', label: 'Conversations', icon: Mail, description: 'Chat and messages' },
    { id: 'forms', label: 'Forms', icon: FileText, description: 'Form submissions' },
    { id: 'workflows', label: 'Workflows', icon: RefreshCw, description: 'Automation workflows' },
  ],
  // Add more platform-specific data types
}

// Export format options
const exportFormats = [
  { id: 'json', label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' },
  { id: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values' },
  { id: 'excel', label: 'Excel', icon: Table, description: 'Microsoft Excel format' },
  { id: 'parquet', label: 'Parquet', icon: Database, description: 'Columnar storage format' },
]

// Storage destinations
const storageDestinations = [
  { id: 's3', label: 'Amazon S3', icon: Cloud, description: 'ListBackup storage', default: true },
  { id: 'google-drive', label: 'Google Drive', icon: Cloud, description: 'Your Google Drive' },
  { id: 'dropbox', label: 'Dropbox', icon: Cloud, description: 'Your Dropbox account' },
  { id: 'box', label: 'Box', icon: Server, description: 'Your Box account' },
  { id: 'ftp', label: 'FTP/SFTP', icon: Server, description: 'Your FTP server' },
  { id: 'azure', label: 'Azure Storage', icon: Cloud, description: 'Azure Blob Storage' },
]

export function JobBuilder({ sourceId, onSubmit, onCancel, initialConfig }: JobBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState({
    name: '',
    description: '',
    sourceId: sourceId || '',
    type: 'backup',
    dataTypes: [] as string[],
    schedule: {
      frequency: 'daily',
      time: '02:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayOfWeek: 1,
      dayOfMonth: 1,
    },
    filters: {
      dateRange: {
        enabled: false,
        start: '',
        end: '',
        mode: 'relative', // relative or absolute
        relativeDays: 30,
      },
      includeDeleted: false,
      customFilters: [] as any[],
    },
    export: {
      formats: ['json'],
      compression: true,
      encryption: true,
      splitFiles: false,
      maxFileSize: 100, // MB
    },
    storage: {
      destinations: ['s3'],
      retention: {
        enabled: true,
        days: 90,
      },
      externalStorage: [] as any[],
    },
    advanced: {
      priority: 'normal',
      retryAttempts: 3,
      timeout: 3600, // seconds
      notifications: {
        onSuccess: true,
        onFailure: true,
        webhookUrl: '',
      },
      validation: {
        enabled: true,
        checksumVerification: true,
        dataIntegrityChecks: true,
      },
    },
    ...initialConfig,
  })

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
  })

  const selectedSource = sources?.find(s => s.sourceId === config.sourceId)
  const availableDataTypes = selectedSource ? dataTypes[selectedSource.type as keyof typeof dataTypes] || [] : []

  const totalSteps = 6
  const stepProgress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSubmit(config)
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return config.name && config.sourceId
      case 2:
        return config.dataTypes.length > 0
      case 3:
        return true // Schedule is always valid
      case 4:
        return true // Filters are optional
      case 5:
        return config.export.formats.length > 0
      case 6:
        return config.storage.destinations.length > 0
      default:
        return true
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(stepProgress)}% Complete</span>
        </div>
        <Progress value={stepProgress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobName">Job Name *</Label>
                    <Input
                      id="jobName"
                      placeholder="e.g., Daily Customer Backup"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose a descriptive name for this backup job
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this backup job do?"
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="source">Data Source *</Label>
                    <Select
                      value={config.sourceId}
                      onValueChange={(value) => setConfig({ ...config, sourceId: value, dataTypes: [] })}
                    >
                      <SelectTrigger id="source" className="mt-1">
                        <SelectValue placeholder="Select a data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources?.map((source) => (
                          <SelectItem key={source.sourceId} value={source.sourceId}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span>{source.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {source.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSource && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Platform: {selectedSource.type} • Last sync: {selectedSource.lastSync ? 'successful' : 'pending'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Backup Type</Label>
                    <RadioGroup
                      value={config.type}
                      onValueChange={(value) => setConfig({ ...config, type: value })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="backup" id="backup" />
                        <Label htmlFor="backup" className="font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Archive className="h-4 w-4" />
                            <span>Backup</span>
                          </div>
                          <p className="text-xs text-muted-foreground">One-way backup of your data</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sync" id="sync" />
                        <Label htmlFor="sync" className="font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span>Sync</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Two-way synchronization (Premium)</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="migration" id="migration" />
                        <Label htmlFor="migration" className="font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span>Migration</span>
                          </div>
                          <p className="text-xs text-muted-foreground">One-time data migration (Premium)</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Data Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Data to Backup</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose which types of data you want to include in this backup job
                </p>

                {availableDataTypes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label>Data Types</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (config.dataTypes.length === availableDataTypes.length) {
                            setConfig({ ...config, dataTypes: [] })
                          } else {
                            setConfig({ ...config, dataTypes: availableDataTypes.map(dt => dt.id) })
                          }
                        }}
                      >
                        {config.dataTypes.length === availableDataTypes.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableDataTypes.map((dataType) => {
                        const Icon = dataType.icon
                        const isSelected = config.dataTypes.includes(dataType.id)

                        return (
                          <div
                            key={dataType.id}
                            className={cn(
                              "p-4 rounded-lg border-2 cursor-pointer transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setConfig({
                                  ...config,
                                  dataTypes: config.dataTypes.filter((dt: any) => dt !== dataType.id)
                                })
                              } else {
                                setConfig({
                                  ...config,
                                  dataTypes: [...config.dataTypes, dataType.id]
                                })
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                isSelected ? "bg-primary/10" : "bg-muted"
                              )}>
                                <Icon className={cn(
                                  "h-5 w-5",
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                )} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{dataType.label}</p>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dataType.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {config.dataTypes.length > 0 && (
                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Selected {config.dataTypes.length} data type{config.dataTypes.length !== 1 ? 's' : ''} for backup
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a data source first to see available data types
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Schedule Your Backup</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure when and how often this backup should run
                </p>

                <Tabs defaultValue="schedule" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Timing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schedule" className="space-y-4">
                    <div>
                      <Label>Frequency</Label>
                      <RadioGroup
                        value={config.schedule.frequency}
                        onValueChange={(value) => setConfig({
                          ...config,
                          schedule: { ...config.schedule, frequency: value }
                        })}
                        className="mt-2"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'manual', label: 'Manual', description: 'Run on demand' },
                            { value: 'hourly', label: 'Hourly', description: 'Every hour' },
                            { value: 'daily', label: 'Daily', description: 'Once per day' },
                            { value: 'weekly', label: 'Weekly', description: 'Once per week' },
                            { value: 'monthly', label: 'Monthly', description: 'Once per month' },
                            { value: 'custom', label: 'Custom', description: 'Cron expression' },
                          ].map((freq) => (
                            <div key={freq.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={freq.value} id={freq.value} />
                              <Label htmlFor={freq.value} className="font-normal cursor-pointer flex-1">
                                <div>{freq.label}</div>
                                <p className="text-xs text-muted-foreground">{freq.description}</p>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {config.schedule.frequency !== 'manual' && config.schedule.frequency !== 'hourly' && (
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Select
                          value={config.schedule.time}
                          onValueChange={(value) => setConfig({
                            ...config,
                            schedule: { ...config.schedule, time: value }
                          })}
                        >
                          <SelectTrigger id="time" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0')
                              return (
                                <SelectItem key={hour} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {config.schedule.frequency === 'weekly' && (
                      <div>
                        <Label htmlFor="dayOfWeek">Day of Week</Label>
                        <Select
                          value={config.schedule.dayOfWeek.toString()}
                          onValueChange={(value) => setConfig({
                            ...config,
                            schedule: { ...config.schedule, dayOfWeek: parseInt(value) }
                          })}
                        >
                          <SelectTrigger id="dayOfWeek" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {config.schedule.frequency === 'monthly' && (
                      <div>
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={config.schedule.dayOfMonth}
                          onChange={(e) => setConfig({
                            ...config,
                            schedule: { ...config.schedule, dayOfMonth: parseInt(e.target.value) || 1 }
                          })}
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={config.schedule.timezone}
                        onValueChange={(value) => setConfig({
                          ...config,
                          schedule: { ...config.schedule, timezone: value }
                        })}
                      >
                        <SelectTrigger id="timezone" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={config.schedule.timezone}>
                            {config.schedule.timezone} (Current)
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Advanced timing options for complex scheduling requirements
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Incremental Backups</Label>
                          <p className="text-xs text-muted-foreground">Only backup changes since last run</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Skip Weekends</Label>
                          <p className="text-xs text-muted-foreground">Don't run on Saturday/Sunday</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Retry Failed Runs</Label>
                          <p className="text-xs text-muted-foreground">Automatically retry if backup fails</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Pause During Maintenance</Label>
                          <p className="text-xs text-muted-foreground">Skip runs during platform maintenance</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* Step 4: Filters */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Filter Your Data</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Apply filters to backup only the data you need
                </p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="date-range">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date Range Filter
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Enable Date Range Filter</Label>
                        <Switch
                          checked={config.filters.dateRange.enabled}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            filters: {
                              ...config.filters,
                              dateRange: { ...config.filters.dateRange, enabled: checked }
                            }
                          })}
                        />
                      </div>

                      {config.filters.dateRange.enabled && (
                        <>
                          <RadioGroup
                            value={config.filters.dateRange.mode}
                            onValueChange={(value) => setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                dateRange: { ...config.filters.dateRange, mode: value }
                              }
                            })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="relative" id="relative" />
                              <Label htmlFor="relative" className="font-normal">
                                Relative (e.g., last 30 days)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="absolute" id="absolute" />
                              <Label htmlFor="absolute" className="font-normal">
                                Absolute (specific dates)
                              </Label>
                            </div>
                          </RadioGroup>

                          {config.filters.dateRange.mode === 'relative' ? (
                            <div>
                              <Label>Days to Include</Label>
                              <Select
                                value={config.filters.dateRange.relativeDays.toString()}
                                onValueChange={(value) => setConfig({
                                  ...config,
                                  filters: {
                                    ...config.filters,
                                    dateRange: { ...config.filters.dateRange, relativeDays: parseInt(value) }
                                  }
                                })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7">Last 7 days</SelectItem>
                                  <SelectItem value="30">Last 30 days</SelectItem>
                                  <SelectItem value="90">Last 90 days</SelectItem>
                                  <SelectItem value="180">Last 180 days</SelectItem>
                                  <SelectItem value="365">Last 365 days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Start Date</Label>
                                <Input
                                  type="date"
                                  value={config.filters.dateRange.start}
                                  onChange={(e) => setConfig({
                                    ...config,
                                    filters: {
                                      ...config.filters,
                                      dateRange: { ...config.filters.dateRange, start: e.target.value }
                                    }
                                  })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>End Date</Label>
                                <Input
                                  type="date"
                                  value={config.filters.dateRange.end}
                                  onChange={(e) => setConfig({
                                    ...config,
                                    filters: {
                                      ...config.filters,
                                      dateRange: { ...config.filters.dateRange, end: e.target.value }
                                    }
                                  })}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="data-filters">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Data Filters
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Include Deleted Records</Label>
                          <p className="text-xs text-muted-foreground">Backup soft-deleted items</p>
                        </div>
                        <Switch
                          checked={config.filters.includeDeleted}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            filters: { ...config.filters, includeDeleted: checked }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Custom Filters</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Add platform-specific filters (e.g., tags, status)
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Filter
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="performance">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Performance Options
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                        <Label>Batch Size</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Number of records to process at once
                        </p>
                        <Select defaultValue="1000">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">100 (Slower, less memory)</SelectItem>
                            <SelectItem value="500">500</SelectItem>
                            <SelectItem value="1000">1000 (Balanced)</SelectItem>
                            <SelectItem value="5000">5000</SelectItem>
                            <SelectItem value="10000">10000 (Faster, more memory)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Rate Limiting</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Requests per second to prevent API throttling
                        </p>
                        <Select defaultValue="auto">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto (Platform defaults)</SelectItem>
                            <SelectItem value="1">1 req/sec</SelectItem>
                            <SelectItem value="5">5 req/sec</SelectItem>
                            <SelectItem value="10">10 req/sec</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* Step 5: Export Options */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Export Configuration</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose how your data should be formatted and processed
                </p>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Export Formats</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {exportFormats.map((format) => {
                        const Icon = format.icon
                        const isSelected = config.export.formats.includes(format.id)

                        return (
                          <div
                            key={format.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setConfig({
                                  ...config,
                                  export: {
                                    ...config.export,
                                    formats: config.export.formats.filter((f: any) => f !== format.id)
                                  }
                                })
                              } else {
                                setConfig({
                                  ...config,
                                  export: {
                                    ...config.export,
                                    formats: [...config.export.formats, format.id]
                                  }
                                })
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={cn(
                                "h-4 w-4",
                                isSelected ? "text-primary" : "text-muted-foreground"
                              )} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{format.label}</p>
                                <p className="text-xs text-muted-foreground">{format.description}</p>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compression</Label>
                        <p className="text-xs text-muted-foreground">Compress files to save storage</p>
                      </div>
                      <Switch
                        checked={config.export.compression}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          export: { ...config.export, compression: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Encryption</Label>
                        <p className="text-xs text-muted-foreground">Encrypt files for security</p>
                      </div>
                      <Switch
                        checked={config.export.encryption}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          export: { ...config.export, encryption: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Split Large Files</Label>
                        <p className="text-xs text-muted-foreground">Split files larger than limit</p>
                      </div>
                      <Switch
                        checked={config.export.splitFiles}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          export: { ...config.export, splitFiles: checked }
                        })}
                      />
                    </div>

                    {config.export.splitFiles && (
                      <div>
                        <Label>Max File Size (MB)</Label>
                        <Select
                          value={config.export.maxFileSize.toString()}
                          onValueChange={(value) => setConfig({
                            ...config,
                            export: { ...config.export, maxFileSize: parseInt(value) }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50 MB</SelectItem>
                            <SelectItem value="100">100 MB</SelectItem>
                            <SelectItem value="500">500 MB</SelectItem>
                            <SelectItem value="1000">1 GB</SelectItem>
                            <SelectItem value="5000">5 GB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {config.export.encryption && (
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        Files will be encrypted using AES-256 encryption. You'll need your encryption key to decrypt the data.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Storage */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose where to store your backup data
                </p>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Storage Destinations</Label>
                    <div className="space-y-3">
                      {storageDestinations.map((destination) => {
                        const Icon = destination.icon
                        const isSelected = config.storage.destinations.includes(destination.id)

                        return (
                          <div
                            key={destination.id}
                            className={cn(
                              "p-4 rounded-lg border transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border",
                              destination.default ? "" : "cursor-pointer hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (destination.default) return
                              
                              if (isSelected) {
                                setConfig({
                                  ...config,
                                  storage: {
                                    ...config.storage,
                                    destinations: config.storage.destinations.filter((d: any) => d !== destination.id)
                                  }
                                })
                              } else {
                                setConfig({
                                  ...config,
                                  storage: {
                                    ...config.storage,
                                    destinations: [...config.storage.destinations, destination.id]
                                  }
                                })
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={cn(
                                  "h-5 w-5",
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                )} />
                                <div>
                                  <p className="font-medium">{destination.label}</p>
                                  <p className="text-sm text-muted-foreground">{destination.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {destination.default && (
                                  <Badge variant="secondary">Default</Badge>
                                )}
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            </div>

                            {isSelected && !destination.default && (
                              <div className="mt-3 pt-3 border-t">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Settings2 className="h-4 w-4 mr-2" />
                                  Configure {destination.label}
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Retention Policy</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Retention Policy</Label>
                          <p className="text-xs text-muted-foreground">Automatically delete old backups</p>
                        </div>
                        <Switch
                          checked={config.storage.retention.enabled}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            storage: {
                              ...config.storage,
                              retention: { ...config.storage.retention, enabled: checked }
                            }
                          })}
                        />
                      </div>

                      {config.storage.retention.enabled && (
                        <div>
                          <Label>Retention Period</Label>
                          <Select
                            value={config.storage.retention.days.toString()}
                            onValueChange={(value) => setConfig({
                              ...config,
                              storage: {
                                ...config.storage,
                                retention: { ...config.storage.retention, days: parseInt(value) }
                              }
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="180">180 days</SelectItem>
                              <SelectItem value="365">1 year</SelectItem>
                              <SelectItem value="730">2 years</SelectItem>
                              <SelectItem value="-1">Forever</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Backups older than {config.storage.retention.days} days will be automatically deleted
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <HardDrive className="h-4 w-4" />
                    <AlertDescription>
                      Your data is always stored encrypted in ListBackup's secure S3 storage. 
                      Additional destinations provide extra redundancy and control.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i + 1 === currentStep
                  ? "w-8 bg-primary"
                  : i + 1 < currentStep
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentStep === totalSteps && (
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Review
            </Button>
          )}
          <Button
            onClick={currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={!isStepValid(currentStep)}
          >
            {currentStep === totalSteps ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Job
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}