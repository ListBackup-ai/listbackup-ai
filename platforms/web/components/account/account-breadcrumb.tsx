'use client'

import { Fragment } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@listbackup/shared/utils'

interface AccountBreadcrumbProps {
  account: any
  hierarchy?: any
  className?: string
}

export function AccountBreadcrumb({ account, hierarchy, className }: AccountBreadcrumbProps) {
  // Build breadcrumb path from hierarchy
  const buildPath = () => {
    if (!hierarchy || !hierarchy.path) {
      return [{ id: account.accountId, name: account.name, href: `/dashboard/account` }]
    }

    const parts = hierarchy.path.filter((a: any) => a.accountId !== account.accountId)
    const breadcrumbs = parts.map((ancestor: any) => ({
      id: ancestor.accountId,
      name: ancestor.name,
      href: `/dashboard/account?accountId=${ancestor.accountId}`
    }))

    // Add current account
    breadcrumbs.push({
      id: account.accountId,
      name: account.name,
      href: `/dashboard/account`
    })

    return breadcrumbs
  }

  const breadcrumbs = buildPath()

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((item: any, index: number) => (
        <Fragment key={item.id}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{item.name}</span>
          ) : (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}