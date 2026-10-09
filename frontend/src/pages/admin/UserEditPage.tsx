import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { adminUserKeys } from '../../features/admin-users/useAdminUsers'
import MenuIcon from '../../features/menu/MenuIcon'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import { ShieldIcon } from '../../components/icons'
import { usePageTitle } from '../../context/SettingsContext'

/** Profil + hak akses per pengguna: centang = boleh melihat menu itu. */
export default function UserEditPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  const user = useQuery({ queryKey: adminUserKeys.detail(id), queryFn: () => api.admin.user(id) })
  const access = useQuery({ queryKey: adminUserKeys.access(id), queryFn: () => api.admin.userAccess(id) })
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savingName, setSavingName] = useState(false)
  const [savingAccess, setSavingAccess] = useState(false)
  usePageTitle(user.data?.full_name)

  useEffect(() => {
    if (user.data) setName(user.data.full_name)
  }, [user.data])

  useEffect(() => {
    if (access.data) setSelected(new Set(access.data.apps.filter((a) => a.granted).map((a) => a.id)))
  }, [access.data])

  const original = new Set(access.data?.apps.filter((a) => a.granted).map((a) => a.id) ?? [])
  const dirty = original.size !== selected.size || [...selected].some((x) => !original.has(x))

  const toggle = (appId: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(appId)) next.delete(appId)
      else next.add(appId)
      return next
    })

  const saveName = async () => {
    setSavingName(true)
    try {
      const updated = await api.admin.updateUser(id, { full_name: name.trim() })
      queryClient.setQueryData(adminUserKeys.detail(id), updated)
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
      toast.success('Nama disimpan')
    } catch (e) {
      toast.error('Gagal menyimpan nama', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSavingName(false)
    }
  }

  const saveAccess = async () => {
    setSavingAccess(true)
    try {
      const updated = await api.admin.setUserAccess(id, [...selected])
      queryClient.setQueryData(adminUserKeys.access(id), updated)
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
      toast.success('Hak akses disimpan', {
        description: `${user.data?.full_name} sekarang bisa melihat ${selected.size} menu.`,
      })
    } catch (e) {
      toast.error('Gagal menyimpan hak akses', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSavingAccess(false)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        back={{ to: '/admin/pengguna', label: 'Pengguna' }}
        title={user.data?.full_name ?? 'Pengguna'}
        description={user.data?.primary_email}
      />

      {(user.isLoading || access.isLoading) && <Skeleton className="h-96 rounded-2xl" />}
      {(user.isError || access.isError) && (
        <ErrorState
          message={(user.error ?? access.error)?.message}
          onRetry={() => void (user.refetch(), access.refetch())}
        />
      )}

      {user.data && access.data && (
        <div className="flex flex-col gap-5">
          <Card title="Profil">
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                wrapperClassName="min-w-[240px] flex-1"
              />
              <Button
                variant="secondary"
                loading={savingName}
                disabled={!name.trim() || name.trim() === user.data.full_name}
                onClick={() => void saveName()}
              >
                Simpan nama
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={user.data.is_admin ? 'info' : 'neutral'}>{user.data.is_admin ? 'Admin' : 'User'}</Badge>
              <Badge tone={user.data.status === 'suspended' ? 'critical' : 'ok'}>
                {user.data.status === 'suspended' ? 'Nonaktif' : 'Aktif'}
              </Badge>
            </div>
          </Card>

          <Card
            title="Hak akses menu"
            description={access.data.is_admin ? undefined : 'Centang menu yang boleh dilihat pengguna ini.'}
            actions={
              !access.data.is_admin && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(new Set(access.data.apps.map((a) => a.id)))}
                  >
                    Pilih semua
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Kosongkan
                  </Button>
                </>
              )
            }
          >
            {access.data.is_admin ? (
              <div className="flex gap-3 rounded-xl bg-accent-soft p-4 text-sm text-accent">
                <ShieldIcon className="mt-0.5 shrink-0" />
                <p className="text-ink">
                  Pengguna ini <b>Admin</b> — otomatis melihat semua menu aktif, tidak perlu diatur per menu.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {access.data.apps.map((app) => (
                    <label
                      key={app.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected.has(app.id) ? 'border-accent bg-accent-soft/50' : 'border-line-soft hover:bg-surface-soft'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(app.id)}
                        onChange={() => toggle(app.id)}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      <MenuIcon icon={app.icon} color={app.color} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{app.name}</span>
                      {!app.is_active && <Badge>Nonaktif</Badge>}
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-end gap-3">
                  {dirty && <span className="text-xs text-warn">Ada perubahan yang belum disimpan</span>}
                  <Button loading={savingAccess} disabled={!dirty} onClick={() => void saveAccess()}>
                    Simpan hak akses
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}
