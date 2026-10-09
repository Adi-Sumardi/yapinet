# System Features — Desain Fitur Yapinet

> Status: **DESAIN** (2026-10-09). Belum diimplementasi. Bagian "Roadmap" di
> bawah menentukan urutan pengerjaan.

## Katalog fitur

| # | Fitur | Siapa | Status |
|---|---|---|---|
| F1 | Login Google (allowlist email dari admin) | semua | ✅ ada |
| F2 | Dashboard menu aplikasi | semua | ⚠️ hardcoded → **dinamis** |
| F3 | Detail ringkasan aplikasi | semua | ⚠️ komponen khusus → **renderer generik** |
| F4 | Buka aplikasi (link / handoff / OAuth) | semua | ✅ ada, dirapikan |
| F5 | **Kelola Menu Aplikasi (CRUD)** | admin | 🆕 |
| F6 | Kelola Pengguna (CRUD + suspend) | admin | ⚠️ tambah/hapus saja → lengkap |
| F7 | Kelola Hak Akses per pengguna | admin | ✅ ada, dipindah ke /admin |
| F8 | **Pengaturan dinamis** | admin | 🆕 |
| F9 | Log aktivitas (audit) | admin | ⚠️ tabel ada, belum ada UI |
| F10 | Refresh ringkasan terjadwal | sistem | ✅ ada |
| F11 | SSO OAuth2 untuk aplikasi anak (Passport) | sistem | ✅ fondasi ada |

---

## F2 + F5 — Menu Aplikasi Dinamis

### Tujuan

Admin bisa **menambah, mengubah, mengurutkan, menyembunyikan, dan menghapus**
menu dari panel admin. Untuk menyambungkan data, admin **cukup memasukkan URL
API** aplikasi (dan API key bila perlu). Tidak ada perubahan kode untuk
menambah aplikasi baru.

### Konsep: satu baris `apps` = satu menu

Setiap menu punya tiga lapisan pengaturan:

1. **Tampilan** — nama, ikon, warna, deskripsi, urutan, aktif/tidak.
2. **Tujuan** — URL yang dibuka saat user klik "Buka Aplikasi", dan mode SSO.
3. **Integrasi data** (opsional) — URL API ringkasan, cara autentikasi, TTL cache.

Menu **tanpa** URL API tetap valid: ia jadi menu "link saja" (klik → langsung
buka aplikasi, tanpa halaman ringkasan).

### Field menu (form admin)

| Grup | Field | Wajib | Keterangan |
|---|---|---|---|
| Tampilan | Nama | ✔ | mis. "SIAKAD" |
| | Slug | ✔ | otomatis dari nama (`siakad`), bisa diedit; dipakai di URL `/siakad` |
| | Kode | ✔ | otomatis dari slug (`SIAKAD`), unik, dipakai di log & integrasi lama |
| | Deskripsi | | teks kecil di halaman detail, mis. "Sistem Informasi Akademik" |
| | Ikon | ✔ | pilih: **inisial** (1–3 huruf) atau **gambar** (upload/URL) |
| | Warna | ✔ | color picker hex; warna lembut & bayangan diturunkan otomatis |
| | Aktif | ✔ | tampil di dashboard atau tidak |
| | Urutan | ✔ | diatur dengan drag-and-drop di daftar |
| Tujuan | URL aplikasi | ✔ | link "Buka Aplikasi", mis. `https://siakad.yapinet.id` |
| | Mode buka | ✔ | `link` (tab sama) · `new_tab` · `handoff` (ticket) · `oauth` (Passport) |
| | Path SSO | kondisional | wajib jika mode `handoff` |
| Integrasi | URL API ringkasan | | URL **lengkap**, mis. `https://siakad.yapinet.id/api/integrations/yapinet/summary` |
| | Autentikasi | | `none` · `bearer` · `header` (nama header custom) |
| | API key | kondisional | write-only; setelah disimpan hanya tampil `••••abcd` |
| | Interval refresh | | menit, default dari pengaturan global |
| | Tampilan detail | | `auto` (renderer generik) · `link_only` · nama layout khusus terdaftar |
| Akses | Berikan ke semua pengguna | | jika aktif, user baru & lama otomatis dapat akses menu ini |

> Keputusan desain: admin memasukkan **URL API lengkap** (bukan base URL +
> path terpisah) — paling sesuai dengan permintaan "tinggal masukin URL API".
> Backend memecahnya sendiri bila perlu.

### Tombol "Tes Koneksi"

Di form menu ada tombol **Tes Koneksi** yang:

1. Memanggil URL API dengan auth yang diisi (form belum perlu disimpan).
2. Menampilkan: status HTTP, waktu respons, dan **pratinjau kartu** yang
   akan muncul di dashboard.
3. Memvalidasi bentuk JSON terhadap kontrak (lihat `api.md` → Kontrak v1)
   dan menampilkan peringatan per field yang salah.

Aturan keamanan tes koneksi → `security.md` (SSRF).

### Alur dashboard (baru)

```
GET /api/menu
  → apps aktif yang user punya akses, urut sort_order
  → TIDAK bergantung app_summary_cache (menu selalu muncul)
  → tiap item membawa ringkasan cache bila ada (status badge kecil)
```

Klik menu:
- `detail_layout = link_only` atau tanpa URL API → langsung jalankan mode buka.
- selain itu → halaman `/{slug}` (ringkasan) dengan tombol "Buka Aplikasi".

### Wireframe — Admin › Menu Aplikasi

```
┌──────────────────────────────────────────────────────────────┐
│ Admin   [Menu Aplikasi] Pengguna  Pengaturan  Log            │
├──────────────────────────────────────────────────────────────┤
│ Menu Aplikasi                                [+ Tambah Menu] │
│ Seret ⋮⋮ untuk mengubah urutan di dashboard.                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │⋮⋮ (SG) Sianggar   sianggar.yapinet.id  ● Tersambung  [✎]│ │
│ │⋮⋮ (SM) Simaya     simaya.yapi.web.id   ● Tersambung  [✎]│ │
│ │⋮⋮ (SA) SIAKAD     siakad.yapinet.id    ○ Link saja   [✎]│ │
│ │⋮⋮ (SP) e-SPP      —                    ◌ Nonaktif    [✎]│ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Wireframe — Form Tambah/Ubah Menu (panel samping / halaman)

```
┌ Tambah Menu ─────────────────────────────── Pratinjau ──┐
│ TAMPILAN                                    ┌────────┐  │
│ Nama        [SIAKAD              ]          │  (SA)  │  │
│ Slug        [siakad              ]          │ SIAKAD │  │
│ Ikon        (•) Inisial [SA]  ( ) Gambar    └────────┘  │
│ Warna       [■ #E0A527]                                  │
│ Deskripsi   [Sistem Informasi Akademik      ]            │
│ [x] Aktif di dashboard                                   │
│                                                          │
│ TUJUAN                                                   │
│ URL aplikasi [https://siakad.yapinet.id      ]           │
│ Mode buka    [Tab baru            ▾]                     │
│                                                          │
│ INTEGRASI DATA (opsional)                                │
│ URL API     [https://siakad.yapinet.id/api/…/summary]    │
│ Auth        [Bearer ▾]  API key [••••••••      ]         │
│ [Tes Koneksi]  ✓ 200 · 312 ms · format valid             │
│                                                          │
│ AKSES                                                    │
│ [x] Berikan ke semua pengguna                            │
│                                                          │
│                         [Batal]  [Simpan Menu]           │
└──────────────────────────────────────────────────────────┘
```

### Hapus menu

- Default tombol **Nonaktifkan** (data & riwayat tetap).
- **Hapus** = soft delete (`deleted_at`), dengan dialog konfirmasi yang
  menyebut jumlah user yang kehilangan akses. Slug/kode tetap dipesan agar
  tidak bentrok dengan link lama.

---

## F3 — Renderer Detail Generik

Halaman `/{slug}` menampilkan `sections[]` dari kontrak API (lihat `api.md`).
Tipe section yang didukung frontend:

| type | Tampilan |
|---|---|
| `stats` | grid kartu angka (label, value, format, tren opsional) |
| `table` | tabel dengan kolom bertipe, pagination & filter klien |
| `list` | daftar item (judul, subjudul, badge status, link) |
| `alert` | kotak info/peringatan |
| `progress` | bar progres (mis. realisasi anggaran) |
| `chart` | (fase lanjut) bar/line sederhana |

Komponen khusus (`SianggarDetail`, `SimayaDetail`, dll.) **dipertahankan
sementara** sebagai layout terdaftar, lalu dihapus satu per satu begitu
aplikasi anaknya mengirim `sections[]`.

---

## Role

Hanya **dua role**:

| Role | Disimpan | Bisa |
|---|---|---|
| **Admin** | `users.is_admin = true` | semua yang User bisa + area `/admin` (menu, pengguna, hak akses, pengaturan, log); melihat **semua** menu aktif tanpa perlu diberi akses |
| **User** | `users.is_admin = false` | login, melihat dashboard & ringkasan menu yang diberikan, membuka aplikasi |

Tidak ada peran per menu (BPH/Pembina/Pengawas/app_admin dihapus) dan tidak
ada flag "bisa bertindak". Siapa yang boleh menyetujui sesuatu diatur di
aplikasi anak masing-masing, bukan di Yapinet.

## F6 + F7 — Pengguna & Hak Akses

- Daftar pengguna: cari, filter status, label Admin, terakhir login.
- Aksi: Tambah, Ubah (nama, role Admin/User, status aktif/nonaktif), **Nonaktifkan**
  (disarankan) atau **Hapus** (permanen).
- Hak akses per pengguna: daftar menu dengan **checkbox** (centang = boleh
  melihat). Tidak ada peran per menu. Untuk Admin, daftar ini tidak perlu
  diatur — Admin selalu melihat semua menu aktif.
- Admin tidak bisa menghapus/menonaktifkan/mencabut admin dirinya sendiri.
- Auto-grant hanya menambah akses **sekali** (saat user dibuat atau menu baru
  dibuat dengan "berikan ke semua"), **tidak** setiap login — supaya akses
  yang dicabut admin tetap tercabut.

---

## F8 — Pengaturan Dinamis

### Prinsip

- **Definisi** pengaturan (key, tipe, default, validasi, publik/tidak) ada di
  kode: `backend/config/settings.php`.
- **Nilai** yang diubah admin disimpan di tabel `settings`. Tanpa baris di DB
  → pakai default dari kode. Jadi menambah pengaturan baru = tambah definisi,
  tanpa migrasi data.
- Dibaca lewat service `Settings::get('branding.app_name')` dengan cache
  (driver `database`, di-flush saat admin menyimpan).
- Pengaturan bertanda `public` dikirim ke frontend tanpa login
  (`GET /api/settings/public`) — untuk halaman login & branding.

### Daftar pengaturan awal

| Grup | Key | Tipe | Default | Publik |
|---|---|---|---|---|
| Branding | `branding.app_name` | string | `Yapinet` | ✔ |
| | `branding.logo_url` | image | logo bawaan | ✔ |
| | `branding.primary_color` | color | `#2E6DA4` | ✔ |
| | `branding.footer_text` | string | `© 2026 Yayasan — Yapinet` | ✔ |
| Login | `login.headline` | string | `Satu Aplikasi, Semua Layanan Yayasan` | ✔ |
| | `login.subtitle` | text | teks sekarang | ✔ |
| | `login.help_text` | string | `Butuh bantuan akses? Hubungi Admin Yayasan.` | ✔ |
| Dashboard | `dashboard.welcome_title` | string | `Selamat Datang di Dashboard Yapinet` | |
| | `dashboard.welcome_subtitle` | string | `Let's connect` | |
| | `dashboard.show_status_badge` | bool | `true` | |
| Akses | `access.auto_grant_new_users` | bool | `true` | |
| Integrasi | `integration.default_refresh_minutes` | int | `10` | |
| | `integration.request_timeout_seconds` | int | `5` | |
| | `integration.stale_after_minutes` | int | `60` | |
| Pengumuman | `announcement.enabled` | bool | `false` | |
| | `announcement.text` | text | `` | |
| | `announcement.level` | enum | `info` | |
| Kontak | `contact.admin_whatsapp` | string | `` | ✔ |
| | `contact.admin_email` | string | `` | ✔ |

### Wireframe — Admin › Pengaturan

```
┌──────────────────────────────────────────────────────────────┐
│ Pengaturan                                                   │
│ [Branding] [Login] [Dashboard] [Akses] [Integrasi] [Pengum.] │
├──────────────────────────────────────────────────────────────┤
│ Nama aplikasi     [Yapinet                     ]             │
│ Logo              [▣ ganti]  [kembalikan default]            │
│ Warna utama       [■ #2E6DA4]                                │
│ Teks footer       [© 2026 Yayasan — Yapinet    ]             │
│                                                              │
│                      [Kembalikan semua default] [Simpan]     │
└──────────────────────────────────────────────────────────────┘
```

---

## F9 — Log Aktivitas

Semua perubahan admin (menu, pengguna, akses, pengaturan) dan event penting
(login, login ditolak, buka aplikasi) dicatat di `audit_log` dengan
`action` terstandar (lihat `database.md`). UI: tabel dengan filter aksi,
pengguna, rentang tanggal.

---

## Roadmap pengerjaan

Kerjakan **berurutan**. Tiap fase harus bisa di-deploy sendiri tanpa
merusak fase sebelumnya.

### Fase 0 — Bersih-bersih (kecil, cepat)
- Perbaiki `deploy.sh` (path `composer.lock`), `LOG_CHANNEL=daily`.
- Pasang ESLint v9 config, Prettier, Laravel Pint.
- Hentikan auto-grant di setiap login (pindah ke "sekali saat dibuat").

### Fase 1 — Fondasi backend
- Migrasi skema `apps` baru + `settings` (lihat `database.md`), migrasi data
  dari kolom lama.
- `SettingsService` + `config/settings.php` + endpoint settings.
- Endpoint `GET /api/menu` (tidak bergantung cache).
- Admin API: apps CRUD + reorder + test-connection; users CRUD; settings.
- Fetcher membaca URL API lengkap + mode auth dari tabel.

### Fase 2 — Fondasi frontend
- UI kit (`components/ui`), `AppShell`, `AdminLayout`.
- Dashboard & detail membaca `/api/menu` (hapus `appSlugs.ts`, `appIcons.ts`).
- Halaman admin: Menu, Pengguna, Pengaturan, Log.
- Branding dari `/api/settings/public`.

### Fase 3 — Kontrak v1 + renderer generik
- Renderer `sections[]`.
- Bantu tiap aplikasi anak mengirim `sections[]`; hapus komponen khusus
  begitu aplikasinya siap.

### Fase 4 — Hardening
- Tes fitur (backend) untuk semua endpoint admin & menu.
- Pindah clone repo ke luar `public_html`; atur CDN agar tidak meng-cache API.
- Rate limit per user, review keamanan (`security.md`).
