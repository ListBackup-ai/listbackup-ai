"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Edit3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TagInput } from '@/components/ui/tag-input'
import { TagDisplay } from '@/components/ui/tag-display'
import { TagManagementDialog } from './tag-management-dialog'
import { 
  Tag, 
  TagSuggestion, 
  getEntityTags, 
  addEntityTags, 
  removeEntityTags, 
  getTagSuggestions,
  createTag,
  searchTags 
} from '@/lib/api/tags'
import { useToast } from '@/components/ui/use-toast'

interface EntityTaggingProps {
  entityId: string
  entityType: 'source' | 'account' | 'user' | 'team' | 'job' | 'connection' | 'client'
  editable?: boolean
  compact?: boolean
  showTitle?: boolean
  className?: string
}

export function EntityTagging({
  entityId,
  entityType,
  editable = false,
  compact = false,
  showTitle = true,
  className,
}: EntityTaggingProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tempTags, setTempTags] = useState<Tag[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadEntityTags()
    if (editable) {
      loadSuggestions()
    }
  }, [entityId, entityType])

  const loadEntityTags = async () => {
    setLoading(true)
    try {
      const entityTags = await getEntityTags(entityId, entityType)
      setTags(entityTags)
      setTempTags(entityTags)
    } catch (error) {
      console.error('Failed to load entity tags:', error)
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestions = async () => {
    try {
      const tagSuggestions = await getTagSuggestions({
        entityType,
        entityId,
        limit: 10,
      })
      setSuggestions(tagSuggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    try {
      const searchResults = await searchTags(query, { limit: 8 })
      const suggestions: TagSuggestion[] = searchResults.tags.map(tag => ({
        tagId: tag.tagId,
        name: tag.name,
        color: tag.color,
        category: tag.category,
        usageCount: tag.usageCount,
        confidence: 1.0,
      }))
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to search tags:', error)
    }
  }

  const handleCreateTag = async (name: string, color: string): Promise<Tag> => {
    try {
      const newTag = await createTag({ name, color })
      toast({
        title: "Success",
        description: "Tag created successfully",
      })
      return newTag
    } catch (error) {
      console.error('Failed to create tag:', error)
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      })
      throw error
    }
  }

  const startEditing = () => {
    setEditing(true)
    setTempTags([...tags])
  }

  const cancelEditing = () => {
    setEditing(false)
    setTempTags([...tags])
  }

  const saveChanges = async () => {
    try {
      setLoading(true)

      // Find tags to add and remove
      const currentTagIds = new Set(tags.map(tag => tag.tagId))
      const newTagIds = new Set(tempTags.map(tag => tag.tagId))

      const tagsToAdd = tempTags.filter(tag => !currentTagIds.has(tag.tagId))
      const tagsToRemove = tags.filter(tag => !newTagIds.has(tag.tagId))

      // Add new tags
      if (tagsToAdd.length > 0) {
        await addEntityTags({
          entityId,
          entityType,
          tagIds: tagsToAdd.map(tag => tag.tagId),
        })
      }

      // Remove tags
      if (tagsToRemove.length > 0) {
        await removeEntityTags({
          entityId,
          entityType,
          tagIds: tagsToRemove.map(tag => tag.tagId),
        })
      }

      setTags([...tempTags])
      setEditing(false)
      
      toast({
        title: "Success",
        description: "Tags updated successfully",
      })
    } catch (error) {
      console.error('Failed to save changes:', error)
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTagRemove = (tagId: string) => {
    if (editing) {
      setTempTags(tempTags.filter(tag => tag.tagId !== tagId))
    } else {
      // Direct removal when not in edit mode
      const removeTag = async () => {
        try {
          await removeEntityTags({
            entityId,
            entityType,
            tagIds: [tagId],
          })
          setTags(tags.filter(tag => tag.tagId !== tagId))
          toast({
            title: "Success",
            description: "Tag removed successfully",
          })
        } catch (error) {
          console.error('Failed to remove tag:', error)
          toast({
            title: "Error",
            description: "Failed to remove tag",
            variant: "destructive",
          })
        }
      }
      removeTag()
    }
  }

  const displayTags = editing ? tempTags : tags

  if (compact) {
    return (
      <div className={className}>
        {displayTags.length > 0 ? (
          <TagDisplay
            tags={displayTags}
            onRemove={editable ? handleTagRemove : undefined}
            size="sm"
            maxVisible={3}
          />
        ) : (
          editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add tags
            </Button>
          )
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <div className="p-4">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Tags</h3>
            {editable && !editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                className="h-8 px-2"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : editing ? (
          <div className="space-y-3">
            <TagInput
              value={tempTags}
              onChange={setTempTags}
              suggestions={suggestions}
              onSearch={handleSearch}
              onCreate={handleCreateTag}
              placeholder="Add or search tags..."
              allowCreate={true}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={loading}
              >
                {loading && (
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {displayTags.length > 0 ? (
              <TagDisplay
                tags={displayTags}
                onRemove={editable ? handleTagRemove : undefined}
                interactive={false}
              />
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                No tags assigned
                {editable && (
                  <>
                    {' · '}
                    <button
                      onClick={startEditing}
                      className="text-primary hover:underline"
                    >
                      Add tags
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// Simplified component for inline tagging
export function InlineEntityTagging({
  entityId,
  entityType,
  editable = false,
  onTagsChange,
}: {
  entityId: string
  entityType: string
  editable?: boolean
  onTagsChange?: (tags: Tag[]) => void
}) {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    const loadTags = async () => {
      try {
        const entityTags = await getEntityTags(entityId, entityType)
        setTags(entityTags)
        onTagsChange?.(entityTags)
      } catch (error) {
        console.error('Failed to load entity tags:', error)
      }
    }
    loadTags()
  }, [entityId, entityType])

  return (
    <TagDisplay
      tags={tags}
      size="sm"
      maxVisible={2}
      className="inline-flex"
    />
  )
}