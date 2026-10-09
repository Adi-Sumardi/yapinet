const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'yapinet_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function googleLoginUrl(): string {
  return `${API_URL}/api/auth/google/redirect`
}

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearToken()
    throw new ApiError(401, 'Sesi berakhir, silakan masuk kembali.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, body.message ?? 'Terjadi kesalahan.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export type SummaryCard = {
  app_code: string
  app_name: string
  app_icon_url: string | null
  unit: { id: string; name: string } | null
  status: 'ok' | 'warning' | 'critical' | 'degraded'
  headline: string | null
  metrics: { label: string; value: string | number }[]
  details: Record<string, unknown>
  fetched_at: string | null
  can_act: boolean
}

export type Me = {
  user: {
    id: string
    full_name: string
    primary_email: string
    status: 'active' | 'pending' | 'suspended'
    is_admin: boolean
  }
  app_access: unknown[]
}

export type AdminUser = {
  id: string
  full_name: string
  primary_email: string
  status: 'active' | 'pending' | 'suspended'
  is_admin: boolean
}

export type AdminApp = { id: string; code: string; name: string }

export type AdminGrant = {
  id: string
  user_id: string
  app_id: string
  app: AdminApp
}

export const api = {
  me: () => request<Me>('/api/me'),
  dashboardSummary: () => request<{ cards: SummaryCard[] }>('/api/dashboard/summary'),
  refreshApp: (code: string) => request(`/api/apps/${code}/refresh`, { method: 'POST' }),
  handoff: (code: string, path?: string) =>
    request<{ redirect_url: string }>(`/api/apps/${code}/handoff${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  adminUsers: () => request<{ data: AdminUser[] }>('/api/admin/users?per_page=100').then((r) => r.data),
  adminCreateUser: (payload: { full_name: string; primary_email: string }) =>
    request<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteUser: (userId: string) => request(`/api/admin/users/${userId}`, { method: 'DELETE' }),
  adminApps: () =>
    request<{ data: (AdminApp & { is_active: boolean })[] }>('/api/admin/apps').then((r) =>
      r.data.filter((app) => app.is_active),
    ),
  adminGrants: (userId: string) => request<AdminGrant[]>(`/api/admin/access?user_id=${userId}`),
  adminGrant: (payload: { user_id: string; app_id: string }) =>
    request<AdminGrant>('/api/admin/access', { method: 'POST', body: JSON.stringify(payload) }),
  adminRevoke: (grantId: string) => request(`/api/admin/access/${grantId}`, { method: 'DELETE' }),
}
