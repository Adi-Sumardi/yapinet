import { useMemo, useState } from 'react'
import type { AttentionItem, Metric, SummaryCard, Tone, When } from '../../lib/types'
import { formatRupiahShort, formatValue } from '../../lib/format'
import Badge from '../../components/ui/Badge'
import SectionRenderer from './sections'

/**
 * Halaman detail generik kontrak v1.1 (rules/detail-pages.md): filter dari
 * aplikasi → Perlu perhatian → Angka kunci → sections. Item ber-`when` hanya
 * tampil bila cocok dengan filter terpilih.
 */

const SEVERITY: Record<Tone, number> = { critical: 0, warning: 1, info: 2, ok: 3, neutral: 4 }

const ATTENTION_STYLE: Record<Tone, { card: string; label: string }> = {
  critical: { card: 'border-crit/30 bg-crit-soft/40', label: 'Kritis' },
  warning: { card: 'border-warn/30 bg-warn-soft/40', label: 'Perhatian' },
  info: { card: 'border-accent/20 bg-accent-soft/40', label: 'Info' },
  ok: { card: 'border-good/25 bg-good-soft/40', label: 'Baik' },
  neutral: { card: 'border-line-soft bg-surface', label: 'Catatan' },
}

const TREND_TEXT: Record<Tone, string> = {
  critical: 'text-crit',
  warning: 'text-warn',
  ok: 'text-good',
  info: 'text-accent',
  neutral: 'text-ink-soft',
}

function matches(when: When | undefined, selected: Record<string, string>, keys: Set<string>): boolean {
  if (!when) return true
  // Key yang tidak dikenal sebagai filter diabaikan, supaya data tetap tampil.
  return Object.entries(when).every(([key, value]) => !keys.has(key) || selected[key] === value)
}

export default function DetailView({ card, onOpen }: { card: SummaryCard; onOpen: (path: string) => void }) {
  const filters = useMemo(() => card.filters ?? [], [card.filters])
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.key, f.default])),
  )
  const keys = useMemo(() => new Set(filters.map((f) => f.key)), [filters])
  const visible = <T extends { when?: When }>(items: T[] = []) => items.filter((i) => matches(i.when, selected, keys))

  const attention = visible(card.attention)
    .sort((a, b) => SEVERITY[a.tone] - SEVERITY[b.tone])
    .slice(0, 3)
  const metrics = visible(card.metrics)
  const sections = visible(card.sections)

  return (
    <div className="flex flex-col gap-6">
      {filters.length > 0 && (
        <section aria-label="Filter" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Tampilkan</span>
          {filters.map((filter) => (
            <label
              key={filter.key}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink focus-within:ring-2 focus-within:ring-accent/30"
            >
              {filter.label}:
              <select
                value={selected[filter.key]}
                onChange={(e) => setSelected((s) => ({ ...s, [filter.key]: e.target.value }))}
                className="bg-transparent font-semibold focus:outline-none"
              >
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}

      {attention.length > 0 && (
        <section aria-labelledby="perlu-perhatian" className="flex flex-col gap-3">
          <h2 id="perlu-perhatian" className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            Perlu perhatian
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((item, i) => (
              <AttentionCard key={i} item={item} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {metrics.length > 0 && (
        <section aria-label="Angka kunci" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <MetricCard key={`${metric.label}-${i}`} metric={metric} />
          ))}
        </section>
      )}

      {sections.length > 0 && <SectionRenderer sections={sections} onOpen={onOpen} />}
    </div>
  )
}

function AttentionCard({ item, onOpen }: { item: AttentionItem; onOpen: (path: string) => void }) {
  const style = ATTENTION_STYLE[item.tone]
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 ${style.card}`}>
      <span className="self-start">
        <Badge tone={item.tone}>{style.label}</Badge>
      </span>
      <p className="text-sm font-semibold text-ink">{item.title}</p>
      {item.description && <p className="text-[13px] text-ink-soft">{item.description}</p>}
      {item.link && (
        <button
          type="button"
          onClick={() => onOpen(item.link!)}
          className="self-start text-[13px] font-semibold text-accent hover:underline"
        >
          {item.link_label ?? 'Lihat di aplikasi'} →
        </button>
      )}
    </div>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{metric.label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-ink">
        {/* Nominal besar disingkat (Rp12,4 M) supaya muat di kartu. */}
        {metric.format === 'currency' && typeof metric.value === 'number'
          ? formatRupiahShort(metric.value)
          : formatValue(metric.value, metric.format)}
      </p>
      {metric.progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-soft">
          <div className="h-full rounded-full bg-accent" style={{ width: `${metric.progress * 100}%` }} />
        </div>
      )}
      {metric.hint && <p className="mt-1.5 text-[13px] text-ink-soft">{metric.hint}</p>}
      {metric.trend && <p className={`mt-1 text-[13px] ${TREND_TEXT[metric.trend.tone]}`}>{metric.trend.text}</p>}
    </div>
  )
}
