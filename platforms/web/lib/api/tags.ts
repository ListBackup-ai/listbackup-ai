import { API_CONFIG } from '../utils'

export interface Tag {
  tagId: string
  accountId: string
  userId: string
  name: string
  description?: string
  color: string
  category?: string
  isSystem: boolean
  usageCount: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateTagRequest {
  name: string
  description?: string
  color: string
  category?: string
  metadata?: Record<string, any>
}

export interface UpdateTagRequest {
  name?: string
  description?: string
  color?: string
  category?: string
  metadata?: Record<string, any>
}

export interface TagsList {
  tags: Tag[]
  totalCount: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SearchTagsList extends TagsList {
  query: string
}

export interface EntityTag {
  entityTagId: string
  accountId: string
  entityId: string
  entityType: string
  tagId: string
  createdAt: string
}

export interface AddEntityTagsRequest {
  entityId: string
  entityType: string
  tagIds: string[]
}

export interface RemoveEntityTagsRequest {
  entityId: string
  entityType: string
  tagIds: string[]
}

export interface TagSuggestion {
  tagId: string
  name: string
  color: string
  category?: string
  usageCount: number
  confidence: number
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// Tag Management
export const createTag = async (tag: CreateTagRequest): Promise<Tag> => {
  const response = await fetch(`${API_CONFIG.baseURL}/tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tag),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create tag')
  }

  const result = await response.json()
  return result.data
}

export const getTag = async (tagId: string): Promise<Tag> => {
  const response = await fetch(`${API_CONFIG.baseURL}/tags/${tagId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get tag')
  }

  const result = await response.json()
  return result.data
}

export const updateTag = async (tagId: string, updates: UpdateTagRequest): Promise<Tag> => {
  const response = await fetch(`${API_CONFIG.baseURL}/tags/${tagId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update tag')
  }

  const result = await response.json()
  return result.data
}

export const deleteTag = async (tagId: string, force = false): Promise<void> => {
  const url = force 
    ? `${API_CONFIG.baseURL}/tags/${tagId}?force=true`
    : `${API_CONFIG.baseURL}/tags/${tagId}`
    
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete tag')
  }
}

export const listTags = async (params?: {
  category?: string
  sortBy?: 'name' | 'usage' | 'created' | 'updated'
  limit?: number
  page?: number
}): Promise<TagsList> => {
  const searchParams = new URLSearchParams()
  
  if (params?.category) searchParams.append('category', params.category)
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.page) searchParams.append('page', params.page.toString())

  const response = await fetch(`${API_CONFIG.baseURL}/tags?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to list tags')
  }

  const result = await response.json()
  return result.data
}

export const searchTags = async (query: string, params?: {
  category?: string
  limit?: number
  page?: number
}): Promise<SearchTagsList> => {
  const searchParams = new URLSearchParams()
  searchParams.append('q', query)
  
  if (params?.category) searchParams.append('category', params.category)
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.page) searchParams.append('page', params.page.toString())

  const response = await fetch(`${API_CONFIG.baseURL}/tags/search?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search tags')
  }

  const result = await response.json()
  return result.data
}

export const getTagSuggestions = async (params?: {
  entityType?: string
  entityId?: string
  limit?: number
}): Promise<TagSuggestion[]> => {
  const searchParams = new URLSearchParams()
  
  if (params?.entityType) searchParams.append('entityType', params.entityType)
  if (params?.entityId) searchParams.append('entityId', params.entityId)
  if (params?.limit) searchParams.append('limit', params.limit.toString())

  const response = await fetch(`${API_CONFIG.baseURL}/tags/suggestions?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get tag suggestions')
  }

  const result = await response.json()
  return result.data
}

// Entity Tagging
export const getEntityTags = async (entityId: string, entityType: string): Promise<Tag[]> => {
  const searchParams = new URLSearchParams()
  searchParams.append('entityId', entityId)
  searchParams.append('entityType', entityType)

  const response = await fetch(`${API_CONFIG.baseURL}/entity-tags?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get entity tags')
  }

  const result = await response.json()
  return result.data
}

export const addEntityTags = async (request: AddEntityTagsRequest): Promise<void> => {
  const response = await fetch(`${API_CONFIG.baseURL}/entity-tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add entity tags')
  }
}

export const removeEntityTags = async (request: RemoveEntityTagsRequest): Promise<void> => {
  const response = await fetch(`${API_CONFIG.baseURL}/entity-tags`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove entity tags')
  }
}

export const getEntitiesByTag = async (tagId: string, params?: {
  entityType?: string
  limit?: number
  page?: number
}): Promise<EntityTag[]> => {
  const searchParams = new URLSearchParams()
  searchParams.append('tagId', tagId)
  
  if (params?.entityType) searchParams.append('entityType', params.entityType)
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.page) searchParams.append('page', params.page.toString())

  const response = await fetch(`${API_CONFIG.baseURL}/entity-tags?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get entities by tag')
  }

  const result = await response.json()
  return result.data
}

// Bulk Operations
export const bulkCreateTags = async (tags: CreateTagRequest[]): Promise<Tag[]> => {
  const promises = tags.map(tag => createTag(tag))
  return Promise.all(promises)
}

export const bulkDeleteTags = async (tagIds: string[], force = false): Promise<void> => {
  const promises = tagIds.map(tagId => deleteTag(tagId, force))
  await Promise.all(promises)
}

export const bulkUpdateTags = async (updates: Array<{tagId: string} & UpdateTagRequest>): Promise<Tag[]> => {
  const promises = updates.map(({tagId, ...update}) => updateTag(tagId, update))
  return Promise.all(promises)
}

// Utility Functions
export const getUniqueCategories = async (): Promise<string[]> => {
  const tags = await listTags({ limit: 1000 }) // Get all tags
  const categories = new Set<string>()
  
  tags.tags.forEach(tag => {
    if (tag.category) {
      categories.add(tag.category)
    }
  })
  
  return Array.from(categories).sort()
}

export const getPopularTags = async (limit = 10): Promise<Tag[]> => {
  const tags = await listTags({ sortBy: 'usage', limit })
  return tags.tags
}

export const getMostRecentTags = async (limit = 10): Promise<Tag[]> => {
  const tags = await listTags({ sortBy: 'created', limit })
  return tags.tags
}