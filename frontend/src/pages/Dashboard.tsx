import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import SummaryCardItem from '../components/SummaryCardItem'

export default function Dashboard() {
  const { me, logout } = useAuth()
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.dashboardSummary,
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-4 pb-10">
      <header className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Yapinet</p>
          <h1 className="text-lg font-semibold text-ink">Halo, {me?.user.full_name.split(' ')[0]}</h1>
        </div>
        <button onClick={() => void logout()} className="text-xs font-medium text-ink-soft underline">
          Keluar
        </button>
      </header>

      {me?.user.status === 'pending' && (
        <div className="mb-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          Akun kamu belum diberi akses ke aplikasi manapun. Hubungi admin Yapinet.
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">Ringkasan Aplikasi</p>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-xs font-medium text-accent-strong disabled:opacity-50"
        >
          {isFetching ? 'Memuat…' : 'Segarkan'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-ink-soft">Memuat ringkasan…</p>}
      {isError && <p className="text-sm text-crit">Gagal memuat dashboard.</p>}

      {data && data.cards.length === 0 && (
        <p className="text-sm text-ink-soft">Belum ada aplikasi yang bisa ditampilkan untuk akunmu.</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.cards.map((card, i) => (
          <SummaryCardItem key={`${card.app_code}-${card.unit?.id ?? i}`} card={card} />
        ))}
      </div>
    </div>
  )
}
