'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@listbackup/shared/utils'

interface BulkOperation {
  id: string
  name: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

interface BulkOperationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  operations: BulkOperation[]
  onConfirm: () => Promise<void>
  onCancel: () => void
  variant?: 'delete' | 'edit' | 'sync' | 'custom'
  confirmText?: string
  cancelText?: string
  isProcessing?: boolean
}

export function BulkOperationsDialog({
  open,
  onOpenChange,
  title,
  description,
  operations,
  onConfirm,
  onCancel,
  variant = 'custom',
  confirmText,
  cancelText = 'Cancel',
  isProcessing = false,
}: BulkOperationsDialogProps) {
  const [currentOperations, setCurrentOperations] = useState<BulkOperation[]>(operations)

  // Calculate progress
  const totalOperations = currentOperations.length
  const completedOperations = currentOperations.filter(
    op => op.status === 'success' || op.status === 'error'
  ).length
  const successfulOperations = currentOperations.filter(op => op.status === 'success').length
  const failedOperations = currentOperations.filter(op => op.status === 'error').length
  const progress = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0

  // Update operations when prop changes
  React.useEffect(() => {
    setCurrentOperations(operations)
  }, [operations])

  const getVariantIcon = () => {
    switch (variant) {
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-500" />
      case 'edit':
        return <Edit className="h-5 w-5 text-blue-500" />
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  const getVariantColor = () => {
    switch (variant) {
      case 'delete':
        return 'text-red-600 hover:text-red-700'
      case 'edit':
        return 'text-blue-600 hover:text-blue-700'
      case 'sync':
        return 'text-green-600 hover:text-green-700'
      default:
        return ''
    }
  }

  const getDefaultConfirmText = () => {
    switch (variant) {
      case 'delete':
        return `Delete ${totalOperations} items`
      case 'edit':
        return `Edit ${totalOperations} items`
      case 'sync':
        return `Sync ${totalOperations} items`
      default:
        return 'Confirm'
    }
  }

  const getStatusIcon = (status: BulkOperation['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: BulkOperation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Bulk operation failed:', error)
    }
  }

  const isCompleted = completedOperations === totalOperations && totalOperations > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getVariantIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Progress Section */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{completedOperations} of {totalOperations} completed</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {/* Summary Stats */}
              <div className="flex items-center gap-4 text-sm">
                {successfulOperations > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {successfulOperations} succeeded
                  </div>
                )}
                {failedOperations > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {failedOperations} failed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Items to process ({totalOperations})
              </h4>
              {isCompleted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  All operations completed
                </Badge>
              )}
            </div>
            
            <ScrollArea className="max-h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {currentOperations.map((operation, index) => (
                  <div key={operation.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(operation.status)}
                        <span className="text-sm font-medium truncate">
                          {operation.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(operation.status)}
                      </div>
                    </div>
                    
                    {/* Error Message */}
                    {operation.status === 'error' && operation.error && (
                      <div className="ml-7 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{operation.error}</span>
                        </div>
                      </div>
                    )}
                    
                    {index < currentOperations.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {isCompleted ? (
                `Completed: ${successfulOperations} successful, ${failedOperations} failed`
              ) : (
                `${totalOperations} items selected`
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing && !isCompleted}
              >
                {isCompleted ? 'Close' : cancelText}
              </Button>
              {!isCompleted && (
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing || totalOperations === 0}
                  className={cn(variant === 'delete' && getVariantColor())}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText || getDefaultConfirmText()
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}