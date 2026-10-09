import { useMemo, useState } from 'react'
import type { SummaryCard } from '../../../lib/types'
import { formatRupiah } from '../../../lib/format'

/**
 * Tampilan khusus Sianggar — struktur datanya (APBS, realisasi, pengajuan)
 * beda dari aplikasi lain sehingga tidak cocok dipaksakan ke kartu generik
 * di AppDetail. Data diambil dari details{} pada summary card, diisi oleh
 * GET /integrations/yapinet/summary milik Sianggar.
 */

type Pengajuan = {
  tanggal: string // ISO yyyy-mm-dd
  unit: string
  keterangan: string
  nominal: number
  status: 'Disetujui' | 'Menunggu' | 'Ditolak'
}

type Realisasi = { percent: number; terealisasi: number; sisa: number }

type ApbsByUnit = { unit: string; total_apbs: number; disahkan_at: string | null; realisasi: Realisasi }

type Apbs = {
  total_apbs: number
  disahkan_at: string | null
  unit_count: number
  by_unit: ApbsByUnit[]
}

type TahunAjaran = Apbs & { tahun: string; realisasi: Realisasi }

const STATUS_CLASS: Record<Pengajuan['status'], string> = {
  Disetujui: 'bg-good-soft text-good',
  Menunggu: 'bg-warn-soft text-warn',
  Ditolak: 'bg-crit-soft text-crit',
}

export default function SianggarDetail({ cards }: { cards: SummaryCard[] }) {
  const details = cards[0]?.details ?? {}
  const defaultApbs = (details.apbs as Apbs | undefined) ?? {
    total_apbs: 0,
    disahkan_at: null,
    unit_count: 0,
    by_unit: [],
  }
  const defaultRealisasi = (details.realisasi as Realisasi | undefined) ?? { percent: 0, terealisasi: 0, sisa: 0 }
  const pengajuan = (details.pengajuan as Pengajuan[] | undefined) ?? []
  const tahunAjaranList = (details.tahun_ajaran as TahunAjaran[] | undefined) ?? []

  const [unit, setUnit] = useState('all')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const selectedTahun = tahunAjaranList.find((t) => t.tahun === tahunAjaran)
  const tahunScope: Apbs = selectedTahun ?? defaultApbs
  const tahunRealisasi: Realisasi = selectedTahun?.realisasi ?? defaultRealisasi
  const byUnit = tahunScope.by_unit ?? []

  // Daftar unit untuk dropdown filter = gabungan unit yang muncul di data
  // pengajuan (mis. Laz, Asrama, Sdm — baru mengajukan, belum tentu punya
  // APBS disahkan) DENGAN unit yang punya APBS disahkan (by_unit, mis. SMP
  // 5-5) yang belum tentu punya pengajuan terbaru. BUKAN dari `cards[].unit`,
  // yang hanya mencerminkan unit sisi Yapinet ("Kantor Yayasan") dan tidak
  // pernah cocok dengan unit asli Sianggar manapun.
  const units = useMemo(() => {
    const names = new Set([
      ...pengajuan.map((p) => p.unit).filter((n): n is string => !!n),
      ...byUnit.map((u) => u.unit),
    ])
    return Array.from(names).sort()
  }, [pengajuan, byUnit])

  // Kalau user memilih unit tertentu (bukan "Semua Unit"), tampilkan angka
  // APBS/realisasi khusus unit itu (dari by_unit yang sudah dihitung backend
  // per tahun ajaran) — bukan agregat semua unit. Kalau unit itu tidak
  // punya data APBS untuk tahun terpilih (unit itu baru mengajukan anggaran,
  // belum disahkan), tampilkan nol dengan catatan yang jelas, alih-alih diam
  // -diam menampilkan agregat semua unit yang salah.
  const selectedUnitApbs = unit !== 'all' ? byUnit.find((u) => u.unit === unit) : undefined
  const selectedUnitHasNoApbs = unit !== 'all' && !selectedUnitApbs
  const apbs: Apbs =
    unit === 'all'
      ? tahunScope
      : {
          total_apbs: selectedUnitApbs?.total_apbs ?? 0,
          disahkan_at: selectedUnitApbs?.disahkan_at ?? null,
          unit_count: selectedUnitApbs ? 1 : 0,
          by_unit: byUnit,
        }
  const realisasi: Realisasi =
    unit === 'all' ? tahunRealisasi : (selectedUnitApbs?.realisasi ?? { percent: 0, terealisasi: 0, sisa: 0 })

  const filteredPengajuan = pengajuan.filter((p) => {
    if (unit !== 'all' && p.unit !== unit) return false
    if (dateFrom && p.tanggal < dateFrom) return false
    if (dateTo && p.tanggal > dateTo) return false
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Unit & Tahun Ajaran */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Filter Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:w-auto"
            >
              <option value="all">Semua Unit</option>
              {units.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Filter Tahun Ajaran
            </label>
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:w-auto"
            >
              <option value="">Tahun berjalan</option>
              {tahunAjaranList.map((t) => (
                <option key={t.tahun} value={t.tahun}>
                  {t.tahun}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* APBS & Tahun Ajaran */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink">APBS &amp; Tahun Ajaran</h3>
          <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink-soft">
            {selectedTahun?.tahun ?? 'Tahun berjalan'}
          </span>
        </div>
        {selectedUnitHasNoApbs && (
          <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
            Unit &quot;{unit}&quot; belum memiliki APBS yang disahkan untuk tahun ajaran ini — unit ini baru mengajukan
            anggaran (lihat Data Pengajuan di bawah).
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Total APBS</p>
            <p className="mt-1 text-lg font-bold text-ink">{formatRupiah(apbs.total_apbs)}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Disahkan</p>
            <p className="mt-1 text-lg font-bold text-ink">
              {apbs.disahkan_at
                ? new Date(apbs.disahkan_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Unit Tercakup</p>
            <p className="mt-1 text-lg font-bold text-ink">{apbs.unit_count}</p>
          </div>
        </div>
      </div>

      {/* Data Realisasi */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Realisasi</h3>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">Realisasi Anggaran</span>
          <span className="text-sm font-bold text-ink">{realisasi.percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-soft">
          <div className="h-full rounded-full bg-accent" style={{ width: `${realisasi.percent}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Terealisasi</p>
            <p className="mt-1 text-base font-bold text-ink">{formatRupiah(realisasi.terealisasi)}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Sisa Anggaran</p>
            <p className="mt-1 text-base font-bold text-ink">{formatRupiah(realisasi.sisa)}</p>
          </div>
        </div>
      </div>

      {/* Data Pengajuan */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Pengajuan</h3>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Dari</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Sampai</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="rounded-lg px-2 py-2 text-xs font-semibold text-accent"
            >
              Reset
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Tanggal</th>
                <th className="pb-2 font-semibold">Keterangan</th>
                <th className="pb-2 font-semibold">Nominal</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPengajuan.map((p, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink-soft">
                    {new Date(p.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2.5 text-ink">{p.keterangan}</td>
                  <td className="py-2.5 font-semibold tabular-nums text-ink">{formatRupiah(p.nominal)}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPengajuan.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada pengajuan pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
