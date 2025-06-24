'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  X, 
  ArrowRight, 
  FileText, 
  HelpCircle, 
  Book,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'article' | 'faq' | 'guide' | 'integration'
  category: string
  url: string
  relevance: number
}

interface SearchBoxProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  showResults?: boolean
}

// Mock search data - in a real app, this would come from an API
const searchData: SearchResult[] = [
  // Help Articles
  {
    id: '1',
    title: 'Getting Started with ListBackup.ai',
    description: 'Complete guide to setting up your first data backup',
    type: 'guide',
    category: 'Getting Started',
    url: '/help#getting-started',
    relevance: 0.9
  },
  {
    id: '2',
    title: 'Connecting Your Keap Account',
    description: 'Step-by-step instructions for connecting Keap (Infusionsoft)',
    type: 'integration',
    category: 'Integrations',
    url: '/platforms/keap',
    relevance: 0.85
  },
  {
    id: '3',
    title: 'Setting Up Stripe Integration',
    description: 'How to backup your Stripe payment data securely',
    type: 'integration',
    category: 'Integrations',
    url: '/platforms/stripe',
    relevance: 0.8
  },
  {
    id: '4',
    title: 'Understanding Data Security',
    description: 'Learn about our security measures and compliance',
    type: 'article',
    category: 'Security',
    url: '/security',
    relevance: 0.75
  },
  {
    id: '5',
    title: 'Pricing and Plans Explained',
    description: 'Complete breakdown of our pricing tiers and features',
    type: 'article',
    category: 'Billing',
    url: '/pricing',
    relevance: 0.7
  },
  // FAQs
  {
    id: '6',
    title: 'How often is my data backed up?',
    description: 'Data backup frequency depends on your plan and integration type',
    type: 'faq',
    category: 'Backup',
    url: '/help#backup-frequency',
    relevance: 0.9
  },
  {
    id: '7',
    title: 'Can I export my data?',
    description: 'Yes, you can export your data in multiple formats',
    type: 'faq',
    category: 'Data Export',
    url: '/help#data-export',
    relevance: 0.85
  },
  {
    id: '8',
    title: 'Is my data encrypted?',
    description: 'All data is encrypted using AES-256 encryption',
    type: 'faq',
    category: 'Security',
    url: '/help#encryption',
    relevance: 0.8
  },
]

export function SearchBox({ 
  placeholder = "Search help articles...", 
  onSearch,
  className = "",
  showResults = true 
}: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches] = useState<string[]>(['backup setup', 'stripe integration', 'data export'])
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search functionality
  useEffect(() => {
    if (query.length === 0) {
      setResults([])
      setIsOpen(false)
      return
    }

    if (query.length < 2) return

    setIsLoading(true)
    
    // Simulate API delay
    const searchTimeout = setTimeout(() => {
      const filteredResults = searchData
        .filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 8)

      setResults(filteredResults)
      setIsOpen(true)
      setIsLoading(false)
      onSearch?.(query)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, onSearch])

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />
      case 'faq': return <HelpCircle className="w-4 h-4" />
      case 'guide': return <Book className="w-4 h-4" />
      case 'integration': return <Zap className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'article': return 'bg-blue-500/10 text-blue-600'
      case 'faq': return 'bg-green-500/10 text-green-600'
      case 'guide': return 'bg-purple-500/10 text-purple-600'
      case 'integration': return 'bg-orange-500/10 text-orange-600'
      default: return 'bg-gray-500/10 text-gray-600'
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    // Track analytics event
    if (typeof window !== 'undefined') {
      console.log('Search result clicked:', result.title)
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1 p-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    onClick={() => handleResultClick(result)}
                    className="block"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {result.title}
                          </h4>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {result.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No results found for "{query}"</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Searches
                </h4>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-muted/50"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}