import type {
  AdminApp,
  AdminAppPayload,
  AdminUser,
  AppDetail,
  AuditLogEntry,
  ConnectionTestResult,
  Me,
  MenuItem,
  MenuMeta,
  OpenMode,
  Paginated,
  PublicSettings,
  SettingItem,
  UserAccess,
} from './types'

export type * from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'yapinet_token'

/** Dikirim saat API membalas 401 (token dicabut, akun dinonaktifkan, sesi habis). */
export const UNAUTHORIZED_EVENT = 'yapinet:unauthorized'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage tidak tersedia (mode privat) — tidak ada yang perlu dihapus
  }
}

export function googleLoginUrl(): string {
  return `${API_URL}/api/auth/google/redirect`
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }

  /** Pesan pertama untuk field tertentu (respons 422). */
  field(name: string): string | undefined {
    return this.errors[name]?.[0]
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const isJsonBody = typeof options.body === 'string'

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    // CDN Hostinger kadang membalas 429 tanpa header CORS → fetch gagal total.
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.')
  }

  if (response.status === 401) {
    clearToken()
    // AuthContext mendengarkan event ini → sesi dikosongkan → diarahkan ke /login.
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(401, 'Sesi berakhir, silakan masuk kembali.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const fallback =
      response.status === 429 ? 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.' : 'Terjadi kesalahan.'
    throw new ApiError(response.status, body.message ?? fallback, body.errors ?? {})
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const str = search.toString()
  return str ? `?${str}` : ''
}

type Data<T> = { data: T }

export const api = {
  publicSettings: () => request<Data<PublicSettings>>('/api/settings/public').then((r) => r.data),
  me: () => request<Me>('/api/me'),
  logout: () => request('/api/auth/logout', json('POST')),

  menu: () => request<{ data: MenuItem[]; meta: MenuMeta }>('/api/menu'),
  app: (slug: string) => request<Data<AppDetail>>(`/api/apps/${slug}`).then((r) => r.data),
  refreshApp: (slug: string) => request<Data<AppDetail>>(`/api/apps/${slug}/refresh`, json('POST')).then((r) => r.data),
  openApp: (slug: string, path?: string) =>
    request<Data<{ redirect_url: string; open_mode: OpenMode }>>(`/api/apps/${slug}/open${qs({ path })}`).then(
      (r) => r.data,
    ),

  admin: {
    apps: () => request<Data<AdminApp[]>>('/api/admin/apps').then((r) => r.data),
    app: (id: string) => request<Data<AdminApp>>(`/api/admin/apps/${id}`).then((r) => r.data),
    createApp: (payload: AdminAppPayload) =>
      request<Data<AdminApp>>('/api/admin/apps', json('POST', payload)).then((r) => r.data),
    updateApp: (id: string, payload: AdminAppPayload) =>
      request<Data<AdminApp>>(`/api/admin/apps/${id}`, json('PUT', payload)).then((r) => r.data),
    deleteApp: (id: string) => request<void>(`/api/admin/apps/${id}`, json('DELETE')),
    reorderApps: (ids: string[]) => request<void>('/api/admin/apps/reorder', json('POST', { ids })),
    refreshApp: (id: string) =>
      request<Data<{ ok: boolean; message: string | null; app: AdminApp }>>(
        `/api/admin/apps/${id}/refresh`,
        json('POST'),
      ).then((r) => r.data),
    testConnection: (payload: {
      summary_url: string
      auth_type: string
      auth_header?: string | null
      api_key?: string
      app_id?: string
    }) =>
      request<Data<ConnectionTestResult>>('/api/admin/apps/test-connection', json('POST', payload)).then((r) => r.data),

    users: (params: { search?: string; status?: string; page?: number } = {}) =>
      request<Paginated<AdminUser>>(`/api/admin/users${qs(params)}`),
    user: (id: string) => request<Data<AdminUser>>(`/api/admin/users/${id}`).then((r) => r.data),
    createUser: (payload: { full_name: string; primary_email: string; is_admin?: boolean }) =>
      request<Data<AdminUser>>('/api/admin/users', json('POST', payload)).then((r) => r.data),
    updateUser: (id: string, payload: Partial<Pick<AdminUser, 'full_name' | 'is_admin' | 'status'>>) =>
      request<Data<AdminUser>>(`/api/admin/users/${id}`, json('PUT', payload)).then((r) => r.data),
    deleteUser: (id: string) => request<void>(`/api/admin/users/${id}`, json('DELETE')),
    userAccess: (id: string) => request<Data<UserAccess>>(`/api/admin/users/${id}/access`).then((r) => r.data),
    setUserAccess: (id: string, appIds: string[]) =>
      request<Data<UserAccess>>(`/api/admin/users/${id}/access`, json('PUT', { app_ids: appIds })).then((r) => r.data),

    settings: () => request<{ data: SettingItem[]; meta: { groups: Record<string, string> } }>('/api/admin/settings'),
    updateSettings: (values: Record<string, unknown>) =>
      request<{ data: SettingItem[] }>('/api/admin/settings', json('PUT', { values })),
    resetSetting: (key: string) => request<void>(`/api/admin/settings/${encodeURIComponent(key)}`, json('DELETE')),

    auditLogs: (params: { action?: string; page?: number } = {}) =>
      request<Paginated<AuditLogEntry>>(`/api/admin/audit-logs${qs(params)}`),

    uploadImage: (file: File) => {
      const body = new FormData()
      body.append('file', file)
      return request<Data<{ url: string }>>('/api/admin/uploads/image', { method: 'POST', body }).then(
        (r) => r.data.url,
      )
    },
  },
}
