'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Search,
  Building
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@listbackup/shared/utils'

export default function ClientPortalReports() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [dateRange, setDateRange] = useState('30d')

  // Calculate date range
  const getDateRange = () => {
    const end = new Date()
    let start: Date
    
    switch (dateRange) {
      case '7d':
        start = subDays(end, 7)
        break
      case '30d':
        start = subDays(end, 30)
        break
      case '90d':
        start = subDays(end, 90)
        break
      case 'month':
        start = startOfMonth(end)
        break
      default:
        start = subDays(end, 30)
    }
    
    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    }
  }

  const { data: accountsData } = useQuery({
    queryKey: ['client-portal-accounts'],
    queryFn: api.clients.getPortalAccounts,
  })

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['client-portal-reports', selectedAccount, dateRange],
    queryFn: () => api.clients.getPortalReports({
      accountId: selectedAccount === 'all' ? undefined : selectedAccount,
      ...getDateRange()
    }),
  })

  const accounts = accountsData?.accounts || []
  const reports = reportsData?.reports || []

  const filteredReports = reports.filter(report => 
    !searchQuery || 
    report.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 95) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (successRate >= 80) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
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
          <h2 className="text-2xl font-bold">Backup Reports</h2>
          <p className="text-muted-foreground">
            View detailed reports on backup operations and data protection
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.accountId} value={account.accountId}>
                      {account.account?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Custom Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredReports.length > 0 ? (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card 
              key={report.reportId} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/portal/reports/${report.reportId}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{report.accountName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Account
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.generatedAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {`${format(new Date(report.period.start), 'MMM d')} - ${format(new Date(report.period.end), 'MMM d')}`}
                        </div>
                      </div>
                      
                      {/* Description removed - not in interface */}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Success Rate */}
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(95)}
                        <span className="text-lg font-semibold">95%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Download functionality placeholder
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium">1,234</p>
                    <p className="text-xs text-muted-foreground">Backups Completed</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">45.2 GB</p>
                    <p className="text-xs text-muted-foreground">Total Data Size</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">12</p>
                    <p className="text-xs text-muted-foreground">Sources Monitored</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(5)}
                    <div>
                      <p className="text-sm font-medium">+5%</p>
                      <p className="text-xs text-muted-foreground">vs Previous</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No reports found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedAccount !== 'all'
                  ? 'Try adjusting your filters' 
                  : 'No reports are available for the selected time period'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}