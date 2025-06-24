'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Tag as TagIcon, 
  Plus, 
  Search, 
  Filter,
  Edit3,
  Trash2,
  MoreVertical,
  TrendingUp,
  Calendar,
  Hash,
  Grid3x3,
  List,
  BarChart3,
  Target,
  Star,
  Users
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { TagManagementDialog } from '@/components/tags/tag-management-dialog'
import { TagDisplay } from '@/components/ui/tag-display'
import { 
  Tag, 
  listTags, 
  searchTags, 
  deleteTag, 
  getUniqueCategories, 
  getPopularTags, 
  getMostRecentTags,
  getEntitiesByTag 
} from '@/lib/api/tags'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch tags
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags', searchQuery, selectedCategory, sortBy],
    queryFn: () => {
      if (searchQuery.trim()) {
        return searchTags(searchQuery, {
          category: selectedCategory || undefined,
          limit: 100,
        })
      } else {
        return listTags({
          category: selectedCategory || undefined,
          sortBy,
          limit: 100,
        })
      }
    },
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: getUniqueCategories,
  })

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => getPopularTags(10),
  })

  // Fetch recent tags
  const { data: recentTags } = useQuery({
    queryKey: ['recent-tags'],
    queryFn: () => getMostRecentTags(10),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['popular-tags'] })
      queryClient.invalidateQueries({ queryKey: ['recent-tags'] })
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tag',
        variant: 'destructive',
      })
    },
  })

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      deleteMutation.mutate(tagId)
    }
  }

  const stats = {
    totalTags: tagsData?.totalCount || 0,
    totalCategories: categories?.length || 0,
    averageUsage: tagsData?.tags.length 
      ? Math.round(tagsData.tags.reduce((sum, tag) => sum + tag.usageCount, 0) / tagsData.tags.length)
      : 0,
    systemTags: tagsData?.tags.filter(tag => tag.isSystem).length || 0,
  }

  const renderTagCard = (tag: Tag) => (
    <Card key={tag.tagId} className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: tag.color }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{tag.name}</CardTitle>
              {tag.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {tag.description}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedTag(tag)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteTag(tag.tagId)}
                className="text-destructive"
                disabled={tag.isSystem}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            {tag.category && (
              <Badge variant="outline" className="text-xs">
                {tag.category}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{tag.usageCount} uses</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created {new Date(tag.createdAt).toLocaleDateString()}</span>
            {tag.isSystem && (
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderTagListItem = (tag: Tag) => (
    <div key={tag.tagId} className="flex items-center justify-between p-4 border-b group hover:bg-muted/50">
      <div className="flex items-center gap-3 flex-1">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: tag.color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{tag.name}</span>
            {tag.category && (
              <Badge variant="outline" className="text-xs">
                {tag.category}
              </Badge>
            )}
            {tag.isSystem && (
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
            )}
          </div>
          {tag.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {tag.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{tag.usageCount} uses</span>
        <span>{new Date(tag.createdAt).toLocaleDateString()}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedTag(tag)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteTag(tag.tagId)}
              className="text-destructive"
              disabled={tag.isSystem}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tag Management</h1>
          <p className="text-muted-foreground">
            Organize and manage tags across your entities
          </p>
        </div>
        <TagManagementDialog 
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          }
          mode="create"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-tags">All Tags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TagIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalTags}</p>
                    <p className="text-xs text-muted-foreground">Total Tags</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Grid3x3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCategories}</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.averageUsage}</p>
                    <p className="text-xs text-muted-foreground">Avg Usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.systemTags}</p>
                    <p className="text-xs text-muted-foreground">System Tags</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular and Recent Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Popular Tags</CardTitle>
                </div>
                <CardDescription>
                  Most frequently used tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {popularTags && popularTags.length > 0 ? (
                  <div className="space-y-3">
                    {popularTags.map((tag) => (
                      <div key={tag.tagId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium">{tag.name}</span>
                          {tag.category && (
                            <Badge variant="outline" className="text-xs">
                              {tag.category}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {tag.usageCount} uses
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No popular tags yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Recent Tags</CardTitle>
                </div>
                <CardDescription>
                  Recently created tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTags && recentTags.length > 0 ? (
                  <div className="space-y-3">
                    {recentTags.map((tag) => (
                      <div key={tag.tagId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium">{tag.name}</span>
                          {tag.category && (
                            <Badge variant="outline" className="text-xs">
                              {tag.category}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No recent tags
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-tags" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags Display */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tagsData && tagsData.tags.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tagsData.tags.map(renderTagCard)}
              </div>
            ) : (
              <Card>
                <div className="divide-y">
                  {tagsData.tags.map(renderTagListItem)}
                </div>
              </Card>
            )
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <TagIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No tags found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory 
                      ? 'Try adjusting your search filters'
                      : 'Create your first tag to get started'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Analytics</CardTitle>
              <CardDescription>
                Usage patterns and insights about your tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced tag analytics and insights will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Categories</CardTitle>
              <CardDescription>
                Organize tags by categories for better management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => {
                    const categoryTags = tagsData?.tags.filter(tag => tag.category === category) || []
                    return (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{category}</CardTitle>
                          <CardDescription>
                            {categoryTags.length} tags
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TagDisplay 
                            tags={categoryTags.slice(0, 5)} 
                            size="sm"
                            maxVisible={5}
                          />
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Categories</h3>
                  <p className="text-muted-foreground">
                    Create tags with categories to organize them better.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tag Dialog */}
      {selectedTag && (
        <TagManagementDialog
          trigger={null}
          mode="manage"
          onTagSelect={() => setSelectedTag(null)}
        />
      )}
    </div>
  )
}