'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react'

interface StatusIndicatorProps {
  service?: string
  endpoint?: string
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

type Status = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown'

interface ServiceStatus {
  status: Status
  latency: number
  lastChecked: Date
}

export function StatusIndicator({ 
  service = 'API', 
  endpoint,
  className = '',
  showLabel = true,
  size = 'md'
}: StatusIndicatorProps) {
  const [status, setStatus] = useState<ServiceStatus>({
    status: 'unknown',
    latency: 0,
    lastChecked: new Date()
  })
  const [isOnline, setIsOnline] = useState(true)

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check service status
  useEffect(() => {
    if (!isOnline) {
      setStatus({ status: 'outage', latency: 0, lastChecked: new Date() })
      return
    }

    const checkStatus = async () => {
      try {
        const startTime = Date.now()
        
        // Use the provided endpoint or default to a health check
        const url = endpoint || `${process.env.NEXT_PUBLIC_API_URL}/health` || 'https://knitting-par-frankfurt-adjust.trycloudflare.com/health'
        
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        })
        
        const latency = Date.now() - startTime
        
        if (response.ok) {
          if (latency > 2000) {
            setStatus({ status: 'degraded', latency, lastChecked: new Date() })
          } else {
            setStatus({ status: 'operational', latency, lastChecked: new Date() })
          }
        } else {
          setStatus({ status: 'outage', latency, lastChecked: new Date() })
        }
      } catch (error) {
        setStatus({ status: 'outage', latency: 0, lastChecked: new Date() })
      }
    }

    // Initial check
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [endpoint, isOnline])

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-500/10',
          label: 'Operational',
          badgeVariant: 'default' as const
        }
      case 'degraded':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500/10',
          label: 'Degraded',
          badgeVariant: 'secondary' as const
        }
      case 'outage':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-500/10',
          label: 'Outage',
          badgeVariant: 'destructive' as const
        }
      case 'maintenance':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-500/10',
          label: 'Maintenance',
          badgeVariant: 'secondary' as const
        }
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-500/10',
          label: 'Unknown',
          badgeVariant: 'outline' as const
        }
    }
  }

  const config = getStatusConfig(status.status)
  const IconComponent = config.icon

  const sizeClasses = {
    sm: { icon: 'w-3 h-3', container: 'gap-1', text: 'text-xs' },
    md: { icon: 'w-4 h-4', container: 'gap-2', text: 'text-sm' },
    lg: { icon: 'w-5 h-5', container: 'gap-2', text: 'text-base' }
  }

  if (!isOnline) {
    return (
      <div className={`flex items-center ${sizeClasses[size].container} ${className}`}>
        <WifiOff className={`${sizeClasses[size].icon} text-red-600`} />
        {showLabel && (
          <span className={`${sizeClasses[size].text} text-red-600`}>
            Offline
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center ${sizeClasses[size].container} ${className}`}>
      <IconComponent className={`${sizeClasses[size].icon} ${config.color}`} />
      {showLabel && (
        <span className={`${sizeClasses[size].text} ${config.color}`}>
          {service} {config.label}
        </span>
      )}
      {status.status === 'operational' && status.latency > 0 && (
        <span className={`${sizeClasses[size].text} text-muted-foreground`}>
          ({status.latency}ms)
        </span>
      )}
    </div>
  )
}

// Compact badge version
export function StatusBadge({ 
  service = 'API',
  endpoint,
  className = ''
}: Omit<StatusIndicatorProps, 'showLabel' | 'size'>) {
  const [status, setStatus] = useState<Status>('unknown')

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const url = endpoint || `${process.env.NEXT_PUBLIC_API_URL}/health` || 'https://knitting-par-frankfurt-adjust.trycloudflare.com/health'
        const response = await fetch(url, { method: 'GET', cache: 'no-cache' })
        setStatus(response.ok ? 'operational' : 'outage')
      } catch {
        setStatus('outage')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [endpoint])

  const getVariant = (status: Status) => {
    switch (status) {
      case 'operational': return 'default'
      case 'degraded': return 'secondary'
      case 'outage': return 'destructive'
      case 'maintenance': return 'secondary'
      default: return 'outline'
    }
  }

  const getLabel = (status: Status) => {
    switch (status) {
      case 'operational': return `${service} ✓`
      case 'degraded': return `${service} ⚠️`
      case 'outage': return `${service} ✗`
      case 'maintenance': return `${service} 🔧`
      default: return `${service} ?`
    }
  }

  return (
    <Badge variant={getVariant(status)} className={`text-xs ${className}`}>
      {getLabel(status)}
    </Badge>
  )
}

// Component for multiple services
export function SystemStatus() {
  const services = [
    { name: 'API', endpoint: '/health' },
    { name: 'Auth', endpoint: '/auth/health' },
    { name: 'Backups', endpoint: '/jobs/health' },
    { name: 'Billing', endpoint: '/billing/health' }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {services.map((service) => (
        <StatusBadge
          key={service.name}
          service={service.name}
          endpoint={service.endpoint}
        />
      ))}
    </div>
  )
}