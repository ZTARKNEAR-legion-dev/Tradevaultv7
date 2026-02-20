'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Database } from 'lucide-react'

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
  feature?: string
}

export function ComingSoonModal({ open, onClose, feature = 'This feature' }: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Coming Soon!</DialogTitle>
          <DialogDescription className="text-center">
            {feature} is currently under development and will be available in a future update.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-center text-sm text-muted-foreground">
            We're working hard to bring you the best trading analytics experience. Stay tuned for updates!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
