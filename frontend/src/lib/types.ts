/** Tipe data API Yapinet — bentuknya mengikuti rules/api.md. */

export type Tone = 'info' | 'ok' | 'warning' | 'critical' | 'neutral'
export type SummaryStatus = 'ok' | 'warning' | 'critical' | 'degraded'
export type ValueFormat = 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'text' | 'badge'
export type OpenMode = 'link' | 'new_tab' | 'handoff' | 'oauth'
export type AuthType = 'none' | 'bearer' | 'header'
export type IconType = 'initials' | 'image'

export type MenuIconData = { type: IconType; text: string | null; url: string | null }

export type MenuItem = {
  id: string
  slug: string
  code: string
  name: string
  description: string | null
  icon: MenuIconData
  color: string
  open_mode: OpenMode
  detail_layout: string
  has_summary: boolean
  summary_status?: SummaryStatus | null
}

export type MenuMeta = {
  welcome_title: string
  welcome_subtitle: string | null
  show_status_badge: boolean
  announcement: { text: string; level: 'info' | 'warning' | 'critical' } | null
}

export type Metric = { label: string; value: string | number; format?: ValueFormat | null }

export type BadgeValue = { text: string; tone?: Tone }

export type Section =
  | {
      type: 'stats'
      title?: string
      items: { label: string; value: string | number; format?: ValueFormat; trend?: string }[]
    }
  | {
      type: 'table'
      title?: string
      columns: { key: string; label: string; format?: ValueFormat }[]
      rows: Record<string, unknown>[]
      row_link?: string
    }
  | {
      type: 'list'
      title?: string
      items: { title: string; subtitle?: string; badge?: BadgeValue; link?: string }[]
    }
  | { type: 'progress'; title?: string; items: { label: string; value: number }[] }
  | { type: 'alert'; tone?: Tone; title?: string; text: string }
  | { type: 'chart'; title?: string; items: { label: string; value: number }[]; format?: ValueFormat }

export type SummaryCard = {
  unit: { id: string; name: string } | null
  status: SummaryStatus
  is_stale: boolean
  headline: string | null
  metrics: Metric[]
  sections: Section[]
  details: Record<string, unknown>
  contract_version: number
  error_message: string | null
  fetched_at: string | null
}

export type AppDetail = MenuItem & { open_url: string; cards: SummaryCard[] }

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

export type PublicSettings = {
  'branding.app_name': string
  'branding.logo_url': string | null
  'branding.primary_color': string
  'branding.footer_text': string | null
  'login.headline': string
  'login.subtitle': string | null
  'login.help_text': string | null
  'contact.admin_whatsapp': string | null
  'contact.admin_email': string | null
}

export type Paginated<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export type AdminApp = {
  id: string
  code: string
  slug: string
  name: string
  description: string | null
  icon_type: IconType
  icon_text: string | null
  icon_url: string | null
  color: string
  sort_order: number
  is_active: boolean
  open_url: string
  open_mode: OpenMode
  sso_path: string | null
  summary_url: string | null
  auth_type: AuthType
  auth_header: string | null
  has_api_key: boolean
  api_key_hint: string | null
  refresh_minutes: number | null
  detail_layout: string
  grant_to_all: boolean
  users_count?: number
  last_checked_at: string | null
  last_check_ok: boolean | null
  last_check_message: string | null
  updated_at: string | null
}

export type AdminAppPayload = Partial<
  Omit<
    AdminApp,
    | 'id'
    | 'sort_order'
    | 'has_api_key'
    | 'api_key_hint'
    | 'users_count'
    | 'last_checked_at'
    | 'last_check_ok'
    | 'last_check_message'
    | 'updated_at'
  >
> & { api_key?: string; remove_api_key?: boolean }

export type ConnectionTestResult = {
  ok: boolean
  http_status: number | null
  duration_ms: number
  message: string | null
  warnings: string[]
  preview: {
    status: SummaryStatus
    headline: string | null
    metrics: Metric[]
    sections: Section[]
    contract_version: number
  } | null
}

export type AdminUser = {
  id: string
  full_name: string
  primary_email: string
  status: 'active' | 'pending' | 'suspended'
  is_admin: boolean
  apps_count?: number
  has_logged_in?: boolean
  created_at: string | null
}

export type UserAccess = {
  is_admin: boolean
  apps: {
    id: string
    slug: string
    name: string
    is_active: boolean
    icon: MenuIconData
    color: string
    granted: boolean
  }[]
}

export type SettingType = 'string' | 'text' | 'bool' | 'int' | 'color' | 'image' | 'enum'

export type SettingItem = {
  key: string
  group: string
  label: string
  type: SettingType
  options: Record<string, string> | null
  public: boolean
  default: unknown
  value: unknown
  is_default: boolean
}

export type AuditLogEntry = {
  id: string
  action: string
  user: { id: string; full_name: string; primary_email: string } | null
  app: { id: string; slug: string; name: string } | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}
