import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { LogoutIcon, ShieldIcon, UserIcon } from '../icons'
import LogoMark from './LogoMark'

export default function TopBar({ badge }: { badge?: ReactNode }) {
  const { me, logout } = useAuth()
  const settings = useSettings()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = me?.user.full_name.trim().charAt(0).toUpperCase() ?? 'U'

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => !menuRef.current?.contains(event.target as Node) && setOpen(false)
    const esc = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const item =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft'

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="font-display text-base font-bold uppercase text-accent-deep">
            {settings['branding.app_name']}
          </span>
          {badge}
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="tap-scale flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 hover:bg-surface-soft sm:pr-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
              {initials}
            </span>
            <span className="hidden max-w-[180px] truncate text-[13px] font-medium text-ink-soft sm:inline">
              {me?.user.primary_email}
            </span>
          </button>

          {open && (
            <div
              role="menu"
              className="dialog-in absolute right-0 top-12 w-64 rounded-2xl border border-line-soft bg-surface p-2 shadow-[0_12px_32px_rgba(15,42,82,0.14)] sm:animate-none"
            >
              <div className="px-3 pb-2.5 pt-1.5">
                <p className="truncate text-sm font-semibold text-ink">{me?.user.full_name}</p>
                <p className="truncate text-xs text-ink-soft">{me?.user.primary_email}</p>
              </div>
              <div className="my-1 h-px bg-line-soft" />
              <Link to="/akun" className={item} onClick={() => setOpen(false)} role="menuitem">
                <UserIcon size={16} className="text-ink-faint" /> Akun saya
              </Link>
              {me?.user.is_admin && (
                <Link to="/admin" className={item} onClick={() => setOpen(false)} role="menuitem">
                  <ShieldIcon size={16} className="text-ink-faint" /> Panel admin
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                className={`${item} text-crit hover:bg-crit-soft`}
                onClick={() => {
                  setOpen(false)
                  void logout().then(() => navigate('/login', { replace: true }))
                }}
              >
                <LogoutIcon size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
