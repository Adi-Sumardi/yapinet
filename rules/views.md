# Views (Halaman & Route)

Yapinet punya dua jenis "view":
- **A. Halaman SPA** (React Router) — hampir semua UI.
- **B. Blade view** (Laravel) — hanya untuk alur SSO/OAuth yang butuh sesi server.

## A. Halaman SPA

| Path | File (target) | Akses | Isi |
|---|---|---|---|
| `/login` | `pages/Login.tsx` | publik | tombol Google, teks dari pengaturan publik, pesan `?error=` |
| `/auth/callback` | `pages/AuthCallback.tsx` | publik | simpan token → `/` |
| `/` | `pages/Dashboard.tsx` | user | pengumuman, sapaan, `MenuGrid` |
| `/{slug}` | `pages/AppDetail.tsx` | user + akses | header menu, tombol Buka/Segarkan, `SectionRenderer` |
| `/akun` | `pages/Account.tsx` | user | profil, daftar aplikasi yang diakses, keluar |
| `/admin` | → redirect `/admin/menu` | admin | |
| `/admin/menu` | `pages/admin/AppsPage.tsx` | admin | daftar menu + urutkan |
| `/admin/menu/baru` | `pages/admin/AppEditPage.tsx` | admin | form tambah (halaman penuh di semua ukuran layar) |
| `/admin/menu/:id` | `pages/admin/AppEditPage.tsx` | admin | form ubah |
| `/admin/pengguna` | `pages/admin/UsersPage.tsx` | admin | daftar pengguna |
| `/admin/pengguna/:id` | `pages/admin/UserEditPage.tsx` | admin | profil + `AccessMatrix` |
| `/admin/pengaturan` | `pages/admin/SettingsPage.tsx` | admin | tab per grup |
| `/admin/log` | `pages/admin/AuditLogPage.tsx` | admin | tabel log |
| `*` | `pages/NotFound.tsx` | publik | 404 + link ke dashboard |

Catatan:
- Path admin & akun memakai **Bahasa Indonesia**, konsisten dengan copy UI.
- `/settings` lama → redirect ke `/akun` (user) / `/admin` (admin) selama transisi.
- Slug menu **tidak boleh** bentrok dengan path tetap: validasi backend
  menolak slug `login`, `auth`, `akun`, `admin`, `settings`, `assets`, `icons`.
- Route `/{slug}` diletakkan **paling akhir** sebelum `*`.

### Guard

| Guard | Perilaku |
|---|---|
| `RequireAuth` | belum login → `/login`; saat memuat → skeleton (bukan layar kosong) |
| `RequireAdmin` | bukan admin → `/` |
| `RequireAppAccess` (di `AppDetail`) | slug tidak ada di `/api/menu` → `NotFound` |

### Aturan halaman

1. Halaman **tipis**: ambil param, panggil hook fitur, susun komponen.
2. Setiap halaman membungkus diri dengan `AppShell` (user) atau `AdminLayout` (admin).
3. `document.title` = `"{Judul} · {branding.app_name}"`.
4. Semua halaman wajib menangani loading / error / kosong (`design.md`).
5. Unrecognized route di dalam SPA → `NotFound`, bukan layar putih
   (sumber bug blank di `/auth/callback` tempo hari).

## B. Blade view (backend/resources/views)

| View | Dipakai oleh | Isi |
|---|---|---|
| `layouts/auth.blade.php` | semua view di bawah | kartu tengah, gaya mandiri (tanpa build Vite) |
| `auth/login.blade.php` | `GET /login` (Passport guest) | tombol "Masuk dengan Google" |
| `oauth/authorize.blade.php` | `/oauth/authorize` | layar persetujuan aplikasi anak |

Aturan:
- Blade **hanya** untuk alur yang butuh sesi server (OAuth). Jangan tambah UI
  produk di Blade.
- Teks & logo mengikuti pengaturan branding (`SettingsService`) agar
  konsisten dengan SPA.
- Semua output di-escape (`{{ }}`), jangan `{!! !!}`.
