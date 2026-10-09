import type { ReactNode } from 'react'
import type { SummaryStatus, Tone } from '../../lib/types'

const TONE: Record<Tone, string> = {
  info: 'bg-accent-soft text-accent',
  ok: 'bg-good-soft text-good',
  warning: 'bg-warn-soft text-warn',
  critical: 'bg-crit-soft text-crit',
  neutral: 'bg-surface-soft text-ink-soft',
}

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone] ?? TONE.neutral}`}
    >
      {children}
    </span>
  )
}

export const STATUS_LABEL: Record<SummaryStatus, string> = {
  ok: 'Aman',
  warning: 'Perlu perhatian',
  critical: 'Kritis',
  degraded: 'Belum ada data',
}

export const STATUS_TONE: Record<SummaryStatus, Tone> = {
  ok: 'ok',
  warning: 'warning',
  critical: 'critical',
  degraded: 'neutral',
}

const DOT: Record<SummaryStatus, string> = {
  ok: 'bg-good',
  warning: 'bg-warn',
  critical: 'bg-crit',
  degraded: 'bg-ink-faint/50',
}

export function StatusDot({ status, className = '' }: { status: SummaryStatus; className?: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-surface ${DOT[status]} ${className}`}
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
    />
  )
}
