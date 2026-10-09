import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, ApiError, type SummaryCard } from '../lib/api'
import { formatDateTime, formatRelative } from '../lib/format'
import { menuKeys, useAppDetail, useOpenApp } from '../features/menu/useMenu'
import MenuIcon from '../features/menu/MenuIcon'
import DetailView from '../features/app-detail/DetailView'
import { CUSTOM_LAYOUTS } from '../features/app-detail/layouts'
import AppShell from '../components/layout/AppShell'
import Badge, { STATUS_LABEL, STATUS_TONE } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import { ArrowLeftIcon, ExternalIcon, PlugIcon, RefreshIcon } from '../components/icons'
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

  return (
    <AppShell>
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeftIcon size={15} /> Kembali ke Dashboard
      </Link>

      {isLoading && (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-16 w-72" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      )}

      {isError && !(error instanceof ApiError && error.status === 404) && (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      )}

      {app && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MenuIcon icon={app.icon} color={app.color} shape="rounded" />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-xl font-bold text-ink">{app.name}</h1>
                  {status && status !== 'degraded' && <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>}
                  {withData[0]?.is_stale && <Badge>Data lama</Badge>}
                </div>
                {app.description && <p className="text-sm text-ink-soft">{app.description}</p>}
                {latest && (
                  <p className="mt-0.5 text-xs text-ink-faint" title={formatDateTime(latest)}>
                    Diperbarui {formatRelative(latest)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" icon={<ExternalIcon size={14} />} onClick={() => void openApp(app)}>
                Buka aplikasi
              </Button>
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
            </div>
          </div>

          {withData.length === 0 ? (
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
            <div className="flex flex-col gap-6">
              {withData.map((card, i) => (
                <GenericCard
                  key={card.unit?.id ?? i}
                  card={card}
                  showUnit={withData.length > 1}
                  onOpen={(path) => void openApp(app, path)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

function GenericCard({
  card,
  showUnit,
  onOpen,
}: {
  card: SummaryCard
  showUnit: boolean
  onOpen: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {(showUnit || card.headline) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5">
          <div>
            {showUnit && <h2 className="font-display text-sm font-bold text-ink">{card.unit?.name ?? 'Semua unit'}</h2>}
            {card.headline && <p className="text-sm text-ink-soft">{card.headline}</p>}
          </div>
          {showUnit && <Badge tone={STATUS_TONE[card.status]}>{STATUS_LABEL[card.status]}</Badge>}
        </div>
      )}
      <DetailView card={card} onOpen={onOpen} />
    </div>
  )
}
