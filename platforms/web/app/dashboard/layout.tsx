'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Database,
  FolderSync,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bot,
  BarChart3,
  Activity,
  Upload,
  CreditCard,
  Building2,
  Link as LinkIcon,
  Users,
  Bell,
  UserCheck,
} from 'lucide-react'
import { LogoMain } from '@/components/logo/logo-main'
import { cn } from '@listbackup/shared/utils'
import { AIAssistant } from '@/components/ai/ai-assistant-v2'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { ThemeToggle, ThemeToggleCompact } from '@/components/layout/theme-toggle'
import { useBranding } from '@/components/branding/branding-loader'

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'System status and health'
  },
  {
    title: 'Sources',
    href: '/dashboard/sources',
    icon: FolderSync,
    description: 'Connected data sources'
  },
  {
    title: 'Connections',
    href: '/dashboard/connections',
    icon: LinkIcon,
    description: 'Platform connections'
  },
  {
    title: 'Jobs',
    href: '/dashboard/jobs',
    icon: Upload,
    description: 'Backup jobs and schedules'
  },
  {
    title: 'Browse',
    href: '/dashboard/browse',
    icon: Database,
    description: 'Explore backed up data'
  },
  {
    title: 'Monitor',
    href: '/dashboard/monitor',
    icon: Activity,
    description: 'Real-time activity'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance metrics'
  },
  {
    title: 'Accounts',
    href: '/dashboard/accounts',
    icon: Building2,
    description: 'Account management'
  },
  {
    title: 'Teams',
    href: '/dashboard/teams',
    icon: Users,
    description: 'Team collaboration'
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: UserCheck,
    description: 'Client access management'
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    description: 'Alerts & notifications'
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Subscription & usage'
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiMinimized, setAiMinimized] = useState(false)
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-card border-r transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <LogoMain collapsed={!sidebarOpen} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 space-y-3">
          {/* AI Assistant */}
          <Button
            variant="outline"
            size={sidebarOpen ? "default" : "icon"}
            className="w-full"
            onClick={() => setShowAIAssistant(true)}
          >
            <Bot className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">AI Assistant</span>}
          </Button>
          
          {/* Settings */}
          <Link href="/dashboard/settings/user">
            <Button
              variant="ghost"
              size={sidebarOpen ? "default" : "icon"}
              className="w-full"
            >
              <Settings className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Settings</span>}
            </Button>
          </Link>
          
          {/* Theme Toggle */}
          <div className="border-t pt-3">
            {sidebarOpen ? (
              <ThemeToggleCompact />
            ) : (
              <ThemeToggle variant="icon" className="w-full" />
            )}
          </div>
          
          {/* User Info and Logout */}
          <div className="border-t pt-3">
            {sidebarOpen ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">All systems operational</span>
                </div>
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <LogoMain />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="space-y-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <LogoMain />
          </div>
          <NotificationCenter />
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant 
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        isMinimized={aiMinimized}
        onToggleMinimize={() => setAiMinimized(!aiMinimized)}
      />
    </div>
  )
}