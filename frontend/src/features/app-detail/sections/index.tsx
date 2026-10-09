import { useMemo, useState, type ReactNode } from 'react'
import type { BadgeValue, Section, Tone, ValueFormat } from '../../../lib/types'
import { formatPercent, formatValue } from '../../../lib/format'
import Badge from '../../../components/ui/Badge'
import { AlertIcon, ErrorIcon, ExternalIcon, InfoIcon, SearchIcon } from '../../../components/icons'

/**
 * Renderer generik untuk sections[] kontrak v1 (rules/api.md bagian B).
 * Data dari aplikasi anak dianggap tidak tepercaya: selalu dirender sebagai
 * teks oleh React, link hanya berupa path yang dibuka lewat Yapinet.
 */

type OpenPath = (path: string) => void

function SectionCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line-soft bg-surface p-5">
      {title && <h3 className="mb-4 font-display text-sm font-bold text-ink">{title}</h3>}
      {children}
    </section>
  )
}

const TONE_TEXT: Record<Tone, string> = {
  critical: 'text-crit font-semibold',
  warning: 'text-warn font-semibold',
  ok: 'text-good',
  info: 'text-accent',
  neutral: 'text-ink',
}

const TONE_BAR: Record<Tone, string> = {
  critical: 'bg-crit',
  warning: 'bg-warn',
  ok: 'bg-good',
  info: 'bg-accent',
  neutral: 'bg-ink-faint',
}

/** Bar mini 0–1 untuk sel tabel format `progress` (v1.1). */
function ProgressCell({ value, tone }: { value: unknown; tone?: Tone }) {
  const ratio = Math.max(0, Math.min(1, Number(value) || 0))
  return (
    <span className="flex min-w-[120px] items-center gap-2">
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
        <span className={`block h-full rounded-full ${TONE_BAR[tone ?? 'ok']}`} style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className={`w-11 text-right text-xs tabular-nums ${tone ? TONE_TEXT[tone] : 'text-ink-soft'}`}>
        {formatPercent(ratio)}
      </span>
    </span>
  )
}

function Cell({ value, format, tone }: { value: unknown; format?: ValueFormat; tone?: Tone }) {
  if (format === 'progress') return <ProgressCell value={value} tone={tone} />
  if (format === 'badge' && value && typeof value === 'object' && 'text' in value) {
    const badge = value as BadgeValue
    return <Badge tone={badge.tone}>{badge.text}</Badge>
  }
  return <span className={tone ? TONE_TEXT[tone] : undefined}>{formatValue(value, format)}</span>
}

/** Ganti {kolom} di row_link dengan nilai baris. */
function fillPath(template: string, row: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(row[key] ?? '')))
}

function StatsSection({ section }: { section: Extract<Section, { type: 'stats' }> }) {
  return (
    <SectionCard title={section.title}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {section.items.map((item, i) => (
          <div key={i} className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">{formatValue(item.value, item.format)}</p>
            {item.trend && (
              <p className={`mt-0.5 text-xs font-semibold ${item.trend.startsWith('-') ? 'text-crit' : 'text-good'}`}>
                {item.trend}
              </p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

const PAGE = 10

function TableSection({ section, onOpen }: { section: Extract<Section, { type: 'table' }>; onOpen: OpenPath }) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return section.rows
    return section.rows.filter((row) =>
      section.columns.some((c) => formatValue(row[c.key], c.format).toLowerCase().includes(q)),
    )
  }, [query, section.rows, section.columns])

  return (
    <SectionCard title={section.title}>
      {section.rows.length > PAGE && (
        <label className="relative mb-4 block">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      )}

      {/* Desktop: tabel. Mobile: daftar kartu. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-soft text-[11px] uppercase tracking-wide text-ink-faint">
              {section.columns.map((c) => (
                <th key={c.key} className="pb-2.5 pr-4 font-semibold">
                  {c.label}
                </th>
              ))}
              {section.row_link && <th className="pb-2.5" />}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, visible).map((row, i) => (
              <tr key={i} className="border-b border-line-soft last:border-0">
                {section.columns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-3 pr-4 text-ink ${['number', 'currency', 'percent'].includes(c.format ?? '') ? 'tabular-nums' : ''}`}
                  >
                    <Cell value={row[c.key]} format={c.format} tone={row._emphasis?.[c.key]} />
                  </td>
                ))}
                {section.row_link && (
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpen(fillPath(section.row_link!, row))}
                      className="rounded-lg p-1.5 text-accent hover:bg-accent-soft"
                      aria-label="Buka di aplikasi"
                    >
                      <ExternalIcon size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2.5 sm:hidden">
        {rows.slice(0, visible).map((row, i) => (
          <div key={i} className="rounded-xl bg-surface-soft p-3.5">
            {section.columns.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3 py-0.5 text-sm">
                <span className="text-xs text-ink-faint">{c.label}</span>
                <span className="text-right font-medium text-ink">
                  <Cell value={row[c.key]} format={c.format} tone={row._emphasis?.[c.key]} />
                </span>
              </div>
            ))}
            {section.row_link && (
              <button
                type="button"
                onClick={() => onOpen(fillPath(section.row_link!, row))}
                className="mt-2 text-xs font-semibold text-accent"
              >
                Buka di aplikasi →
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">Tidak ada data.</p>}
      {rows.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-accent hover:bg-accent-soft"
        >
          Tampilkan lebih banyak ({rows.length - visible} lagi)
        </button>
      )}
    </SectionCard>
  )
}

function ListSection({ section, onOpen }: { section: Extract<Section, { type: 'list' }>; onOpen: OpenPath }) {
  const [visible, setVisible] = useState(PAGE)
  return (
    <SectionCard title={section.title}>
      <ul className="divide-y divide-line-soft">
        {section.items.slice(0, visible).map((item, i) => (
          <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              {item.subtitle && <p className="truncate text-xs text-ink-soft">{item.subtitle}</p>}
            </div>
            {item.badge && <Badge tone={item.badge.tone}>{item.badge.text}</Badge>}
            {item.link && (
              <button
                type="button"
                onClick={() => onOpen(item.link!)}
                className="rounded-lg p-1.5 text-accent hover:bg-accent-soft"
                aria-label="Buka di aplikasi"
              >
                <ExternalIcon size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {section.items.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">Tidak ada data.</p>}
      {section.items.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-accent hover:bg-accent-soft"
        >
          Tampilkan lebih banyak
        </button>
      )}
    </SectionCard>
  )
}

function barColor(value: number) {
  return value >= 0.9 ? 'bg-crit' : value >= 0.7 ? 'bg-warn' : 'bg-good'
}

function ProgressSection({ section }: { section: Extract<Section, { type: 'progress' }> }) {
  return (
    <SectionCard title={section.title}>
      <div className="flex flex-col gap-3.5">
        {section.items.map((item, i) => {
          const value = Math.max(0, Math.min(1, Number(item.value) || 0))
          return (
            <div key={i}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-ink">{item.label}</span>
                <span className="font-semibold tabular-nums text-ink-soft">{formatPercent(value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                <div className={`h-full rounded-full ${barColor(value)}`} style={{ width: `${value * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

function ChartSection({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  if (section.variant === 'columns') return <ColumnChart section={section} />
  if (section.variant === 'stacked') return <StackedChart section={section} />

  const max = Math.max(1, ...section.items.map((i) => Number(i.value) || 0))
  return (
    <SectionCard title={section.title}>
      <div className="flex flex-col gap-2.5">
        {section.items.map((item, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-ink-soft">{item.label}</span>
            <div className="h-6 overflow-hidden rounded-md bg-surface-soft">
              <div
                className="h-full rounded-md bg-accent/80"
                style={{ width: `${((Number(item.value) || 0) / max) * 100}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-ink">{formatValue(item.value, section.format)}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/** Kolom vertikal per periode; kolom terakhir disorot (periode berjalan). */
function ColumnChart({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const max = Math.max(section.format === 'percent' ? 1 : 0, ...section.items.map((i) => Number(i.value) || 0)) || 1
  const last = section.items.length - 1
  return (
    <SectionCard title={section.title}>
      <div className="flex h-44 items-end gap-2" role="img" aria-label={section.title}>
        {section.items.map((item, i) => {
          const current = section.highlight_last && i === last
          return (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span className={`text-[11px] tabular-nums ${current ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                {formatValue(item.value, section.format)}
              </span>
              <div
                className={`w-full rounded-t-lg rounded-b ${current ? 'bg-accent' : 'bg-accent/40'}`}
                style={{ height: `${Math.max(2, ((Number(item.value) || 0) / max) * 100)}%` }}
              />
              <span className={`truncate text-[11px] ${current ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/** Kolom bertumpuk per periode (mis. hadir tepat waktu vs terlambat). */
function StackedChart({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const series = section.series ?? []
  const totals = section.items.map((item) => series.reduce((sum, s) => sum + (Number(item[s.key]) || 0), 0))
  const max = Math.max(1, ...totals)
  return (
    <SectionCard title={section.title}>
      <div className="flex h-44 items-end gap-2" role="img" aria-label={section.title}>
        {section.items.map((item, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="flex w-full flex-col-reverse overflow-hidden rounded-md"
              style={{ height: `${Math.max(2, (totals[i] / max) * 100)}%` }}
              title={series.map((s) => `${s.label}: ${formatValue(item[s.key], section.format)}`).join(' · ')}
            >
              {series.map((s) => (
                <div key={s.key} className={TONE_BAR[s.tone ?? 'info']} style={{ flex: Number(item[s.key]) || 0 }} />
              ))}
            </div>
            <span className="truncate text-[11px] text-ink-soft">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${TONE_BAR[s.tone ?? 'info']}`} />
            {s.label}
          </span>
        ))}
      </div>
    </SectionCard>
  )
}

/** Tahapan berurutan: % terhadap tahap pertama, penurunan terbesar disorot. */
function FunnelSection({ section }: { section: Extract<Section, { type: 'funnel' }> }) {
  const first = Number(section.items[0]?.value) || 1
  const drops = section.items.map((item, i) =>
    i === 0 ? 0 : (Number(section.items[i - 1].value) || 0) - (Number(item.value) || 0),
  )
  const biggest = drops.indexOf(Math.max(...drops))
  return (
    <SectionCard title={section.title}>
      <div className="flex flex-col gap-2">
        {section.items.map((item, i) => {
          const ratio = (Number(item.value) || 0) / first
          const isDrop = i === biggest && drops[i] > 0
          return (
            <div key={i} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 text-sm">
              <span className={`truncate ${isDrop ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{item.label}</span>
              <div className="h-7 overflow-hidden rounded-lg bg-surface-soft">
                <div
                  className={`flex h-full items-center rounded-lg px-2.5 text-xs font-semibold text-white ${isDrop ? 'bg-warn' : 'bg-accent'}`}
                  style={{ width: `${Math.max(ratio * 100, 8)}%` }}
                >
                  {formatValue(item.value)}
                </div>
              </div>
              <span className={`text-right tabular-nums ${isDrop ? 'font-semibold text-warn' : 'text-ink-soft'}`}>
                {formatPercent(ratio)}
              </span>
            </div>
          )
        })}
      </div>
      {biggest > 0 && drops[biggest] > 0 && (
        <p className="mt-3 text-xs text-warn">
          Penurunan terbesar: {section.items[biggest - 1].label} → {section.items[biggest].label} (−
          {formatValue(drops[biggest])})
        </p>
      )}
    </SectionCard>
  )
}

const ALERT: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-accent-soft text-accent', icon: <InfoIcon /> },
  ok: { box: 'bg-good-soft text-good', icon: <InfoIcon /> },
  neutral: { box: 'bg-surface-soft text-ink-soft', icon: <InfoIcon /> },
  warning: { box: 'bg-warn-soft text-warn', icon: <AlertIcon /> },
  critical: { box: 'bg-crit-soft text-crit', icon: <ErrorIcon /> },
}

function AlertSection({ section }: { section: Extract<Section, { type: 'alert' }> }) {
  const style = ALERT[section.tone ?? 'info'] ?? ALERT.info
  return (
    <div className={`flex gap-3 rounded-2xl p-4 ${style.box}`}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="text-sm">
        {section.title && <p className="font-semibold">{section.title}</p>}
        <p className="text-ink">{section.text}</p>
      </div>
    </div>
  )
}

/** Tabel, funnel, statistik & peringatan memakai lebar penuh; lainnya berpasangan 2 kolom. */
const FULL_WIDTH = new Set(['table', 'funnel', 'stats', 'alert'])

/** Memilih renderer berdasarkan type; tipe tak dikenal diabaikan diam-diam. */
export default function SectionRenderer({ sections, onOpen }: { sections: Section[]; onOpen: OpenPath }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {sections.map((section, i) => (
        <div key={i} className={`min-w-0 ${FULL_WIDTH.has(section.type) ? 'md:col-span-2' : ''}`}>
          {renderSection(section, onOpen)}
        </div>
      ))}
    </div>
  )
}

function renderSection(section: Section, onOpen: OpenPath) {
  switch (section.type) {
    case 'stats':
      return <StatsSection section={section} />
    case 'table':
      return <TableSection section={section} onOpen={onOpen} />
    case 'list':
      return <ListSection section={section} onOpen={onOpen} />
    case 'progress':
      return <ProgressSection section={section} />
    case 'chart':
      return <ChartSection section={section} />
    case 'funnel':
      return <FunnelSection section={section} />
    case 'alert':
      return <AlertSection section={section} />
    default:
      return null
  }
}
