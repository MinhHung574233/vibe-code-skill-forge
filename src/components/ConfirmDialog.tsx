import { useEffect, useId, useRef } from 'react';
import { t } from '@/i18n/core';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive confirmations use the danger style and focus Cancel by default. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirmation on a native modal <dialog> (required before deletes and restores). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="modal-dialog m-auto w-[min(90vw,20rem)] rounded-2xl border border-border bg-surface-raised p-5 text-text backdrop:bg-black/40"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className="type-headline">
        {title}
      </h2>
      <p id={descId} className="mt-1.5 type-subhead text-muted">
        {message}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel} autoFocus={destructive}>
          {cancelLabel ?? t('Cancel')}
        </Button>
      </div>
    </dialog>
  );
}
