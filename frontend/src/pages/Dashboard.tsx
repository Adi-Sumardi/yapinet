import { useMenu } from '../features/menu/useMenu'
import MenuTile from '../features/menu/MenuTile'
import AppShell from '../components/layout/AppShell'
import LogoMark from '../components/layout/LogoMark'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States'
import { GridIcon, MegaphoneIcon } from '../components/icons'
import { usePageTitle } from '../context/SettingsContext'

const ANNOUNCEMENT = {
  info: 'bg-accent-soft text-accent',
  warning: 'bg-warn-soft text-warn',
  critical: 'bg-crit-soft text-crit',
}

export default function Dashboard() {
  usePageTitle('Dashboard')
  const { data, isLoading, isError, error, refetch } = useMenu()
  const meta = data?.meta

  return (
    <AppShell>
      {meta?.announcement && (
        <div className={`mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm ${ANNOUNCEMENT[meta.announcement.level]}`}>
          <MegaphoneIcon className="mt-0.5 shrink-0" />
          <p className="whitespace-pre-line text-ink">{meta.announcement.text}</p>
        </div>
      )}

      <div className="pt-4 text-center">
        <LogoMark size="lg" className="mx-auto mb-6" />
        {isLoading ? (
          <Skeleton className="mx-auto h-8 w-72" />
        ) : (
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{meta?.welcome_title}</h1>
        )}
        {meta?.welcome_subtitle && <p className="mt-2 text-sm text-ink-soft">{meta.welcome_subtitle}</p>}
      </div>

      <div className="mt-11">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}

        {data && data.data.length === 0 && (
          <EmptyState
            icon={<GridIcon size={24} />}
            title="Belum ada menu untuk akunmu"
            description="Hubungi Admin Yayasan agar diberi akses ke aplikasi yang kamu butuhkan."
          />
        )}

        {data && data.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {data.data.map((item) => (
              <MenuTile key={item.id} item={item} showStatus={meta?.show_status_badge ?? true} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
