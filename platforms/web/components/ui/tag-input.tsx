"use client"

import React, { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from './badge'
import { Input } from './input'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import { Tag, TagSuggestion } from '@/lib/api/tags'

interface TagInputProps {
  value?: Tag[]
  onChange?: (tags: Tag[]) => void
  placeholder?: string
  suggestions?: TagSuggestion[]
  onSearch?: (query: string) => void
  onCreate?: (name: string, color: string) => Promise<Tag>
  disabled?: boolean
  maxTags?: number
  allowCreate?: boolean
  className?: string
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
]

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  suggestions = [],
  onSearch,
  onCreate,
  disabled = false,
  maxTags,
  allowCreate = true,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  // Handle search as user types
  useEffect(() => {
    if (inputValue.trim() && onSearch) {
      onSearch(inputValue.trim())
    }
  }, [inputValue, onSearch])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setIsOpen(value.length > 0)
  }

  const handleTagSelect = (tag: Tag | TagSuggestion) => {
    const existingTag = value.find(t => t.tagId === tag.tagId)
    if (existingTag) return

    const newTag: Tag = 'confidence' in tag ? {
      tagId: tag.tagId,
      accountId: '',
      userId: '',
      name: tag.name,
      color: tag.color,
      category: tag.category,
      isSystem: false,
      usageCount: tag.usageCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : tag as Tag

    onChange?.([...value, newTag])
    setInputValue('')
    setIsOpen(false)
  }

  const handleTagRemove = (tagId: string) => {
    onChange?.(value.filter(tag => tag.tagId !== tagId))
  }

  const handleCreateTag = async () => {
    if (!inputValue.trim() || !onCreate || !allowCreate) return

    setIsCreating(true)
    try {
      const randomColor = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]
      const newTag = await onCreate(inputValue.trim(), randomColor)
      onChange?.([...value, newTag])
      setInputValue('')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      if (allowCreate && onCreate) {
        handleCreateTag()
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault()
      handleTagRemove(value[value.length - 1].tagId)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setInputValue('')
    }
  }

  const canAddMore = !maxTags || value.length < maxTags
  const availableSuggestions = suggestions.filter(
    suggestion => !value.some(tag => tag.tagId === suggestion.tagId)
  )

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag) => (
          <Badge
            key={tag.tagId}
            variant="secondary"
            className="gap-1 pr-1"
            style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleTagRemove(tag.tagId)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        
        {canAddMore && !disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={value.length === 0 ? placeholder : ""}
                  className="border-0 shadow-none focus-visible:ring-0 h-6 px-0"
                  disabled={disabled}
                />
              </div>
            </PopoverTrigger>
            
            {isOpen && (
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-2">
                  {availableSuggestions.length === 0 && !allowCreate && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No tags found
                    </div>
                  )}
                  
                  {availableSuggestions.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Suggestions
                      </div>
                      <div className="space-y-1">
                        {availableSuggestions.slice(0, 8).map((suggestion) => (
                          <button
                            key={suggestion.tagId}
                            onClick={() => handleTagSelect(suggestion)}
                            className="w-full flex items-center gap-2 p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                          >
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: suggestion.color }}
                            />
                            <span className="flex-1 text-left">{suggestion.name}</span>
                            {suggestion.category && (
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {suggestion.usageCount}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {allowCreate && inputValue.trim() && onCreate && (
                    <div>
                      {availableSuggestions.length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Create
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleCreateTag}
                        disabled={isCreating}
                        className="w-full flex items-center gap-2 p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create "{inputValue.trim()}"</span>
                        {isCreating && (
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full ml-auto" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}
      </div>
      
      {maxTags && (
        <div className="text-xs text-muted-foreground mt-1">
          {value.length} / {maxTags} tags
        </div>
      )}
    </div>
  )
}