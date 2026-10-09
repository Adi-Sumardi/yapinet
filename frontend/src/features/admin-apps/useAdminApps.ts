import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export const adminAppKeys = {
  all: ['admin', 'apps'] as const,
  detail: (id: string) => ['admin', 'apps', id] as const,
}

export function useAdminApps() {
  return useQuery({ queryKey: adminAppKeys.all, queryFn: api.admin.apps })
}

export function useAdminApp(id: string | undefined) {
  return useQuery({ queryKey: adminAppKeys.detail(id ?? ''), queryFn: () => api.admin.app(id!), enabled: !!id })
}
