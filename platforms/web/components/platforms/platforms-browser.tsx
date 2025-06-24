'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Star,
  Zap,
  Shield,
  Globe,
  Filter
} from 'lucide-react'
import { api, Platform } from '@listbackup/shared/api'
import { PlatformSetupDialog } from './platform-setup-dialog'

export function PlatformsBrowser() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: platformsData, isLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: api.platforms.list,
  })

  const platforms = platformsData?.platforms || []
  
  // Get unique categories
  const allCategories = Array.from(
    new Set(platforms.map(platform => platform.category).filter(Boolean))
  ).sort()

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
    setIsDialogOpen(true)
  }

  const getPopularityIcon = (score: number) => {
    if (score >= 95) return <Star className="h-4 w-4 text-yellow-500 fill-current" />
    if (score >= 90) return <Zap className="h-4 w-4 text-blue-500" />
    return <Globe className="h-4 w-4 text-gray-500" />
  }

  const getAuthTypeIcon = (authType: string) => {
    switch (authType) {
      case 'oauth2':
        return <Shield className="h-3 w-3 text-green-500" />
      case 'api_key':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <Shield className="h-3 w-3 text-gray-500" />
    }
  }

  const getAuthTypeLabel = (authType: string) => {
    switch (authType) {
      case 'oauth2':
        return 'OAuth2'
      case 'api_key':
        return 'API Key'
      default:
        return 'Custom'
    }
  }

  if (isLoading) {
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Available Platforms</h2>
        <p className="text-muted-foreground">
          Connect your favorite tools and services to start backing up your data
        </p>
      </div>

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
        
        <div className="flex gap-2 overflow-x-auto pb-2">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlatforms.map((platform) => (
          <Card 
            key={platform.platformId || platform.id} 
            className="relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            onClick={() => handlePlatformSelect(platform)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={platform.logo} 
                      alt={platform.company}
                      className="w-10 h-10 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/40/40'
                      }}
                    />
                    <div className="absolute -top-1 -right-1">
                      {getPopularityIcon(platform.popularityScore)}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{platform.displayName || platform.title || platform.name}</CardTitle>
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
                {(platform.tags || [platform.category]).slice(0, 3).map((tag, index) => (
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

              {/* Connect Button */}
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlatformSelect(platform)
                }}
              >
                Connect
              </Button>
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
            <Button variant="outline" onClick={() => {
              setSearchQuery('')
              setSelectedCategory(null)
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Setup Dialog */}
      <PlatformSetupDialog
        platform={selectedPlatform}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}