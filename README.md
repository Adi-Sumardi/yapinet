# Yapinet

Portal super-app (PWA) yang menyatukan Sianggar, Simaya, Simonik, Simoy,
SiHaris, Simonas, dan aplikasi unit lainnya di satu dashboard — dibuat agar
**BPH, Pembina, dan Pengawas Yayasan** bisa memantau seluruh unit tanpa login
satu-satu, cukup dengan login Google.

Yapinet bukan pengganti aplikasi-aplikasi tersebut — ia hanya membaca
ringkasan dari API masing-masing aplikasi lalu meredirect ke aplikasi asal
saat pengguna butuh detail atau ingin bertindak (mis. menyetujui pengajuan
anggaran).

## Struktur repo

```
backend/    Laravel 13 (PHP 8.3+) — API, auth Google, App Registry, cache table, cron refresh
frontend/   React + Vite + TypeScript — PWA mobile-first
```

## Tech stack (disesuaikan untuk Hostinger Business Shared Hosting)

Tidak ada Docker, Redis, atau proses daemon permanen — semuanya lewat
MySQL/MariaDB + Cron Job hPanel. Lihat alasan tiap pilihan di dalam kode
(banyak komentar merujuk ke bagian blueprint terkait).

| Lapisan | Pilihan |
|---|---|
| Frontend | React + Vite + TypeScript, di-build jadi file statis |
| PWA | vite-plugin-pwa (Workbox), Web App Manifest |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Backend | PHP 8.3 + Laravel 13 |
| Auth | Google OAuth via Laravel Socialite, sesi via Laravel Sanctum (bearer token) |
| Database | MySQL/MariaDB (SQLite untuk dev lokal) |
| Cache, sesi, queue | Database driver Laravel — bukan Redis |
| Job berkala | Laravel Scheduler, dipicu Cron Job hPanel tiap menit |
| Deploy | Git + SSH (Hostinger Business Shared Hosting) |

## Cara kerja ringkas

1. **Login**: pengguna login dengan Google → `backend` membuat/mencocokkan
   user via `google_identities` → menerbitkan token Sanctum.
2. **Dashboard**: `frontend` membaca `GET /api/dashboard/summary`, yang HANYA
   membaca tabel `app_summary_cache` — tidak pernah memanggil API aplikasi
   anak secara langsung saat halaman dibuka.
3. **Prefetch**: `php artisan app:refresh-app-summaries` dijalankan berkala
   oleh Laravel Scheduler (lihat `bootstrap/app.php`) untuk mengisi ulang
   `app_summary_cache` per aplikasi.
4. **Redirect/handoff**: tap kartu ringkasan → `GET /api/apps/{code}/handoff`
   menerbitkan tiket pendek (<60 detik) dan mengembalikan `redirect_url` ke
   aplikasi anak, dengan fallback ke tautan biasa bila aplikasi belum
   mendukung SSO handoff.

## Setup lokal

### Backend

```bash
cd backend
cp .env.example .env   # sudah ada isinya, tinggal isi GOOGLE_CLIENT_ID/SECRET
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Jadwalkan refresh cache secara lokal (opsional, meniru cron produksi):

```bash
php artisan schedule:work
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Setup Google OAuth

1. Buat OAuth 2.0 Client ID (Web application) di Google Cloud Console.
2. Authorized redirect URI: `{APP_URL}/api/auth/google/callback`
   (lokal: `http://localhost:8000/api/auth/google/callback`).
3. Isi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` di
   `backend/.env`.

## Deploy ke Hostinger (Business Shared Hosting, domain yapinet.id)

1. Buat database MySQL & user di hPanel, pilih PHP 8.3.
2. Aktifkan SSH & Git deploy (fitur Git di hPanel) untuk `backend/`.
3. `composer install --no-dev --optimize-autoloader`, lalu
   `php artisan migrate --force` dan `php artisan db:seed --force` (sekali).
4. Set Cron Job: `* * * * * php /path/to/backend/artisan schedule:run >> /dev/null 2>&1`
5. Build frontend (`npm run build` di `frontend/`) dan upload isi `dist/` ke
   `public_html` (atau subdomain terpisah), set `VITE_API_URL` sebelum build.
6. Set `FRONTEND_URL` di `backend/.env` ke URL PWA produksi (mis. `https://yapinet.id`).

## Menambah aplikasi unit baru

Tidak perlu ubah kode inti — tambahkan baris baru ke tabel `apps` (App
Registry) berikut kredensialnya di `app_credentials`, lalu beri akses lewat
`user_app_access`. Jika API aplikasi tersebut punya kuirk khusus, buat kelas
baru yang extends `App\Services\Adapters\GenericHttpSummaryFetcher` dan
daftarkan di `App\Services\AppAdapterResolver`.
