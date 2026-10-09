import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api, type AdminApp } from '../../lib/api'
import { adminAppKeys, useAdminApps } from '../../features/admin-apps/useAdminApps'
import { connectionStatus, hostOf } from '../../features/admin-apps/options'
import { menuKeys } from '../../features/menu/useMenu'
import MenuIcon from '../../features/menu/MenuIcon'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  GridIcon,
  GripIcon,
  PlusIcon,
  PowerIcon,
} from '../../components/icons'
import { usePageTitle } from '../../context/SettingsContext'

export default function AppsPage() {
  usePageTitle('Menu Aplikasi')
  const { data, isLoading, isError, error, refetch } = useAdminApps()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [order, setOrder] = useState<AdminApp[]>([])
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    if (data) setOrder(data)
  }, [data])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminAppKeys.all })
    void queryClient.invalidateQueries({ queryKey: menuKeys.all })
  }

  const saveOrder = async (next: AdminApp[]) => {
    const previous = order
    setOrder(next)
    try {
      await api.admin.reorderApps(next.map((a) => a.id))
      toast.success('Urutan menu disimpan')
      invalidate()
    } catch (e) {
      setOrder(previous)
      toast.error('Gagal menyimpan urutan', { description: e instanceof Error ? e.message : undefined })
    }
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    void saveOrder(next)
  }

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const next = order.filter((a) => a.id !== dragId)
    const dragged = order.find((a) => a.id === dragId)!
    next.splice(
      next.findIndex((a) => a.id === targetId),
      0,
      dragged,
    )
    setDragId(null)
    void saveOrder(next)
  }

  const setActive = async (app: AdminApp, isActive: boolean, undoable = true) => {
    try {
      await api.admin.updateApp(app.id, { is_active: isActive })
      invalidate()
      if (undoable) {
        toast.success(isActive ? `${app.name} ditampilkan` : `${app.name} disembunyikan`, {
          description: isActive ? 'Menu kembali muncul di dashboard.' : 'Menu tidak lagi muncul di dashboard.',
          action: { label: 'Urungkan', onClick: () => void setActive(app, !isActive, false) },
        })
      } else {
        toast.info('Perubahan dibatalkan')
      }
    } catch (e) {
      toast.error('Gagal mengubah menu', { description: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Menu Aplikasi"
        description="Atur menu yang tampil di dashboard. Seret ⋮⋮ atau pakai panah untuk mengubah urutan."
        actions={
          <Link to="/admin/menu/baru">
            <Button icon={<PlusIcon size={16} />}>Tambah menu</Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState
          icon={<GridIcon size={24} />}
          title="Belum ada menu"
          description="Tambahkan aplikasi pertama — cukup isi nama, URL aplikasi, dan (opsional) URL API ringkasannya."
          action={
            <Link to="/admin/menu/baru">
              <Button icon={<PlusIcon size={16} />}>Tambah menu</Button>
            </Link>
          }
        />
      )}

      <ul className="flex flex-col gap-2.5">
        {order.map((app, index) => {
          const status = connectionStatus(app)
          return (
            <li
              key={app.id}
              draggable
              onDragStart={() => setDragId(app.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(app.id)}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-3 rounded-2xl border bg-surface p-3 pr-3.5 transition ${
                dragId === app.id ? 'border-accent opacity-60' : 'border-line-soft'
              } ${app.is_active ? '' : 'bg-surface/60'}`}
            >
              <span className="hidden cursor-grab text-ink-faint active:cursor-grabbing sm:block" aria-hidden="true">
                <GripIcon />
              </span>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Naikkan ${app.name}`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded p-0.5 text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <ChevronUpIcon size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Turunkan ${app.name}`}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded p-0.5 text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <ChevronDownIcon size={16} />
                </button>
              </div>
              <div className={app.is_active ? '' : 'opacity-50 grayscale'}>
                <MenuIcon
                  icon={{ type: app.icon_type, text: app.icon_text, url: app.icon_url }}
                  color={app.color}
                  size="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{app.name}</p>
                <p className="truncate text-xs text-ink-soft">{hostOf(app.open_url)}</p>
              </div>
              <span title={status.detail} className="hidden sm:inline-flex">
                <Badge tone={status.tone}>{status.label}</Badge>
              </span>
              <button
                type="button"
                onClick={() => void setActive(app, !app.is_active)}
                aria-label={app.is_active ? `Sembunyikan ${app.name}` : `Tampilkan ${app.name}`}
                title={app.is_active ? 'Sembunyikan' : 'Tampilkan'}
                className={`rounded-lg p-2 hover:bg-surface-soft ${app.is_active ? 'text-good' : 'text-ink-faint'}`}
              >
                <PowerIcon size={17} />
              </button>
              <Link
                to={`/admin/menu/${app.id}`}
                aria-label={`Ubah ${app.name}`}
                className="rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-ink"
              >
                <EditIcon size={17} />
              </Link>
            </li>
          )
        })}
      </ul>
    </AdminLayout>
  )
}
