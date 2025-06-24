import { cn } from '@listbackup/shared/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
  text?: string
}

export function Loading({ 
  size = 'md', 
  variant = 'spinner', 
  className,
  text 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div 
          className={cn(
            'animate-spin rounded-full border-2 border-muted border-t-primary',
            sizeClasses[size]
          )}
        />
        {text && (
          <p className={cn('mt-2 text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary rounded-full animate-pulse',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
        {text && (
          <p className={cn('mt-2 text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div 
          className={cn(
            'bg-primary rounded-full animate-pulse',
            sizeClasses[size]
          )}
        />
        {text && (
          <p className={cn('mt-2 text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  return null
}

// Skeleton loading components
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-muted rounded', className)} />
  )
}

export function LoadingCard() {
  return (
    <div className="border rounded-lg p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-muted rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  )
}