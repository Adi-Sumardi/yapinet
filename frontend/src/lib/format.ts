import type { ValueFormat } from './types'

/** Semua formatter tampilan ada di sini (rules/formatting.md). Locale id-ID, zona WIB. */

const TZ = 'Asia/Jakarta'

export const EMPTY = '—'

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

/** Rp1,25 M · Rp3,4 jt — untuk kartu ringkas. */
export function formatRupiahShort(value: number): string {
  const abs = Math.abs(value)
  const fmt = (n: number, unit: string) =>
    `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n)} ${unit}`
  if (abs >= 1e12) return fmt(value / 1e12, 'T')
  if (abs >= 1e9) return fmt(value / 1e9, 'M')
  if (abs >= 1e6) return fmt(value / 1e6, 'jt')
  return formatRupiah(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(
    new Date(value),
  )
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(value))
}

export function formatRelative(value: string | Date): string {
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
  ]
  let unit: Intl.RelativeTimeFormatUnit = 'year'
  let divisor = 31557600
  let prev = 1
  for (const [limit, u] of steps) {
    if (Math.abs(diff) < limit) {
      unit = u
      divisor = prev
      break
    }
    prev = limit
  }
  if (Math.abs(diff) < 45) return 'baru saja'
  return rtf.format(Math.round(diff / divisor), unit)
}

/** Format satu nilai sesuai `format` dari kontrak API aplikasi anak. */
export function formatValue(value: unknown, format?: ValueFormat | null): string {
  if (value === null || value === undefined || value === '') return EMPTY

  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        return formatRupiah(value)
      case 'percent':
      case 'progress':
        return formatPercent(value)
      case 'number':
      case undefined:
      case null:
        return formatNumber(value)
    }
  }

  if (typeof value === 'string' && (format === 'date' || format === 'datetime')) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return format === 'date' ? formatDate(date) : formatDateTime(date)
  }

  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text: unknown }).text)
  }

  return String(value)
}
