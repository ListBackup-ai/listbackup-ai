'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database,
  Users,
  ShoppingCart,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle2,
  Info,
  AlertTriangle,
  Zap,
  Clock,
  HardDrive,
  Sparkles
} from 'lucide-react'
import { api, Platform, PlatformConnection, PlatformSource } from '@listbackup/shared/api'
import { WizardStepProps } from '../onboarding-wizard'
import { cn } from '@/lib/utils'

interface DataSourceSelectionData {
  selectedPlatform: Platform
  selectedConnection: PlatformConnection
  selectedSources: PlatformSource[]
  estimatedSize?: number
  estimatedTime?: number
}

// Icon mapping for different data types
const getDataTypeIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    contacts: <Users className="h-5 w-5" />,
    customers: <Users className="h-5 w-5" />,
    orders: <ShoppingCart className="h-5 w-5" />,
    products: <Database className="h-5 w-5" />,
    emails: <Mail className="h-5 w-5" />,
    campaigns: <Mail className="h-5 w-5" />,
    files: <FileText className="h-5 w-5" />,
    events: <Calendar className="h-5 w-5" />,
    transactions: <DollarSign className="h-5 w-5" />,
    analytics: <Activity className="h-5 w-5" />,
    default: <Database className="h-5 w-5" />
  }
  
  return iconMap[type.toLowerCase()] || iconMap.default
}

// Priority levels for data sources
const getPriorityLevel = (source: PlatformSource): 'essential' | 'recommended' | 'optional' => {
  const essentialTypes = ['contacts', 'customers', 'orders', 'transactions']
  const recommendedTypes = ['products', 'emails', 'campaigns', 'files']
  
  if (essentialTypes.some(type => source.sourceType.toLowerCase().includes(type))) {
    return 'essential'
  }
  if (recommendedTypes.some(type => source.sourceType.toLowerCase().includes(type))) {
    return 'recommended'
  }
  return 'optional'
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'essential':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'recommended':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'optional':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function DataSourceSelectionStep({ 
  data, 
  setData, 
  onNext,
  canProceed,
  isLoading,
  setLoading
}: WizardStepProps) {
  const [selectedSources, setSelectedSources] = useState<PlatformSource[]>(data.selectedSources || [])
  const [selectAll, setSelectAll] = useState(false)
  const [estimatedSize, setEstimatedSize] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  const platform = data.selectedPlatform as Platform
  const connection = data.selectedConnection as PlatformConnection

  // Fetch available data sources for this platform
  const { data: sourcesData, isLoading: isLoadingSources } = useQuery({
    queryKey: ['platform-sources', platform?.platformId, connection?.connectionId],
    queryFn: () => api.platformSources.list(platform.platformId || platform.id),
    enabled: !!platform && !!connection,
  })

  const availableSources = sourcesData?.sources || []

  // Group sources by priority
  const groupedSources = availableSources.reduce((acc, source) => {
    const priority = getPriorityLevel(source)
    if (!acc[priority]) acc[priority] = []
    acc[priority].push(source)
    return acc
  }, {} as Record<string, PlatformSource[]>)

  // Calculate estimates
  useEffect(() => {
    const calculateEstimates = () => {
      let totalSize = 0
      let totalTime = 0

      selectedSources.forEach(source => {
        // Mock size calculation (in MB)
        const sizeMap: Record<string, number> = {
          contacts: 10,
          customers: 15,
          orders: 50,
          products: 25,
          emails: 100,
          campaigns: 30,
          files: 200,
          events: 20,
          transactions: 75,
          analytics: 40
        }

        const baseSize = sizeMap[source.sourceType.toLowerCase()] || 20
        totalSize += baseSize

        // Time estimation (in minutes)
        totalTime += Math.ceil(baseSize / 10) * 2
      })

      setEstimatedSize(totalSize)
      setEstimatedTime(totalTime)
    }

    calculateEstimates()
  }, [selectedSources])

  const handleSourceToggle = (source: PlatformSource, checked: boolean) => {
    let newSelectedSources: PlatformSource[]
    
    if (checked) {
      newSelectedSources = [...selectedSources, source]
    } else {
      newSelectedSources = selectedSources.filter(s => s.platformSourceId !== source.platformSourceId)
    }
    
    setSelectedSources(newSelectedSources)
    setData({
      ...data,
      selectedSources: newSelectedSources,
      estimatedSize,
      estimatedTime
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    
    if (checked) {
      setSelectedSources(availableSources)
      setData({
        ...data,
        selectedSources: availableSources,
        estimatedSize,
        estimatedTime
      })
    } else {
      setSelectedSources([])
      setData({
        ...data,
        selectedSources: [],
        estimatedSize: 0,
        estimatedTime: 0
      })
    }
  }

  const handleQuickSelect = (priority: 'essential' | 'recommended') => {
    const sources = [
      ...(groupedSources.essential || []),
      ...(priority === 'recommended' ? (groupedSources.recommended || []) : [])
    ]
    
    setSelectedSources(sources)
    setData({
      ...data,
      selectedSources: sources,
      estimatedSize,
      estimatedTime
    })
  }

  const isSourceSelected = (source: PlatformSource) => {
    return selectedSources.some(s => s.platformSourceId === source.platformSourceId)
  }

  if (isLoadingSources) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!platform || !connection) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Missing platform or connection information. Please go back and complete the previous steps.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <img 
            src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
            alt={platform.company}
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div>
            <h3 className="text-lg font-semibold">
              Select Data to Backup
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose which data types to backup from {connection.name}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Select Options */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('essential')}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Select Essential
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('recommended')}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Select Recommended
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectAll(!selectAll)}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {selectAll ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Data Sources */}
      <div className="space-y-6">
        {(['essential', 'recommended', 'optional'] as const).map((priority) => {
          const sources = groupedSources[priority] || []
          if (sources.length === 0) return null

          return (
            <div key={priority} className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium capitalize">{priority} Data</h4>
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', getPriorityColor(priority))}
                >
                  {sources.length} available
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {sources.map((source) => (
                  <Card
                    key={source.platformSourceId}
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      isSourceSelected(source)
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-muted hover:shadow-sm"
                    )}
                    onClick={() => handleSourceToggle(source, !isSourceSelected(source))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSourceSelected(source)}
                          onCheckedChange={(checked) => 
                            handleSourceToggle(source, checked as boolean)
                          }
                          className="mt-1"
                        />
                        
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            {getDataTypeIcon(source.sourceType)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{source.displayName}</h5>
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', getPriorityColor(priority))}
                              >
                                {priority}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {source.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                Est. {source.estimatedSize || '10-50'} MB
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {source.estimatedTime || '2-5'} min
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* No Sources Available */}
      {availableSources.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Data Sources Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This platform doesn't have any configured data sources yet. 
                Check back later or contact support.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedSources.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Backup Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedSources.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Data Sources
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ~{estimatedSize}MB
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimated Size
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ~{estimatedTime}min
                </div>
                <div className="text-sm text-muted-foreground">
                  Backup Time
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Selected Sources:</span>
                <span className="font-medium">{selectedSources.length}</span>
              </div>
              <Progress value={(selectedSources.length / availableSources.length) * 100} className="h-2" />
            </div>
            
            <div className="flex flex-wrap gap-1">
              {selectedSources.slice(0, 5).map((source) => (
                <Badge key={source.platformSourceId} variant="secondary" className="text-xs">
                  {source.displayName}
                </Badge>
              ))}
              {selectedSources.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedSources.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You can modify your data source selection at any time after setup. 
          We recommend starting with essential data and adding more sources later.
        </AlertDescription>
      </Alert>
    </div>
  )
}