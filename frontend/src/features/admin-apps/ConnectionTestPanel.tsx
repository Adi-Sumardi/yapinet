import { useState } from 'react'
import { api, type ConnectionTestResult } from '../../lib/api'
import { formatValue } from '../../lib/format'
import Badge, { STATUS_LABEL, STATUS_TONE } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { AlertIcon, CheckIcon, ErrorIcon, PlugIcon } from '../../components/icons'
import { useToast } from '../../components/ui/Toast'

/** Tes Koneksi dari isi form (belum disimpan) + pratinjau kartu (rules/system-features.md F5). */
export default function ConnectionTestPanel({
  summaryUrl,
  authType,
  authHeader,
  apiKey,
  appId,
}: {
  summaryUrl: string
  authType: string
  authHeader: string
  apiKey: string
  appId?: string
}) {
  const [result, setResult] = useState<ConnectionTestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const toast = useToast()

  const run = async () => {
    setTesting(true)
    try {
      const res = await api.admin.testConnection({
        summary_url: summaryUrl,
        auth_type: authType,
        auth_header: authHeader || null,
        api_key: apiKey || undefined,
        app_id: appId,
      })
      setResult(res)
      if (res.ok) toast.success('Koneksi berhasil', { description: `HTTP ${res.http_status} · ${res.duration_ms} ms` })
      else toast.error('Koneksi gagal', { description: res.message ?? undefined })
    } catch (e) {
      toast.error('Tes koneksi gagal dijalankan', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line-soft bg-surface-soft p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<PlugIcon size={14} />}
          loading={testing}
          disabled={!summaryUrl}
          onClick={() => void run()}
        >
          Tes koneksi
        </Button>
        {result && (
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${result.ok ? 'text-good' : 'text-crit'}`}>
            {result.ok ? <CheckIcon size={16} strokeWidth={2.6} /> : <ErrorIcon size={16} />}
            {result.ok
              ? `HTTP ${result.http_status} · ${result.duration_ms} ms · ${result.warnings.length ? `${result.warnings.length} peringatan` : 'format valid'}`
              : result.message}
          </span>
        )}
        {!result && !summaryUrl && <span className="text-xs text-ink-faint">Isi URL API dulu untuk mengetes.</span>}
      </div>

      {result && result.warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {result.warnings.map((w) => (
            <li key={w} className="flex gap-2 text-xs text-warn">
              <AlertIcon size={14} className="mt-0.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      {result?.preview && (
        <div className="mt-4 rounded-xl border border-line-soft bg-surface p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Pratinjau ringkasan</p>
            <Badge tone={STATUS_TONE[result.preview.status]}>{STATUS_LABEL[result.preview.status]}</Badge>
          </div>
          {result.preview.headline && <p className="mb-3 text-sm text-ink">{result.preview.headline}</p>}
          {result.preview.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {result.preview.metrics.map((m) => (
                <div key={m.label} className="rounded-lg bg-surface-soft p-2.5">
                  <p className="text-[10px] font-semibold uppercase text-ink-faint">{m.label}</p>
                  <p className="text-sm font-bold tabular-nums text-ink">{formatValue(m.value, m.format)}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Kontrak v{result.preview.contract_version} · {result.preview.sections.length} section
            {result.preview.sections.length > 0 && ` (${result.preview.sections.map((s) => s.type).join(', ')})`}
          </p>
        </div>
      )}
    </div>
  )
}
