import { useMemo, useState } from 'react'
import type { SummaryCard } from '../lib/api'
import { formatRupiah } from '../lib/format'

/**
 * Tampilan khusus Simaya (manajemen aset) — data diambil dari details{} pada
 * summary card, diisi oleh GET /integrations/yapinet/summary milik Simaya.
 */

type AsetRusak = {
  nama: string
  unit: string
  tanggal_lapor: string // ISO yyyy-mm-dd
  status: 'Menunggu Perbaikan' | 'Sedang Diperbaiki' | 'Dihapuskan'
}

const STATUS_CLASS: Record<AsetRusak['status'], string> = {
  'Menunggu Perbaikan': 'bg-warn-soft text-warn',
  'Sedang Diperbaiki': 'bg-accent-soft text-accent',
  Dihapuskan: 'bg-crit-soft text-crit',
}

type Penyusutan = {
  nama: string
  unit?: string
  nilai_awal: number
  nilai_sekarang: number
  penyusutan_per_tahun: number
}

type ByUnit = { unit: string; jumlah_aset: number; nilai_total_aset: number }

export default function SimayaDetail({ cards }: { cards: SummaryCard[] }) {
  const details = cards[0]?.details ?? {}
  const defaultJumlahAset = (details.jumlah_aset as number | undefined) ?? 0
  const defaultNilaiTotalAset = (details.nilai_total_aset as number | undefined) ?? 0
  const byUnit = (details.by_unit as ByUnit[] | undefined) ?? []
  const sampleAsetRusak = (details.aset_rusak as AsetRusak[] | undefined) ?? []
  const samplePenyusutan = (details.penyusutan as Penyusutan[] | undefined) ?? []

  // Daftar unit untuk dropdown filter = gabungan unit yang muncul di data
  // aset rusak DENGAN unit yang punya breakdown jumlah/nilai aset (by_unit)
  // — BUKAN dari `cards[].unit`, yang hanya mencerminkan unit sisi Yapinet
  // ("Kantor Yayasan") dan tidak pernah cocok dengan unit asli Simaya.
  const units = useMemo(() => {
    const names = new Set([
      ...sampleAsetRusak.map((a) => a.unit).filter((n): n is string => !!n),
      ...byUnit.map((u) => u.unit),
    ])
    return Array.from(names).sort()
  }, [sampleAsetRusak, byUnit])

  const [unit, setUnit] = useState('all')

  const selectedUnitStats = unit !== 'all' ? byUnit.find((u) => u.unit === unit) : undefined
  const jumlahAset = unit === 'all' ? defaultJumlahAset : selectedUnitStats?.jumlah_aset ?? 0
  const nilaiTotalAset = unit === 'all' ? defaultNilaiTotalAset : selectedUnitStats?.nilai_total_aset ?? 0

  const asetRusak = sampleAsetRusak.filter((a) => unit === 'all' || a.unit === unit)
  const penyusutan = samplePenyusutan.filter((a) => unit === 'all' || a.unit === unit)
  const totalNilaiAwal = penyusutan.reduce((sum, a) => sum + a.nilai_awal, 0)
  const totalNilaiSekarang = penyusutan.reduce((sum, a) => sum + a.nilai_sekarang, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Unit */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
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

      {/* Jumlah Aset & Nilai Aset */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Jumlah Aset &amp; Nilai Aset</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Jumlah Aset</p>
            <p className="mt-1 text-lg font-bold text-ink">{jumlahAset.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Nilai Total Aset</p>
            <p className="mt-1 text-lg font-bold text-ink">{formatRupiah(nilaiTotalAset)}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Unit Tercakup</p>
            <p className="mt-1 text-lg font-bold text-ink">{unit === 'all' ? byUnit.length : selectedUnitStats ? 1 : 0}</p>
          </div>
        </div>
      </div>

      {/* Data Aset Rusak */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Aset Rusak</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Nama Aset</th>
                <th className="pb-2 font-semibold">Tanggal Lapor</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {asetRusak.map((a, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink">{a.nama}</td>
                  <td className="py-2.5 text-ink-soft">
                    {new Date(a.tanggal_lapor).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {asetRusak.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada laporan aset rusak untuk unit ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Penyusutan Aset */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Penyusutan Aset</h3>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Nilai Perolehan</p>
            <p className="mt-1 text-base font-bold text-ink">{formatRupiah(totalNilaiAwal)}</p>
          </div>
          <div className="rounded-xl bg-surface-soft p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Nilai Buku Saat Ini</p>
            <p className="mt-1 text-base font-bold text-ink">{formatRupiah(totalNilaiSekarang)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Nama Aset</th>
                <th className="pb-2 font-semibold">Nilai Awal</th>
                <th className="pb-2 font-semibold">Nilai Sekarang</th>
                <th className="pb-2 font-semibold">Penyusutan/Tahun</th>
              </tr>
            </thead>
            <tbody>
              {penyusutan.map((a, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink">{a.nama}</td>
                  <td className="py-2.5 text-ink-soft">{formatRupiah(a.nilai_awal)}</td>
                  <td className="py-2.5 font-semibold tabular-nums text-ink">{formatRupiah(a.nilai_sekarang)}</td>
                  <td className="py-2.5 text-ink-soft">{a.penyusutan_per_tahun}%</td>
                </tr>
              ))}
              {penyusutan.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada data penyusutan untuk unit ini.
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
