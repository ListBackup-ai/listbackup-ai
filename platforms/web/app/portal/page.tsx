'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  Building, 
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function PortalDashboard() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['client-portal-profile'],
    queryFn: api.clients.getPortalProfile,
  })

  const { data: accountsData } = useQuery({
    queryKey: ['client-portal-accounts'],
    queryFn: api.clients.getPortalAccounts,
  })

  const { data: reportsData } = useQuery({
    queryKey: ['client-portal-reports', selectedTimeframe],
    queryFn: () => api.clients.getPortalReports({ 
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }),
  })

  const { data: exportsData } = useQuery({
    queryKey: ['client-portal-exports'],
    queryFn: () => api.clients.getPortalExports(),
  })

  const accounts = accountsData?.accounts || []
  const reports = reportsData?.reports || []
  const exports = exportsData?.exports || []

  // Calculate stats - using default values since report structure is generic
  const totalBackups = accounts.length * 10 // Placeholder
  const totalDataSize = 1024 * 1024 * 1024 * 50 // 50GB placeholder
  const successRate = 98.5 // Placeholder

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {profile?.name}
        </h2>
        <p className="text-muted-foreground">
          Access your backup reports and data exports across all managed accounts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Managed Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {profile?.accessibleTeams || 0} teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Backups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBackups.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Data Protected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalDataSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Compressed & encrypted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              {successRate >= 95 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <Progress value={successRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
            <CardDescription>
              Your latest backup reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 3).map((report) => (
                  <div key={report.reportId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{report.accountName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.generatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/portal/reports/${report.reportId}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reports available yet</p>
              </div>
            )}
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => router.push('/portal/reports')}
            >
              View All Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Exports</CardTitle>
            <CardDescription>
              Available data downloads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exports.length > 0 ? (
              <div className="space-y-3">
                {exports.slice(0, 3).map((export_) => (
                  <div key={export_.exportId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{export_.sourceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {export_.size}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(export_.downloadUrl, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exports available yet</p>
              </div>
            )}
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => router.push('/portal/exports')}
            >
              Browse All Exports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Managed Accounts</CardTitle>
          <CardDescription>
            Accounts you have access to view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.accountId} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{account.account?.name}</h4>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {account.permissions.includes('read') ? 'Read' : 'Limited'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Path: {account.account?.accountPath}
                    </p>
                    <p className="text-muted-foreground">
                      Granted: {formatDistanceToNow(new Date(account.grantedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => router.push(`/portal/accounts/${account.accountId}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No accounts available</p>
              <p className="text-sm mt-1">Contact your administrator for access</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}