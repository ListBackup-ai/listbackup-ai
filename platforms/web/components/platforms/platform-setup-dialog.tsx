'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Link2,
  ArrowRight,
  Plus,
  AlertCircle
} from 'lucide-react'
import { Platform } from '@listbackup/shared/api'

interface PlatformSetupDialogProps {
  platform: Platform | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlatformSetupDialog({ 
  platform, 
  open, 
  onOpenChange 
}: PlatformSetupDialogProps) {
  const router = useRouter()

  const handleCreateConnection = () => {
    // Navigate to connections page with pre-selected platform
    router.push(`/dashboard/connections?platform=${platform?.id}&action=create`)
    onOpenChange(false)
  }

  const handleViewConnections = () => {
    // Navigate to connections page filtered by platform
    router.push(`/dashboard/connections?platform=${platform?.id}`)
    onOpenChange(false)
  }

  if (!platform) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <img
                src={platform.logo || `https://logo.clearbit.com/${platform.company.toLowerCase()}.com`}
                alt={platform.title}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/api/placeholder/32/32'
                }}
              />
            </div>
            <div>
              <DialogTitle>{platform.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{platform.company}</p>
            </div>
          </div>
          <DialogDescription>
            {platform.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To start backing up data from {platform.title}, you need to create a connection first.
              You can then select which data sources to backup.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Available Data Sources</h4>
            <p className="text-sm text-muted-foreground">
              Once connected, you'll be able to backup:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {(platform.dataTypes || platform.tags || [platform.category]).map((item, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Connection Type</h4>
            <div className="flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {platform.authType === 'oauth2' ? 'OAuth 2.0 (Secure)' : 
                 platform.authType === 'api_key' ? 'API Key' : 
                 'Custom Authentication'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleViewConnections}
            className="w-full sm:w-auto"
          >
            View Existing Connections
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            onClick={handleCreateConnection}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}