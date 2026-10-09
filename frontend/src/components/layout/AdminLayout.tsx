import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowLeftIcon, GridIcon, ListIcon, SettingsIcon, UsersIcon } from '../icons'
import TopBar from './TopBar'

const NAV = [
  { to: '/admin/menu', label: 'Menu Aplikasi', icon: GridIcon },
  { to: '/admin/pengguna', label: 'Pengguna', icon: UsersIcon },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: SettingsIcon },
  { to: '/admin/log', label: 'Log Aktivitas', icon: ListIcon },
]

/** Sidebar di desktop, tab horizontal yang bisa digeser di mobile (rules/design.md → Layout Admin). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-paper">
      <TopBar
        badge={
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase text-accent">
            Admin
          </span>
        }
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-5 sm:px-6 md:flex-row md:pt-8">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:px-0">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-accent text-white shadow-[0_4px_12px_rgba(46,109,164,0.25)]'
                    : 'text-ink-soft hover:bg-surface hover:text-ink'
                }`
              }
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
          <Link
            to="/"
            className="hidden items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-faint hover:text-ink md:mt-4 md:flex"
          >
            <ArrowLeftIcon size={17} /> Dashboard
          </Link>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          to={back.to}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          <ArrowLeftIcon size={15} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
