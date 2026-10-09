import type { MenuIconData } from '../../lib/types'
import { menuTheme } from '../../lib/color'

const SIZE = {
  sm: { box: 'h-9 w-9', text: 'text-[11px]' },
  md: { box: 'h-14 w-14', text: 'text-sm' },
  lg: { box: 'h-16 w-16', text: 'text-base' },
}

/** Lingkaran warna + inisial, atau gambar dari admin. Dipakai di tile, detail, dan admin. */
export default function MenuIcon({
  icon,
  color,
  size = 'md',
  shape = 'circle',
}: {
  icon: MenuIconData
  color: string
  size?: keyof typeof SIZE
  shape?: 'circle' | 'rounded'
}) {
  const theme = menuTheme(color)
  const s = SIZE[size]
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  if (icon.type === 'image' && icon.url) {
    return (
      <div
        className={`${s.box} ${radius} shrink-0 overflow-hidden bg-surface`}
        style={{ boxShadow: `0 6px 16px ${theme.shadow}` }}
      >
        <img src={icon.url} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`${s.box} ${radius} flex shrink-0 items-center justify-center`}
      style={{ background: theme.color, boxShadow: `0 6px 16px ${theme.shadow}` }}
    >
      <span className={`font-display font-bold ${s.text}`} style={{ color: theme.text }}>
        {icon.text || '•'}
      </span>
    </div>
  )
}
