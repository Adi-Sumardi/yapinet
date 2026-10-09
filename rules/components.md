# Components (React)

Lokasi: `frontend/src/`.

## Struktur folder (target)

```
src/
  main.tsx, App.tsx            ← router & provider
  pages/                       ← satu file per route (lihat views.md); tipis, merangkai komponen
    admin/                     ← halaman admin
  components/
    ui/                        ← komponen dasar tanpa logika bisnis
    layout/                    ← AppShell, AdminLayout, TopBar, PageHeader
    icons/                     ← SVG inline
  features/                    ← logika per domain: hooks query/mutation + komponen khusus domain
    menu/                      ← MenuGrid, MenuTile, useMenu
    app-detail/                ← SectionRenderer + renderer per tipe section, layouts/ khusus
    admin-apps/                ← AppTable, AppForm, ConnectionTestPanel, useAdminApps
    admin-users/               ← UserTable, UserForm, AccessMatrix, useAdminUsers
    admin-settings/            ← SettingsForm, SettingField, useSettings
    audit/                     ← AuditTable
  context/                     ← AuthContext, SettingsContext (pengaturan publik)
  lib/                         ← api client, format, color, util murni
```

## Aturan

1. **Function component + TypeScript**. Props diberi `type` di file yang sama.
   Tanpa `any`; data API diberi tipe di `lib/api.ts` (atau `features/*/types.ts`).
2. **Satu komponen per file**, nama file = nama komponen (`MenuTile.tsx`).
   Komponen kecil privat boleh di file yang sama bila hanya dipakai di situ.
3. **Data fetching hanya lewat TanStack Query** di hook `features/*/use*.ts`.
   Komponen `ui/` dan `layout/` tidak memanggil API.
4. **Query key terpusat** per fitur: `menuKeys.all`, `adminAppKeys.detail(id)`.
   Setelah mutasi → `invalidateQueries` key terkait (mis. ubah menu → invalidasi `menu` & `admin-apps`).
5. **Tidak ada daftar aplikasi hardcoded** di frontend. Nama, slug, warna,
   ikon, urutan → selalu dari `/api/menu`.
6. **Styling: Tailwind + token** (`design.md`). Inline `style` hanya untuk
   nilai dinamis dari data (warna menu).
7. **Form**: selalu `<form noValidate>` — popup validasi bawaan browser ("Please fill out this field") dilarang,
   sama seperti `window.alert`. Komponen terkontrol + state lokal; tampilkan error per field dari
   respons 422 (`errors.{field}[0]`). Tombol submit disable saat `isPending`.
8. **Dilarang `window.alert` / `window.confirm` / `window.prompt`.** Aksi
   berbahaya → `useConfirm()` (ConfirmDialog); umpan balik → `useToast()`.
   Spesifikasi visual & animasi: `design.md` → "Notifikasi & Konfirmasi".
   (`AccessManager` sekarang masih memakai `window.confirm`/`alert` — ganti.)
9. **Setiap mutasi wajib punya umpan balik**: sukses → toast `success`,
   gagal → toast `error` berisi `message` dari API. Mutasi lama/berat pakai
   `toast.promise()`. Pola ini dibungkus di helper `useMutationWithToast`.
10. Komponen > ~200 baris → pecah.

## Katalog `components/ui`

| Komponen | Props inti | Catatan |
|---|---|---|
| `Button` | `variant: primary\|secondary\|ghost\|danger`, `size: sm\|md`, `loading` | `tap-scale`, spinner saat loading |
| `IconButton` | `label` (aria), `icon` | |
| `Input`, `Textarea` | `label`, `error`, `hint` | label di atas, error merah di bawah |
| `Select` | `label`, `options`, `error` | native `<select>` |
| `Switch` | `checked`, `onChange`, `label` | untuk boolean pengaturan |
| `ColorInput` | `value`, `onChange` | swatch + input hex |
| `ImageInput` | `value`, `onChange` | upload/URL + pratinjau |
| `Card` | `title?`, `actions?` | `rounded-2xl border-line-soft` |
| `Badge` | `tone: info\|ok\|warning\|critical\|neutral` | |
| `StatusDot` | `status` | |
| `Modal` | `title`, `onClose`, `footer?` | bottom sheet di mobile; untuk form singkat (mis. tambah pengguna) |
| `ConfirmDialog` + `ConfirmProvider` | `title`, `description`, `confirmLabel`, `tone: danger\|warning\|default`, `requireText?` | dipanggil via `const ok = await confirm({...})`; bottom sheet di mobile |
| `Toaster` + `useToast` | `toast.success/error/warning/info(title, { description, action, duration })`, `toast.promise(p, msgs)` | dipasang sekali di `App.tsx`; animasi & tumpukan sesuai `design.md` |
| `Tabs` | `items`, `value` | dipakai halaman Pengaturan |
| `Table` | `columns`, `rows`, `empty` | responsif: jadi daftar kartu di mobile |
| `Skeleton` | `className` | |
| `EmptyState`, `ErrorState` | `title`, `description`, `action` | |
| `SortableList` | `items`, `onReorder` | drag-and-drop urutan menu (pointer + keyboard) |

## Komponen domain penting

| Komponen | Isi |
|---|---|
| `MenuIcon` | lingkaran warna + inisial / gambar; dipakai di tile, detail, admin |
| `MenuTile` | `MenuIcon` + nama + `StatusDot`; klik → detail atau buka aplikasi |
| `SectionRenderer` | memilih renderer berdasarkan `section.type`; tipe tak dikenal diabaikan diam-diam |
| `StatsSection`, `TableSection`, `ListSection`, `ProgressSection`, `AlertSection` | satu per tipe kontrak (`api.md`) |
| `AppForm` | form menu lengkap (lihat wireframe `system-features.md`) |
| `ConnectionTestPanel` | tombol Tes Koneksi + hasil + pratinjau kartu |
| `AccessMatrix` | daftar menu dengan checkbox akses per pengguna (centang semua / hapus semua) |
| `SettingField` | memilih input sesuai `type` definisi pengaturan |

## Yang dihapus / dipindah saat migrasi

| Sekarang | Nasib |
|---|---|
| `lib/appSlugs.ts`, `lib/appIcons.ts` | hapus (data dari API) |
| `CUSTOM_DETAIL` di `pages/AppDetail.tsx` | jadi registry `features/app-detail/layouts/index.ts` |
| `SianggarDetail`, `SimayaDetail`, `SimonasDetail`, `SimonikDetail` | pindah ke `features/app-detail/layouts/`, hapus begitu app kirim `sections[]` |
| `components/AccessManager.tsx` | pecah ke `features/admin-users/*` |
| header yang diduplikasi di 3 halaman | `components/layout/TopBar` + `AppShell` |
