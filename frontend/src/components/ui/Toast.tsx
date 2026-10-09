import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon, SpinnerIcon, XIcon } from '../icons'

/**
 * Toast Yapinet — pengganti window.alert (rules/design.md → "Notifikasi &
 * Konfirmasi"). Dipasang sekali lewat <ToastProvider>, dipakai lewat useToast().
 */

type Variant = 'success' | 'error' | 'warning' | 'info' | 'loading'

type ToastAction = { label: string; onClick: () => void }

export type ToastOptions = { description?: ReactNode; action?: ToastAction; duration?: number | null }

type ToastItem = {
  id: number
  variant: Variant
  title: ReactNode
  description?: ReactNode
  action?: ToastAction
  duration: number | null
  leaving: boolean
}

type PromiseMessages<T> = {
  loading: ReactNode
  success: ReactNode | ((value: T) => ReactNode)
  error?: ReactNode | ((error: unknown) => ReactNode)
}

export type ToastApi = {
  success: (title: ReactNode, options?: ToastOptions) => number
  error: (title: ReactNode, options?: ToastOptions) => number
  warning: (title: ReactNode, options?: ToastOptions) => number
  info: (title: ReactNode, options?: ToastOptions) => number
  loading: (title: ReactNode, options?: ToastOptions) => number
  dismiss: (id: number) => void
  promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>) => Promise<T>
}

const DEFAULT_DURATION: Record<Variant, number | null> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: null, // error tetap tampil sampai ditutup
  loading: null,
}

const STYLE: Record<Variant, { color: string; soft: string; icon: ReactNode }> = {
  success: {
    color: 'var(--color-good)',
    soft: 'var(--color-good-soft)',
    icon: <CheckIcon size={18} strokeWidth={2.6} />,
  },
  error: { color: 'var(--color-crit)', soft: 'var(--color-crit-soft)', icon: <ErrorIcon size={18} /> },
  warning: { color: 'var(--color-warn)', soft: 'var(--color-warn-soft)', icon: <AlertIcon size={18} /> },
  info: { color: 'var(--color-accent)', soft: 'var(--color-accent-soft)', icon: <InfoIcon size={18} /> },
  loading: { color: 'var(--color-accent)', soft: 'var(--color-accent-soft)', icon: <SpinnerIcon size={18} /> },
}

const ToastContext = createContext<ToastApi | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 170)
  }, [])

  const push = useCallback((variant: Variant, title: ReactNode, options: ToastOptions = {}, id = nextId++) => {
    const duration =
      options.duration !== undefined
        ? options.duration
        : options.action
          ? Math.max(6000, DEFAULT_DURATION[variant] ?? 0)
          : DEFAULT_DURATION[variant]
    const item: ToastItem = { id, variant, title, ...options, duration, leaving: false }

    setItems((list) => (list.some((t) => t.id === id) ? list.map((t) => (t.id === id ? item : t)) : [...list, item]))
    return id
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, options) => push('success', title, options),
      error: (title, options) => push('error', title, options),
      warning: (title, options) => push('warning', title, options),
      info: (title, options) => push('info', title, options),
      loading: (title, options) => push('loading', title, options),
      dismiss: remove,
      promise: async (promise, messages) => {
        const id = push('loading', messages.loading)
        try {
          const value = await promise
          push('success', typeof messages.success === 'function' ? messages.success(value) : messages.success, {}, id)
          return value
        } catch (error) {
          const fallback = error instanceof Error ? error.message : 'Terjadi kesalahan.'
          const message = typeof messages.error === 'function' ? messages.error(error) : (messages.error ?? fallback)
          push('error', message, { description: messages.error ? fallback : undefined }, id)
          throw error
        }
      },
    }),
    [push, remove],
  )

  const visible = items.slice(-3).reverse()

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-2.5 sm:inset-x-auto sm:right-4 sm:top-20 sm:w-[380px]"
        aria-live="polite"
      >
        {visible.map((item, depth) => (
          <ToastCard key={item.id} item={item} depth={depth} onDismiss={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, depth, onDismiss }: { item: ToastItem; depth: number; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  const [dragX, setDragX] = useState(0)
  const startX = useRef<number | null>(null)
  const style = STYLE[item.variant]

  const onPointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('button')) return
    startX.current = event.clientX
    setPaused(true)
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (startX.current !== null) setDragX(event.clientX - startX.current)
  }
  const onPointerUp = () => {
    if (startX.current === null) return
    startX.current = null
    setPaused(false)
    if (Math.abs(dragX) > 80) onDismiss()
    else setDragX(0)
  }

  return (
    <div
      role={item.variant === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto relative w-full touch-pan-y select-none overflow-hidden rounded-2xl border border-line-soft bg-surface/95 shadow-[0_12px_32px_rgba(15,42,82,0.14)] backdrop-blur ${item.leaving ? 'toast-leave' : 'toast-enter'}`}
      style={{
        transform: dragX ? `translateX(${dragX}px)` : `scale(${1 - depth * 0.03})`,
        opacity: dragX ? Math.max(0.2, 1 - Math.abs(dragX) / 200) : 1 - depth * 0.12,
        transition: startX.current === null ? 'transform 200ms, opacity 200ms' : undefined,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: style.color }} />
      <div className="flex items-start gap-3 py-3.5 pl-4.5 pr-3">
        <div
          className="icon-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: style.soft, color: style.color }}
        >
          {style.icon}
        </div>
        <div className="min-w-0 flex-1 pt-1.5">
          <p className="text-sm font-semibold leading-snug text-ink">{item.title}</p>
          {item.description && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{item.description}</p>}
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick()
                onDismiss()
              }}
              className="mt-2 rounded-lg px-2 py-1 -ml-2 text-xs font-bold hover:bg-surface-soft"
              style={{ color: style.color }}
            >
              {item.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink"
        >
          <XIcon size={16} />
        </button>
      </div>
      {item.duration !== null && !item.leaving && (
        <div
          className="toast-progress absolute bottom-0 left-0 h-[3px] w-full"
          style={{
            background: style.color,
            opacity: 0.45,
            animationDuration: `${item.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
          onAnimationEnd={onDismiss}
        />
      )}
    </div>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>')
  return ctx
}
