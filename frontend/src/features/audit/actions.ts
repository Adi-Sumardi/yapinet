import type { Tone } from '../../lib/types'

/** Label Bahasa Indonesia untuk audit_log.action (rules/database.md). */
export const ACTION_LABEL: Record<string, { label: string; tone: Tone }> = {
  'auth.login': { label: 'Masuk', tone: 'ok' },
  'auth.login_rejected': { label: 'Login ditolak', tone: 'critical' },
  'auth.logout': { label: 'Keluar', tone: 'neutral' },
  'app.opened': { label: 'Membuka aplikasi', tone: 'info' },
  'admin.app_created': { label: 'Menambah menu', tone: 'info' },
  'admin.app_updated': { label: 'Mengubah menu', tone: 'info' },
  'admin.app_deleted': { label: 'Menghapus menu', tone: 'critical' },
  'admin.apps_reordered': { label: 'Mengurutkan menu', tone: 'info' },
  'admin.user_created': { label: 'Menambah pengguna', tone: 'info' },
  'admin.user_updated': { label: 'Mengubah pengguna', tone: 'info' },
  'admin.user_deleted': { label: 'Menghapus pengguna', tone: 'critical' },
  'admin.access_updated': { label: 'Mengubah hak akses', tone: 'warning' },
  'admin.settings_updated': { label: 'Mengubah pengaturan', tone: 'warning' },
  // Nama aksi lama sebelum 2026-10-09
  login: { label: 'Masuk', tone: 'ok' },
  redirect: { label: 'Membuka aplikasi', tone: 'info' },
}

export const ACTION_FILTERS = [
  { value: '', label: 'Semua aktivitas' },
  { value: 'auth', label: 'Login & keluar' },
  { value: 'app.', label: 'Membuka aplikasi' },
  { value: 'admin.app', label: 'Perubahan menu' },
  { value: 'admin.user', label: 'Perubahan pengguna' },
  { value: 'admin.access', label: 'Perubahan hak akses' },
  { value: 'admin.settings', label: 'Perubahan pengaturan' },
]

/** Ringkasan metadata yang aman ditampilkan (tidak pernah berisi secret). */
export function describeMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return ''
  const parts: string[] = []
  if (typeof metadata.email === 'string') parts.push(metadata.email)
  if (typeof metadata.reason === 'string')
    parts.push(
      metadata.reason === 'not_registered'
        ? 'email belum terdaftar'
        : metadata.reason === 'suspended'
          ? 'akun nonaktif'
          : metadata.reason,
    )
  if (Array.isArray(metadata.changed) && metadata.changed.length) parts.push(`ubah: ${metadata.changed.join(', ')}`)
  if (Array.isArray(metadata.keys)) parts.push(metadata.keys.join(', '))
  if (metadata.api_key_changed) parts.push('API key diganti')
  if (typeof metadata.path === 'string') parts.push(metadata.path)
  return parts.join(' · ')
}
