import type { AdminApp, AuthType, OpenMode, Tone } from '../../lib/types'

export const OPEN_MODES: { value: OpenMode; label: string }[] = [
  { value: 'link', label: 'Tab yang sama' },
  { value: 'new_tab', label: 'Tab baru' },
  { value: 'handoff', label: 'SSO tiket (handoff)' },
  { value: 'oauth', label: 'SSO OAuth2 (Passport)' },
]

export const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'Tanpa autentikasi' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'header', label: 'Header custom' },
]

export const DETAIL_LAYOUTS = [
  { value: 'auto', label: 'Otomatis (dari data API)' },
  { value: 'link_only', label: 'Link saja — klik menu langsung buka aplikasi' },
  { value: 'sianggar', label: 'Tampilan khusus: Sianggar' },
  { value: 'simaya', label: 'Tampilan khusus: Simaya' },
  { value: 'simonik', label: 'Tampilan khusus: Simonik' },
  { value: 'simonas', label: 'Tampilan khusus: Simonas' },
]

export function connectionStatus(app: AdminApp): { tone: Tone; label: string; detail?: string } {
  if (!app.is_active) return { tone: 'neutral', label: 'Nonaktif' }
  if (!app.summary_url || app.detail_layout === 'link_only') return { tone: 'info', label: 'Link saja' }
  if (app.last_check_ok === true) return { tone: 'ok', label: 'Tersambung' }
  if (app.last_check_ok === false)
    return { tone: 'critical', label: 'Gagal', detail: app.last_check_message ?? undefined }
  return { tone: 'neutral', label: 'Belum dicek' }
}

export function hostOf(url: string | null): string {
  if (!url) return '—'
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
}
