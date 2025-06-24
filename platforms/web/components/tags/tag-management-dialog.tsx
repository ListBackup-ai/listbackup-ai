"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Search, Palette, Trash2, Edit, Filter, MoreVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Tag, CreateTagRequest, UpdateTagRequest, listTags, createTag, updateTag, deleteTag, searchTags, getUniqueCategories } from '@/lib/api/tags'

interface TagManagementDialogProps {
  trigger?: React.ReactNode
  onTagSelect?: (tag: Tag) => void
  selectedTags?: Tag[]
  mode?: 'manage' | 'select' | 'create'
}

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280',
  '#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#65A30D', '#EA580C', '#DB2777', '#4B5563',
]

export function TagManagementDialog({
  trigger,
  onTagSelect,
  selectedTags = [],
  mode = 'manage'
}: TagManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [creatingTag, setCreatingTag] = useState(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())

  // Form states
  const [formData, setFormData] = useState<CreateTagRequest | UpdateTagRequest>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    category: '',
  })

  useEffect(() => {
    if (open) {
      loadTags()
      loadCategories()
    }
  }, [open, searchQuery, selectedCategory, sortBy])

  const loadTags = async () => {
    setLoading(true)
    try {
      let result
      if (searchQuery.trim()) {
        result = await searchTags(searchQuery, {
          category: selectedCategory || undefined,
          limit: 100,
        })
      } else {
        result = await listTags({
          category: selectedCategory || undefined,
          sortBy,
          limit: 100,
        })
      }
      setTags(result.tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await getUniqueCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!formData.name?.trim()) return

    try {
      const newTag = await createTag(formData as CreateTagRequest)
      setTags([newTag, ...tags])
      setCreatingTag(false)
      resetForm()
      if (mode === 'select' && onTagSelect) {
        onTagSelect(newTag)
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !formData.name?.trim()) return

    try {
      const updatedTag = await updateTag(editingTag.tagId, formData as UpdateTagRequest)
      setTags(tags.map(tag => tag.tagId === editingTag.tagId ? updatedTag : tag))
      setEditingTag(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update tag:', error)
    }
  }

  const handleDeleteTag = async (tagId: string, force = false) => {
    try {
      await deleteTag(tagId, force)
      setTags(tags.filter(tag => tag.tagId !== tagId))
      if (editingTag?.tagId === tagId) {
        setEditingTag(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedForBulk).map(tagId => deleteTag(tagId, true))
    try {
      await Promise.all(promises)
      setTags(tags.filter(tag => !selectedForBulk.has(tag.tagId)))
      setSelectedForBulk(new Set())
      setBulkSelectMode(false)
    } catch (error) {
      console.error('Failed to bulk delete tags:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      category: '',
    })
  }

  const startEditing = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      category: tag.category || '',
    })
    setCreatingTag(false)
  }

  const startCreating = () => {
    setCreatingTag(true)
    setEditingTag(null)
    resetForm()
  }

  const cancelEditing = () => {
    setEditingTag(null)
    setCreatingTag(false)
    resetForm()
  }

  const isSelected = (tagId: string) => selectedTags.some(tag => tag.tagId === tagId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Tag' : mode === 'select' ? 'Select Tags' : 'Manage Tags'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={mode === 'create' ? 'create' : 'browse'} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Tags</TabsTrigger>
              <TabsTrigger value="create">Create Tag</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 overflow-hidden space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
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
                    {categories.map(category => (
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
                {mode === 'manage' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setBulkSelectMode(!bulkSelectMode)}
                      >
                        {bulkSelectMode ? 'Exit' : 'Enter'} Bulk Mode
                      </DropdownMenuItem>
                      {bulkSelectMode && selectedForBulk.size > 0 && (
                        <DropdownMenuItem
                          onClick={handleBulkDelete}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedForBulk.size})
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Tags Grid */}
              <div className="flex-1 overflow-auto border rounded-lg p-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tags found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tags.map((tag) => (
                      <div
                        key={tag.tagId}
                        className={cn(
                          "group relative border rounded-lg p-3 hover:shadow-sm transition-all",
                          isSelected(tag.tagId) && "ring-2 ring-primary",
                          mode === 'select' && "cursor-pointer"
                        )}
                        onClick={mode === 'select' && onTagSelect ? () => onTagSelect(tag) : undefined}
                      >
                        {bulkSelectMode && (
                          <div className="absolute top-2 left-2">
                            <input
                              type="checkbox"
                              checked={selectedForBulk.has(tag.tagId)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedForBulk)
                                if (e.target.checked) {
                                  newSelected.add(tag.tagId)
                                } else {
                                  newSelected.delete(tag.tagId)
                                }
                                setSelectedForBulk(newSelected)
                              }}
                              className="rounded border-gray-300"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium truncate flex-1">{tag.name}</span>
                          {mode === 'manage' && !bulkSelectMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => startEditing(tag)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTag(tag.tagId)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        
                        {tag.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {tag.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {tag.category && (
                              <Badge variant="outline" className="text-xs">
                                {tag.category}
                              </Badge>
                            )}
                          </div>
                          <span>{tag.usageCount} uses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="create" className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter tag name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Optional category"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Color</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded border-2 transition-all",
                            formData.color === color ? "border-primary scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="mt-2 h-8"
                    />
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <Label>Preview</Label>
                    <Badge
                      style={{
                        backgroundColor: formData.color + '20',
                        borderColor: formData.color,
                        color: formData.color,
                      }}
                      className="gap-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: formData.color }}
                      />
                      {formData.name || 'Tag Name'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                {(editingTag || creatingTag) && (
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                  disabled={!formData.name?.trim()}
                >
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}