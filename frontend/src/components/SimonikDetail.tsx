import { useState } from 'react'
import type { SummaryCard } from '../lib/api'

/**
 * Tampilan khusus Simonik (meeting, notulensi, follow up) — data diambil
 * dari details{} pada summary card, diisi oleh GET
 * /integrations/yapinet/summary milik Simonik.
 */

type Meeting = { tanggal: string; tempat: string; agenda: string }
type FollowUp = { tanggal_meeting: string; tindak_lanjut: string; penanggung_jawab: string; status: 'Selesai' | 'Proses' | 'Belum Mulai' }
type JadwalLain = { tanggal: string; waktu: string; tempat: string; agenda: string }

const FOLLOWUP_STATUS_CLASS: Record<FollowUp['status'], string> = {
  Selesai: 'bg-good-soft text-good',
  Proses: 'bg-accent-soft text-accent',
  'Belum Mulai': 'bg-warn-soft text-warn',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SimonikDetail({ cards }: { cards: SummaryCard[] }) {
  const details = cards[0]?.details ?? {}
  const sampleMeeting = (details.meetings as Meeting[] | undefined) ?? []
  const sampleFollowUp = (details.follow_ups as FollowUp[] | undefined) ?? []
  const sampleJadwalLain = (details.jadwal_lain as JadwalLain[] | undefined) ?? []

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const inRange = (tanggal: string) => (!dateFrom || tanggal >= dateFrom) && (!dateTo || tanggal <= dateTo)

  const meetings = sampleMeeting.filter((m) => inRange(m.tanggal))
  const followUps = sampleFollowUp.filter((f) => inRange(f.tanggal_meeting))
  const jadwalLain = sampleJadwalLain.filter((j) => inRange(j.tanggal))

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Jadwal Meeting */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-3 font-display text-sm font-bold text-ink">Filter Jadwal Meeting</h3>
        <div className="flex flex-wrap items-end gap-3">
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
      </div>

      {/* Data Meeting */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Meeting</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Tanggal</th>
                <th className="pb-2 font-semibold">Tempat</th>
                <th className="pb-2 font-semibold">Agenda</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink-soft">{formatTanggal(m.tanggal)}</td>
                  <td className="py-2.5 text-ink">{m.tempat}</td>
                  <td className="py-2.5 text-ink">{m.agenda}</td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada meeting pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Follow Up Meeting */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Follow Up Meeting</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-semibold">Meeting</th>
                <th className="pb-2 font-semibold">Tindak Lanjut</th>
                <th className="pb-2 font-semibold">Penanggung Jawab</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((f, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-ink-soft">{formatTanggal(f.tanggal_meeting)}</td>
                  <td className="py-2.5 text-ink">{f.tindak_lanjut}</td>
                  <td className="py-2.5 text-ink-soft">{f.penanggung_jawab}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${FOLLOWUP_STATUS_CLASS[f.status]}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {followUps.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-ink-faint">
                    Tidak ada follow up pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Jadwal Meeting Lainnya */}
      <div className="rounded-2xl border border-line-soft bg-surface p-5">
        <h3 className="mb-4 font-display text-sm font-bold text-ink">Data Jadwal Meeting Lainnya</h3>
        <div className="flex flex-col gap-3">
          {jadwalLain.map((j, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-soft p-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{j.agenda}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{j.tempat}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{formatTanggal(j.tanggal)}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{j.waktu} WIB</p>
              </div>
            </div>
          ))}
          {jadwalLain.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-faint">Tidak ada jadwal lain pada rentang tanggal ini.</p>
          )}
        </div>
      </div>
    </div>
  )
}
