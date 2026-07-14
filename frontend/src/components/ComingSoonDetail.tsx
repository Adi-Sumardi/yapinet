import { useParams } from 'react-router-dom'
import { appTheme } from '../lib/appIcons'
import { codeToName, slugToCode } from '../lib/appSlugs'

/**
 * Fallback untuk aplikasi yang belum masuk gelombang deploy pertama (baru
 * Sianggar/Simaya/Simonik/Simonas yang punya kontrak
 * /integrations/yapinet/summary nyata) — dipakai lewat CUSTOM_DETAIL di
 * AppDetail.tsx alih-alih memaksakan kartu generik atau data contoh.
 */
export default function ComingSoonDetail() {
  const { slug = '' } = useParams()
  const code = slugToCode(slug) ?? ''
  const theme = appTheme(code)
  const name = codeToName(code)

  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-10 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: theme.color, boxShadow: `0 6px 16px ${theme.shadow}` }}
      >
        <span className="font-display text-sm font-bold text-white">{theme.initials}</span>
      </div>
      <span className="mb-3 inline-block rounded-full bg-warn-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warn">
        Sedang Tahap Development
      </span>
      <h2 className="font-display text-lg font-bold text-ink">Coming Soon</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        Integrasi {name} ke Yapinet masih dalam tahap pengembangan dan belum termasuk gelombang deploy pertama.
        Ringkasan akan muncul di sini begitu API aplikasi ini sudah tersambung.
      </p>
    </div>
  )
}
