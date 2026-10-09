import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LogoMark from '../components/LogoMark'
import AccessManager from '../components/AccessManager'

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  pending: 'Menunggu akses',
  suspended: 'Nonaktif',
}

export default function Settings() {
  const { me, logout } = useAuth()
  const initials = me?.user.full_name.trim().charAt(0).toUpperCase() ?? 'U'

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

        <h1 className="mb-5 font-display text-xl font-bold text-ink">Pengaturan</h1>

        <div className="rounded-2xl border border-line-soft bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-lg font-bold text-ink">
              {initials}
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">{me?.user.full_name}</p>
              <p className="text-sm text-ink-soft">{me?.user.primary_email}</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-line-soft pt-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-soft">Status akun</dt>
              <dd className="text-sm font-semibold text-ink">
                {me ? (STATUS_LABEL[me.user.status] ?? me.user.status) : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-soft">Aplikasi diakses</dt>
              <dd className="text-sm font-semibold text-ink">{me?.app_access.length ?? 0}</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={() => void logout()}
          className="tap-scale mt-6 w-full rounded-xl border border-line px-5 py-3.5 text-sm font-semibold text-ink hover:bg-surface-soft"
        >
          Keluar
        </button>

        {me?.user.is_admin && (
          <div className="mt-8">
            <AccessManager />
          </div>
        )}
      </main>
    </div>
  )
}
