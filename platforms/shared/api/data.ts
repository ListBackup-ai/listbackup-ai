import { apiClient } from './client'

export interface FileItem {
  fileId: string
  accountId: string
  sourceId: string
  path: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size: number
  modified: number
  created?: number
  metadata?: {
    checksum?: string
    version?: string
    tags?: string[]
    [key: string]: any
  }
  s3Key?: string
  status: 'active' | 'deleted' | 'archived'
}

export interface FileSearchRequest {
  query?: string
  sourceId?: string
  type?: 'file' | 'folder'
  mimeType?: string[]
  minSize?: number
  maxSize?: number
  modifiedAfter?: number
  modifiedBefore?: number
  path?: string
  tags?: string[]
  limit?: number
  offset?: number
  sort?: 'name' | 'size' | 'modified' | 'created'
  order?: 'asc' | 'desc'
}

export interface FileDownloadRequest {
  fileId: string
  version?: string
}

export interface BulkDownloadRequest {
  fileIds: string[]
  format?: 'zip' | 'tar'
}

export interface FileTreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: number
  children?: FileTreeNode[]
}

export const dataApi = {
  listFiles: async (params?: FileSearchRequest) => {
    const response = await apiClient.get<FileItem[]>('/data/files', { params })
    return response.data
  },

  searchFiles: async (request: FileSearchRequest) => {
    const response = await apiClient.post<FileItem[]>('/data/search', request)
    return response.data
  },

  getFile: async (fileId: string) => {
    const response = await apiClient.get<FileItem>(`/data/files/${fileId}`)
    return response.data
  },

  downloadFile: async (request: FileDownloadRequest) => {
    const response = await apiClient.post('/data/download', request, {
      responseType: 'blob'
    })
    return response.data
  },

  getDownloadUrl: async (fileId: string) => {
    const response = await apiClient.get<{ url: string; expiresAt: number }>(
      `/data/files/${fileId}/download-url`
    )
    return response.data
  },

  bulkDownload: async (request: BulkDownloadRequest) => {
    const response = await apiClient.post('/data/bulk-download', request)
    return response.data
  },

  getFileTree: async (sourceId: string, path?: string) => {
    const response = await apiClient.get<FileTreeNode[]>('/data/tree', {
      params: { sourceId, path }
    })
    return response.data
  },

  deleteFile: async (fileId: string) => {
    const response = await apiClient.delete(`/data/files/${fileId}`)
    return response.data
  },

  restoreFile: async (fileId: string) => {
    const response = await apiClient.post(`/data/files/${fileId}/restore`)
    return response.data
  },
}