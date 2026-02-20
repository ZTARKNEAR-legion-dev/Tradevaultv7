'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variantStyles = {
    danger: {
      icon: <Trash2 className="h-12 w-12 text-red-500" />,
      iconBg: 'bg-red-500/10',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
      iconBg: 'bg-amber-500/10',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <AlertTriangle className="h-12 w-12 text-blue-500" />,
      iconBg: 'bg-blue-500/10',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const style = variantStyles[variant]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Icon */}
          <div className={`rounded-full p-4 ${style.iconBg}`}>
            {style.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground">{title}</h2>

          {/* Message */}
          <p className="text-sm text-muted-foreground">{message}</p>

          {/* Buttons */}
          <div className="mt-2 flex w-full gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${style.button}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
