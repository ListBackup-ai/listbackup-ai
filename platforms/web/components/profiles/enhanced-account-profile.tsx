"use client"

import React, { useState } from 'react'
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  Globe, 
  Phone, 
  Mail,
  CreditCard,
  Shield,
  Activity,
  Settings,
  Edit3,
  Save,
  X,
  Plus,
  TrendingUp,
  Database,
  Cloud,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Award,
  Crown,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { EntityTagging } from '@/components/tags/entity-tagging'
import { TagDisplay } from '@/components/ui/tag-display'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface EnhancedAccountProfileProps {
  accountId: string
  editable?: boolean
  compact?: boolean
  className?: string
}

interface AccountProfile {
  accountId: string
  name: string
  company?: string
  description?: string
  logo?: string
  level: number
  accountPath: string
  parentAccountId?: string
  
  // Contact Information
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }
  
  // Billing Information
  billing?: {
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
    plan: string
    billingCycle: 'monthly' | 'yearly'
    nextBillingDate?: string
    paymentMethod?: string
  }
  
  // Statistics
  stats?: {
    totalUsers: number
    totalSources: number
    totalJobs: number
    totalBackups: number
    storageUsed: number
    storageLimit: number
    monthlyApiCalls: number
    apiCallsLimit: number
  }
  
  // Compliance
  compliance?: {
    gdprCompliant: boolean
    hipaaCompliant: boolean
    soc2Compliant: boolean
    dataRetentionDays: number
    encryptionEnabled: boolean
  }
  
  // Settings
  settings?: {
    allowSubAccounts: boolean
    enforceSSO: boolean
    requireMFA: boolean
    dataExportEnabled: boolean
    auditLogsEnabled: boolean
    customBranding: boolean
  }
  
  // Dates
  createdAt: string
  updatedAt: string
  lastActivity?: string
}

// Mock data - in real app this would come from API
const mockAccountProfile: AccountProfile = {
  accountId: 'acc-123',
  name: 'Acme Corporation',
  company: 'Acme Corp',
  description: 'Leading provider of innovative solutions for enterprise data management and backup services.',
  logo: '/api/placeholder/100/100',
  level: 0,
  accountPath: '/acme-corp',
  
  contactInfo: {
    email: 'admin@acmecorp.com',
    phone: '+1 (555) 123-4567',
    website: 'https://acmecorp.com',
    address: {
      street: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postalCode: '94105'
    }
  },
  
  billing: {
    status: 'active',
    plan: 'Enterprise',
    billingCycle: 'yearly',
    nextBillingDate: '2024-12-01',
    paymentMethod: '**** 4242'
  },
  
  stats: {
    totalUsers: 45,
    totalSources: 128,
    totalJobs: 67,
    totalBackups: 1250,
    storageUsed: 45.2 * 1024 * 1024 * 1024, // 45.2 GB
    storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB
    monthlyApiCalls: 75000,
    apiCallsLimit: 100000
  },
  
  compliance: {
    gdprCompliant: true,
    hipaaCompliant: true,
    soc2Compliant: true,
    dataRetentionDays: 365,
    encryptionEnabled: true
  },
  
  settings: {
    allowSubAccounts: true,
    enforceSSO: true,
    requireMFA: true,
    dataExportEnabled: true,
    auditLogsEnabled: true,
    customBranding: true
  },
  
  createdAt: '2023-01-15T08:00:00Z',
  updatedAt: '2024-06-20T10:30:00Z',
  lastActivity: '2024-06-20T10:30:00Z'
}

export function EnhancedAccountProfile({
  accountId,
  editable = false,
  compact = false,
  className,
}: EnhancedAccountProfileProps) {
  const [profile, setProfile] = useState<AccountProfile>(mockAccountProfile)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAccountTypeIcon = (level: number) => {
    if (level === 0) return <Crown className="h-5 w-5" />
    if (level === 1) return <Building2 className="h-5 w-5" />
    return <Briefcase className="h-5 w-5" />
  }

  const getAccountTypeName = (level: number) => {
    if (level === 0) return 'Root Account'
    if (level === 1) return 'Division'
    if (level === 2) return 'Sub-Division'
    return `Level ${level}`
  }

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'past_due': return 'text-yellow-600 bg-yellow-100'
      case 'canceled': return 'text-red-600 bg-red-100'
      case 'trialing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.logo} alt={profile.name} />
              <AvatarFallback>
                {getAccountTypeIcon(profile.level)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{getAccountTypeName(profile.level)}</p>
              <div className="mt-2">
                <EntityTagging
                  entityId={accountId}
                  entityType="account"
                  editable={editable}
                  compact={true}
                  showTitle={false}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.logo} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {getAccountTypeIcon(profile.level)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-lg text-muted-foreground">{profile.company}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">
                      {getAccountTypeName(profile.level)}
                    </Badge>
                    {profile.billing && (
                      <Badge className={getBillingStatusColor(profile.billing.status)}>
                        {profile.billing.plan}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Active {new Date(profile.lastActivity!).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {editable && (
              <Button
                variant={editing ? "outline" : "default"}
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Account
                  </>
                )}
              </Button>
            )}
          </div>

          {profile.description && (
            <div className="mt-4">
              <p className="text-muted-foreground">{profile.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.contactInfo?.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.contactInfo.email}</span>
                  </div>
                )}
                {profile.contactInfo?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.contactInfo.phone}</span>
                  </div>
                )}
                {profile.contactInfo?.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={profile.contactInfo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {profile.contactInfo.website}
                    </a>
                  </div>
                )}
                {profile.contactInfo?.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="text-sm">
                      <p>{profile.contactInfo.address.street}</p>
                      <p>
                        {profile.contactInfo.address.city}, {profile.contactInfo.address.state}
                      </p>
                      <p>
                        {profile.contactInfo.address.country} {profile.contactInfo.address.postalCode}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.stats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{profile.stats.totalUsers}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{profile.stats.totalSources}</p>
                        <p className="text-xs text-muted-foreground">Sources</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{profile.stats.totalJobs}</p>
                        <p className="text-xs text-muted-foreground">Jobs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{profile.stats.totalBackups}</p>
                        <p className="text-xs text-muted-foreground">Backups</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage Used</span>
                          <span>{formatBytes(profile.stats.storageUsed)} / {formatBytes(profile.stats.storageLimit)}</span>
                        </div>
                        <Progress 
                          value={(profile.stats.storageUsed / profile.stats.storageLimit) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>API Calls</span>
                          <span>{profile.stats.monthlyApiCalls.toLocaleString()} / {profile.stats.apiCallsLimit.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(profile.stats.monthlyApiCalls / profile.stats.apiCallsLimit) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  View Sources
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and their permissions for this account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">User Management</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage users for this account
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.billing && (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge className={getBillingStatusColor(profile.billing.status)}>
                        {profile.billing.plan}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="text-sm font-medium capitalize">{profile.billing.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Billing Cycle</span>
                      <span className="text-sm font-medium capitalize">{profile.billing.billingCycle}</span>
                    </div>
                    {profile.billing.nextBillingDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Next Billing</span>
                        <span className="text-sm font-medium">
                          {new Date(profile.billing.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {profile.billing.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment Method</span>
                        <span className="text-sm font-medium">{profile.billing.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.stats && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage</span>
                        <span>{formatBytes(profile.stats.storageUsed)} / {formatBytes(profile.stats.storageLimit)}</span>
                      </div>
                      <Progress 
                        value={(profile.stats.storageUsed / profile.stats.storageLimit) * 100} 
                        className="h-3"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>API Calls (Monthly)</span>
                        <span>{profile.stats.monthlyApiCalls.toLocaleString()} / {profile.stats.apiCallsLimit.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(profile.stats.monthlyApiCalls / profile.stats.apiCallsLimit) * 100} 
                        className="h-3"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Active Users</span>
                        <span>{profile.stats.totalUsers} users</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Security
              </CardTitle>
              <CardDescription>
                Security certifications and compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.compliance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Certifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">GDPR Compliant</span>
                        <Badge variant={profile.compliance.gdprCompliant ? "default" : "secondary"}>
                          {profile.compliance.gdprCompliant ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">HIPAA Compliant</span>
                        <Badge variant={profile.compliance.hipaaCompliant ? "default" : "secondary"}>
                          {profile.compliance.hipaaCompliant ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SOC 2 Compliant</span>
                        <Badge variant={profile.compliance.soc2Compliant ? "default" : "secondary"}>
                          {profile.compliance.soc2Compliant ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Security Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Encryption Enabled</span>
                        <Badge variant={profile.compliance.encryptionEnabled ? "default" : "secondary"}>
                          {profile.compliance.encryptionEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Retention</span>
                        <span className="text-sm font-medium">{profile.compliance.dataRetentionDays} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <EntityTagging
            entityId={accountId}
            entityType="account"
            editable={editable}
            compact={false}
            showTitle={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {editable && profile.settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Configure account-level settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-sub-accounts">Allow Sub-Accounts</Label>
                    <Switch id="allow-sub-accounts" checked={profile.settings.allowSubAccounts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enforce-sso">Enforce SSO</Label>
                    <Switch id="enforce-sso" checked={profile.settings.enforceSSO} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-mfa">Require MFA</Label>
                    <Switch id="require-mfa" checked={profile.settings.requireMFA} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="custom-branding">Custom Branding</Label>
                    <Switch id="custom-branding" checked={profile.settings.customBranding} />
                  </div>
                </CardContent>
              </Card>

              {/* Data & Audit Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Data & Audit</CardTitle>
                  <CardDescription>
                    Data management and audit trail settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-export">Data Export Enabled</Label>
                    <Switch id="data-export" checked={profile.settings.dataExportEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="audit-logs">Audit Logs Enabled</Label>
                    <Switch id="audit-logs" checked={profile.settings.auditLogsEnabled} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}