'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building, 
  Search,
  FileText,
  Database,
  Calendar,
  Shield,
  Users,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@listbackup/shared/utils'

export default function ClientPortalAccounts() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['client-portal-accounts'],
    queryFn: api.clients.getPortalAccounts,
  })

  const accounts = accountsData?.accounts || []

  const filteredAccounts = accounts.filter(account => 
    !searchQuery || 
    account.account?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account?.accountPath.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPermissionBadges = (permissions: string[]) => {
    return permissions.map(permission => {
      const config = {
        read: { label: 'Read', variant: 'secondary' as const },
        reports: { label: 'Reports', variant: 'outline' as const },
        exports: { label: 'Exports', variant: 'outline' as const },
        analytics: { label: 'Analytics', variant: 'outline' as const },
      }[permission] || { label: permission, variant: 'default' as const }

      return (
        <Badge key={permission} variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Managed Accounts</h2>
          <p className="text-muted-foreground">
            View and access accounts you have permissions for
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts by name or path..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((clientAccount) => {
            const account = clientAccount.account
            const isExpired = !!(clientAccount.expiresAt && new Date(clientAccount.expiresAt) < new Date())

            return (
              <Card 
                key={clientAccount.accountId} 
                className={cn(
                  "hover:shadow-lg transition-shadow cursor-pointer",
                  isExpired && "opacity-60"
                )}
                onClick={() => !isExpired && router.push(`/portal/accounts/${clientAccount.accountId}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{account?.name}</CardTitle>
                    </div>
                    {isExpired && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {account?.accountPath}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Permissions */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {getPermissionBadges(clientAccount.permissions)}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{account?.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Granted</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(clientAccount.grantedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {clientAccount.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expires</span>
                        <span className={cn(
                          "font-medium",
                          isExpired ? "text-red-600" : "text-yellow-600"
                        )}>
                          {isExpired ? 'Expired' : format(new Date(clientAccount.expiresAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <div className="text-center">
                      <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">12</p>
                      <p className="text-xs text-muted-foreground">Reports</p>
                    </div>
                    <div className="text-center">
                      <Database className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">8</p>
                      <p className="text-xs text-muted-foreground">Exports</p>
                    </div>
                    <div className="text-center">
                      <Activity className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">Active</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={isExpired}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/portal/accounts/${clientAccount.accountId}`)
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Building className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No accounts found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'No accounts match your search criteria' 
                  : 'You don\'t have access to any accounts yet'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Need access to more accounts?</p>
              <p className="text-sm text-muted-foreground">
                Contact your account administrator to request access to additional accounts or update your permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}