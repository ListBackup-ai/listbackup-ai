'use client'

import Image from 'next/image'
import { cn } from '@listbackup/shared/utils'
import { useBranding } from '@/components/branding/branding-loader'

interface LogoMainProps {
  className?: string
  collapsed?: boolean
  variant?: 'full' | 'icon'
}

export function LogoMain({ className, collapsed = false, variant = 'full' }: LogoMainProps) {
  const { logos } = useBranding()
  if (collapsed || variant === 'icon') {
    const logoSrc = logos?.compact || logos?.square || '/images/logo-icon.png'
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {logoSrc.startsWith('data:') ? (
          <img
            src={logoSrc}
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
        ) : (
          <Image
            src={logoSrc}
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        )}
      </div>
    )
  }

  const logoSrc = logos?.full || '/images/logo.png'
  return (
    <div className={cn('flex items-center', className)}>
      {logoSrc.startsWith('data:') ? (
        <img
          src={logoSrc}
          alt="Logo"
          className="h-8 w-auto object-contain"
        />
      ) : (
        <Image
          src={logoSrc}
          alt="Logo"
          width={180}
          height={40}
          className="h-8 w-auto"
          priority
        />
      )}
    </div>
  )
}