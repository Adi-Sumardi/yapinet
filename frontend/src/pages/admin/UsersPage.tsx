import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api, type AdminUser } from '../../lib/api'
import { adminUserKeys, useAdminUsers } from '../../features/admin-users/useAdminUsers'
import AddUserModal from '../../features/admin-users/AddUserModal'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useConfirm } from '../../components/ui/Confirm'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import { GridIcon, PlusIcon, PowerIcon, SearchIcon, ShieldIcon, TrashIcon, UsersIcon } from '../../components/icons'
import { useAuth } from '../../context/AuthContext'
import { usePageTitle } from '../../context/SettingsContext'

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Nonaktif' },
]

export default function UsersPage() {
  usePageTitle('Pengguna')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const { data, isLoading, isError, error, refetch } = useAdminUsers({ search: debounced, status, page })
  const { me } = useAuth()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const toast = useToast()

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: adminUserKeys.all })

  const toggleAdmin = (user: AdminUser) =>
    void confirm({
      tone: user.is_admin ? 'warning' : 'default',
      icon: <ShieldIcon size={24} />,
      title: user.is_admin ? `Cabut role Admin dari ${user.full_name}?` : `Jadikan ${user.full_name} Admin?`,
      description: user.is_admin
        ? 'Pengguna ini tidak bisa lagi membuka panel admin dan hanya melihat menu yang diberikan.'
        : 'Admin bisa mengelola menu, pengguna, hak akses, dan pengaturan, serta melihat semua menu.',
      confirmLabel: user.is_admin ? 'Cabut Admin' : 'Jadikan Admin',
      onConfirm: async () => {
        await api.admin.updateUser(user.id, { is_admin: !user.is_admin })
        invalidate()
        toast.success(user.is_admin ? 'Role Admin dicabut' : 'Role Admin diberikan', { description: user.full_name })
      },
    })

  const toggleStatus = (user: AdminUser) => {
    const suspending = user.status !== 'suspended'
    void confirm({
      tone: suspending ? 'warning' : 'default',
      icon: <PowerIcon size={24} />,
      title: suspending ? `Nonaktifkan ${user.full_name}?` : `Aktifkan kembali ${user.full_name}?`,
      description: suspending
        ? 'Pengguna langsung keluar dari semua perangkat dan tidak bisa masuk sampai diaktifkan lagi. Data & hak aksesnya tetap tersimpan.'
        : 'Pengguna bisa masuk lagi dengan akun Google-nya.',
      confirmLabel: suspending ? 'Nonaktifkan' : 'Aktifkan',
      onConfirm: async () => {
        await api.admin.updateUser(user.id, { status: suspending ? 'suspended' : 'active' })
        invalidate()
        toast.success(suspending ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan', { description: user.full_name })
      },
    })
  }

  const remove = (user: AdminUser) =>
    void confirm({
      tone: 'danger',
      title: 'Hapus pengguna ini?',
      description: (
        <>
          <b className="text-ink">{user.full_name}</b> ({user.primary_email}) akan dihapus permanen dan tidak bisa masuk
          lagi. Tindakan ini tidak bisa dibatalkan — pertimbangkan <b>Nonaktifkan</b> saja.
        </>
      ),
      confirmLabel: 'Ya, hapus',
      requireText: 'HAPUS',
      onConfirm: async () => {
        await api.admin.deleteUser(user.id)
        invalidate()
        toast.success('Pengguna dihapus', { description: user.primary_email })
      },
    })

  const users = data?.data ?? []

  return (
    <AdminLayout>
      <PageHeader
        title="Pengguna"
        description="Hanya email yang terdaftar di sini yang bisa masuk ke Yapinet."
        actions={
          <Button icon={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
            Tambah pengguna
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="inline-flex rounded-xl bg-surface p-1 ring-1 ring-line-soft">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value)
                setPage(1)
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${status === f.value ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {data && users.length === 0 && (
        <EmptyState
          icon={<UsersIcon size={24} />}
          title="Tidak ada pengguna"
          description={debounced ? 'Coba kata kunci lain.' : 'Tambahkan pengguna pertama.'}
        />
      )}

      <ul className="flex flex-col gap-2.5">
        {users.map((user) => {
          const isSelf = user.id === me?.user.id
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line-soft bg-surface p-3.5"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${user.is_admin ? 'bg-accent text-white' : 'bg-surface-soft text-ink'}`}
              >
                {user.full_name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
                  <span className="truncate">{user.full_name}</span>
                  {isSelf && <span className="text-xs font-normal text-ink-faint">(kamu)</span>}
                  {user.is_admin && <Badge tone="info">Admin</Badge>}
                  {user.status === 'suspended' && <Badge tone="critical">Nonaktif</Badge>}
                  {user.has_logged_in === false && <Badge>Belum pernah masuk</Badge>}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {user.primary_email} · {user.is_admin ? 'semua menu' : `${user.apps_count ?? 0} menu`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link to={`/admin/pengguna/${user.id}`}>
                  <Button variant="secondary" size="sm" icon={<GridIcon size={14} />}>
                    Akses
                  </Button>
                </Link>
                {!isSelf && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleAdmin(user)}
                      title={user.is_admin ? 'Cabut Admin' : 'Jadikan Admin'}
                      aria-label={user.is_admin ? 'Cabut Admin' : 'Jadikan Admin'}
                      className={`rounded-lg p-2 hover:bg-surface-soft ${user.is_admin ? 'text-accent' : 'text-ink-faint'}`}
                    >
                      <ShieldIcon size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(user)}
                      title={user.status === 'suspended' ? 'Aktifkan' : 'Nonaktifkan'}
                      aria-label={user.status === 'suspended' ? 'Aktifkan' : 'Nonaktifkan'}
                      className={`rounded-lg p-2 hover:bg-surface-soft ${user.status === 'suspended' ? 'text-ink-faint' : 'text-good'}`}
                    >
                      <PowerIcon size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(user)}
                      title="Hapus"
                      aria-label={`Hapus ${user.full_name}`}
                      className="rounded-lg p-2 text-ink-faint hover:bg-crit-soft hover:text-crit"
                    >
                      <TrashIcon size={17} />
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {data && data.meta.last_page > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
          <span>
            Halaman {data.meta.current_page} dari {data.meta.last_page} · {data.meta.total} pengguna
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {adding && <AddUserModal onClose={() => setAdding(false)} />}
    </AdminLayout>
  )
}
