import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, ApiError, type SummaryCard } from '../lib/api'
import { formatDateTime, formatRelative } from '../lib/format'
import { menuKeys, useAppDetail, useOpenApp } from '../features/menu/useMenu'
import MenuIcon from '../features/menu/MenuIcon'
import DetailView from '../features/app-detail/DetailView'
import { accentOnDark } from '../features/app-detail/theme'
import { CUSTOM_LAYOUTS } from '../features/app-detail/layouts'
import AppShell from '../components/layout/AppShell'
import Badge, { STATUS_LABEL, STATUS_TONE } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import { AlertIcon, ArrowLeftIcon, ExternalIcon, PlugIcon, PrinterIcon, RefreshIcon } from '../components/icons'
import { usePageTitle } from '../context/SettingsContext'
import NotFound from './NotFound'

/** Kartu tanpa data nyata = integrasi API belum tersambung, bukan "aman". */
function hasData(card: SummaryCard) {
  return card.status !== 'degraded' || !!card.headline || card.metrics.length > 0 || card.sections.length > 0
}

export default function AppDetail() {
  const { slug = '' } = useParams()
  const { data: app, isLoading, isError, error, refetch } = useAppDetail(slug)
  const queryClient = useQueryClient()
  const openApp = useOpenApp()
  const toast = useToast()
  const [refreshing, setRefreshing] = useState(false)
  usePageTitle(app?.name)

  if (isError && error instanceof ApiError && error.status === 404) return <NotFound />

  const refresh = async () => {
    setRefreshing(true)
    try {
      const fresh = await toast.promise(api.refreshApp(slug), {
        loading: `Mengambil data terbaru ${app?.name ?? ''}…`,
        success: 'Data diperbarui',
        error: 'Gagal memperbarui data',
      })
      queryClient.setQueryData(menuKeys.detail(slug), fresh)
      void queryClient.invalidateQueries({ queryKey: menuKeys.all, exact: true })
    } catch {
      // toast.promise sudah menampilkan pesan error
    } finally {
      setRefreshing(false)
    }
  }

  const cards = app?.cards ?? []
  const withData = cards.filter(hasData)
  // Layout khusus lama hanya untuk aplikasi yang belum mengirim kontrak v1.1.
  const isV11 = withData.some((c) => c.contract_version >= 2)
  const Custom = app && !isV11 ? CUSTOM_LAYOUTS[app.detail_layout] : undefined
  const status = withData[0]?.status
  const latest = cards
    .map((c) => c.fetched_at)
    .filter(Boolean)
    .sort()
    .at(-1)
  const failure = cards.find((c) => c.error_message)?.error_message
  const accent = accentOnDark(app?.color)

  return (
    <AppShell wide>
      <Link
        to="/"
        className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline print:hidden"
      >
        <ArrowLeftIcon size={15} /> Kembali ke Dashboard
      </Link>

      {isLoading && <DetailSkeleton />}

      {isError && !(error instanceof ApiError && error.status === 404) && (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      )}

      {app && (
        <>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MenuIcon icon={app.icon} color={app.color} shape="rounded" />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-bold text-ink">{app.name}</h1>
                  {status && status !== 'degraded' && <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>}
                </div>
                {app.description && <p className="text-sm text-ink-soft">{app.description}</p>}
                {latest && <Freshness at={latest} stale={!!withData[0]?.is_stale} failed={!!failure && withData.length > 0} />}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {withData.length > 0 && (
                <Button size="sm" variant="secondary" icon={<PrinterIcon size={14} />} onClick={() => window.print()}>
                  Cetak / PDF
                </Button>
              )}
              {app.has_summary && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshIcon size={14} />}
                  loading={refreshing}
                  onClick={() => void refresh()}
                >
                  Segarkan
                </Button>
              )}
              <Button size="sm" icon={<ExternalIcon size={14} />} onClick={() => void openApp(app)}>
                Buka aplikasi
              </Button>
            </div>
          </div>

          {withData.length === 0 && app.has_summary && failure ? (
            <EmptyState
              icon={<AlertIcon size={24} className="text-warn" />}
              title="Data belum bisa diambil"
              description={`${failure} Coba segarkan; kalau masih gagal, kemungkinan ${app.name} sedang lambat atau tidak bisa dihubungi.`}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" icon={<RefreshIcon size={15} />} loading={refreshing} onClick={() => void refresh()}>
                    Segarkan
                  </Button>
                  <Button icon={<ExternalIcon size={15} />} onClick={() => void openApp(app)}>
                    Buka {app.name}
                  </Button>
                </div>
              }
            />
          ) : withData.length === 0 ? (
            <EmptyState
              icon={<PlugIcon size={24} />}
              title="Integrasi data belum tersedia"
              description={`Ringkasan ${app.name} akan muncul di sini begitu API aplikasinya tersambung. Sementara itu, kamu tetap bisa membuka aplikasinya langsung.`}
              action={
                <Button icon={<ExternalIcon size={15} />} onClick={() => void openApp(app)}>
                  Buka {app.name}
                </Button>
              }
            />
          ) : Custom ? (
            <Custom cards={cards} />
          ) : (
            <div className="flex flex-col gap-7">
              {withData.map((card, i) => (
                <GenericCard
                  key={card.unit?.id ?? i}
                  card={card}
                  accent={accent}
                  showUnit={withData.length > 1}
                  onOpen={(path) => void openApp(app, path)}
                />
              ))}
            </div>
          )}
          <p className="mt-10 hidden text-xs text-ink-soft print:block">
            Dicetak dari Yapinet · {app.name} · data {latest ? formatDateTime(latest) : '—'}
          </p>
        </>
      )}
    </AppShell>
  )
}

/** "Diperbarui X lalu" + titik: hijau berdenyut = segar, kuning = lama, merah = gagal ambil terakhir. */
function Freshness({ at, stale, failed }: { at: string; stale: boolean; failed: boolean }) {
  const tone = failed ? 'text-crit' : stale ? 'text-warn' : 'text-good'
  const note = failed ? ' · pengambilan terakhir gagal' : stale ? ' · data lama' : ''
  return (
    <p className="mt-1 flex items-center gap-2 text-xs text-ink-soft" title={formatDateTime(at)}>
      <span className={`relative inline-block h-2 w-2 rounded-full bg-current ${tone} ${!failed && !stale ? 'live-dot' : ''}`} />
      Diperbarui {formatRelative(at)}
      {note}
    </p>
  )
}

/** Kerangka memuat sebentuk halaman: hero, tiga sorotan, dua kartu. */
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Memuat">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-[28px]" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  )
}

function GenericCard({
  card,
  accent,
  showUnit,
  onOpen,
}: {
  card: SummaryCard
  accent: string
  showUnit: boolean
  onOpen: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {showUnit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5">
          <div>
            <h2 className="font-display text-sm font-bold text-ink">{card.unit?.name ?? 'Semua unit'}</h2>
            {card.headline && <p className="text-sm text-ink-soft">{card.headline}</p>}
          </div>
          <Badge tone={STATUS_TONE[card.status]}>{STATUS_LABEL[card.status]}</Badge>
        </div>
      )}
      <DetailView card={card} accent={accent} onOpen={onOpen} />
    </div>
  )
}
