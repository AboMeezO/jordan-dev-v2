import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  children,
  confirmLabel,
  description,
  onConfirm,
  title,
  variant = 'default',
}: {
  cancelLabel?: string
  children: ReactNode
  confirmLabel: string
  description: string
  onConfirm: () => void
  title: string
  variant?: 'danger' | 'default'
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content className="nd-panel fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6">
          <DialogPrimitive.Title className="font-mono text-xl tracking-[-0.04em] text-[var(--nd-text-display)]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-3 text-sm leading-6 text-[var(--nd-text-secondary)]">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                type="button"
                variant="outline"
              >
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Button
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                onClick={onConfirm}
                type="button"
                variant={variant === 'danger' ? 'destructive' : 'default'}
              >
                {confirmLabel}
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
