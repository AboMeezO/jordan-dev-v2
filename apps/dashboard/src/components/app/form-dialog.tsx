import { Dialog as DialogPrimitive } from 'radix-ui'
import type { FormEvent, ReactNode } from 'react'

import { Button } from '#/components/ui/button'

export function FormDialog({
  children,
  description,
  error,
  isPending,
  onOpenChange,
  open,
  onSubmit,
  submitDisabled,
  submitLabel,
  title,
}: {
  children?: ReactNode
  description?: string
  error?: string | null
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  onSubmit: (e: FormEvent) => void
  submitDisabled?: boolean
  submitLabel: string
  title: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className="nd-panel fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={() => onOpenChange(false)}
        >
          <form onSubmit={onSubmit}>
            <DialogPrimitive.Title className="font-mono text-xl tracking-[-0.04em] text-(--nd-text-display)">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-3 text-sm leading-6 text-(--nd-text-secondary)">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            <div className="mt-4 grid gap-4">
              {children}
            </div>
            {error ? (
              <p className="mt-4 text-xs leading-5 text-(--nd-accent)">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <DialogPrimitive.Close asChild>
                <Button
                  className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                  disabled={isPending}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogPrimitive.Close>
              <Button
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                disabled={submitDisabled || isPending}
                type="submit"
              >
                {isPending ? `${submitLabel}...` : submitLabel}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
