import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, type SettingItem } from '../../lib/api'
import SettingField from '../../features/admin-settings/SettingField'
import { menuKeys } from '../../features/menu/useMenu'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import { useConfirm } from '../../components/ui/Confirm'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { useToast } from '../../components/ui/Toast'
import { RefreshIcon } from '../../components/icons'
import { publicSettingsKey, usePageTitle } from '../../context/SettingsContext'

const settingsKey = ['admin', 'settings'] as const

export default function SettingsPage() {
  usePageTitle('Pengaturan')
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: settingsKey, queryFn: api.admin.settings })
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [group, setGroup] = useState('branding')
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (data) setValues(Object.fromEntries(data.data.map((s) => [s.key, s.value])))
  }, [data])

  const items = useMemo(() => data?.data.filter((s) => s.group === group) ?? [], [data, group])
  const changed = useMemo(
    () => (data ? data.data.filter((s) => JSON.stringify(values[s.key]) !== JSON.stringify(s.value)) : []),
    [data, values],
  )

  const afterSave = () => {
    void queryClient.invalidateQueries({ queryKey: settingsKey })
    void queryClient.invalidateQueries({ queryKey: publicSettingsKey })
    void queryClient.invalidateQueries({ queryKey: menuKeys.all })
  }

  const save = async () => {
    setSaving(true)
    setErrors({})
    try {
      await api.admin.updateSettings(Object.fromEntries(changed.map((s) => [s.key, values[s.key]])))
      afterSave()
      toast.success('Pengaturan disimpan', { description: `${changed.length} perubahan diterapkan.` })
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setErrors(e.errors)
        toast.error('Ada isian yang belum benar', { description: 'Periksa kolom yang ditandai merah.' })
      } else {
        toast.error('Gagal menyimpan pengaturan', { description: e instanceof Error ? e.message : undefined })
      }
    } finally {
      setSaving(false)
    }
  }

  const reset = (item: SettingItem) =>
    void confirm({
      tone: 'warning',
      icon: <RefreshIcon size={24} />,
      title: `Kembalikan “${item.label}” ke bawaan?`,
      description: 'Nilai yang sekarang akan diganti dengan nilai bawaan sistem.',
      confirmLabel: 'Kembalikan',
      onConfirm: async () => {
        await api.admin.resetSetting(item.key)
        afterSave()
        toast.success('Dikembalikan ke bawaan', { description: item.label })
      },
    })

  return (
    <AdminLayout>
      <PageHeader title="Pengaturan" description="Ubah tampilan dan perilaku Yapinet tanpa mengubah kode." />

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {data && (
        <>
          <Tabs
            items={Object.entries(data.meta.groups).map(([value, label]) => ({ value, label }))}
            value={group}
            onChange={setGroup}
          />

          <div className="mt-4 flex flex-col gap-1 rounded-2xl border border-line-soft bg-surface">
            {items.map((item) => (
              <div key={item.key} className="border-b border-line-soft p-5 last:border-0">
                <SettingField
                  item={item}
                  value={values[item.key]}
                  error={errors[`values.${item.key}`]?.[0]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v }))}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.public && <Badge tone="info">Tampil sebelum login</Badge>}
                  {!item.is_default && (
                    <button
                      type="button"
                      onClick={() => reset(item)}
                      className="text-xs font-semibold text-ink-faint hover:text-accent"
                    >
                      Kembalikan ke bawaan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 mt-5 flex items-center justify-end gap-3 rounded-2xl bg-paper/80 py-2 backdrop-blur">
            {changed.length > 0 && (
              <span className="text-xs font-semibold text-warn">{changed.length} perubahan belum disimpan</span>
            )}
            {changed.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setValues(Object.fromEntries(data.data.map((s) => [s.key, s.value])))}
              >
                Batalkan
              </Button>
            )}
            <Button loading={saving} disabled={changed.length === 0} onClick={() => void save()}>
              Simpan pengaturan
            </Button>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
