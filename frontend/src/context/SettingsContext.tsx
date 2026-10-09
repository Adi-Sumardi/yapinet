import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type PublicSettings } from '../lib/api'
import { applyAccent } from '../lib/color'

/**
 * Pengaturan publik (branding, teks login, kontak) dari GET /api/settings/public.
 * Default di sini hanya dipakai sesaat sebelum respons pertama datang.
 */
const DEFAULTS: PublicSettings = {
  'branding.app_name': 'Yapinet',
  'branding.logo_url': null,
  'branding.primary_color': '#2E6DA4',
  'branding.footer_text': '© 2026 Yayasan — Yapinet',
  'login.headline': 'Satu Aplikasi, Semua Layanan Yayasan',
  'login.subtitle': null,
  'login.help_text': 'Butuh bantuan akses? Hubungi Admin Yayasan.',
  'contact.admin_whatsapp': null,
  'contact.admin_email': null,
}

export const publicSettingsKey = ['public-settings'] as const

const SettingsContext = createContext<PublicSettings>(DEFAULTS)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({ queryKey: publicSettingsKey, queryFn: api.publicSettings, staleTime: 5 * 60_000 })
  const settings = { ...DEFAULTS, ...data }

  const primaryColor = settings['branding.primary_color']
  useEffect(() => {
    applyAccent(primaryColor)
  }, [primaryColor])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext)
}

/** document.title = "{Judul} · {nama aplikasi}" (rules/views.md). */
export function usePageTitle(title?: string) {
  const appName = useSettings()['branding.app_name']
  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName
  }, [title, appName])
}
