'use client'

import { useState } from 'react'
import { ChevronDown, Building2, Search, Check, Plus, Building, Store, Briefcase, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@listbackup/shared/utils'
import { useRouter } from 'next/navigation'

interface AccountSwitcherProps {
  accounts: any[]
  currentAccountId: string
  className?: string
}

const accountTypeIcons = {
  conglomerate: Building2,
  subsidiary: Building,
  division: Briefcase,
  location: Store,
  franchise: Home,
}

export function AccountSwitcher({ accounts, currentAccountId, className }: AccountSwitcherProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  const currentAccount = accounts.find(a => a.accountId === currentAccountId)
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Build hierarchy structure
  const buildHierarchy = () => {
    const accountMap = new Map(accounts.map(a => [a.accountId, { ...a, children: [] }]))
    const roots: any[] = []
    
    accounts.forEach(account => {
      const node = accountMap.get(account.accountId)
      if (account.parentAccountId) {
        const parent = accountMap.get(account.parentAccountId)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }
  
  const renderAccountItem = (account: any, level: number = 0) => {
    const Icon = accountTypeIcons[account.accountType as keyof typeof accountTypeIcons] || Building2
    const isSelected = account.accountId === currentAccountId
    
    return (
      <div key={account.accountId}>
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/account?accountId=${account.accountId}`)}
          className={cn(
            "cursor-pointer",
            isSelected && "bg-primary/10",
            level > 0 && "ml-4"
          )}
        >
          <Icon className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{account.name}</span>
              {account.accountType && (
                <Badge variant="outline" className="text-xs">
                  {account.accountType}
                </Badge>
              )}
            </div>
            {account.company && (
              <p className="text-xs text-muted-foreground">{account.company}</p>
            )}
          </div>
          {isSelected && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        {account.children?.map((child: any) => renderAccountItem(child, level + 1))}
      </div>
    )
  }
  
  if (!currentAccount) return null
  
  const CurrentIcon = accountTypeIcons[currentAccount.accountType as keyof typeof accountTypeIcons] || Building2
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <CurrentIcon className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{currentAccount.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]" align="end">
        <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
        
        {accounts.length > 5 && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {searchQuery ? (
            filteredAccounts.length > 0 ? (
              filteredAccounts.map(account => renderAccountItem(account))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No accounts found
              </div>
            )
          ) : (
            buildHierarchy().map(account => renderAccountItem(account))
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => router.push('/dashboard/account/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sub-Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}