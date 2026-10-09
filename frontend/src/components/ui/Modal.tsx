import { useRef, type ReactNode } from 'react'
import { XIcon } from '../icons'
import { useDialogA11y } from './useDialogA11y'

/** Dialog umum untuk form singkat. Bottom sheet di mobile, kartu di tengah di desktop. */
export default function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogA11y(panelRef, { onEscape: onClose })

  return (
    <div
      className="overlay-in fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 backdrop-blur-[4px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="dialog-in max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_rgba(15,42,82,0.18)] outline-none sm:max-w-lg sm:rounded-3xl sm:pb-6 sm:pt-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink"
          >
            <XIcon />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}
