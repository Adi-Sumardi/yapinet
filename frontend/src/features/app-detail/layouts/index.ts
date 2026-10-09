import type { JSX } from 'react'
import type { SummaryCard } from '../../../lib/types'
import SianggarDetail from './SianggarDetail'
import SimayaDetail from './SimayaDetail'
import SimonasDetail from './SimonasDetail'
import SimonikDetail from './SimonikDetail'

/**
 * Layout detail khusus (membaca `details` bebas dari kontrak lama). Kuncinya
 * sama dengan apps.detail_layout. Hapus satu per satu begitu aplikasinya
 * mengirim sections[] — renderer generik akan mengambil alih.
 */
export const CUSTOM_LAYOUTS: Record<string, (props: { cards: SummaryCard[] }) => JSX.Element> = {
  sianggar: SianggarDetail,
  simaya: SimayaDetail,
  simonik: SimonikDetail,
  simonas: SimonasDetail,
}
