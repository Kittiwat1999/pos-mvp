import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ActionConfirmVariant = 'confirmation' | 'warning' | 'danger';

export type ActionConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  variant?: ActionConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
};

const variantConfig = {
  confirmation: {
    icon: CheckCircle2,
    iconWrap: 'bg-primary/15 text-primary',
    confirmVariant: 'default' as const,
    defaultConfirmText: 'Confirm',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    confirmVariant: 'orange' as const,
    defaultConfirmText: 'Continue',
  },
  danger: {
    icon: Trash2,
    iconWrap: 'bg-destructive/15 text-destructive',
    confirmVariant: 'destructive' as const,
    defaultConfirmText: 'Delete',
  },
} as const;

export default function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'confirmation',
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
}: ActionConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const loading = isLoading || pending;
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (loading) return;

    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setPending(true);
        await result;
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={loading}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup role="alertdialog" className="sm:max-w-md" aria-busy={loading}>
          <DialogHeader className="sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <div
              className={cn(
                'mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0',
                config.iconWrap,
              )}
            >
              <Icon className="size-6" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={config.confirmVariant}
              disabled={loading}
              onClick={() => {
                void handleConfirm();
              }}
            >
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {confirmText ?? config.defaultConfirmText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
