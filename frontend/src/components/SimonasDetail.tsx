import { useMemo, useState } from 'react'
import type { SummaryCard } from '../lib/api'

/**
 * Tampilan khusus Simonas (monitoring warga asrama) — data diambil dari
 * details{} pada summary card, diisi oleh GET /integrations/yapinet/summary
 * milik Simonas.
 */

type Warga = {
  nama: string
  asrama: string
  status: 'Aktif' | 'Cuti' | 'Alumni'
  ipk: number | null
  poin_simonas: number
  tahun_masuk: number | null
  tahun_keluar: number | null
}

const STATUS_CLASS: Record<Warga['status'], string> = {
  Aktif: 'bg-good-soft text-good',
  Cuti: 'bg-warn-soft text-warn',
  Alumni: 'bg-surface-soft text-ink-faint',
}

export default function SimonasDetail({ cards }: { cards: SummaryCard[] }) {
  const warga = (cards[0]?.details?.warga as Warga[] | undefined) ?? []

  // Daftar asrama untuk dropdown filter diambil dari data warga itu sendiri —
  // BUKAN dari `cards[].unit`, yang hanya mencerminkan unit sisi Yapinet
  // ("Kantor Yayasan") dan tidak pernah cocok dengan nilai `asrama` per warga.
  const asramaList = useMemo(() => {
    const names = new Set(warga.map((w) => w.asrama).filter((n): n is string => !!n))
    return Array.from(names).sort()
  }, [warga])

  const [asrama, setAsrama] = useState('all')
  const [tahunMasuk, setTahunMasuk] = useState('')
  const [tahunKeluar, setTahunKeluar] = useState('')

  const wargaFiltered = warga.filter((w) => asrama === 'all' || w.asrama === asrama)

  const wargaByTahun = warga.filter((w) => {
    if (tahunMasuk && w.tahun_masuk !== Number(tahunMasuk)) return false
    if (tahunKeluar && w.tahun_keluar !== Number(tahunKeluar)) return false
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Data Asrama */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Filter Data Asrama</label>
        <select
          value={asrama}
          onChange={(e) => setAsrama(e.target.value)}
          className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:w-auto"
        >
          <option value="all">Semua Asrama</option>
          {asramaList.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Nama Warga</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">IPK</th>
                <th className="pb-2 font-semibold">Poin Simonas</th>
              </tr>
            </thead>
            <tbody>
              {wargaFiltered.map((w, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink">{w.nama}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-ink-soft">{w.ipk !== null ? w.ipk.toFixed(2) : '—'}</td>
                  <td className="py-2.5 font-semibold tabular-nums text-ink">{w.poin_simonas}</td>
                </tr>
              ))}
              {wargaFiltered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada warga untuk asrama ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Tahun Masuk & Keluar Asrama */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-3 font-display text-sm font-bold text-ink">Filter Tahun Masuk &amp; Keluar Asrama</h3>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Tahun Masuk</label>
            <input
              type="number"
              placeholder="Semua"
              value={tahunMasuk}
              onChange={(e) => setTahunMasuk(e.target.value)}
              className="mt-1.5 w-28 rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">Tahun Keluar</label>
            <input
              type="number"
              placeholder="Semua"
              value={tahunKeluar}
              onChange={(e) => setTahunKeluar(e.target.value)}
              className="mt-1.5 w-28 rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </div>
          {(tahunMasuk || tahunKeluar) && (
            <button
              onClick={() => {
                setTahunMasuk('')
                setTahunKeluar('')
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
                <th className="pb-2 font-semibold">Nama Warga</th>
                <th className="pb-2 font-semibold">Tahun Masuk</th>
                <th className="pb-2 font-semibold">Tahun Keluar</th>
              </tr>
            </thead>
            <tbody>
              {wargaByTahun.map((w, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink">{w.nama}</td>
                  <td className="py-2.5 text-ink-soft">{w.tahun_masuk ?? '—'}</td>
                  <td className="py-2.5 text-ink-soft">{w.tahun_keluar ?? '—'}</td>
                </tr>
              ))}
              {wargaByTahun.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada warga yang cocok dengan filter tahun ini.
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
