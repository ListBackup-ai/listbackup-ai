'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Star,
  Shield,
  Globe,
  Filter,
  TrendingUp,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react'
import { api, Platform } from '@listbackup/shared/api'
import { WizardStepProps } from '../onboarding-wizard'
import { cn } from '@/lib/utils'

interface PlatformSelectionData {
  selectedPlatform?: Platform
  searchQuery?: string
  selectedCategory?: string
}

export function PlatformSelectionStep({ 
  data, 
  setData, 
  onNext,
  canProceed,
  isLoading 
}: WizardStepProps) {
  const [searchQuery, setSearchQuery] = useState(data.searchQuery || '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(data.selectedCategory || null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(data.selectedPlatform || null)

  const { data: platformsData, isLoading: isPlatformsLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: api.platforms.list,
  })

  const platforms = platformsData?.platforms || []
  
  // Get categories with counts
  const categoriesWithCounts = platforms.reduce((acc, platform) => {
    const category = platform.category || 'Other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const allCategories = Object.keys(categoriesWithCounts).sort()

  // Get popular platforms (top 6 by popularity score)
  const popularPlatforms = platforms
    .filter(p => p.popularityScore > 80)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 6)

  // Get recently used platforms (this would come from user history)
  const recentPlatforms = platforms.slice(0, 3) // Mock recent platforms

  // Filter platforms based on search and category
  const filteredPlatforms = platforms.filter(platform => {
    const matchesSearch = !searchQuery || 
      (platform.displayName || platform.title || platform.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (platform.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (platform.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || 
      platform.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform)
    setData({
      ...data,
      selectedPlatform: platform,
      searchQuery,
      selectedCategory
    })
    
    // Auto-advance to next step after selection
    setTimeout(() => {
      onNext()
    }, 500)
  }

  const getPopularityIcon = (score: number) => {
    if (score >= 95) return <Star className="h-4 w-4 text-yellow-500 fill-current" />
    if (score >= 90) return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <Globe className="h-4 w-4 text-gray-500" />
  }

  const getAuthTypeIcon = (authType: string) => {
    const type = authType || 'custom'
    switch (type) {
      case 'oauth2':
        return <Shield className="h-3 w-3 text-green-500" />
      case 'api_key':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <Shield className="h-3 w-3 text-gray-500" />
    }
  }

  const getAuthTypeLabel = (authType: string) => {
    const type = authType || 'custom'
    switch (type) {
      case 'oauth2':
        return 'OAuth2'
      case 'api_key':
        return 'API Key'
      default:
        return 'Custom'
    }
  }

  if (isPlatformsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      {!searchQuery && !selectedCategory && (
        <div className="space-y-4">
          {/* Popular Platforms */}
          {popularPlatforms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Popular Platforms</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularPlatforms.map((platform) => (
                  <Card
                    key={platform.platformId || platform.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all border-2",
                      selectedPlatform?.platformId === platform.platformId 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent hover:border-muted"
                    )}
                    onClick={() => handlePlatformSelect(platform)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="relative">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
                          <img
                            src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
                            alt={platform.displayName || platform.title || platform.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/24/24'
                            }}
                          />
                        </div>
                        <div className="absolute -top-1 -right-1">
                          {getPopularityIcon(platform.popularityScore)}
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {platform.displayName || platform.title || platform.name}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recently Used */}
          {recentPlatforms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Recently Used</h3>
              </div>
              <div className="flex gap-2">
                {recentPlatforms.map((platform) => (
                  <Button
                    key={platform.platformId || platform.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlatformSelect(platform)}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
                      alt={platform.displayName || platform.title || platform.name}
                      className="w-4 h-4 object-contain"
                    />
                    {platform.displayName || platform.title || platform.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
              <Badge variant="secondary" className="ml-1 text-xs">
                {categoriesWithCounts[category]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        Showing {filteredPlatforms.length} of {platforms.length} platforms
        {selectedCategory && (
          <Badge variant="secondary" className="ml-2">
            {selectedCategory}
          </Badge>
        )}
      </div>

      {/* Platforms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlatforms.map((platform) => (
          <Card 
            key={platform.platformId || platform.id} 
            className={cn(
              "cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-2",
              selectedPlatform?.platformId === platform.platformId 
                ? "border-primary bg-primary/5 shadow-lg" 
                : "border-transparent"
            )}
            onClick={() => handlePlatformSelect(platform)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
                      alt={platform.company}
                      className="w-10 h-10 rounded-lg object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/40/40'
                      }}
                    />
                    <div className="absolute -top-1 -right-1">
                      {getPopularityIcon(platform.popularityScore)}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {platform.displayName || platform.title || platform.name}
                    </CardTitle>
                    <CardDescription>{platform.company}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {platform.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-1">
                {(platform.tags || [platform.category]).filter(Boolean).slice(0, 3).map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {(platform.tags || []).length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{platform.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Auth Type and Popularity */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getAuthTypeIcon(platform.authType || (platform.requiresOAuth ? 'oauth2' : 'api_key'))}
                  {getAuthTypeLabel(platform.authType || (platform.requiresOAuth ? 'oauth2' : 'api_key'))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  {platform.popularityScore}%
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedPlatform?.platformId === platform.platformId && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredPlatforms.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No platforms found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search terms or selecting a different category
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setSelectedCategory(null)
              }}>
                Clear Filters
              </Button>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Request Platform
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Selected Platform Summary */}
      {selectedPlatform && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <img 
                src={selectedPlatform.logo || `https://logo.clearbit.com/${selectedPlatform.company.toLowerCase()}.com`}
                alt={selectedPlatform.company}
                className="w-8 h-8 rounded object-contain"
              />
              <div>
                <p className="font-medium">
                  {selectedPlatform.displayName || selectedPlatform.title || selectedPlatform.name} selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Ready to connect your {selectedPlatform.company} account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}