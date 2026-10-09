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
| [detail-pages.md](detail-pages.md) | **Analisis & desain halaman detail per aplikasi**, kontrak v1.1 |

## Gap yang diketahui (diperbarui 2026-10-09, setelah Fase 0–4)

Sudah ditutup:

1. ~~Menu hardcoded di 6 tempat~~ — Fase 1–2 (menu dari tabel `apps`, admin CRUD).
2. ~~Tile dashboard bergantung cache~~ — Fase 1 (`GET /api/menu`).
3. ~~Auto-grant di setiap login~~ — Fase 0 (`GrantDefaultAccess`, sekali saat dibuat).
4. ~~Unique index dengan NULL~~ — Fase 1 (`scope_key`).
5. ~~`deploy.sh` tidak pernah `composer install`~~ — Fase 0.
6. ~~File repo bisa diunduh lewat `yapinet.id/yapinet/*`~~ — Fase 4 (403 via `.htaccess`).
   Repo masih ter-clone di `public_html`; pindah ke luar tetap disarankan.
7. ~~CDN Hostinger (cache `sw.js` & 429)~~ — CDN dinonaktifkan di hPanel; service
   worker tidak didaftarkan lagi dan dibersihkan otomatis.
8. ~~`laravel.log` tanpa rotasi~~ — Fase 0 (`LOG_STACK=daily`, level warning).
9. ~~Header diduplikasi~~ — Fase 2 (`AppShell`, `AdminLayout`).
10. ~~Kolom/tabel legacy~~ — Fase 1 & 4 (`api_key`, password & `notifications` dihapus).
11. ~~Tidak ada formatter~~ — Fase 0 (Pint, Prettier, oxlint).

Masih terbuka:

12. **Unit hanya "Kantor Yayasan"** di sisi Yapinet — filter unit kini disediakan
    tiap aplikasi (`filters[]`, lihat [detail-pages.md](detail-pages.md)).
13. **SIAKAD, PMB, SiHaris belum punya endpoint ringkasan** (404).
14. **Kredensial di repo aplikasi anak** — lihat catatan keamanan di `security.md` §9.
