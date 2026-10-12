import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { BadgeValue, Section, Tone, ValueFormat } from '../../../lib/types'
import { formatPercent, formatRupiahShort, formatValue } from '../../../lib/format'
import Badge from '../../../components/ui/Badge'
import { AlertIcon, ErrorIcon, ExternalIcon, InfoIcon, SearchIcon } from '../../../components/icons'
import { AnimatedNumber, InView } from '../viz'

/**
 * Renderer generik untuk sections[] kontrak v1–v1.2 (rules/api.md bagian B,
 * rules/detail-pages.md). Data dari aplikasi anak dianggap tidak tepercaya:
 * selalu dirender sebagai teks oleh React, link hanya berupa path yang dibuka
 * lewat Yapinet. Animasi: setiap kartu adalah <InView>, elemen anim-* di
 * dalamnya bergerak saat kartu terlihat (index.css).
 */

type OpenPath = (path: string) => void

const v = (i: number) => ({ '--i': i }) as CSSProperties

function SectionCard({ title, aside, children }: { title?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <InView as="section" className="h-full rounded-3xl border border-line-soft bg-surface p-5 sm:p-7">
      {(title || aside) && (
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          {title && <h3 className="font-display text-lg font-bold text-ink">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </InView>
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
  warning: 'bg-[#e8a33d]',
  ok: 'bg-good',
  info: 'bg-accent',
  neutral: 'bg-ink-faint',
}

const TONE_CHIP: Record<Tone, string> = {
  critical: 'bg-crit-soft text-crit',
  warning: 'bg-warn-soft text-[#7a5a14]',
  ok: 'bg-good-soft text-[#17694a]',
  info: 'bg-accent-soft text-accent-strong',
  neutral: 'bg-surface-soft text-ink-soft',
}

/** Gelembung nilai saat batang/titik disorot (hover atau fokus keyboard). */
function Tip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-accent-deep px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
      {children}
    </span>
  )
}

function shortValue(value: unknown, format?: ValueFormat) {
  return format === 'currency' && typeof value === 'number' ? formatRupiahShort(value) : formatValue(value, format)
}

/** Bar mini 0–1 untuk sel tabel format `progress` (v1.1). */
function ProgressCell({ value, tone, index }: { value: unknown; tone?: Tone; index: number }) {
  if (value === null || value === undefined || value === '') return <span className="text-ink-faint">—</span>
  const ratio = Math.max(0, Math.min(1, Number(value) || 0))
  return (
    <span className="flex min-w-[120px] items-center gap-2">
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
        <span
          className={`anim-grow-x anim-size block h-full rounded-full ${TONE_BAR[tone ?? 'ok']}`}
          style={{ width: `${ratio * 100}%`, ...v(index) }}
        />
      </span>
      <span className={`w-12 text-right text-xs tabular-nums ${tone ? TONE_TEXT[tone] : 'text-ink-soft'}`}>
        {formatPercent(ratio)}
      </span>
    </span>
  )
}

function Cell({ value, format, tone, index }: { value: unknown; format?: ValueFormat; tone?: Tone; index: number }) {
  if (format === 'progress') return <ProgressCell value={value} tone={tone} index={index} />
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
          <div key={i} className="anim-fade-up rounded-2xl bg-surface-soft p-4" style={v(i)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{item.label}</p>
            <AnimatedNumber value={item.value} format={item.format} className="mt-1 block font-display text-2xl font-bold text-ink" />
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

function useSearch<T>(items: T[], text: (item: T) => string) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((item) => text(item).toLowerCase().includes(q)) : items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, items])
  return { query, setQuery, filtered }
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative mb-4 block print:hidden">
      <span className="sr-only">Cari</span>
      <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari…"
        className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  )
}

function MoreButton({ left, onClick }: { left: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 min-h-11 w-full rounded-xl text-sm font-semibold text-accent hover:bg-accent-soft print:hidden"
    >
      Tampilkan lebih banyak ({left} lagi)
    </button>
  )
}

function TableSection({ section, onOpen }: { section: Extract<Section, { type: 'table' }>; onOpen: OpenPath }) {
  const [visible, setVisible] = useState(PAGE)
  const { query, setQuery, filtered: rows } = useSearch(section.rows, (row) =>
    section.columns.map((c) => formatValue(row[c.key], c.format)).join(' '),
  )

  return (
    <SectionCard title={section.title}>
      {section.rows.length > PAGE && <SearchBox value={query} onChange={setQuery} />}

      {/* Desktop: tabel. Mobile: daftar kartu. */}
      <div className="hidden overflow-x-auto sm:block print:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-soft">
              {section.columns.map((c) => (
                <th key={c.key} className="pb-3 pr-4 font-semibold">
                  {c.label}
                </th>
              ))}
              {section.row_link && <th className="pb-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, visible).map((row, i) => (
              <tr key={i} className="anim-fade-up border-b border-line-soft transition-colors last:border-0 hover:bg-paper" style={v(Math.min(i, 12))}>
                {section.columns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-3 pr-4 text-ink ${['number', 'currency', 'percent'].includes(c.format ?? '') ? 'tabular-nums' : ''}`}
                  >
                    <Cell value={row[c.key]} format={c.format} tone={row._emphasis?.[c.key]} index={Math.min(i, 12)} />
                  </td>
                ))}
                {section.row_link && (
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpen(fillPath(section.row_link!, row))}
                      className="rounded-lg p-2 text-accent hover:bg-accent-soft"
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

      <div className="flex flex-col gap-2.5 sm:hidden print:hidden">
        {rows.slice(0, visible).map((row, i) => (
          <div key={i} className="anim-fade-up rounded-2xl bg-surface-soft p-3.5" style={v(Math.min(i, 8))}>
            {section.columns.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3 py-0.5 text-sm">
                <span className="text-xs text-ink-soft">{c.label}</span>
                <span className="text-right font-medium text-ink">
                  <Cell value={row[c.key]} format={c.format} tone={row._emphasis?.[c.key]} index={0} />
                </span>
              </div>
            ))}
            {section.row_link && (
              <button
                type="button"
                onClick={() => onOpen(fillPath(section.row_link!, row))}
                className="mt-2 min-h-11 text-xs font-semibold text-accent"
              >
                Buka di aplikasi →
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">Tidak ada data.</p>}
      {rows.length > visible && <MoreButton left={rows.length - visible} onClick={() => setVisible((n) => n + PAGE)} />}
    </SectionCard>
  )
}

/** Urutan kartu orang: yang perlu ditindaklanjuti dulu. */
const CARD_ORDER: Record<Tone, number> = { critical: 0, warning: 1, neutral: 2, info: 3, ok: 4 }

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '•'
  )
}

/** Teks badge tanpa angka, untuk legenda ("Terlambat 20 mnt" → "Terlambat"). */
function badgeGroup(text: string) {
  return text.replace(/[+]?\d+([.,]\d+)?\s*(mnt|menit|hari|jam)?/gi, '').replace(/\s+/g, ' ').trim() || text
}

/** v1.2 `display: "cards"` — kartu orang: kolom pertama nama, kolom terakhir badge. */
function PersonCards({ section }: { section: Extract<Section, { type: 'table' }> }) {
  const [visible, setVisible] = useState(12)
  const cols = section.columns
  const nameCol = cols[0]
  const badgeCol = cols[cols.length - 1]
  const middle = cols.slice(1, -1)
  const subtitleCols = middle.length <= 2 ? middle : middle.slice(0, 2)
  const chipCols = middle.length <= 2 ? [] : middle.slice(2)

  const people = useMemo(
    () =>
      section.rows
        .map((row) => {
          const tones = Object.values(row._emphasis ?? {}) as Tone[]
          const worst = tones.sort((a, b) => CARD_ORDER[a] - CARD_ORDER[b])[0]
          return { row, tone: row._emphasis?.[badgeCol.key] ?? worst }
        })
        .sort((a, b) => CARD_ORDER[a.tone ?? 'ok'] + (a.tone ? 0 : 5) - (CARD_ORDER[b.tone ?? 'ok'] + (b.tone ? 0 : 5))),
    [section.rows, badgeCol.key],
  )
  const { query, setQuery, filtered } = useSearch(people, ({ row }) =>
    cols.map((c) => formatValue(row[c.key], c.format)).join(' '),
  )

  // Legenda: jumlah per kelompok badge (mis. 12 hadir · 2 terlambat · 1 cuti).
  const groups = useMemo(() => {
    const map = new Map<string, { tone: Tone; count: number }>()
    for (const p of people) {
      if (!p.row._emphasis?.[badgeCol.key]) continue
      const label = badgeGroup(formatValue(p.row[badgeCol.key], badgeCol.format))
      const g = map.get(label) ?? { tone: p.tone ?? 'neutral', count: 0 }
      g.count++
      map.set(label, g)
    }
    return [...map.entries()].sort((a, b) => CARD_ORDER[a[1].tone] - CARD_ORDER[b[1].tone])
  }, [people, badgeCol])

  const badgeText = (row: Record<string, unknown>) => {
    const text = formatValue(row[badgeCol.key], badgeCol.format)
    return badgeCol.format === 'number' ? `${text} ${badgeCol.label.toLowerCase()}` : text
  }

  return (
    <SectionCard
      title={section.title}
      aside={
        groups.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
            {groups.map(([label, g]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${TONE_BAR[g.tone]}`} />
                <strong className="text-ink">{g.count}</strong> {label.toLowerCase()}
              </span>
            ))}
          </div>
        )
      }
    >
      {groups.length > 1 && (
        <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-surface-soft" role="img" aria-label={groups.map(([l, g]) => `${g.count} ${l}`).join(', ')}>
          {groups.map(([label, g], i) => (
            <div key={label} className={`anim-grow-x ${TONE_BAR[g.tone]}`} style={{ flexGrow: g.count, ...v(i) }} />
          ))}
        </div>
      )}
      {people.length > 12 && <SearchBox value={query} onChange={setQuery} />}
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visible).map(({ row, tone }, i) => {
          const name = formatValue(row[nameCol.key])
          const subtitle = subtitleCols
            .map((c) => formatValue(row[c.key], c.format))
            .filter((t) => t && t !== '—')
            .join(' · ')
          const chip = TONE_CHIP[tone ?? 'neutral']
          return (
            <li
              key={i}
              className={`anim-fade-up flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${
                tone === 'warning' ? 'border-warn/30 bg-[#fffaf0]' : tone === 'critical' ? 'border-crit/25 bg-crit-soft/40' : tone === 'neutral' ? 'border-dashed border-line' : 'border-line-soft'
              }`}
              style={v(Math.min(i, 12))}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${chip}`}>
                {initials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                {subtitle && <p className="truncate text-xs text-ink-soft">{subtitle}</p>}
                {chipCols.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {chipCols.map((c) => (
                      <span key={c.key} className={`mr-2 ${row._emphasis?.[c.key] ? TONE_TEXT[row._emphasis[c.key]] : ''}`}>
                        {c.label} {formatValue(row[c.key], c.format)}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${chip}`}>{badgeText(row)}</span>
            </li>
          )
        })}
      </ul>
      {filtered.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">Tidak ada data.</p>}
      {filtered.length > visible && <MoreButton left={filtered.length - visible} onClick={() => setVisible((n) => n + 12)} />}
    </SectionCard>
  )
}

function ListSection({ section, onOpen }: { section: Extract<Section, { type: 'list' }>; onOpen: OpenPath }) {
  const [visible, setVisible] = useState(PAGE)
  if (section.display === 'aging') return <AgingList section={section} onOpen={onOpen} />
  return (
    <SectionCard title={section.title}>
      <ul className="divide-y divide-line-soft">
        {section.items.slice(0, visible).map((item, i) => (
          <li key={i} className="anim-fade-up flex items-center gap-3 py-3 first:pt-0 last:pb-0" style={v(Math.min(i, 10))}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              {item.subtitle && <p className="truncate text-xs text-ink-soft">{item.subtitle}</p>}
            </div>
            {item.badge && <Badge tone={item.badge.tone}>{item.badge.text}</Badge>}
            {item.link && (
              <button
                type="button"
                onClick={() => onOpen(item.link!)}
                className="rounded-lg p-2 text-accent hover:bg-accent-soft"
                aria-label="Buka di aplikasi"
              >
                <ExternalIcon size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {section.items.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">Tidak ada data.</p>}
      {section.items.length > visible && <MoreButton left={section.items.length - visible} onClick={() => setVisible((n) => n + PAGE)} />}
    </SectionCard>
  )
}

/** v1.2 `display: "aging"` — umur antrean sebagai batang, garis = batas hari. */
function AgingList({ section, onOpen }: { section: Extract<Section, { type: 'list' }>; onOpen: OpenPath }) {
  const ages = section.items.map((i) => Number(i.age_days) || 0)
  const limit = section.limit_days ?? 0
  const max = Math.max(1, limit, ...ages)
  return (
    <SectionCard
      title={section.title}
      aside={limit > 0 && <span className="text-xs text-ink-soft">garis = batas {limit} hari</span>}
    >
      <ul className="flex flex-col gap-3.5">
        {section.items.slice(0, 10).map((item, i) => {
          const age = ages[i]
          const tone: Tone = item.badge?.tone ?? (limit && age > limit ? 'critical' : 'warning')
          const content = (
            <>
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <strong className="text-ink">{item.title}</strong>
                  {item.subtitle && <span className="text-ink-soft"> · {item.subtitle}</span>}
                </span>
                <strong className={`shrink-0 tabular-nums ${tone === 'critical' ? 'text-crit' : 'text-[#9a6c12]'}`}>{age} hari</strong>
              </span>
              <span className="relative mt-1.5 block h-2 rounded-full bg-surface-soft">
                <span className={`anim-grow-x absolute inset-y-0 left-0 rounded-full ${TONE_BAR[tone]}`} style={{ width: `${(age / max) * 100}%`, ...v(i) }} />
                {limit > 0 && <span className="absolute -inset-y-1 w-0.5 bg-accent-deep" style={{ left: `${(limit / max) * 100}%` }} />}
              </span>
            </>
          )
          return (
            <li key={i}>
              {item.link ? (
                <button type="button" onClick={() => onOpen(item.link!)} className="block w-full rounded-lg text-left hover:bg-paper">
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

function ProgressSection({ section }: { section: Extract<Section, { type: 'progress' }> }) {
  const target = section.target
  // Tanpa target warna netral: "tinggi" bisa baik (serapan, sisa nilai) atau buruk (kapasitas).
  const color = (value: number) =>
    target === undefined ? 'bg-accent' : value >= target ? 'bg-good' : value >= target * 0.85 ? 'bg-[#e8a33d]' : 'bg-crit'
  return (
    <SectionCard
      title={section.title}
      aside={target !== undefined && <span className="text-xs text-ink-soft">garis = target {formatPercent(target)}</span>}
    >
      <div className="flex flex-col gap-4">
        {section.items.map((item, i) => {
          const value = Math.max(0, Math.min(1, Number(item.value) || 0))
          return (
            <div key={i} className="group relative" tabIndex={0}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm">
                <span className="truncate font-medium text-ink">{item.label}</span>
                <span className={`font-semibold tabular-nums ${target !== undefined && value < target * 0.85 ? 'text-crit' : 'text-ink'}`}>
                  {formatPercent(value)}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-surface-soft">
                <div className={`anim-grow-x anim-size h-full rounded-full ${color(value)}`} style={{ width: `${value * 100}%`, ...v(i) }} />
                {target !== undefined && <span className="absolute -inset-y-1 w-0.5 bg-accent-deep" style={{ left: `${target * 100}%` }} />}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

function CompareBadge({ compare }: { compare?: { text: string; tone?: Tone } }) {
  if (!compare) return null
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CHIP[compare.tone ?? 'neutral']}`}>{compare.text}</span>
}

function ChartSection({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  if (section.variant === 'columns') return <ColumnChart section={section} />
  if (section.variant === 'stacked') return <StackedChart section={section} />
  if (section.variant === 'area') return <AreaChart section={section} />
  if (section.variant === 'treemap') return <Treemap section={section} />

  const max = Math.max(1, ...section.items.map((i) => Number(i.value) || 0))
  return (
    <SectionCard title={section.title} aside={<CompareBadge compare={section.compare} />}>
      <div className="flex flex-col gap-3">
        {section.items.map((item, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-ink-soft">{item.label}</span>
            <div className="h-6 overflow-hidden rounded-lg bg-surface-soft">
              <div
                className="anim-grow-x anim-size h-full rounded-lg bg-accent"
                style={{ width: `${((Number(item.value) || 0) / max) * 100}%`, ...v(i) }}
              />
            </div>
            <span className="font-semibold tabular-nums text-ink">{shortValue(item.value, section.format)}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/** Kolom vertikal per periode; kolom terakhir disorot (periode berjalan). */
function ColumnChart({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const max = Math.max(section.format === 'percent' ? 1 : 0, ...section.items.map((i) => Number(i.value) || 0)) || 1
  const count = section.items.length
  const last = count - 1
  return (
    <SectionCard title={section.title} aside={<CompareBadge compare={section.compare} />}>
      <div className="flex h-48 gap-1.5 sm:gap-2" role="img" aria-label={section.title}>
        {section.items.map((item, i) => {
          const current = section.highlight_last && i === last
          const ratio = Math.max(0.02, (Number(item.value) || 0) / max)
          return (
            <div key={i} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1.5 outline-none" tabIndex={0}>
              <Tip>
                {item.label}: {formatValue(item.value, section.format)}
              </Tip>
              {/* Angka + batang berbagi ruang di atas label, jadi batang tertinggi tidak mendorong label turun. */}
              <div className="flex w-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`text-[11px] tabular-nums max-sm:hidden ${current ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                  {shortValue(item.value, section.format)}
                </span>
                <div
                  className={`anim-grow-y anim-size w-full rounded-t-lg rounded-b transition-colors ${current ? 'bg-accent' : 'bg-accent/40 group-hover:bg-accent/70'}`}
                  style={{ height: `calc((100% - 1.25rem) * ${ratio})`, ...v(i) }}
                />
              </div>
              <span className={`w-full truncate text-center text-[11px] ${sparseLabel(i, count)} ${current ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/** Banyak kolom di layar sempit: label selang-seling disembunyikan (ruangnya tetap) supaya tidak bertumpuk. */
function sparseLabel(index: number, count: number): string {
  return count > 8 && index % 2 === 1 && index !== count - 1 ? 'max-sm:invisible' : ''
}

/** Kolom bertumpuk per periode (mis. hadir tepat waktu vs terlambat). */
function StackedChart({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const series = section.series ?? []
  const totals = section.items.map((item) => series.reduce((sum, s) => sum + (Number(item[s.key]) || 0), 0))
  const max = Math.max(1, ...totals)
  const legend = (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${TONE_BAR[s.tone ?? 'info']}`} />
          {s.label}
        </span>
      ))}
    </div>
  )
  return (
    <SectionCard title={section.title} aside={section.compare ? <CompareBadge compare={section.compare} /> : legend}>
      <div className="flex h-48 items-end gap-1.5 sm:gap-2" role="img" aria-label={section.title}>
        {section.items.map((item, i) => (
          <div key={i} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 outline-none" tabIndex={0}>
            <Tip>
              {item.label} · {series.map((s) => `${s.label} ${formatValue(item[s.key], section.format)}`).join(' · ')}
            </Tip>
            <span className="text-[11px] font-semibold tabular-nums text-ink-soft max-sm:hidden">{totals[i] > 0 ? shortValue(totals[i], section.format) : ''}</span>
            <div
              className="anim-grow-y anim-size flex w-full flex-col-reverse overflow-hidden rounded-lg transition-transform group-hover:-translate-y-0.5"
              style={{ height: `calc((100% - 2.75rem) * ${Math.max(0.02, totals[i] / max)})`, ...v(i) }}
            >
              {series.map((s) => (
                <div key={s.key} className={TONE_BAR[s.tone ?? 'info']} style={{ flex: Number(item[s.key]) || 0 }} />
              ))}
            </div>
            <span className={`w-full truncate text-center text-[11px] text-ink-soft ${sparseLabel(i, section.items.length)}`}>{item.label}</span>
          </div>
        ))}
      </div>
      {section.compare && <div className="mt-3">{legend}</div>}
    </SectionCard>
  )
}

/** v1.2 `variant: "area"` — garis tergambar kiri→kanan, puncak ditandai. */
function AreaChart({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const values = section.items.map((i) => Number(i.value) || 0)
  const n = values.length
  const max = Math.max(1, ...values)
  const W = 600
  const H = 200
  const pad = 14
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (val: number) => pad + (1 - val / max) * (H - pad * 2)
  const line = values.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const peak = values.indexOf(Math.max(...values))
  const pctX = (i: number) => (x(i) / W) * 100
  const pctY = (val: number) => (y(val) / H) * 100
  const step = n > 10 ? Math.ceil(n / 6) : 1

  return (
    <SectionCard title={section.title} aside={<CompareBadge compare={section.compare} />}>
      <div className="relative h-52" role="img" aria-label={`${section.title ?? 'Grafik'}: puncak ${formatValue(values[peak], section.format)} pada ${section.items[peak]?.label ?? ''}`}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1="0" x2={W} y1={pad + t * (H - pad * 2)} y2={pad + t * (H - pad * 2)} stroke="var(--color-line-soft)" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill="var(--color-accent-soft)" className="anim-fade-up" />
          <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" pathLength={1} vectorEffect="non-scaling-stroke" className="anim-draw" />
        </svg>
        {/* Puncak: titik + label, muncul memantul setelah garis selesai. */}
        {n > 1 && values[peak] > 0 && (
          <div className="anim-pop pointer-events-none absolute" style={{ left: `${pctX(peak)}%`, top: `${pctY(values[peak])}%`, '--i': 14 } as CSSProperties}>
            <span className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#e8a33d] shadow" />
            <span className={`absolute -top-9 whitespace-nowrap rounded-lg bg-accent-deep px-2.5 py-1 text-xs font-semibold text-white ${pctX(peak) > 70 ? 'right-2' : 'left-2'}`}>
              Puncak · {shortValue(values[peak], section.format)} ({section.items[peak].label})
            </span>
          </div>
        )}
        {/* Kolom tak terlihat untuk tooltip per titik. */}
        <div className="absolute inset-0 flex">
          {section.items.map((item, i) => (
            <div key={i} className="group relative flex-1 outline-none" tabIndex={0}>
              <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ left: `${n === 1 ? 50 : ((pctX(i) - (i / n) * 100) * n)}%`, top: `${pctY(values[i])}%` }} />
              <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-accent-deep px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {item.label}: {formatValue(item.value, section.format)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-ink-soft">
        {section.items.map((item, i) =>
          i % step === 0 || i === n - 1 ? (
            <span
              key={i}
              className={`absolute whitespace-nowrap ${i === n - 1 ? 'right-0 font-semibold text-ink' : i === 0 ? 'left-0' : '-translate-x-1/2'}`}
              style={i === 0 || i === n - 1 ? undefined : { left: `${pctX(i)}%` }}
            >
              {item.label}
            </span>
          ) : null,
        )}
      </div>
    </SectionCard>
  )
}

type Box = { index: number; x: number; y: number; w: number; h: number }

/** Bagi dua berulang dengan jumlah seimbang — cukup rapi untuk ≤ 12 kotak. */
function splitLayout(items: { index: number; value: number }[], x: number, y: number, w: number, h: number, out: Box[]) {
  if (items.length === 0) return
  if (items.length === 1) {
    out.push({ index: items[0].index, x, y, w, h })
    return
  }
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  let acc = 0
  let cut = 1
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value
    cut = i + 1
    if (acc >= total / 2) break
  }
  const first = items.slice(0, cut)
  const ratio = first.reduce((s, i) => s + i.value, 0) / total
  if (w >= h) {
    splitLayout(first, x, y, w * ratio, h, out)
    splitLayout(items.slice(cut), x + w * ratio, y, w * (1 - ratio), h, out)
  } else {
    splitLayout(first, x, y, w, h * ratio, out)
    splitLayout(items.slice(cut), x, y + h * ratio, w, h * (1 - ratio), out)
  }
}

const TREEMAP_FILL = ['#0f2a52', '#1d4c78', '#2e6da4', '#4f8fc6', '#7fb0d9', '#a9cbe8', '#cfe2f2', '#e2edf7']

/** v1.2 `variant: "treemap"` — luas kotak = porsi; 11+ item terkecil digabung. */
function Treemap({ section }: { section: Extract<Section, { type: 'chart' }> }) {
  const sorted = section.items
    .map((item) => ({ item, value: Math.max(0, Number(item.value) || 0) }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, 10)
  const tail = sorted.slice(10)
  const entries = tail.length
    ? [...head, { item: { label: `${tail.length} lainnya` } as (typeof sorted)[number]['item'], value: tail.reduce((s, i) => s + i.value, 0) }]
    : head
  const total = entries.reduce((s, e) => s + e.value, 0) || 1
  const boxes: Box[] = []
  splitLayout(entries.map((e, index) => ({ index, value: e.value })), 0, 0, 100, 100, boxes)

  return (
    <SectionCard title={section.title} aside={<span className="text-xs text-ink-soft">luas kotak = porsi</span>}>
      <div className="relative h-72 sm:h-80" role="img" aria-label={entries.map((e) => `${e.item.label} ${formatPercent(e.value / total)}`).join(', ')}>
        {boxes.map((b) => {
          const e = entries[b.index]
          const share = e.value / total
          const fill = TREEMAP_FILL[Math.min(b.index, TREEMAP_FILL.length - 1)]
          const dark = b.index < 4
          const roomy = b.w * b.h > 600
          return (
            <div
              key={b.index}
              className="group absolute p-0.75 outline-none"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              tabIndex={0}
            >
              <Tip>
                {e.item.label}: {shortValue(e.value, section.format)} ({formatPercent(share)})
              </Tip>
              <div
                className={`anim-pop flex h-full w-full flex-col justify-between overflow-hidden rounded-xl p-2.5 transition-[filter] group-hover:brightness-110 sm:p-3.5 ${dark ? 'text-white' : 'text-accent-deep'}`}
                style={{ background: fill, ...v(b.index) }}
              >
                <span className="truncate text-xs font-semibold sm:text-sm">{e.item.label}</span>
                {b.w * b.h > 150 && (
                  <span>
                    <span className={`block font-display font-extrabold leading-none ${roomy ? 'text-3xl' : 'text-base'}`}>{formatPercent(share)}</span>
                    {roomy && <span className={`text-xs ${dark ? 'text-white/75' : 'text-accent-deep/75'}`}>{shortValue(e.value, section.format)}</span>}
                    {roomy && typeof e.item.note === 'string' && <span className={`block text-xs ${dark ? 'text-white/75' : 'text-accent-deep/75'}`}>{e.item.note}</span>}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/** Tahapan berurutan: batang mengecil ke tengah, persen lanjut antartahap, tahap tersempit disorot. */
function FunnelSection({ section }: { section: Extract<Section, { type: 'funnel' }> }) {
  const first = Number(section.items[0]?.value) || 1
  const rates = section.items.map((item, i) =>
    i === 0 ? 1 : (Number(item.value) || 0) / Math.max(1, Number(section.items[i - 1].value) || 0),
  )
  const narrowest = rates.slice(1).reduce((best, r, i) => (r < rates[best] ? i + 1 : best), 1)
  const last = section.items.at(-1)
  const shades = ['bg-accent-deep', 'bg-accent-strong', 'bg-accent', 'bg-[#4f8fc6]', 'bg-[#7fb0d9]']

  return (
    <SectionCard
      title={section.title}
      aside={
        last && section.items.length > 1 && (
          <span className="text-sm text-ink-soft">
            konversi akhir <strong className="text-ink">{formatPercent((Number(last.value) || 0) / first)}</strong>
          </span>
        )
      }
    >
      <div className="flex flex-col gap-1">
        {section.items.map((item, i) => {
          const ratio = (Number(item.value) || 0) / first
          const isLast = i === section.items.length - 1
          return (
            <div key={i}>
              {i > 0 && (
                <div className="grid grid-cols-[minmax(0,9rem)_1fr_4rem] gap-3 py-1 sm:grid-cols-[minmax(0,11rem)_1fr_4.5rem]">
                  <span />
                  <span
                    className={`anim-fade-up justify-self-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      i === narrowest ? 'pulse-once border border-warn/40 bg-warn-soft text-[#7a5a14]' : 'bg-surface-soft text-ink-soft'
                    }`}
                    style={{ ...v(i * 2), '--pulse-color': 'rgba(232,163,61,.45)' } as CSSProperties}
                  >
                    ↓ {formatPercent(rates[i])} lanjut{i === narrowest ? ' · paling sempit' : ''}
                  </span>
                  <span />
                </div>
              )}
              <div className="group grid grid-cols-[minmax(0,9rem)_1fr_4rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,11rem)_1fr_4.5rem]">
                <span className="truncate font-semibold text-ink">{item.label}</span>
                <div className="flex h-11 justify-center">
                  <div
                    className={`anim-grow-x anim-size h-full rounded-xl ${isLast && section.items.length > 2 ? 'bg-good' : shades[Math.min(i, shades.length - 1)]}`}
                    style={{ width: `${Math.max(ratio * 100, 4)}%`, transformOrigin: 'center', ...v(i * 2) }}
                  />
                </div>
                <AnimatedNumber value={Number(item.value) || 0} className={`text-right font-display text-lg font-bold ${isLast && section.items.length > 2 ? 'text-good' : 'text-ink'}`} />
              </div>
            </div>
          )
        })}
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
    <InView className={`flex gap-3 rounded-2xl p-4 ${style.box}`}>
      <span className="anim-pop mt-0.5 shrink-0">{style.icon}</span>
      <div className="text-sm">
        {section.title && <p className="font-semibold">{section.title}</p>}
        <p className="text-ink">{section.text}</p>
      </div>
    </InView>
  )
}

/** Tabel, funnel, statistik, peringatan & peta porsi memakai lebar penuh; lainnya berpasangan 2 kolom. */
const FULL_WIDTH = new Set(['table', 'funnel', 'stats', 'alert'])

/** Grafik dengan banyak kolom butuh lebar penuh supaya labelnya terbaca. */
const LONG_CHART = 8

function isWide(section: Section): boolean {
  if (FULL_WIDTH.has(section.type)) return true
  if (section.type === 'chart') return section.variant === 'treemap' || section.items.length > LONG_CHART
  return false
}

/**
 * Section setengah lebar dipasangkan berurutan; yang tidak punya pasangan
 * (diapit section lebar atau paling akhir) dibuat lebar penuh agar tidak
 * menyisakan ruang kosong.
 */
function fullSpans(sections: Section[]): boolean[] {
  const wide = sections.map(isWide)
  const spans: boolean[] = []
  for (let i = 0; i < sections.length; ) {
    if (!wide[i] && i + 1 < sections.length && !wide[i + 1]) {
      spans.push(false, false)
      i += 2
    } else {
      spans.push(true)
      i += 1
    }
  }
  return spans
}

/** Memilih renderer berdasarkan type; tipe tak dikenal diabaikan diam-diam. */
export default function SectionRenderer({ sections, onOpen }: { sections: Section[]; onOpen: OpenPath }) {
  const spans = fullSpans(sections)
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {sections.map((section, i) => (
        <div key={`${section.type}-${section.title ?? ''}-${i}`} className={`min-w-0 ${spans[i] ? 'md:col-span-2' : ''}`}>
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
      return section.display === 'cards' ? <PersonCards section={section} /> : <TableSection section={section} onOpen={onOpen} />
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
