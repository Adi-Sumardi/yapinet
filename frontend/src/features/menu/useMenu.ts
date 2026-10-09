import { useQuery } from '@tanstack/react-query'
import { api, type AppDetail, type MenuItem } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'

export const menuKeys = {
  all: ['menu'] as const,
  detail: (slug: string) => ['menu', 'app', slug] as const,
}

export function useMenu() {
  return useQuery({ queryKey: menuKeys.all, queryFn: api.menu })
}

export function useAppDetail(slug: string) {
  return useQuery({ queryKey: menuKeys.detail(slug), queryFn: () => api.app(slug), retry: false })
}

/**
 * Buka aplikasi sesuai open_mode. Untuk tab baru, jendela dibuka DULU secara
 * sinkron (sebelum await) supaya tidak diblokir popup blocker browser.
 */
export function useOpenApp() {
  const toast = useToast()

  return async (item: Pick<MenuItem | AppDetail, 'slug' | 'name' | 'open_mode'>, path?: string) => {
    const popup = item.open_mode === 'new_tab' ? window.open('', '_blank') : null
    if (popup) popup.opener = null

    try {
      const { redirect_url } = await api.openApp(item.slug, path)
      if (popup) popup.location.href = redirect_url
      else window.location.href = redirect_url
    } catch (e) {
      popup?.close()
      toast.error(`Gagal membuka ${item.name}`, { description: e instanceof Error ? e.message : undefined })
    }
  }
}
