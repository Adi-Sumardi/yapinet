import type { ReactNode } from 'react'

export default function Card({
  title,
  description,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={`rounded-2xl border border-line-soft bg-surface ${padded ? 'p-5' : ''} ${className}`}>
      {(title || actions) && (
        <div className={`flex flex-wrap items-start justify-between gap-3 ${padded ? 'mb-4' : 'px-5 pt-5 pb-4'}`}>
          <div>
            {title && <h2 className="font-display text-base font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
