"use client"

import React from 'react'
import { Badge } from './badge'
import { Button } from './button'
import { X, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { cn } from '@/lib/utils'
import { Tag } from '@/lib/api/tags'

interface TagDisplayProps {
  tags: Tag[]
  onRemove?: (tagId: string) => void
  onEdit?: (tag: Tag) => void
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  interactive?: boolean
  className?: string
}

export function TagDisplay({
  tags,
  onRemove,
  onEdit,
  maxVisible = 5,
  size = 'md',
  variant = 'secondary',
  interactive = false,
  className,
}: TagDisplayProps) {
  const visibleTags = tags.slice(0, maxVisible)
  const hiddenTags = tags.slice(maxVisible)

  const sizeClasses = {
    sm: 'text-xs h-5',
    md: 'text-sm h-6',
    lg: 'text-base h-8',
  }

  const TagComponent = ({ tag, showActions = false }: { tag: Tag; showActions?: boolean }) => (
    <Badge
      key={tag.tagId}
      variant={variant}
      className={cn(
        'gap-1 transition-colors',
        sizeClasses[size],
        interactive && 'hover:opacity-80 cursor-pointer',
        className
      )}
      style={{ 
        backgroundColor: tag.color + '20', 
        borderColor: tag.color, 
        color: tag.color 
      }}
      onClick={interactive && onEdit ? () => onEdit(tag) : undefined}
    >
      <span 
        className={cn(
          'rounded-full',
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'
        )} 
        style={{ backgroundColor: tag.color }} 
      />
      <span className="truncate max-w-[120px]">{tag.name}</span>
      {showActions && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'p-0 hover:bg-transparent',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.tagId)
          }}
        >
          <X className={cn(
            size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        </Button>
      )}
    </Badge>
  )

  if (tags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No tags
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleTags.map((tag) => (
        <TagComponent 
          key={tag.tagId} 
          tag={tag} 
          showActions={Boolean(onRemove || onEdit)} 
        />
      ))}
      
      {hiddenTags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 cursor-pointer hover:bg-accent',
                sizeClasses[size]
              )}
            >
              <MoreHorizontal className={cn(
                size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
              )} />
              +{hiddenTags.length}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-[300px]">
            {hiddenTags.map((tag) => (
              <DropdownMenuItem
                key={tag.tagId}
                className="flex items-center gap-2 max-w-full"
                onClick={interactive && onEdit ? () => onEdit(tag) : undefined}
              >
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: tag.color }} 
                />
                <span className="truncate flex-1">{tag.name}</span>
                {tag.category && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {tag.category}
                  </Badge>
                )}
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(tag.tagId)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Simplified component for display-only tags
export function TagList({ 
  tags, 
  className 
}: { 
  tags: Tag[]
  className?: string 
}) {
  return (
    <TagDisplay 
      tags={tags}
      className={className}
      interactive={false}
    />
  )
}

// Component for editable tags
export function EditableTagList({
  tags,
  onRemove,
  onEdit,
  className,
}: {
  tags: Tag[]
  onRemove?: (tagId: string) => void
  onEdit?: (tag: Tag) => void
  className?: string
}) {
  return (
    <TagDisplay
      tags={tags}
      onRemove={onRemove}
      onEdit={onEdit}
      interactive={true}
      className={className}
    />
  )
}