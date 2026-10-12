import { useMemo, useState, type CSSProperties } from 'react'
import type { Metric, SummaryCard, Tone, When } from '../../lib/types'
import SectionRenderer from './sections'
import { autoInsights, layoutHero } from './auto'
import { AttentionBanners, HeroPanel, InsightCards } from './Hero'
import { AnimatedNumber, InView, Ring } from './viz'

/**
 * Halaman detail infografis (kontrak v1.1/v1.2, rules/detail-pages.md):
 * filter → hero → Sorotan → Perlu perhatian → angka kunci lain → sections.
 * Item ber-`when` hanya tampil bila cocok dengan filter terpilih. Hero &
 * Sorotan disusun otomatis bila aplikasi belum mengirimnya.
 */

const SEVERITY: Record<Tone, number> = { critical: 0, warning: 1, info: 2, ok: 3, neutral: 4 }

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

export default function DetailView({
  card,
  accent,
  onOpen,
}: {
  card: SummaryCard
  accent: string
  onOpen: (path: string) => void
}) {
  const filters = useMemo(() => card.filters ?? [], [card.filters])
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.key, f.default])),
  )
  const keys = useMemo(() => new Set(filters.map((f) => f.key)), [filters])
  const visible = <T extends { when?: When }>(items: T[] = []) => items.filter((i) => matches(i.when, selected, keys))

  const attention = visible(card.attention)
    .sort((a, b) => SEVERITY[a.tone] - SEVERITY[b.tone])
    .slice(0, 4)
  const metrics = visible(card.metrics)
  const sections = visible(card.sections)
  const layout = layoutHero(visible(card.hero), metrics, card.headline)
  const sent = visible(card.insights)
  const insights = sent.length > 0 ? sent.slice(0, 6) : autoInsights(sections)

  return (
    <div className="flex flex-col gap-7">
      {filters.map((filter) => (
        <section key={filter.key} aria-label={`Filter ${filter.label}`} className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">{filter.label}</span>
          {filter.options.map((o) => {
            const active = selected[filter.key] === o.value
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected((s) => ({ ...s, [filter.key]: o.value }))}
                className={`tap-scale min-h-9 rounded-full px-3.5 text-[13px] transition-colors ${
                  active
                    ? 'bg-accent-deep font-semibold text-white shadow-sm'
                    : 'border border-line bg-surface font-medium text-ink/80 hover:border-accent/40 hover:text-accent'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </section>
      ))}
      {filters.length > 0 && (
        <p className="hidden text-sm text-ink-soft print:block">
          {filters.map((f) => `${f.label}: ${f.options.find((o) => o.value === selected[f.key])?.label ?? ''}`).join(' · ')}
        </p>
      )}

      {/* Tanpa remount saat filter berganti: angka & batang bergerak dari nilai lama ke baru. */}
      <div className="flex flex-col gap-7">
        {layout && <HeroPanel layout={layout} accent={accent} />}
        {insights.length > 0 && <InsightCards insights={insights} auto={sent.length === 0} />}
        {attention.length > 0 && <AttentionBanners items={attention} onOpen={onOpen} />}

        {layout && layout.rest.length > 0 && (
          <InView as="section" aria-label="Angka kunci lain" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {layout.rest.map((metric, i) => (
              <MetricCard key={`${metric.label}-${i}`} metric={metric} index={i} />
            ))}
          </InView>
        )}

        {sections.length > 0 && <SectionRenderer sections={sections} onOpen={onOpen} />}
      </div>
    </div>
  )
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const style = { '--i': index } as CSSProperties
  if (metric.display && metric.progress !== undefined) {
    return (
      <div className="anim-fade-up flex items-center gap-4 rounded-[20px] border border-line-soft bg-surface p-4" style={style}>
        <Ring value={metric.progress} size={76} stroke={9} color="var(--color-accent)" track="var(--color-accent-soft)" label={metric.label}>
          <AnimatedNumber value={metric.progress} format="percent" className="text-xs font-bold text-ink" />
        </Ring>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{metric.label}</p>
          <AnimatedNumber value={metric.value} format={metric.format} className="font-display text-xl font-bold text-ink" />
          {metric.hint && <p className="text-[13px] text-ink-soft">{metric.hint}</p>}
        </div>
      </div>
    )
  }
  return (
    <div className="anim-fade-up rounded-[20px] border border-line-soft bg-surface p-4" style={style}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{metric.label}</p>
      <AnimatedNumber value={metric.value} format={metric.format} className="mt-1.5 block font-display text-2xl font-bold text-ink" />
      {metric.progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-soft">
          <div
            className="anim-grow-x anim-size h-full rounded-full bg-accent"
            style={{ width: `${metric.progress * 100}%`, ...style }}
          />
        </div>
      )}
      {metric.hint && <p className="mt-1.5 text-[13px] text-ink-soft">{metric.hint}</p>}
      {metric.trend && <p className={`mt-1 text-[13px] font-semibold ${TREND_TEXT[metric.trend.tone]}`}>{metric.trend.text}</p>}
    </div>
  )
}
