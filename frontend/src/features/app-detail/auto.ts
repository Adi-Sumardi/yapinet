import type { HeroItem, Insight, Metric, Section, Tone } from '../../lib/types'
import { formatNumber, formatPercent, formatValue } from '../../lib/format'

/**
 * Hero & Sorotan otomatis untuk aplikasi yang belum mengirim `hero` /
 * `insights` (kontrak v1.2). Hanya membaca angka yang sudah ada di payload —
 * tidak menebak apa pun di luar data.
 */

export type HeroLayout = {
  hero: HeroItem
  /** Metric dengan progress → cincin/gauge di sisi kanan. */
  side: Metric[]
  /** Metric lain → ubin kecil di bawah angka utama. */
  tiles: Metric[]
  /** Sisa metric → grid di bawah panel. */
  rest: Metric[]
}

export function layoutHero(heroes: HeroItem[], metrics: Metric[], headline?: string | null): HeroLayout | null {
  const provided = heroes[0]
  if (!provided && metrics.length === 0) return null

  const hero: HeroItem = provided ?? {
    value: metrics[0].value,
    format: metrics[0].format,
    label: metrics[0].label,
    story: metrics[0].hint ?? headline ?? undefined,
  }
  const used = new Set<Metric>()
  const heroMetric = metrics.find((m) => m.label === hero.label)
  if (heroMetric) used.add(heroMetric)

  const side = hero.side
    ? hero.side.map((label) => metrics.find((m) => m.label === label && !used.has(m))).filter((m): m is Metric => !!m)
    : metrics.filter((m) => m.progress !== undefined && !used.has(m)).slice(0, 2)
  side.forEach((m) => used.add(m))

  const tiles = metrics.filter((m) => !used.has(m) && m.progress === undefined).slice(0, 3)
  tiles.forEach((m) => used.add(m))

  return { hero, side, tiles, rest: metrics.filter((m) => !used.has(m)) }
}

const pct = (n: number) => formatPercent(n)
/** "Pendaftar" → "pendaftar", tapi "APBS" tetap "APBS". */
const lowerLabel = (label: string) => (/^[A-Z0-9]{2,}\b/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1))
const num = (n: number) => formatNumber(Math.round(n * 10) / 10)

/** Maks. 3 kalimat; yang bernada peringatan didahulukan. */
export function autoInsights(sections: Section[]): Insight[] {
  const found: Insight[] = []

  for (const s of sections) {
    if (s.type === 'funnel' && s.items.length >= 3) {
      let worst = -1
      let worstRatio = 1
      for (let i = 1; i < s.items.length; i++) {
        const prev = Number(s.items[i - 1].value) || 0
        const ratio = prev > 0 ? (Number(s.items[i].value) || 0) / prev : 1
        if (ratio < worstRatio) {
          worstRatio = ratio
          worst = i
        }
      }
      if (worst > 0 && worstRatio < 0.8) {
        const prev = s.items[worst - 1]
        const cur = s.items[worst]
        found.push({
          icon: 'filter',
          tone: worstRatio < 0.4 ? 'warning' : 'info',
          text: `Tahap paling sempit: dari **${formatValue(prev.value)}** ${prev.label.toLowerCase()} baru **${formatValue(cur.value)} ${cur.label.toLowerCase()} (${pct(worstRatio)})**.`,
        })
      }
    }

    if (s.type === 'chart' && (s.variant === 'columns' || s.variant === 'area') && s.items.length >= 8) {
      const values = s.items.map((i) => Number(i.value) || 0)
      const half = Math.min(7, Math.floor(values.length / 2))
      const recent = values.slice(-half)
      const before = values.slice(-half * 2, -half)
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
      const a = avg(recent)
      const b = avg(before)
      if (b > 0) {
        const change = (a - b) / b
        if (Math.abs(change) >= 0.15) {
          const down = change < 0
          found.push({
            icon: down ? 'trend-down' : 'trend-up',
            tone: 'info',
            text: `${s.title ?? 'Tren'}: rata-rata **${num(a)}** di ${half} titik terakhir, ${down ? 'turun' : 'naik'} **${pct(Math.abs(change))}** dari ${half} sebelumnya.`,
          })
        }
      }
      const peak = values.indexOf(Math.max(...values))
      if (peak >= 0 && values[peak] > 0 && peak < values.length - 1) {
        found.push({
          icon: 'star',
          tone: 'neutral',
          text: `Puncak ${(s.title ?? '').toLowerCase() || 'grafik'}: **${formatValue(values[peak], s.format)}** pada ${s.items[peak].label}.`,
        })
      }
    }

    if (s.type === 'table' && s.display !== 'cards' && !s.row_link && s.rows.length >= 3 && s.rows.length <= 25) {
      const nameCol = s.columns[0]
      const nameKey = nameCol?.key
      const isCategory = nameCol && !nameCol.format && !['nama', 'tanggal', 'date'].includes(nameCol.key)
      if (nameKey && isCategory) {
        const critical = s.rows.filter((r) => Object.values(r._emphasis ?? {}).includes('critical' as Tone))
        if (critical.length > 0) {
          const names = critical.slice(0, 2).map((r) => String(r[nameKey]))
          found.push({
            icon: 'alert',
            tone: 'critical',
            text: `**${critical.length}** dari ${s.rows.length} baris di "${s.title ?? 'tabel'}" berstatus kritis: ${names.join(', ')}${critical.length > 2 ? ', …' : ''}.`,
          })
        }
        const numeric = s.columns.find((c) => c.format === 'number' || c.format === 'currency')
        if (numeric) {
          const values = s.rows.map((r) => Number(r[numeric.key]) || 0)
          const total = values.reduce((x, y) => x + y, 0)
          const top = values.indexOf(Math.max(...values))
          if (total > 0 && values[top] / total >= 0.3) {
            found.push({
              icon: 'building',
              tone: 'info',
              text: `**${String(s.rows[top][nameKey])}** memegang **${pct(values[top] / total)}** dari total ${lowerLabel(numeric.label)}.`,
            })
          }
        }
      }
    }
  }

  const order: Record<Tone, number> = { critical: 0, warning: 1, info: 2, ok: 3, neutral: 4 }
  return found.sort((x, y) => order[x.tone] - order[y.tone]).slice(0, 3)
}
