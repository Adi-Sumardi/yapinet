import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AdminGrant } from '../lib/api'

const ROLE_LABEL: Record<AdminGrant['yayasan_role'], string> = {
  bph: 'BPH',
  pembina: 'Pembina',
  pengawas: 'Pengawas',
  app_admin: 'Admin Aplikasi',
}

type RowState = { role: AdminGrant['yayasan_role']; canAct: boolean }

export default function AccessManager() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [rows, setRows] = useState<Record<string, RowState>>({})
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
  const appsQuery = useQuery({ queryKey: ['admin-apps'], queryFn: api.adminApps })
  const grantsQuery = useQuery({
    queryKey: ['admin-grants', selectedUserId],
    queryFn: () => api.adminGrants(selectedUserId),
    enabled: !!selectedUserId,
  })

  useEffect(() => {
    if (!appsQuery.data) return

    const next: Record<string, RowState> = {}
    for (const app of appsQuery.data) {
      const existing = grantsQuery.data?.find((g) => g.app_id === app.id)
      next[app.id] = { role: existing?.yayasan_role ?? 'pembina', canAct: existing?.can_act ?? false }
    }
    setRows(next)
  }, [appsQuery.data, grantsQuery.data])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-grants', selectedUserId] })

  const grantMutation = useMutation({
    mutationFn: (appId: string) =>
      api.adminGrant({
        user_id: selectedUserId,
        app_id: appId,
        yayasan_role: rows[appId].role,
        can_act: rows[appId].canAct,
      }),
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
            placeholder="nama@yayasan.id"
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
          Pengguna baru mendapat password default dan wajib menggantinya di login pertama.
        </p>
      </form>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Pilih pengguna
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
            const row = rows[app.id] ?? { role: 'pembina', canAct: false }

            return (
              <div key={app.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="w-28 shrink-0 text-sm font-semibold text-ink">{app.name}</span>

                <select
                  value={row.role}
                  onChange={(e) =>
                    setRows((prev) => ({
                      ...prev,
                      [app.id]: { ...row, role: e.target.value as AdminGrant['yayasan_role'] },
                    }))
                  }
                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink"
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={row.canAct}
                    onChange={(e) => setRows((prev) => ({ ...prev, [app.id]: { ...row, canAct: e.target.checked } }))}
                  />
                  Bisa bertindak
                </label>

                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => grantMutation.mutate(app.id)}
                    disabled={grantMutation.isPending}
                    className="tap-scale rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {grant ? 'Simpan' : 'Beri Akses'}
                  </button>
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
