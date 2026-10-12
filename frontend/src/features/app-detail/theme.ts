import type { ReactNode } from 'react'
import type { InsightIcon } from '../../lib/types'
import {
  AlertIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  FilterIcon,
  MoneyIcon,
  StarIcon,
  TrendDownIcon,
  TrendUpIcon,
  UsersIcon,
} from '../../components/icons'

/** Pemetaan ikon Sorotan & warna aksen halaman detail (bukan komponen). */

export const INSIGHT_ICONS: Record<InsightIcon, (p: { size?: number }) => ReactNode> = {
  'trend-up': TrendUpIcon,
  'trend-down': TrendDownIcon,
  filter: FilterIcon,
  building: BuildingIcon,
  clock: ClockIcon,
  people: UsersIcon,
  money: MoneyIcon,
  check: CheckIcon,
  alert: AlertIcon,
  star: StarIcon,
}

/**
 * Warna aksen menu bisa gelap (dipilih admin); di atas panel navy ia dicerahkan
 * sampai cukup kontras supaya cincin & sorotan tetap terlihat.
 */
export function accentOnDark(hex: string | undefined): string {
  const fallback = '#7fb0d9'
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!m) return fallback
  let [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16))
  const lum = () => {
    const c = [r, g, b].map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  for (let i = 0; i < 12 && lum() < 0.32; i++) {
    r = Math.round(r + (255 - r) * 0.18)
    g = Math.round(g + (255 - g) * 0.18)
    b = Math.round(b + (255 - b) * 0.18)
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
