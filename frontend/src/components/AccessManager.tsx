import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AdminUser } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function AccessManager() {
  const queryClient = useQueryClient()
  const { me } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: api.adminUsers })

  const createUserMutation = useMutation({
    mutationFn: () => api.adminCreateUser({ full_name: newUserName, primary_email: newUserEmail }),
    onSuccess: () => {
      setNewUserName('')
      setNewUserEmail('')
      setCreateError(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => setCreateError('Gagal menambah pengguna. Periksa email (mungkin sudah dipakai).'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.adminDeleteUser(userId),
    onSuccess: (_, userId) => {
      if (userId === selectedUserId) setSelectedUserId('')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => window.alert('Gagal menghapus pengguna.'),
  })

  const confirmDelete = (user: AdminUser) => {
    if (window.confirm(`Hapus ${user.full_name} (${user.primary_email})? Pengguna ini tidak akan bisa login lagi.`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const appsQuery = useQuery({ queryKey: ['admin-apps'], queryFn: api.adminApps })
  const grantsQuery = useQuery({
    queryKey: ['admin-grants', selectedUserId],
    queryFn: () => api.adminGrants(selectedUserId),
    enabled: !!selectedUserId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-grants', selectedUserId] })

  const grantMutation = useMutation({
    mutationFn: (appId: string) => api.adminGrant({ user_id: selectedUserId, app_id: appId }),
    onSuccess: invalidate,
  })

  const revokeMutation = useMutation({
    mutationFn: (grantId: string) => api.adminRevoke(grantId),
    onSuccess: invalidate,
  })

  if (usersQuery.isLoading || appsQuery.isLoading) {
    return <p className="text-sm text-ink-soft">Memuat data akses…</p>
  }

  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-5">
      <h2 className="font-display text-base font-bold text-ink">Kelola Hak Akses</h2>
      <p className="mt-1 text-sm text-ink-soft">Atur aplikasi apa saja yang bisa dilihat tiap pengguna.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          createUserMutation.mutate()
        }}
        className="mt-5 flex flex-wrap items-end gap-2.5 rounded-xl border border-line-soft bg-surface-soft p-3.5"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Nama Lengkap
          </label>
          <input
            required
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            placeholder="Nama pengguna baru"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Email</label>
          <input
            type="email"
            required
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            placeholder="nama@gmail.com"
          />
        </div>
        <button
          type="submit"
          disabled={createUserMutation.isPending}
          className="tap-scale rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          Tambah Pengguna
        </button>
        {createError && <p className="w-full text-xs text-red-600">{createError}</p>}
        <p className="w-full text-xs text-ink-faint">
          Pengguna hanya bisa masuk dengan akun Google yang emailnya sama dengan email di sini.
        </p>
      </form>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Daftar Pengguna ({usersQuery.data?.length ?? 0})
      </h3>
      <div className="mt-1.5 flex flex-col divide-y divide-line-soft rounded-xl border border-line-soft">
        {usersQuery.data?.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {u.full_name}
                {u.is_admin && (
                  <span className="ml-2 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                    Admin
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-ink-soft">{u.primary_email}</p>
            </div>
            {u.id !== me?.user.id && (
              <button
                onClick={() => confirmDelete(u)}
                disabled={deleteUserMutation.isPending}
                className="tap-scale shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>

      <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Atur akses aplikasi — pilih pengguna
      </label>
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
      >
        <option value="">— Pilih —</option>
        {usersQuery.data?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name} ({u.primary_email})
          </option>
        ))}
      </select>

      {selectedUserId && (
        <div className="mt-5 flex flex-col divide-y divide-line-soft border-t border-line-soft">
          {appsQuery.data?.map((app) => {
            const grant = grantsQuery.data?.find((g) => g.app_id === app.id)

            return (
              <div key={app.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="w-28 shrink-0 text-sm font-semibold text-ink">{app.name}</span>

                <div className="ml-auto flex gap-2">
                  {!grant && (
                    <button
                      onClick={() => grantMutation.mutate(app.id)}
                      disabled={grantMutation.isPending}
                      className="tap-scale rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Beri Akses
                    </button>
                  )}
                  {grant && (
                    <button
                      onClick={() => revokeMutation.mutate(grant.id)}
                      disabled={revokeMutation.isPending}
                      className="tap-scale rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
                    >
                      Cabut
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
