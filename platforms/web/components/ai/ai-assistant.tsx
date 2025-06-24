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
  Loader2
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'
import { useToast } from '@/components/ui/use-toast'

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AISuggestion {
  id: string
  title: string
  description: string
  action: string
  type: 'optimization' | 'security' | 'insight' | 'warning'
  icon: React.ElementType
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
    description: 'Enable two-factor authentication for your Dropbox connection to enhance security.',
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
  { label: 'Create backup', query: 'How do I create a new backup for my Google Drive?' },
  { label: 'Check system health', query: 'What is the current system health status?' },
  { label: 'View recent activity', query: 'Show me recent backup activity' },
  { label: 'Troubleshoot errors', query: 'Help me troubleshoot connection errors' }
]

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function AIAssistant({ isOpen, onClose, isMinimized, onToggleMinimize }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your ListBackup.ai assistant. I can help you with backup operations, data insights, and troubleshooting. What would you like to know?',
      timestamp: new Date(),
      suggestions: ['System status', 'Create backup', 'Data insights']
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(message),
        timestamp: new Date(),
        suggestions: generateSuggestions(message)
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const generateMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('backup') || lowerQuery.includes('create')) {
      return 'To create a new backup, go to the Backups section and click "New Backup". You can select your data sources, set a schedule, and configure retention policies. Would you like me to guide you through the specific steps for any particular data source?'
    }
    
    if (lowerQuery.includes('status') || lowerQuery.includes('health')) {
      return 'Your system is currently healthy! ✅ All 3 data sources are connected, with 2 active backup jobs running. CPU usage is at 34%, memory at 68%. There\'s one minor alert about Dropbox connection that needs attention.'
    }
    
    if (lowerQuery.includes('activity') || lowerQuery.includes('recent')) {
      return 'Recent activity shows: Google Drive backup completed 2 minutes ago (1,247 files), Slack export finished successfully, and there\'s a scheduled Dropbox sync in 1 hour. All operations are running smoothly.'
    }
    
    if (lowerQuery.includes('error') || lowerQuery.includes('troubleshoot')) {
      return 'I can help troubleshoot! The most common issues are: 1) API credential expiration (check Dropbox connection), 2) Network timeouts during large transfers, 3) Storage quota exceeded. Which specific error are you experiencing?'
    }
    
    return 'I understand you\'re asking about "' + query + '". Let me help you with that. Can you provide more specific details about what you\'d like to accomplish?'
  }

  const generateSuggestions = (query: string): string[] => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('backup')) {
      return ['Schedule options', 'Data sources', 'Retention policies']
    }
    
    if (lowerQuery.includes('status')) {
      return ['View details', 'Performance metrics', 'System alerts']
    }
    
    return ['More help', 'Related topics', 'Contact support']
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-2xl ${isMinimized ? 'h-auto' : 'h-[600px]'} flex flex-col`}>
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <CardDescription>Get help with backups and data management</CardDescription>
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
        </CardHeader>

        {!isMinimized && (
          <>
            {/* AI Suggestions */}
            <div className="flex-shrink-0 p-4 border-b bg-accent/5">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Smart Suggestions
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {mockSuggestions.slice(0, 2).map((suggestion) => {
                  const Icon = suggestion.icon
                  return (
                    <div key={suggestion.id} className="p-3 border rounded-lg bg-background hover:bg-accent/50 cursor-pointer">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 ${
                          suggestion.type === 'warning' ? 'text-yellow-500' :
                          suggestion.type === 'security' ? 'text-blue-500' :
                          suggestion.type === 'insight' ? 'text-purple-500' :
                          'text-green-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent'
                    } rounded-lg p-3`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      
                      {message.suggestions && message.type === 'assistant' && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, index) => (
                            <Button 
                              key={index}
                              variant="outline" 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleSendMessage(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-accent rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Quick Actions */}
            <div className="flex-shrink-0 p-4 border-t bg-accent/5">
              <div className="flex flex-wrap gap-2 mb-3">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSendMessage(action.query)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about your backups..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

// Quick AI Assistant trigger button
export function AIAssistantTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      size="icon"
    >
      <Bot className="h-6 w-6" />
    </Button>
  )
}