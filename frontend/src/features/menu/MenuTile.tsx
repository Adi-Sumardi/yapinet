import { Link } from 'react-router-dom'
import type { MenuItem } from '../../lib/types'
import { menuTheme } from '../../lib/color'
import { StatusDot } from '../../components/ui/Badge'
import MenuIcon from './MenuIcon'
import { useOpenApp } from './useMenu'

/** Klik: halaman ringkasan bila ada integrasi data, selain itu langsung buka aplikasinya. */
export default function MenuTile({ item, showStatus }: { item: MenuItem; showStatus: boolean }) {
  const openApp = useOpenApp()
  const theme = menuTheme(item.color)
  const direct = !item.has_summary || item.detail_layout === 'link_only'

  const body = (
    <>
      <div className="relative">
        <MenuIcon icon={item.icon} color={item.color} />
        {showStatus && item.summary_status && (
          <StatusDot status={item.summary_status} className="absolute -right-0.5 -top-0.5" />
        )}
      </div>
      <span className="text-center text-sm font-semibold leading-tight text-ink">{item.name}</span>
    </>
  )

  const className =
    'tap-scale flex flex-col items-center gap-3.5 rounded-2xl px-4 py-7 transition-shadow hover:shadow-[0_8px_24px_rgba(15,42,82,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'

  if (direct) {
    return (
      <button type="button" onClick={() => void openApp(item)} className={className} style={{ background: theme.soft }}>
        {body}
      </button>
    )
  }

  return (
    <Link to={`/${item.slug}`} className={className} style={{ background: theme.soft }}>
      {body}
    </Link>
  )
}
