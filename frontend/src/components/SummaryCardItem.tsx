import { useState } from 'react'
import type { SummaryCard } from '../lib/api'
import { api } from '../lib/api'

const STATUS_LABEL: Record<SummaryCard['status'], string> = {
  ok: 'Aman',
  warning: 'Perlu perhatian',
  critical: 'Kritis',
  degraded: 'Tidak dapat memuat',
}

const STATUS_CLASS: Record<SummaryCard['status'], string> = {
  ok: 'bg-good-soft text-good',
  warning: 'bg-warn-soft text-warn',
  critical: 'bg-crit-soft text-crit',
  degraded: 'bg-line/60 text-ink-soft',
}

export default function SummaryCardItem({ card }: { card: SummaryCard }) {
  const [navigating, setNavigating] = useState(false)

  const open = async () => {
    setNavigating(true)
    try {
      const { redirect_url } = await api.handoff(card.app_code)
      window.location.href = redirect_url
    } finally {
      setNavigating(false)
    }
  }

  return (
    <button
      onClick={open}
      disabled={navigating}
      className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:shadow-md disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{card.app_name}</p>
          {card.unit && <p className="text-xs text-ink-soft">{card.unit.name}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[card.status]}`}>
          {STATUS_LABEL[card.status]}
        </span>
      </div>

      {card.headline && <p className="text-sm text-ink-soft">{card.headline}</p>}

      {card.metrics.length > 0 && (
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {card.metrics.map((metric) => (
            <div key={metric.label} className="flex items-baseline gap-1.5">
              <dt className="text-xs text-ink-soft">{metric.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {card.can_act && (
        <span className="mt-1 text-xs font-medium text-accent-strong">Perlu tindakan →</span>
      )}
    </button>
  )
}
