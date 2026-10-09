import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '../../lib/api'

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (params: { search?: string; status?: string; page?: number }) => ['admin', 'users', 'list', params] as const,
  detail: (id: string) => ['admin', 'users', id] as const,
  access: (id: string) => ['admin', 'users', id, 'access'] as const,
}

export function useAdminUsers(params: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => api.admin.users(params),
    placeholderData: keepPreviousData,
  })
}
