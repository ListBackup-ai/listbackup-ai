'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  Archive,
  Settings,
  Volume2,
  VolumeX,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: 'backup' | 'sync' | 'system' | 'security' | 'billing'
  actions?: {
    label: string
    action: () => void
  }[]
  metadata?: {
    sourceId?: string
    jobId?: string
    fileName?: string
  }
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Backup Completed',
    message: 'Google Drive backup completed successfully. 1,247 files processed.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    category: 'backup',
    actions: [
      { label: 'View Details', action: () => console.log('View details') }
    ]
  },
  {
    id: '2',
    type: 'warning',
    title: 'Storage Warning',
    message: 'You\'ve used 85% of your storage quota. Consider upgrading your plan.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    category: 'system',
    actions: [
      { label: 'Upgrade Plan', action: () => console.log('Upgrade') },
      { label: 'Manage Storage', action: () => console.log('Manage') }
    ]
  },
  {
    id: '3',
    type: 'error',
    title: 'Sync Failed',
    message: 'Keap sync failed due to authentication error. Please re-authenticate.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: true,
    category: 'sync',
    actions: [
      { label: 'Fix Now', action: () => console.log('Fix') }
    ]
  },
  {
    id: '4',
    type: 'info',
    title: 'New Integration Available',
    message: 'HubSpot integration is now available. Connect your HubSpot account to start backing up.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    category: 'system'
  },
  {
    id: '5',
    type: 'success',
    title: 'Security Update',
    message: 'Two-factor authentication has been successfully enabled for your account.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    category: 'security'
  }
]

interface NotificationCenterProps {
  position?: 'dropdown' | 'page'
}

export function NotificationCenter({ position = 'dropdown' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { toast } = useToast()

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const random = Math.random()
      if (random > 0.95) { // 5% chance every second
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'New Activity',
          message: 'A backup job has started for your Stripe data.',
          timestamp: new Date(),
          read: false,
          category: 'backup'
        }
        setNotifications(prev => [newNotification, ...prev])
        
        if (soundEnabled) {
          // Play notification sound (you'd implement this)
          console.log('🔔 Notification sound')
        }
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
        })
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [soundEnabled, toast])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div 
      className={cn(
        "p-4 transition-all duration-200 cursor-pointer",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20",
        "hover:bg-muted/50"
      )}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{notification.title}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => deleteNotification(notification.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            <Badge variant="outline" className="text-xs">
              {notification.category}
            </Badge>
          </div>
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={index === 0 ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (position === 'page') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your backup activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Archive className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.slice(0, 5).map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>
        
        {notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button variant="outline" className="w-full" size="sm">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}