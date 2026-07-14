import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, type SummaryCard } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { appTheme } from '../lib/appIcons'
import { codeToSlug } from '../lib/appSlugs'
import LogoMark from '../components/LogoMark'

function uniqueApps(cards: SummaryCard[]) {
  const seen = new Map<string, string>()
  for (const card of cards) {
    if (!seen.has(card.app_code)) seen.set(card.app_code, card.app_name)
  }
  return Array.from(seen.entries()).map(([code, name]) => ({ code, name }))
}

export default function Dashboard() {
  const { me, logout } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.dashboardSummary,
  })

  const apps = useMemo(() => (data ? uniqueApps(data.cards) : []), [data])

  const initials = me?.user.full_name.trim().charAt(0).toUpperCase() ?? 'U'

  return (
    <div className="min-h-svh bg-paper">
      <header className="flex items-center justify-between border-b border-line-soft bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="font-display text-base font-bold uppercase text-accent-deep">Yapinet</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-ink-soft sm:inline">{me?.user.primary_email}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-[13px] font-bold text-ink">
            {initials}
          </div>
          <button
            onClick={() => void logout()}
            className="tap-scale rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-surface-soft"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-14 text-center">
        <LogoMark size="lg" className="mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Selamat Datang di Dashboard <span className="text-accent">Yapinet</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Let&apos;s <span className="font-semibold text-accent">connect</span>
        </p>

        <div className="mt-11 grid grid-cols-2 gap-4 text-left sm:grid-cols-3 md:grid-cols-4">
          {isLoading && <p className="col-span-full text-sm text-ink-soft">Memuat aplikasi…</p>}
          {isError && <p className="col-span-full text-sm text-crit">Gagal memuat dashboard.</p>}
          {data && apps.length === 0 && (
            <p className="col-span-full text-sm text-ink-soft">Belum ada aplikasi untuk akunmu.</p>
          )}

          {apps.map((app) => {
            const theme = appTheme(app.code)
            return (
              <Link
                key={app.code}
                to={`/${codeToSlug(app.code)}`}
                className="tap-scale flex flex-col items-center gap-3.5 rounded-2xl px-4 py-8"
                style={{ background: theme.soft }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: theme.color, boxShadow: `0 6px 16px ${theme.shadow}` }}
                >
                  <span className="font-display text-sm font-bold text-white">{theme.initials}</span>
                </div>
                <span className="text-center text-sm font-semibold text-ink">{app.name}</span>
              </Link>
            )
          })}

          <Link
            to="/settings"
            className="tap-scale flex flex-col items-center gap-3.5 rounded-2xl px-4 py-8"
            style={{ background: '#eef0f2' }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5a6472] shadow-[0_6px_16px_rgba(90,100,114,0.3)]">
              <span className="text-lg text-white">⚙</span>
            </div>
            <span className="text-center text-sm font-semibold text-ink">Pengaturan</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
