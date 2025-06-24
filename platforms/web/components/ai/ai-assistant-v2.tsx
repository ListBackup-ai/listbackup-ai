'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Bot, 
  Send, 
  Lightbulb, 
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  Database,
  HelpCircle
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'
import { useToast } from '@/components/ui/use-toast'

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: {
    label: string
    action: () => void
  }[]
}

interface AISuggestion {
  id: string
  title: string
  description: string
  action: string
  type: 'optimization' | 'security' | 'insight' | 'warning'
  icon: React.ElementType
}

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

const mockSuggestions: AISuggestion[] = [
  {
    id: '1',
    title: 'Optimize Backup Schedule',
    description: 'Your Google Drive backup is running during peak hours. Consider rescheduling to 2:00 AM for better performance.',
    action: 'Update Schedule',
    type: 'optimization',
    icon: TrendingUp
  },
  {
    id: '2',
    title: 'Security Recommendation',
    description: 'Enable two-factor authentication for enhanced security.',
    action: 'Enable 2FA',
    type: 'security',
    icon: Shield
  },
  {
    id: '3',
    title: 'Storage Insight',
    description: 'You have 2.3GB of duplicate files across your sources. Clean up to save storage space.',
    action: 'View Duplicates',
    type: 'insight',
    icon: Lightbulb
  },
  {
    id: '4',
    title: 'Connection Issue',
    description: 'Dropbox API connection failed 3 times in the last hour. Check your credentials.',
    action: 'Fix Connection',
    type: 'warning',
    icon: AlertTriangle
  }
]

const quickActions = [
  {
    icon: Database,
    label: 'Check backup status',
    query: 'What is the status of my latest backups?'
  },
  {
    icon: FileText,
    label: 'Find specific file',
    query: 'Help me find a file from my backups'
  },
  {
    icon: Zap,
    label: 'Optimize performance',
    query: 'How can I optimize my backup performance?'
  },
  {
    icon: HelpCircle,
    label: 'Troubleshoot issue',
    query: 'I\'m having an issue with my backup job'
  }
]

const exampleQueries = [
  "Show me failed backup jobs from last week",
  "How much storage am I using?",
  "Create a new backup job for my Stripe data",
  "When was my last successful Keap backup?",
  "Compare my usage this month vs last month",
  "Help me set up a new integration"
]

export function AIAssistant({ isOpen, onClose, isMinimized, onToggleMinimize }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage backups, find files, troubleshoot issues, and optimize your data protection strategy. What can I help you with today?',
      timestamp: new Date(),
      suggestions: ['Show backup status', 'Help with integration', 'Find a file', 'Check usage']
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(input),
        timestamp: new Date(),
        suggestions: generateSuggestions(input)
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('backup') && lowerQuery.includes('status')) {
      return 'Your backup system is healthy! ✅ You have 3 active backup jobs running smoothly:\n\n• Google Drive: Last backup 2 hours ago (Success)\n• Stripe: Currently syncing (45% complete)\n• Keap: Scheduled for 2:00 AM\n\nAll systems are operational with no errors detected.'
    }
    
    if (lowerQuery.includes('storage') || lowerQuery.includes('usage')) {
      return '📊 Storage Usage Overview:\n\n• Total Used: 85GB of 500GB (17%)\n• Monthly Growth: +8.5%\n• Largest Sources:\n  - Google Drive: 45GB\n  - Stripe: 23GB\n  - Keap: 17GB\n\nAt current growth rate, you have ~5 months of storage remaining.'
    }
    
    if (lowerQuery.includes('find') && lowerQuery.includes('file')) {
      return 'I can help you find files! Here\'s how:\n\n1. Go to Browse Data in the sidebar\n2. Use the search bar to find files by name\n3. Filter by source, date, or file type\n\nWhat specific file are you looking for? I can guide you through the search process.'
    }
    
    if (lowerQuery.includes('create') && lowerQuery.includes('backup')) {
      return 'To create a new backup job:\n\n1. Go to Sources → Add Integration\n2. Select your data source (e.g., Stripe)\n3. Authenticate with your credentials\n4. Configure backup schedule\n5. Set retention policies\n\nWould you like me to walk you through setting up a specific integration?'
    }
    
    return 'I understand you\'re asking about "' + query + '". Let me help you with that. Could you provide more details about what you\'re trying to accomplish?'
  }

  const generateSuggestions = (query: string): string[] => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('backup')) {
      return ['View all jobs', 'Check recent activity', 'Create new backup', 'Troubleshoot failures']
    }
    
    if (lowerQuery.includes('file') || lowerQuery.includes('find')) {
      return ['Browse all files', 'Search by date', 'Filter by source', 'Download files']
    }
    
    if (lowerQuery.includes('storage') || lowerQuery.includes('usage')) {
      return ['View detailed breakdown', 'Set up alerts', 'Optimize storage', 'Upgrade plan']
    }
    
    return ['Tell me more', 'Show examples', 'View documentation', 'Contact support']
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }

  const handleQuickAction = (query: string) => {
    setInput(query)
    handleSend()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      description: 'The message has been copied to your clipboard',
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Assistant Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg animate-pulse">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggleMinimize}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 1 && (
                <Card className="mb-4 border-dashed animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start hover:bg-primary/10 hover:scale-105 transition-all duration-200"
                          onClick={() => handleQuickAction(action.query)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Smart Suggestions */}
              {messages.length === 1 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-700">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Smart Suggestions
                  </h4>
                  {mockSuggestions.slice(0, 2).map((suggestion) => {
                    const Icon = suggestion.icon
                    return (
                      <Card 
                        key={suggestion.id} 
                        className="p-3 cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02]"
                        onClick={() => handleQuickAction(suggestion.description)}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={cn(
                            "h-4 w-4 mt-0.5",
                            suggestion.type === 'warning' ? 'text-yellow-500' :
                            suggestion.type === 'security' ? 'text-blue-500' :
                            suggestion.type === 'insight' ? 'text-purple-500' :
                            'text-green-500'
                          )} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {message.type === 'assistant' && (
                    <div className="p-2 bg-primary/10 rounded-lg h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={cn(
                    'max-w-[80%] space-y-2',
                    message.type === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'p-3 rounded-lg',
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:scale-110 transition-transform"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:scale-110 transition-transform">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:scale-110 transition-transform">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs hover:scale-105 transition-transform duration-200"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in duration-200">
                  <div className="p-2 bg-primary/10 rounded-lg h-8 w-8 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Example Queries */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 animate-in fade-in slide-in-from-bottom duration-500">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleQueries.slice(0, 3).map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 hover:bg-primary/10 hover:scale-105 transition-all duration-200"
                      onClick={() => handleQuickAction(query)}
                    >
                      "{query}"
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 transition-all duration-200 hover:shadow-md focus:shadow-md"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="hover:scale-105 transition-transform duration-200"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Quick AI Assistant trigger button
export function AIAssistantTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 duration-500"
      size="icon"
    >
      <Bot className="h-6 w-6" />
    </Button>
  )
}