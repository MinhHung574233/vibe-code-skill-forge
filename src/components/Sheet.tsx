import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

const DISMISS_DISTANCE_PX = 96;
const DISMISS_VELOCITY_PX_PER_MS = 0.6;
const DISMISS_ANIMATION_MS = 180;

/** Pure rule for drag-to-dismiss: far enough, or a fast downward flick. */
export function shouldDismissSheet(dragPx: number, velocityPxPerMs: number): boolean {
  return (
    dragPx > DISMISS_DISTANCE_PX || (dragPx > 8 && velocityPxPerMs > DISMISS_VELOCITY_PX_PER_MS)
  );
}

interface SheetProps {
  open: boolean;
  /** Called for every dismissal path: drag, scrim tap, Escape / system back. */
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom sheet on a native modal <dialog>: free focus trap, inert background, Escape handling
 * and focus return. State stays controlled by the parent via `open`/`onClose`.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startT: number; lastY: number; lastT: number } | null>(
    null,
  );
  const dismissTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDragY(0);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => () => window.clearTimeout(dismissTimer.current), []);

  const dismiss = () => {
    setDragY(window.innerHeight);
    window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(onClose, DISMISS_ANIMATION_MS);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    drag.current = { startY: e.clientY, startT: now, lastY: e.clientY, lastT: now };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.lastY = e.clientY;
    d.lastT = performance.now();
    setDragY(Math.max(0, e.clientY - d.startY));
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    const distance = Math.max(0, d.lastY - d.startY);
    const velocity = distance / Math.max(1, d.lastT - d.startT);
    if (shouldDismissSheet(distance, velocity)) dismiss();
    else setDragY(0);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-xl overflow-hidden rounded-t-3xl border border-b-0 border-border bg-surface-raised p-0 text-text backdrop:bg-black/40"
      style={{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? 'none' : `transform ${DISMISS_ANIMATION_MS}ms ease-out`,
      }}
      onCancel={(e) => {
        e.preventDefault(); // parent owns state
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // scrim tap
      }}
    >
      <div
        className="flex touch-none justify-center pb-2 pt-2.5"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-border" />
      </div>
      <div
        className="max-h-[calc(90dvh-28px)] overflow-y-auto overscroll-contain px-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <h2 id={titleId} className="mb-3 type-title-2">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
