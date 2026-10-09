import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatDateTime, formatRelative } from '../../lib/format'
import { ACTION_FILTERS, ACTION_LABEL, describeMetadata } from '../../features/audit/actions'
import AdminLayout, { PageHeader } from '../../components/layout/AdminLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'
import { ListIcon } from '../../components/icons'
import { usePageTitle } from '../../context/SettingsContext'

export default function AuditLogPage() {
  usePageTitle('Log Aktivitas')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'audit', action, page],
    queryFn: () => api.admin.auditLogs({ action, page }),
    placeholderData: keepPreviousData,
  })

  return (
    <AdminLayout>
      <PageHeader
        title="Log Aktivitas"
        description="Riwayat login, pembukaan aplikasi, dan semua perubahan oleh admin."
      />

      <Select
        value={action}
        onChange={(e) => {
          setAction(e.target.value)
          setPage(1)
        }}
        options={ACTION_FILTERS}
        wrapperClassName="mb-4 max-w-xs"
        aria-label="Filter aktivitas"
      />

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}
      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}
      {data && data.data.length === 0 && <EmptyState icon={<ListIcon size={24} />} title="Belum ada aktivitas" />}

      {data && data.data.length > 0 && (
        <ul className="divide-y divide-line-soft rounded-2xl border border-line-soft bg-surface">
          {data.data.map((log) => {
            const meta = ACTION_LABEL[log.action] ?? { label: log.action, tone: 'neutral' as const }
            const detail = describeMetadata(log.metadata)
            return (
              <li key={log.id} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-4 py-3.5">
                <span
                  className="w-32 shrink-0 text-xs text-ink-faint"
                  title={log.created_at ? formatDateTime(log.created_at) : undefined}
                >
                  {log.created_at ? formatRelative(log.created_at) : '—'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-ink">{log.user?.full_name ?? 'Sistem / tamu'}</span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {log.app && <span className="font-medium text-ink-soft">{log.app.name}</span>}
                  </p>
                  {detail && <p className="mt-0.5 truncate text-xs text-ink-soft">{detail}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
          <span>
            Halaman {data.meta.current_page} dari {data.meta.last_page}
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
    </AdminLayout>
  )
}
