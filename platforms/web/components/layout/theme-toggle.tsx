'use client'

import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@listbackup/shared/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'icon' | 'button' | 'dropdown'
}

export function ThemeToggle({ className, showLabel = false, variant = 'dropdown' }: ThemeToggleProps) {
  const { setTheme, theme, systemTheme } = useTheme()
  
  const currentTheme = theme === 'system' ? systemTheme : theme
  
  const getIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }
  
  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
      default:
        return 'Theme'
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(currentTheme === 'light' ? 'dark' : 'light')}
        className={cn("hover:bg-muted", className)}
      >
        {getIcon()}
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(currentTheme === 'light' ? 'dark' : 'light')}
        className={cn("gap-2", className)}
      >
        {getIcon()}
        {showLabel && <span>{getLabel()}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={showLabel ? "sm" : "icon"}
          className={cn("gap-2", className)}
        >
          {getIcon()}
          {showLabel && <span>{getLabel()}</span>}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for sidebar footer
export function ThemeToggleCompact() {
  const { setTheme, theme } = useTheme()
  
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme || 'system')
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-full justify-start gap-2 text-xs"
    >
      {theme === 'light' && <Sun className="h-3 w-3" />}
      {theme === 'dark' && <Moon className="h-3 w-3" />}
      {theme === 'system' && <Monitor className="h-3 w-3" />}
      <span className="capitalize">{theme || 'system'} mode</span>
    </Button>
  )
}