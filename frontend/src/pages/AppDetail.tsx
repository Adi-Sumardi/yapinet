import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { appTheme } from '../lib/appIcons'
import { codeToName, slugToCode } from '../lib/appSlugs'
import LogoMark from '../components/LogoMark'
import SianggarDetail from '../components/SianggarDetail'
import SimayaDetail from '../components/SimayaDetail'
import SimonikDetail from '../components/SimonikDetail'
import SimonasDetail from '../components/SimonasDetail'
import ComingSoonDetail from '../components/ComingSoonDetail'
import type { SummaryCard } from '../lib/api'

// Aplikasi dengan struktur data khusus dapat punya tampilan detail sendiri,
// bukan kartu generik — daftarkan di sini begitu komponennya dibuat. Hanya
// Sianggar/Simaya/Simonik/Simonas yang sudah masuk gelombang deploy pertama
// dan punya kontrak /integrations/yapinet/summary nyata; sisanya memakai
// fallback "Coming Soon" sampai integrasinya dibangun.
const CUSTOM_DETAIL: Record<string, (props: { cards: SummaryCard[] }) => React.JSX.Element> = {
  SNGR: SianggarDetail,
  SMYA: SimayaDetail,
  SMNK: SimonikDetail,
  SMNS: SimonasDetail,
  SMOY: ComingSoonDetail,
  SHRS: ComingSoonDetail,
  ESPP: ComingSoonDetail,
  PMB: ComingSoonDetail,
  ARSD: ComingSoonDetail,
  SKLH: ComingSoonDetail,
  FRNT: ComingSoonDetail,
}

const STATUS_LABEL = {
  ok: 'Aman',
  warning: 'Perlu perhatian',
  critical: 'Kritis',
  degraded: 'Belum ada data',
} as const

const STATUS_CLASS = {
  ok: 'bg-good-soft text-good',
  warning: 'bg-warn-soft text-warn',
  critical: 'bg-crit-soft text-crit',
  degraded: 'bg-surface-soft text-ink-faint',
} as const

function OpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

export default function AppDetail() {
  const { slug = '' } = useParams()
  const code = slugToCode(slug)
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [opening, setOpening] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.dashboardSummary,
  })

  if (!code) {
    return <Navigate to="/" replace />
  }

  const theme = appTheme(code)
  const CustomDetail = CUSTOM_DETAIL[code]
  const cards = data?.cards.filter((c) => c.app_code === code) ?? []
  const appName = cards[0]?.app_name ?? codeToName(code)

  // Belum ada satu pun baris ringkasan yang membawa data nyata — berarti API
  // aplikasi ini belum tersambung, bukan berarti "aman"/kosong.
  const noApiYet =
    cards.length > 0 && cards.every((c) => c.status === 'degraded' && !c.headline && c.metrics.length === 0)

  const refresh = async () => {
    setRefreshing(true)
    try {
      await api.refreshApp(code)
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    } finally {
      setRefreshing(false)
    }
  }

  const openApp = async () => {
    setOpening(true)
    try {
      const { redirect_url } = await api.handoff(code)
      window.location.href = redirect_url
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="min-h-svh bg-paper">
      <header className="flex items-center justify-between border-b border-line-soft bg-surface px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="font-display text-base font-bold uppercase text-accent-deep">Yapinet</span>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          ← Kembali ke Dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: theme.color, boxShadow: `0 6px 16px ${theme.shadow}` }}
            >
              <span className="font-display text-sm font-bold text-white">{theme.initials}</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink">{appName}</h1>
              <p className="text-sm text-ink-soft">{theme.category}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void openApp()}
              disabled={opening}
              className="tap-scale flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <OpenIcon />
              Buka Aplikasi
            </button>
            <button
              onClick={() => void refresh()}
              disabled={refreshing}
              className="tap-scale flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
            >
              <RefreshIcon />
              {refreshing ? 'Menyegarkan…' : 'Segarkan'}
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-ink-soft">Memuat data…</p>}

        {!isLoading && CustomDetail && <CustomDetail cards={cards} />}

        {!isLoading && !CustomDetail && (
          <>
            {cards.length === 0 && (
              <div className="rounded-2xl border border-line-soft bg-surface p-8 text-center">
                <p className="text-sm text-ink-soft">
                  Tidak ada data untuk aplikasi ini — kamu mungkin belum diberi akses, atau ringkasan belum tersedia.
                </p>
              </div>
            )}

            {noApiYet && (
              <div className="rounded-2xl border border-line-soft bg-surface p-10 text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: theme.color, opacity: 0.85 }}
                >
                  <span className="font-display text-xs font-bold text-white">{theme.initials}</span>
                </div>
                <h2 className="font-display text-base font-bold text-ink">Menu Sedang Proses Pengerjaan</h2>
                <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
                  Integrasi data {appName} ke Yapinet belum tersedia. Ringkasan akan muncul di sini begitu API
                  aplikasi ini sudah tersambung.
                </p>
              </div>
            )}

            {!noApiYet && (
              <div className="flex flex-col gap-5">
                {cards.map((card, i) => (
                  <div
                    key={`${card.unit?.id ?? 'all'}-${i}`}
                    className="rounded-2xl border border-line-soft bg-surface p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold text-ink">{card.unit?.name ?? 'Semua Unit'}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[card.status]}`}>
                        {STATUS_LABEL[card.status]}
                      </span>
                    </div>

                    {card.headline && <p className="mb-4 text-sm text-ink-soft">{card.headline}</p>}

                    {card.metrics.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {card.metrics.map((metric) => (
                          <div key={metric.label} className="rounded-xl bg-surface-soft p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                              {metric.label}
                            </p>
                            <p className="mt-1 text-lg font-bold tabular-nums text-ink">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !card.headline && <p className="text-sm text-ink-faint">Data belum tersedia dari aplikasi ini.</p>
                    )}

                    {card.can_act && (
                      <p className="mt-4 text-xs font-semibold text-accent">Perlu tindakan dari kamu →</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
