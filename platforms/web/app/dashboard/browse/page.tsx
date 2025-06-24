'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Download, 
  Filter,
  File,
  Folder,
  Image,
  FileText,
  Database,
  MoreHorizontal,
  Calendar,
  HardDrive,
  Eye
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [fileType, setFileType] = useState<string>('all')
  const { toast } = useToast()

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', { sourceId: selectedSource, fileType }],
    queryFn: () => api.data.listFiles({ 
      sourceId: selectedSource === 'all' ? undefined : selectedSource,
      type: fileType === 'all' ? undefined : 'file'
    }),
  })

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
  })

  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await api.data.getDownloadUrl(fileId)
      if (result.url) {
        window.open(result.url, '_blank')
      }
      return result
    },
    onSuccess: () => {
      toast({
        title: 'Download started',
        description: 'File download has been initiated',
      })
    },
    onError: () => {
      toast({
        title: 'Download failed',
        description: 'Failed to download file',
        variant: 'destructive',
      })
    },
  })

  const searchFiles = useMutation({
    mutationFn: (query: string) => api.data.searchFiles({
      query,
      sourceId: selectedSource === 'all' ? undefined : selectedSource,
      type: fileType === 'all' ? undefined : fileType as 'file' | 'folder'
    }),
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchFiles.mutate(searchQuery)
    }
  }

  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (fileType === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    if (fileType === 'document' || ['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-green-500" />
    }
    if (fileType === 'database' || ['sql', 'db', 'sqlite'].includes(extension || '')) {
      return <Database className="h-5 w-5 text-purple-500" />
    }
    if (['zip', 'rar', 'tar', 'gz'].includes(extension || '')) {
      return <Folder className="h-5 w-5 text-yellow-500" />
    }
    
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const displayFiles = searchFiles.data || files || []

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Data</h1>
          <p className="text-muted-foreground">
            Search and download your backed up files and data
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
          <CardDescription>Find specific files across all your data sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search files by name, content, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searchFiles.isPending} className="hover:scale-105 transition-transform duration-200">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="flex gap-4">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-48 hover:scale-105 transition-transform duration-200">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sources?.map((source) => (
                  <SelectItem key={source.sourceId} value={source.sourceId}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-48 hover:scale-105 transition-transform duration-200">
                <SelectValue placeholder="All file types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All file types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="archive">Archives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {isLoading || searchFiles.isPending ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : displayFiles.length > 0 ? (
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">
              {searchFiles.data ? 'Search Results' : 'Files'}
              <Badge variant="secondary" className="ml-2 hover:scale-110 transition-transform duration-200">
                {displayFiles.length} files
              </Badge>
            </CardTitle>
            <CardDescription>
              {searchFiles.data ? 
                `Found ${displayFiles.length} files matching "${searchQuery}"` :
                `Showing all files ${selectedSource !== 'all' ? `from selected source` : 'from all sources'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {displayFiles.map((file) => {
                const source = sources?.find(s => s.sourceId === file.sourceId)
                
                return (
                  <div key={file.fileId} className="p-4 hover:bg-muted/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.name, file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{source?.name || 'Unknown source'}</span>
                            <span>{formatFileSize(file.size || 0)}</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(file.modified), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs hover:scale-110 transition-transform duration-200">
                          {file.type || 'unknown'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:scale-110 hover:bg-muted transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => downloadMutation.mutate(file.fileId)}
                              className="hover:bg-muted/80 transition-colors duration-200"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-muted/80 transition-colors duration-200">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadMutation.mutate(file.fileId)}
                          disabled={downloadMutation.isPending}
                          className="hover:scale-105 hover:shadow-md transition-all duration-200"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <HardDrive className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchQuery ? 'No files found' : 'No files available'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery ? 
                  `No files matched your search for "${searchQuery}". Try adjusting your search terms or filters.` :
                  'Once you have data sources configured and backup jobs running, your files will appear here for browsing and download.'
                }
              </p>
            </div>
            {!searchQuery && (
              <Button variant="outline" className="hover:scale-105 transition-transform duration-200">
                <Filter className="h-4 w-4 mr-2" />
                Adjust Filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}