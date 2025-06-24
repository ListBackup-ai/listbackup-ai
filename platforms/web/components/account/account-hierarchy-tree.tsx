'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Building2, Building, Briefcase, Store, Home, Users, Plus, MoreHorizontal, Eye, Edit, Trash2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@listbackup/shared/utils'
import { useRouter } from 'next/navigation'

interface AccountNode {
  accountId: string
  name: string
  type: string
  status: string
  userCount: number
  sourceCount: number
  childAccounts?: AccountNode[]
  level: number
  expanded?: boolean
}

interface AccountHierarchyTreeProps {
  hierarchy: any
  currentAccountId: string
  onAccountSelect?: (accountId: string) => void
  onCreateSubAccount?: (parentId: string) => void
  onEditAccount?: (accountId: string) => void
  onDeleteAccount?: (accountId: string) => void
}

const accountTypeIcons = {
  conglomerate: Building2,
  subsidiary: Building,
  division: Briefcase,
  location: Store,
  franchise: Home,
}

const accountTypeColors = {
  conglomerate: 'text-purple-600',
  subsidiary: 'text-blue-600',
  division: 'text-green-600',
  location: 'text-orange-600',
  franchise: 'text-pink-600',
}

export function AccountHierarchyTree({
  hierarchy,
  currentAccountId,
  onAccountSelect,
  onCreateSubAccount,
  onEditAccount,
  onDeleteAccount,
}: AccountHierarchyTreeProps) {
  const router = useRouter()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([currentAccountId]))

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: AccountNode, depth: number = 0) => {
    const Icon = accountTypeIcons[node.type as keyof typeof accountTypeIcons] || Building
    const iconColor = accountTypeColors[node.type as keyof typeof accountTypeColors] || 'text-gray-600'
    const isExpanded = expandedNodes.has(node.accountId)
    const isCurrent = node.accountId === currentAccountId
    const hasChildren = node.childAccounts && node.childAccounts.length > 0

    return (
      <div key={node.accountId}>
        <div
          className={cn(
            "group flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors",
            isCurrent && "bg-primary/10 hover:bg-primary/15",
            depth > 0 && "ml-6"
          )}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleNode(node.accountId)}
            className={cn(
              "p-0.5 rounded hover:bg-muted",
              !hasChildren && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Node Content */}
          <div
            className="flex-1 flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (onAccountSelect) {
                onAccountSelect(node.accountId)
              } else {
                router.push(`/dashboard/account?accountId=${node.accountId}`)
              }
            }}
          >
            <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  isCurrent && "text-primary"
                )}>
                  {node.name}
                </span>
                {node.status !== 'active' && (
                  <Badge variant="secondary" className="text-xs">
                    {node.status}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.userCount} users
                </span>
                <span>{node.sourceCount} sources</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/account?accountId=${node.accountId}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onCreateSubAccount && (
                  <DropdownMenuItem onClick={() => onCreateSubAccount(node.accountId)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push(`/dashboard/account/users?accountId=${node.accountId}`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onEditAccount && (
                  <DropdownMenuItem onClick={() => onEditAccount(node.accountId)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Account
                  </DropdownMenuItem>
                )}
                {onDeleteAccount && (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDeleteAccount(node.accountId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {depth > 0 && (
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            )}
            {node.childAccounts!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!hierarchy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Hierarchy</CardTitle>
          <CardDescription>
            Your organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hierarchy data available
          </p>
        </CardContent>
      </Card>
    )
  }

  // Transform hierarchy data into tree structure
  const buildTree = (account: any): AccountNode => {
    return {
      accountId: account.accountId,
      name: account.name,
      type: account.accountType || 'location',
      status: account.status || 'active',
      userCount: account.userCount || 0,
      sourceCount: account.sourceCount || 0,
      level: account.level || 0,
      childAccounts: account.childAccounts?.map(buildTree),
    }
  }

  const rootNode = buildTree(hierarchy)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Hierarchy</CardTitle>
            <CardDescription>
              Navigate your organizational structure
            </CardDescription>
          </div>
          {onCreateSubAccount && (
            <Button
              onClick={() => onCreateSubAccount(currentAccountId)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Account
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {renderNode(rootNode)}
        </div>

        {/* Summary Stats */}
        {hierarchy.totalDescendants > 0 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold">{hierarchy.totalDescendants + 1}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{hierarchy.totalUsers || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sources</p>
              <p className="text-2xl font-bold">{hierarchy.totalSources || 0}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}