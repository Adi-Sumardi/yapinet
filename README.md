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

Struktur: `yapinet.id` (root domain) = frontend statis, `api.yapinet.id`
(subdomain) = backend Laravel. Bearer-token auth (Sanctum PAT, bukan cookie)
jadi CORS lintas-subdomain aman tanpa `supports_credentials`.

### Setup satu kali (lewat hPanel)

1. Buat database MySQL & user di hPanel, pilih PHP 8.3.
2. Buat subdomain **api.yapinet.id**, document root diarahkan ke
   `~/yapinet/backend/public` (bukan ke folder `backend/` itu sendiri).
3. Domain utama **yapinet.id** document root-nya `public_html` biasa — ini
   yang nanti diisi build statis frontend.
4. `git clone` repo ini ke `~/yapinet` di server (lewat SSH/Termius).
5. Salin `backend/.env.example` → `backend/.env`, isi kredensial produksi:
   `APP_URL=https://api.yapinet.id`, `FRONTEND_URL=https://yapinet.id`,
   `SANCTUM_STATEFUL_DOMAINS=yapinet.id`, `DB_*` sesuai database di hPanel,
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, dan
   `GOOGLE_REDIRECT_URI=https://api.yapinet.id/api/auth/google/callback`
   (daftarkan juga persis sama sebagai Authorized redirect URI di Google
   Cloud Console).
6. Aktifkan SSH key di hPanel (Advanced > SSH Access) supaya `rsync` dari
   langkah deploy frontend tidak minta password tiap kali.
7. Set Cron Job hPanel (sekali saja):
   `* * * * * php /home/USERNAME/yapinet/backend/artisan schedule:run >> /dev/null 2>&1`
8. `php artisan db:seed --force` (sekali, untuk App Registry awal).

### Deploy rutin (tiap ada perubahan)

- **Backend** — SSH/Termius ke server, lalu:
  ```bash
  cd ~/yapinet/backend && bash deploy.sh
  ```
  (`deploy.sh` melakukan git pull, composer install kalau perlu, migrate,
  clear+cache config/route/view, storage:link.)
- **Frontend** — dari komputer lokal (Hostinger Business Shared Hosting
  tidak menjamin runtime Node.js untuk build di server):
  ```bash
  HOSTINGER_SSH=uXXXXXXXXX@yapinet.id HOSTINGER_PORT=65002 bash deploy-frontend.sh
  ```
  (build lokal `npm run build` dengan `VITE_API_URL=https://api.yapinet.id`,
  lalu `rsync` isi `frontend/dist/` ke `public_html` domain utama — isi
  `HOSTINGER_SSH`/`HOSTINGER_PORT`/`HOSTINGER_PATH` sesuai akun Hostinger,
  lihat komentar di dalam script.)

## Menambah aplikasi unit baru

Tidak perlu ubah kode inti — tambahkan baris baru ke tabel `apps` (App
Registry) berikut kredensialnya di `app_credentials`, lalu beri akses lewat
`user_app_access`. Jika API aplikasi tersebut punya kuirk khusus, buat kelas
baru yang extends `App\Services\Adapters\GenericHttpSummaryFetcher` dan
daftarkan di `App\Services\AppAdapterResolver`.
