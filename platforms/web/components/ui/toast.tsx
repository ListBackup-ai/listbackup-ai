'use client'

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

// Enhanced toast function with custom styling
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      icon: <CheckCircle className="w-5 h-5" />,
      className: 'border-green-200 bg-green-50 text-green-900',
    })
  },
  
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      icon: <XCircle className="w-5 h-5" />,
      className: 'border-red-200 bg-red-50 text-red-900',
    })
  },
  
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      icon: <AlertCircle className="w-5 h-5" />,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    })
  },
  
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      icon: <Info className="w-5 h-5" />,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
    })
  },
  
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },
  
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },
  
  custom: (jsx: React.ReactNode) => {
    sonnerToast.custom(() => <>{jsx}</>)
  },
  
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },
}

// Custom toaster component with branding
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={true}
      richColors={false}
      closeButton={true}
      toastOptions={{
        className: 'rounded-lg border shadow-lg',
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
      theme="light"
    />
  )
}

// Pre-built toast templates for common actions
export const toastTemplates = {
  // Form submissions
  formSuccess: (type: string) => toast.success(
    `${type} submitted successfully!`,
    "We'll get back to you soon."
  ),
  
  formError: () => toast.error(
    "Something went wrong",
    "Please try again or contact support if the problem persists."
  ),
  
  // Integration actions
  integrationConnected: (platform: string) => toast.success(
    `${platform} connected!`,
    "Your data backup is now active."
  ),
  
  integrationError: (platform: string) => toast.error(
    `Failed to connect ${platform}`,
    "Please check your credentials and try again."
  ),
  
  // Account actions
  accountCreated: () => toast.success(
    "Welcome to ListBackup.ai!",
    "Your account has been created successfully."
  ),
  
  accountUpdated: () => toast.success(
    "Account updated",
    "Your changes have been saved."
  ),
  
  // Backup actions
  backupStarted: (source: string) => toast.info(
    `Backup initiated for ${source}`,
    "This may take a few minutes to complete."
  ),
  
  backupCompleted: (source: string, count: number) => toast.success(
    `Backup completed for ${source}`,
    `Successfully backed up ${count.toLocaleString()} records.`
  ),
  
  backupFailed: (source: string) => toast.error(
    `Backup failed for ${source}`,
    "Please check your connection and try again."
  ),
  
  // Subscription actions
  subscriptionUpdated: (plan: string) => toast.success(
    `Upgraded to ${plan}`,
    "Your new features are now available."
  ),
  
  subscriptionCancelled: () => toast.warning(
    "Subscription cancelled",
    "You'll retain access until your current period ends."
  ),
  
  // System notifications
  maintenanceMode: () => toast.warning(
    "Scheduled maintenance",
    "Some features may be temporarily unavailable."
  ),
  
  systemUpdate: () => toast.info(
    "System updated",
    "New features and improvements are now available."
  ),
  
  // Generic actions
  copied: () => toast.success("Copied to clipboard"),
  
  saved: () => toast.success("Changes saved"),
  
  deleted: (item: string) => toast.success(`${item} deleted`),
  
  networkError: () => toast.error(
    "Connection error",
    "Please check your internet connection and try again."
  ),
}

// Hook for easy toast access in components
export function useToast() {
  return {
    toast,
    templates: toastTemplates,
  }
}