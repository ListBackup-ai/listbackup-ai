'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard,
  Download,
  Package,
  Calendar,
  Users,
  Database,
  Zap,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Receipt,
  Settings,
  Plus
} from 'lucide-react'
import { api } from '@listbackup/shared/api'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// Mock subscription data - would come from API
const mockSubscription = {
  plan: 'professional',
  status: 'active',
  currentPeriodEnd: new Date('2025-07-14'),
  seats: {
    used: 3,
    included: 5
  },
  usage: {
    storage: {
      used: 85 * 1024 * 1024 * 1024, // 85GB
      limit: 500 * 1024 * 1024 * 1024, // 500GB
      percentage: 17
    },
    apiCalls: {
      used: 145000,
      limit: 1000000,
      percentage: 14.5
    },
    sources: {
      used: 12,
      limit: 50,
      percentage: 24
    }
  },
  billing: {
    amount: 99,
    currency: 'USD',
    interval: 'month',
    nextBillingDate: new Date('2025-07-14')
  }
}

const plans = [
  {
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      '100GB Storage',
      'Up to 10 data sources',
      '100K API calls/month',
      '1 team member',
      'Daily backups',
      'Email support'
    ],
    notIncluded: ['Priority support', 'Custom integrations', 'Advanced analytics']
  },
  {
    name: 'Professional',
    price: 99,
    interval: 'month',
    current: true,
    features: [
      '500GB Storage',
      'Up to 50 data sources',
      '1M API calls/month',
      '5 team members',
      'Hourly backups',
      'Priority support',
      'Advanced analytics'
    ],
    notIncluded: ['Custom integrations', 'Dedicated account manager']
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    interval: 'month',
    features: [
      'Unlimited storage',
      'Unlimited data sources',
      'Unlimited API calls',
      'Unlimited team members',
      'Real-time backups',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager'
    ],
    notIncluded: []
  }
]

const invoices = [
  {
    id: 'inv_1234',
    date: new Date('2025-06-14'),
    amount: 99,
    status: 'paid',
    downloadUrl: '#'
  },
  {
    id: 'inv_1233',
    date: new Date('2025-05-14'),
    amount: 99,
    status: 'paid',
    downloadUrl: '#'
  },
  {
    id: 'inv_1232',
    date: new Date('2025-04-14'),
    amount: 99,
    status: 'paid',
    downloadUrl: '#'
  }
]

export default function BillingPage() {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { toast } = useToast()

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName)
    setShowUpgradeDialog(true)
  }

  const confirmUpgrade = () => {
    toast({
      title: 'Subscription upgraded',
      description: `Successfully upgraded to ${selectedPlan} plan`,
    })
    setShowUpgradeDialog(false)
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, usage, and billing information
          </p>
        </div>
        <Button variant="outline" className="hover:scale-105 transition-transform duration-200">
          <Receipt className="h-4 w-4 mr-2" />
          Billing Portal
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="mb-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Current Plan</CardTitle>
              <CardDescription>Your subscription details and usage</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:scale-110 transition-transform duration-200">
              {mockSubscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg hover:scale-110 transition-transform duration-200">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{mockSubscription.plan} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  ${mockSubscription.billing.amount}/{mockSubscription.billing.interval}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next billing date</p>
              <p className="font-medium">
                {mockSubscription.billing.nextBillingDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Usage Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Storage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockSubscription.usage.storage.percentage}%
                </span>
              </div>
              <Progress value={mockSubscription.usage.storage.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatBytes(mockSubscription.usage.storage.used)} of {formatBytes(mockSubscription.usage.storage.limit)}
              </p>
            </div>

            {/* API Calls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">API Calls</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockSubscription.usage.apiCalls.percentage}%
                </span>
              </div>
              <Progress value={mockSubscription.usage.apiCalls.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {mockSubscription.usage.apiCalls.used.toLocaleString()} of {mockSubscription.usage.apiCalls.limit.toLocaleString()}
              </p>
            </div>

            {/* Sources */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Data Sources</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockSubscription.usage.sources.percentage}%
                </span>
              </div>
              <Progress value={mockSubscription.usage.sources.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {mockSubscription.usage.sources.used} of {mockSubscription.usage.sources.limit}
              </p>
            </div>
          </div>

          {/* Team Seats */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Team Members</p>
                <p className="text-xs text-muted-foreground">
                  {mockSubscription.seats.used} of {mockSubscription.seats.included} seats used
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Add Seats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.current ? 'border-primary' : ''} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white hover:scale-110 transition-transform duration-200">
                  Current Plan
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold">{plan.price}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button 
                    className="w-full hover:scale-105 transition-transform duration-200" 
                    variant={plan.name === 'Enterprise' ? 'outline' : 'default'}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg hover:scale-110 transition-transform duration-200">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
                <Settings className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Billing Address</CardTitle>
            <CardDescription>Address associated with your payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <p className="font-medium">Acme Corporation</p>
              <p className="text-sm text-muted-foreground">
                123 Business Street<br />
                Suite 456<br />
                San Francisco, CA 94105<br />
                United States
              </p>
              <Button variant="outline" size="sm" className="mt-3 hover:scale-105 transition-transform duration-200">
                <Settings className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
          <CardDescription>Download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.date.toLocaleDateString()} • ${invoice.amount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform duration-200">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan}</DialogTitle>
            <DialogDescription>
              Are you sure you want to upgrade to the {selectedPlan} plan? Your new billing amount will be reflected in your next invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>You will be charged a prorated amount for the remainder of this billing cycle.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade}>
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}