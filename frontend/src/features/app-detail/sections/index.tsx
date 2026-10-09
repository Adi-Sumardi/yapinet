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

function Cell({ value, format }: { value: unknown; format?: ValueFormat }) {
  if (format === 'badge' && value && typeof value === 'object' && 'text' in value) {
    const badge = value as BadgeValue
    return <Badge tone={badge.tone}>{badge.text}</Badge>
  }
  return <>{formatValue(value, format)}</>
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
                    <Cell value={row[c.key]} format={c.format} />
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
                  <Cell value={row[c.key]} format={c.format} />
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

/** Memilih renderer berdasarkan type; tipe tak dikenal diabaikan diam-diam. */
export default function SectionRenderer({ sections, onOpen }: { sections: Section[]; onOpen: OpenPath }) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, i) => {
        switch (section.type) {
          case 'stats':
            return <StatsSection key={i} section={section} />
          case 'table':
            return <TableSection key={i} section={section} onOpen={onOpen} />
          case 'list':
            return <ListSection key={i} section={section} onOpen={onOpen} />
          case 'progress':
            return <ProgressSection key={i} section={section} />
          case 'chart':
            return <ChartSection key={i} section={section} />
          case 'alert':
            return <AlertSection key={i} section={section} />
          default:
            return null
        }
      })}
    </div>
  )
}
