import type { ReactNode } from 'react'
import { ErrorIcon } from '../icons'
import Button from './Button'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-ink-faint">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<ErrorIcon size={24} className="text-crit" />}
      title="Gagal memuat data"
      description={message ?? 'Terjadi kesalahan saat menghubungi server.'}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Coba lagi
          </Button>
        )
      }
    />
  )
}
