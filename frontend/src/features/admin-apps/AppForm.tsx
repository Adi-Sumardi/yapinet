import { useState, type FormEvent, type ReactNode } from 'react'
import type { AdminApp, AdminAppPayload, AuthType, IconType, OpenMode } from '../../lib/types'
import { ApiError } from '../../lib/api'
import { menuTheme } from '../../lib/color'
import MenuIcon from '../menu/MenuIcon'
import Button from '../../components/ui/Button'
import ColorInput from '../../components/ui/ColorInput'
import ImageInput from '../../components/ui/ImageInput'
import { Input, Select, Switch } from '../../components/ui/Field'
import ConnectionTestPanel from './ConnectionTestPanel'
import { AUTH_TYPES, DETAIL_LAYOUTS, OPEN_MODES, initialsOf, slugify } from './options'

type FormState = {
  name: string
  slug: string
  description: string
  icon_type: IconType
  icon_text: string
  icon_url: string | null
  color: string
  is_active: boolean
  open_url: string
  open_mode: OpenMode
  sso_path: string
  summary_url: string
  auth_type: AuthType
  auth_header: string
  api_key: string
  remove_api_key: boolean
  refresh_minutes: string
  detail_layout: string
  grant_to_all: boolean
}

function initialState(app?: AdminApp): FormState {
  return {
    name: app?.name ?? '',
    slug: app?.slug ?? '',
    description: app?.description ?? '',
    icon_type: app?.icon_type ?? 'initials',
    icon_text: app?.icon_text ?? '',
    icon_url: app?.icon_url ?? null,
    color: app?.color ?? '#3E7CB1',
    is_active: app?.is_active ?? true,
    open_url: app?.open_url ?? '',
    open_mode: app?.open_mode ?? 'new_tab',
    sso_path: app?.sso_path ?? '',
    summary_url: app?.summary_url ?? '',
    auth_type: app?.auth_type ?? 'bearer',
    auth_header: app?.auth_header ?? '',
    api_key: '',
    remove_api_key: false,
    refresh_minutes: app?.refresh_minutes ? String(app.refresh_minutes) : '',
    detail_layout: app?.detail_layout ?? 'auto',
    grant_to_all: app?.grant_to_all ?? true,
  }
}

function toPayload(form: FormState): AdminAppPayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    icon_type: form.icon_type,
    icon_text: form.icon_type === 'initials' ? form.icon_text.trim().toUpperCase() : form.icon_text.trim() || null,
    icon_url: form.icon_url,
    color: form.color.toUpperCase(),
    is_active: form.is_active,
    open_url: form.open_url.trim(),
    open_mode: form.open_mode,
    sso_path: form.open_mode === 'handoff' ? form.sso_path.trim() || null : null,
    summary_url: form.summary_url.trim() || null,
    auth_type: form.auth_type,
    auth_header: form.auth_type === 'header' ? form.auth_header.trim() || null : null,
    refresh_minutes: form.refresh_minutes ? Number(form.refresh_minutes) : null,
    detail_layout: form.detail_layout,
    grant_to_all: form.grant_to_all,
    // API key write-only: hanya dikirim bila diisi (rules/api.md).
    ...(form.api_key ? { api_key: form.api_key } : {}),
    ...(form.remove_api_key ? { remove_api_key: true } : {}),
  }
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line-soft bg-surface p-5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-ink-faint">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

export default function AppForm({
  app,
  submitting,
  error,
  onSubmit,
  footerExtra,
}: {
  app?: AdminApp
  submitting: boolean
  error: unknown
  onSubmit: (payload: AdminAppPayload) => void
  footerExtra?: ReactNode
}) {
  const [form, setForm] = useState<FormState>(() => initialState(app))
  const [slugTouched, setSlugTouched] = useState(!!app)
  const [initialsTouched, setInitialsTouched] = useState(!!app)
  const fieldError = (name: string) => (error instanceof ApiError ? error.field(name) : undefined)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const onName = (name: string) =>
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
      icon_text: initialsTouched ? f.icon_text : initialsOf(name),
    }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(toPayload(form))
  }

  const theme = menuTheme(/^#[0-9a-f]{6}$/i.test(form.color) ? form.color : '#3E7CB1')

  return (
    <form noValidate onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex flex-col gap-5">
        <Group title="Tampilan">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nama menu"
              required
              value={form.name}
              onChange={(e) => onName(e.target.value)}
              error={fieldError('name')}
              placeholder="mis. SIAKAD"
            />
            <Input
              label="Slug (alamat halaman)"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
              hint={`yapinet.id/${form.slug || 'slug'}`}
              error={fieldError('slug')}
            />
          </div>
          <Input
            label="Deskripsi"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="mis. Sistem Informasi Akademik"
            error={fieldError('description')}
          />

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">Ikon</p>
            <div className="mb-3 inline-flex rounded-xl bg-surface-soft p-1">
              {(['initials', 'image'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('icon_type', type)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${form.icon_type === type ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'}`}
                >
                  {type === 'initials' ? 'Inisial' : 'Gambar'}
                </button>
              ))}
            </div>
            {form.icon_type === 'initials' ? (
              <Input
                value={form.icon_text}
                maxLength={3}
                onChange={(e) => {
                  setInitialsTouched(true)
                  set('icon_text', e.target.value.toUpperCase())
                }}
                wrapperClassName="max-w-[120px]"
                className="text-center font-bold uppercase tracking-widest"
                error={fieldError('icon_text')}
              />
            ) : (
              <ImageInput
                value={form.icon_url}
                onChange={(url) => set('icon_url', url)}
                hint="PNG/JPG/WEBP, sebaiknya persegi. Gambar besar otomatis diperkecil."
                error={fieldError('icon_url')}
              />
            )}
          </div>

          <ColorInput label="Warna" value={form.color} onChange={(c) => set('color', c)} error={fieldError('color')} />
          <Switch
            checked={form.is_active}
            onChange={(v) => set('is_active', v)}
            label="Tampil di dashboard"
            description="Matikan untuk menyembunyikan menu tanpa menghapus datanya."
          />
        </Group>

        <Group title="Tujuan" description="Ke mana pengguna diarahkan saat menekan “Buka aplikasi”.">
          <Input
            label="URL aplikasi"
            required
            type="url"
            value={form.open_url}
            onChange={(e) => set('open_url', e.target.value)}
            placeholder="https://siakad.yapinet.id"
            error={fieldError('open_url')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Cara membuka"
              value={form.open_mode}
              onChange={(e) => set('open_mode', e.target.value as OpenMode)}
              options={OPEN_MODES}
              error={fieldError('open_mode')}
            />
            {form.open_mode === 'handoff' && (
              <Input
                label="Path SSO"
                value={form.sso_path}
                onChange={(e) => set('sso_path', e.target.value)}
                placeholder="/integrations/yapinet/sso/consume"
                error={fieldError('sso_path')}
              />
            )}
          </div>
        </Group>

        <Group
          title="Integrasi data (opsional)"
          description="Isi URL API ringkasan agar data aplikasi tampil di Yapinet. Kosongkan untuk menu link saja."
        >
          <Input
            label="URL API ringkasan"
            type="url"
            value={form.summary_url}
            onChange={(e) => set('summary_url', e.target.value)}
            placeholder="https://siakad.yapinet.id/api/integrations/yapinet/summary"
            error={fieldError('summary_url')}
            hint="Format respons: rules/api.md bagian B (kontrak v1)."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Autentikasi"
              value={form.auth_type}
              onChange={(e) => set('auth_type', e.target.value as AuthType)}
              options={AUTH_TYPES}
              error={fieldError('auth_type')}
            />
            {form.auth_type === 'header' && (
              <Input
                label="Nama header"
                value={form.auth_header}
                onChange={(e) => set('auth_header', e.target.value)}
                placeholder="X-Api-Key"
                error={fieldError('auth_header')}
              />
            )}
          </div>
          {form.auth_type !== 'none' && (
            <div>
              <Input
                label="API key"
                type="password"
                autoComplete="new-password"
                value={form.api_key}
                onChange={(e) => set('api_key', e.target.value)}
                placeholder={
                  app?.has_api_key
                    ? `•••••••• ${app.api_key_hint ?? ''} (biarkan kosong agar tidak berubah)`
                    : 'Tempel API key dari aplikasi'
                }
                error={fieldError('api_key')}
                disabled={form.remove_api_key}
              />
              {app?.has_api_key && (
                <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={form.remove_api_key}
                    onChange={(e) => set('remove_api_key', e.target.checked)}
                  />
                  Hapus API key tersimpan
                </label>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Interval refresh (menit)"
              type="number"
              min={1}
              max={1440}
              value={form.refresh_minutes}
              onChange={(e) => set('refresh_minutes', e.target.value)}
              hint="Kosong = ikut pengaturan global."
              error={fieldError('refresh_minutes')}
            />
            <Select
              label="Tampilan detail"
              value={form.detail_layout}
              onChange={(e) => set('detail_layout', e.target.value)}
              options={DETAIL_LAYOUTS}
              error={fieldError('detail_layout')}
            />
          </div>
          <ConnectionTestPanel
            summaryUrl={form.summary_url}
            authType={form.auth_type}
            authHeader={form.auth_header}
            apiKey={form.api_key}
            appId={app?.id}
          />
        </Group>

        <Group title="Akses">
          <Switch
            checked={form.grant_to_all}
            onChange={(v) => set('grant_to_all', v)}
            label="Berikan ke semua pengguna"
            description="Semua pengguna (lama & baru) otomatis bisa melihat menu ini. Matikan untuk mengatur per pengguna."
          />
        </Group>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>{footerExtra}</div>
          <Button type="submit" loading={submitting}>
            {app ? 'Simpan perubahan' : 'Simpan menu'}
          </Button>
        </div>
      </div>

      <aside className="order-first lg:order-none">
        <div className="sticky top-24 rounded-2xl border border-line-soft bg-surface p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-faint">Pratinjau</p>
          <div className="flex flex-col items-center gap-3.5 rounded-2xl px-4 py-7" style={{ background: theme.soft }}>
            <MenuIcon icon={{ type: form.icon_type, text: form.icon_text, url: form.icon_url }} color={theme.color} />
            <span className="text-center text-sm font-semibold text-ink">{form.name || 'Nama menu'}</span>
          </div>
          {!form.is_active && (
            <p className="mt-3 text-center text-xs text-ink-faint">Menu ini tersembunyi dari dashboard.</p>
          )}
        </div>
      </aside>
    </form>
  )
}
