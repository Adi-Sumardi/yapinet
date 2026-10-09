# Overview — Yapinet

> Baca file ini dulu sebelum menyentuh kode. File lain di folder `rules/`
> adalah aturan per area; file ini menjelaskan *apa* Yapinet dan *ke mana*
> arah penataan ulangnya.

## Apa itu Yapinet

Portal super-app (PWA) untuk **pengurus Yayasan**. Satu
login Google → satu dashboard berisi menu semua aplikasi unit (Sianggar,
Simaya, Simonas, SiHaris, SIAKAD, PMB, …).

Yapinet **bukan pengganti** aplikasi-aplikasi itu. Tugasnya hanya tiga:

1. **Menampilkan menu** aplikasi yang boleh diakses user.
2. **Membaca ringkasan** dari API tiap aplikasi (lewat cache, bukan live).
3. **Mengantar user** ke aplikasi asal (link biasa / SSO handoff / OAuth2).

## Arah penataan ulang (2026-10)

| Sebelumnya | Target |
|---|---|
| Daftar aplikasi di-hardcode di 6 tempat (frontend + backend) | **Menu dinamis**: CRUD lewat panel admin, admin cukup isi URL API |
| Tampilan detail per aplikasi = komponen React khusus | **Renderer generik** dari kontrak `sections[]`; komponen khusus hanya pengecualian |
| Teks, warna, logo, perilaku akses tertanam di kode | **Pengaturan dinamis** (`settings`) yang bisa diubah admin |
| Semua user otomatis dapat semua aplikasi di setiap login | Auto-grant **sekali** saat dibuat, bisa diatur per menu |
| Peran BPH/Pembina/Pengawas/app_admin + `can_act` | **Hanya 2 role: Admin & User**; akses per menu = ya/tidak |
| Admin panel = satu komponen `AccessManager` | Area **/admin** terpisah: Menu, Pengguna, Pengaturan, Log |

Detail desainnya ada di [`system-features.md`](system-features.md).

## Tech stack (tetap — jangan diganti tanpa diskusi)

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Backend | PHP 8.3 + Laravel 13 | `backend/` |
| Auth | Google OAuth (Socialite) + Sanctum bearer token | allowlist: hanya email yang didaftarkan admin |
| SSO anak | Laravel Passport (Authorization Code) + ticket handoff lama | lihat `security.md` |
| Database | MySQL/MariaDB (prod), SQLite (lokal) | query harus jalan di keduanya |
| Cache/queue/session | driver `database` | **tidak ada Redis** |
| Job berkala | Laravel Scheduler via Cron hPanel tiap menit | tidak ada daemon/worker permanen |
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 | `frontend/`, build statis |
| Data fetching | TanStack Query | |
| Hosting | Hostinger Business Shared Hosting | ada CDN Hostinger di depan domain |

Batasan hosting yang **wajib** dihormati: tanpa Docker, tanpa Redis, tanpa
proses yang hidup terus, tanpa WebSocket. Semua kerja berat → scheduler + cache tabel.

## Arsitektur ringkas

```
Browser (PWA yapinet.id)
   │  Bearer token (Sanctum)
   ▼
api.yapinet.id (Laravel)
   ├─ /api/menu ............ baca tabel apps + user_app_access
   ├─ /api/apps/{slug} ..... baca app_summary_cache (TIDAK memanggil API anak)
   ├─ /api/admin/* ......... CRUD menu, user, akses, settings
   └─ Scheduler (cron) ──► GET {api_base_url}{summary_path} tiap aplikasi
                            └─► simpan ke app_summary_cache
```

## Struktur repo

```
backend/     Laravel — API, auth, App Registry, scheduler
frontend/    React PWA
rules/       Aturan & desain (folder ini)
ui-ux/       Referensi desain awal (YAPINET.dc.html)
deploy-frontend.sh, backend/deploy.sh
```

## Peta file rules

| File | Isi |
|---|---|
| [overview.md](overview.md) | File ini |
| [system-features.md](system-features.md) | Fitur sistem + **desain menu & pengaturan dinamis** + roadmap |
| [api.md](api.md) | Endpoint Yapinet + **kontrak API aplikasi anak** |
| [database.md](database.md) | Skema target, migrasi, aturan data |
| [models.md](models.md) | Aturan Eloquent model |
| [controllers.md](controllers.md) | Aturan controller, request, resource, service |
| [views.md](views.md) | Daftar halaman/route frontend + Blade view |
| [components.md](components.md) | Struktur & katalog komponen React |
| [design.md](design.md) | Design system: token, tipografi, layout, wireframe |
| [formatting.md](formatting.md) | Format angka/tanggal/teks + formatter kode |
| [code-style.md](code-style.md) | Gaya kode PHP & TypeScript, penamaan, git |
| [security.md](security.md) | Auth, otorisasi, secret, SSRF, hosting |

## Gap yang diketahui (per 2026-10-09)

Ini daftar masalah nyata di kode sekarang. Penataan ulang harus menutupnya.

1. **Menu hardcoded** — `frontend/src/lib/appSlugs.ts`, `appIcons.ts`,
   `CUSTOM_DETAIL` di `pages/AppDetail.tsx`, `$order` di
   `DashboardController`, `AppAdapterResolver::$map`, `AppRegistrySeeder`.
2. **Tile dashboard bergantung cache** — aplikasi baru tidak muncul sampai
   scheduler membuat baris `app_summary_cache`.
3. ~~**Auto-grant terlalu lebar**~~ (**diperbaiki di Fase 0**: grant sekali saat user dibuat) — `AuthController::callback` memberi semua
   aplikasi aktif ke semua user sebagai `bph` + `can_act=true` di setiap login,
   sehingga pencabutan akses di panel admin akan dibatalkan di login berikutnya.
4. **Unique index dengan NULL** — `unique(app_id, unit_id)` di
   `app_summary_cache` & `user_app_access`: di MySQL, `NULL` dianggap berbeda
   sehingga duplikat baris "semua unit" tetap bisa terjadi.
5. ~~`deploy.sh` tidak pernah `composer install`~~ — **diperbaiki di Fase 0**.
6. **Repo ter-clone di dalam `public_html`** — sekarang aman (403), tapi
   rapuh; target: pindah ke luar `public_html`.
7. **CDN Hostinger meng-cache file entry** (`sw.js`, `index.html`) 7 hari dan
   pernah me-rate-limit (429) API. API seharusnya tidak lewat CDN cache.
8. **`laravel.log` 62 MB** tanpa rotasi — pakai `LOG_CHANNEL=daily`.
9. **Header halaman diduplikasi** di Dashboard/Settings/AppDetail;
   `components/TopBar.tsx` tidak dipakai.
10. **Kolom/tabel legacy**: `users.password`, `users.must_change_password`,
    `notifications` (tidak dipakai), `app_credentials.*_encrypted` (nama
    menyesatkan — nilai sudah dienkripsi oleh cast, bukan oleh nama kolom).
11. ~~Tidak ada Prettier/Pint di workflow~~ — **selesai di Fase 0**
    (lint frontend memakai oxlint: `npm run lint`).
12. **Unit hanya "Kantor Yayasan"** — fitur per-unit belum benar-benar dipakai.
