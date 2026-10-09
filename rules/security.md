# Security

## 1. Autentikasi

- **Login hanya via Google**, dan hanya untuk email yang sudah didaftarkan
  admin (`GoogleAccountResolver`). Email tak dikenal → ditolak, **tidak pernah**
  dibuat otomatis. Akun `suspended` → ditolak.
- Cocokkan berdasarkan `google_sub` dulu, lalu email (case-insensitive).
  Tolak email Google yang `email_verified = false`.
- Token Sanctum: set masa berlaku (`sanctum.expiration`, mis. 30 hari) dan
  hapus token saat logout / user dihapus / dinonaktifkan.
- Token diterima frontend lewat query `?token=` di `/auth/callback` → segera
  disimpan lalu **dihapus dari URL** (`history.replaceState`) agar tidak
  tersimpan di riwayat/screenshot.
- Sesi web (Passport `/login`) memakai `session()->regenerate()` setelah login.

## 2. Otorisasi

- Rute admin: middleware `auth:sanctum` + `admin`. Cek ulang di backend —
  menyembunyikan tombol di frontend **bukan** keamanan.
- Akses menu user diperiksa di **setiap** endpoint `/api/apps/{slug}/*`
  (scope `visibleTo`), termasuk refresh & open.
- Admin tidak bisa: menghapus dirinya, mencabut admin dirinya, menonaktifkan
  dirinya. Sistem harus selalu punya ≥ 1 admin aktif.
- Role hanya **Admin** (`is_admin = true`) dan **User**. Admin otomatis bisa
  melihat semua menu aktif; User hanya menu yang diberikan.
- Mass assignment: `is_admin`/`status` hanya bisa diubah lewat FormRequest admin.

## 3. Secret

- API key aplikasi anak disimpan di `app_credentials` dengan cast `encrypted`
  (pakai `APP_KEY`). **Jangan ganti `APP_KEY` produksi** — semua key jadi tak terbaca.
- Secret **write-only** di API: tidak pernah dikirim balik; hanya `has_api_key`
  + 4 karakter terakhir.
- Jangan tulis secret ke log, audit `metadata`, pesan exception, atau respons Tes Koneksi.
- `.env`, `secret.md`, kunci Passport (`storage/oauth-*.key`) tidak boleh
  masuk git (sudah di `.gitignore`). Kredensial SSH/hosting tidak boleh ditulis
  di file yang ter-track.
- Bandingkan secret dengan `hash_equals`.

## 4. URL dari admin — cegah SSRF

URL API ringkasan diisi admin lalu dipanggil **server** Yapinet. Tanpa
pembatasan, URL itu bisa diarahkan ke layanan internal hosting. Aturan
(`SafeUrlValidator` + rule `SafeExternalUrl`):

- Wajib `https://` (pengecualian `http://localhost`/`127.0.0.1` hanya saat `APP_ENV=local`).
- Resolve DNS host → tolak bila IP privat/loopback/link-local/metadata
  (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`, `fc00::/7`).
- Tidak mengikuti redirect ke host lain (`allow_redirects` maks 3, host harus tetap aman).
- Timeout dari pengaturan (default 5 dtk), ukuran respons maks 512 KB.
- Tes Koneksi hanya untuk admin, rate limit 10×/menit.

## 5. Input & output

- Semua input lewat FormRequest. URL divalidasi `url:https`, warna regex hex,
  slug `alpha_dash` + daftar terlarang (`views.md`).
- Data dari aplikasi anak dianggap **tidak tepercaya**: dirender sebagai teks
  oleh React (jangan `dangerouslySetInnerHTML`); `link`/`row_link`/`detail_path`
  hanya boleh path relatif atau URL dengan host yang sama dengan `open_url`.
- Upload ikon: hanya `png`/`jpg`/`webp` — **SVG ditolak** (bisa berisi skrip),
  maks 512 KB, disimpan dengan nama acak di `storage/app/public/app-icons`.
- Blade: selalu `{{ }}`.

## 6. Rate limiting

| Endpoint | Batas |
|---|---|
| `/api/auth/google/*` | 20/menit/IP |
| `/api/apps/{slug}/refresh` | 1/menit/user/aplikasi |
| `/api/admin/apps/test-connection` | 10/menit/user |
| default `api` | 120/menit/user |

## 7. Hosting & deploy

- Clone repo dipindah ke **luar** `public_html` (mis. `~/apps/yapinet`), dan
  hanya `backend/public` yang jadi document root `api.yapinet.id`.
  Sementara masih di dalam `public_html`, pastikan `.env`, `.git`, `storage`
  mengembalikan 403 (sudah dicek 2026-10-09).
- **CDN Hostinger**: jangan cache `api.yapinet.id`; untuk `yapinet.id`, file
  entry (`index.html`, `sw.js`, `manifest.webmanifest`) dikirim `no-cache`
  (sudah di `frontend/public/.htaccess`).
- `APP_DEBUG=false` di produksi. `LOG_CHANNEL=daily`, `LOG_LEVEL=warning`.
- Backup DB sebelum migrasi produksi. Simpan `.env.bak-*` di luar web root.
- SSH: gunakan SSH key, bukan password. Ganti password hosting yang pernah dibagikan.

## 8. CORS

- `allowed_origins` hanya `FRONTEND_URL` (`https://yapinet.id`) + localhost saat lokal.
- Endpoint integrasi (`/api/integrations/*`, `/api/oauth/user`) dipanggil
  server-ke-server — tidak butuh CORS.
- Ingat: 429/5xx dari CDN muncul di browser sebagai "CORS error" karena tidak
  membawa header CORS. Cek kode HTTP aslinya dulu (curl) sebelum mengubah CORS.

## Checklist PR keamanan

- [ ] Endpoint baru punya middleware & cek akses yang benar
- [ ] Input divalidasi FormRequest
- [ ] Tidak ada secret di respons/log
- [ ] URL eksternal lewat `SafeUrlValidator`
- [ ] Data aplikasi anak tidak dirender sebagai HTML
- [ ] Ada feature test untuk kasus "tidak berhak"
