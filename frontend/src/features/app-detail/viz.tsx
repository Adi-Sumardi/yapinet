import { createElement, type CSSProperties, type ReactNode } from 'react'
import type { ValueFormat } from '../../lib/types'
import { formatNumber, formatPercent, formatRupiah, formatRupiahShort, formatValue } from '../../lib/format'
import { useCountUp, useInView } from '../../lib/motion'

/** Blok visual bersama halaman detail infografis (kontrak v1.2). */

/** Pembungkus yang memberi data-in="false|true" — pemicu animasi CSS anim-*. */
export function InView({
  as = 'div',
  className,
  style,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'article' | 'ul'
  className?: string
  style?: CSSProperties
  children: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  return createElement(as, { ref, className, style, 'data-in': String(inView), ...rest }, children)
}

function formatAnimated(current: number, target: number, format?: ValueFormat | null, short = true): string {
  if (format === 'currency') return short ? formatRupiahShort(current) : formatRupiah(Math.round(current))
  if (format === 'percent' || format === 'progress') return formatPercent(current)
  return formatNumber(Number.isInteger(target) ? Math.round(current) : Math.round(current * 100) / 100)
}

/** Angka yang menghitung naik saat terlihat & bergerak halus saat filter berganti. */
export function AnimatedNumber({
  value,
  format,
  short = true,
  className,
}: {
  value: string | number
  format?: ValueFormat | null
  short?: boolean
  className?: string
}) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const numeric = typeof value === 'number' && Number.isFinite(value)
  const current = useCountUp(numeric ? value : 0, inView)
  const text = numeric ? formatAnimated(current, value, format, short) : formatValue(value, format)
  const final = numeric ? formatAnimated(value, value, format, short) : text
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`} aria-label={final}>
      <span aria-hidden="true">{text}</span>
    </span>
  )
}

/** `**tebal**` → <strong>. Teks tetap dirender sebagai teks oleh React (aman). */
export function RichText({ text, strongClass = 'font-semibold text-ink' }: { text: string; strongClass?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className={strongClass}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

/** Cincin 0–1. Harus berada di dalam <InView> supaya busurnya "terisi". */
export function Ring({
  value,
  size = 160,
  stroke = 18,
  color,
  track,
  children,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  color: string
  track: string
  children?: ReactNode
  label: string
}) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(1, value))
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="anim-arc"
          style={{ '--arc-len': len, '--arc-off': len * (1 - ratio) } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** Gauge setengah lingkaran 0–1. */
export function Gauge({
  value,
  width = 200,
  stroke = 18,
  color,
  track,
  children,
  label,
}: {
  value: number
  width?: number
  stroke?: number
  color: string
  track: string
  children?: ReactNode
  label: string
}) {
  const r = (width - stroke) / 2
  const len = Math.PI * r
  const ratio = Math.max(0, Math.min(1, value))
  const height = r + stroke
  const d = `M ${stroke / 2} ${r + stroke / 2} A ${r} ${r} 0 0 1 ${width - stroke / 2} ${r + stroke / 2}`
  return (
    <div className="relative" style={{ width, height }} role="img" aria-label={label}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={d} fill="none" stroke={track} strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          className="anim-arc"
          style={{ '--arc-len': len, '--arc-off': len * (1 - ratio) } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">{children}</div>
    </div>
  )
}
