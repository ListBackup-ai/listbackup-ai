'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Database,
  Users,
  Mail,
  ShoppingCart,
  CreditCard,
  FileText,
  Calendar,
  Activity,
  Filter,
  CheckCircle2,
  Info,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { api, PlatformSource, PlatformConnection } from '@listbackup/shared/api'
import { cn } from '@/lib/utils'

interface PlatformSourcesSelectorProps {
  platformId: string
  connectionId: string
  onSelect: (sources: PlatformSource[]) => void
  onCancel: () => void
}

const categoryIcons: Record<string, any> = {
  'Contacts': Users,
  'Orders': ShoppingCart,
  'Payments': CreditCard,
  'Emails': Mail,
  'Documents': FileText,
  'Calendar': Calendar,
  'Activity': Activity,
  'Database': Database,
}

export function PlatformSourcesSelector({
  platformId,
  connectionId,
  onSelect,
  onCancel
}: PlatformSourcesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimates, setEstimates] = useState<Record<string, any>>({})

  // Fetch platform sources
  const { data: sourcesData, isLoading } = useQuery({
    queryKey: ['platform-sources', platformId],
    queryFn: () => api.platformSources.list(platformId),
    enabled: !!platformId
  })

  // Fetch connection details
  const { data: connection } = useQuery({
    queryKey: ['platform-connection', connectionId],
    queryFn: () => api.platformConnections.get(connectionId),
    enabled: !!connectionId
  })

  const sources = sourcesData?.sources || []
  const categories = sourcesData?.categories || []

  // Filter sources based on search and category
  const filteredSources = sources.filter(source => {
    const matchesSearch = !searchQuery || 
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || source.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Group sources by category
  const groupedSources = filteredSources.reduce((acc, source) => {
    if (!acc[source.category]) {
      acc[source.category] = []
    }
    acc[source.category].push(source)
    return acc
  }, {} as Record<string, PlatformSource[]>)

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
        delete estimates[sourceId]
      } else {
        next.add(sourceId)
        estimateSourceData(sourceId)
      }
      return next
    })
  }

  const toggleCategory = (category: string) => {
    const categorySources = groupedSources[category] || []
    const allSelected = categorySources.every(s => selectedSources.has(s.platformSourceId))
    
    setSelectedSources(prev => {
      const next = new Set(prev)
      categorySources.forEach(source => {
        if (allSelected) {
          next.delete(source.platformSourceId)
          delete estimates[source.platformSourceId]
        } else {
          next.add(source.platformSourceId)
          estimateSourceData(source.platformSourceId)
        }
      })
      return next
    })
  }

  const estimateSourceData = async (sourceId: string) => {
    try {
      setIsEstimating(true)
      const estimate = await api.platformSources.estimate(sourceId, connectionId)
      setEstimates(prev => ({ ...prev, [sourceId]: estimate }))
    } catch (error) {
      console.error('Failed to estimate source data:', error)
    } finally {
      setIsEstimating(false)
    }
  }

  const handleSelectSources = () => {
    const selected = sources.filter(s => selectedSources.has(s.platformSourceId))
    onSelect(selected)
  }

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || Database
    return <Icon className="h-4 w-4" />
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Select Data Sources</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which data you want to backup from {connection?.name}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {getCategoryIcon(category)}
              <span className="ml-2">{category}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          {selectedSources.size} of {sources.length} sources selected
        </div>
        {selectedSources.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSources(new Set())
              setEstimates({})
            }}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Sources List */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-4 space-y-6">
          {Object.entries(groupedSources).map(([category, categorySources]) => {
            const allSelected = categorySources.every(s => selectedSources.has(s.platformSourceId))
            const someSelected = categorySources.some(s => selectedSources.has(s.platformSourceId))
            
            return (
              <div key={category} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => toggleCategory(category)}>
                      {getCategoryIcon(category)}
                      <h4 className="font-medium">{category}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {categorySources.length}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Category Sources */}
                <div className="ml-6 space-y-2">
                  {categorySources.map((source) => {
                    const isSelected = selectedSources.has(source.platformSourceId)
                    const estimate = estimates[source.platformSourceId]
                    
                    return (
                      <Card
                        key={source.platformSourceId}
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
                        )}
                        onClick={() => toggleSource(source.platformSourceId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSource(source.platformSourceId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 space-y-2">
                              <div>
                                <h5 className="font-medium">{source.displayName}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {source.description}
                                </p>
                              </div>

                              {/* Features */}
                              {source.features.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {source.features.slice(0, 3).map((feature, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      {feature}
                                    </Badge>
                                  ))}
                                  {source.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{source.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Estimate */}
                              {isSelected && estimate && (
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>~{formatNumber(estimate.estimatedRecords)} records</span>
                                  <span>•</span>
                                  <span>{estimate.estimatedSize}</span>
                                </div>
                              )}

                              {/* Limitations */}
                              {source.limitations && source.limitations.length > 0 && (
                                <Alert className="mt-2">
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    {source.limitations[0]}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center space-x-2">
          {isEstimating && (
            <span className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Estimating data...
            </span>
          )}
          <Button 
            onClick={handleSelectSources}
            disabled={selectedSources.size === 0}
          >
            Continue with {selectedSources.size} source{selectedSources.size !== 1 ? 's' : ''}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}