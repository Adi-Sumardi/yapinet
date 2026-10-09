import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, type AdminAppPayload } from '../../lib/api'
import { formatRelative } from '../../lib/format'
import { adminAppKeys, useAdminApp } from '../../features/admin-apps/useAdminApps'
import AppForm from '../../features/admin-apps/AppForm'
import { connectionStatus } from '../../features/admin-apps/options'
import { menuKeys } from '../../features/menu/useMenu'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useConfirm } from '../../components/ui/Confirm'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import { RefreshIcon, TrashIcon } from '../../components/icons'
import { usePageTitle } from '../../context/SettingsContext'

export default function AppEditPage() {
  const { id } = useParams()
  const isNew = !id
  const { data: app, isLoading, isError, error, refetch } = useAdminApp(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  usePageTitle(isNew ? 'Tambah menu' : app?.name)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminAppKeys.all })
    void queryClient.invalidateQueries({ queryKey: menuKeys.all })
  }

  const save = useMutation({
    mutationFn: (payload: AdminAppPayload) =>
      isNew ? api.admin.createApp(payload) : api.admin.updateApp(id!, payload),
    onSuccess: (saved) => {
      invalidate()
      queryClient.setQueryData(adminAppKeys.detail(saved.id), saved)
      toast.success(isNew ? 'Menu ditambahkan' : 'Perubahan disimpan', {
        description: isNew
          ? `${saved.name} sudah ${saved.is_active ? 'tampil di dashboard' : 'tersimpan (belum ditampilkan)'}.`
          : undefined,
      })
      navigate('/admin/menu')
    },
    onError: (e) => {
      const message =
        e instanceof ApiError && e.status === 422 ? 'Periksa kembali isian yang ditandai merah.' : e.message
      toast.error('Menu belum tersimpan', { description: message })
    },
  })

  const refresh = async () => {
    try {
      const res = await toast.promise(api.admin.refreshApp(id!), {
        loading: 'Mengambil ringkasan…',
        success: (r) => (r.ok ? 'Ringkasan diperbarui' : 'Selesai, tapi gagal mengambil data'),
      })
      queryClient.setQueryData(adminAppKeys.detail(id!), res.app)
      if (!res.ok) toast.warning('Aplikasi belum mengembalikan data', { description: res.message ?? undefined })
      invalidate()
    } catch {
      // pesan sudah ditampilkan toast.promise
    }
  }

  const remove = () =>
    void confirm({
      tone: 'danger',
      title: `Hapus menu ${app?.name}?`,
      description: (
        <>
          Menu ini akan hilang dari dashboard{app?.users_count ? ` ${app.users_count} pengguna` : ''}. Riwayat log tetap
          tersimpan, dan slug <b>/{app?.slug}</b> tidak bisa dipakai menu lain.
        </>
      ),
      confirmLabel: 'Ya, hapus menu',
      requireText: 'HAPUS',
      onConfirm: async () => {
        await api.admin.deleteApp(id!)
        invalidate()
        toast.success('Menu dihapus', { description: `${app?.name} sudah tidak ada di dashboard.` })
        navigate('/admin/menu')
      },
    })

  const status = app ? connectionStatus(app) : null

  return (
    <AdminLayout>
      <PageHeader
        back={{ to: '/admin/menu', label: 'Menu Aplikasi' }}
        title={isNew ? 'Tambah menu' : (app?.name ?? 'Ubah menu')}
        description={
          app && status ? (
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              {status.detail && <span className="text-xs text-crit">{status.detail}</span>}
              {app.last_checked_at && (
                <span className="text-xs text-ink-faint">dicek {formatRelative(app.last_checked_at)}</span>
              )}
            </span>
          ) : (
            'Isi tampilan dan tujuan menu. Integrasi data bisa ditambahkan belakangan.'
          )
        }
        actions={
          app?.summary_url && (
            <Button variant="secondary" size="sm" icon={<RefreshIcon size={14} />} onClick={() => void refresh()}>
              Ambil data sekarang
            </Button>
          )
        }
      />

      {!isNew && isLoading && <Skeleton className="h-[600px] rounded-2xl" />}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {(isNew || app) && (
        <AppForm
          key={app?.id ?? 'new'}
          app={app}
          submitting={save.isPending}
          error={save.error}
          onSubmit={(payload) => save.mutate(payload)}
          footerExtra={
            app && (
              <Button
                variant="ghost"
                className="text-crit hover:bg-crit-soft hover:text-crit"
                icon={<TrashIcon size={16} />}
                onClick={remove}
              >
                Hapus menu
              </Button>
            )
          }
        />
      )}
    </AdminLayout>
  )
}
