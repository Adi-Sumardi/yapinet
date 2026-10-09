# API

Dua jenis API:
- **A. API Yapinet** — dipanggil frontend Yapinet (`api.yapinet.id/api/*`).
- **B. Kontrak aplikasi anak** — endpoint yang harus disediakan tiap aplikasi
  agar ringkasannya tampil di Yapinet.

## Aturan umum

- Semua respons JSON, `Content-Type: application/json`, UTF-8.
- Nama field `snake_case`. Tanggal ISO 8601 dengan offset (`2026-10-09T16:03:00+07:00`).
- Auth SPA: header `Authorization: Bearer <sanctum token>`.
- Request body divalidasi dengan **FormRequest** (lihat `controllers.md`).
- Respons dibentuk dengan **API Resource** — jangan `->toArray()` model mentah.
- Secret (API key, token) **tidak pernah** muncul di respons. Tampilkan
  `has_api_key: true` + `api_key_hint: "abcd"` (4 karakter terakhir).

### Bentuk respons

```jsonc
// Sukses — satu objek
{ "data": { ... } }

// Sukses — daftar ber-halaman
{ "data": [ ... ], "meta": { "current_page": 1, "last_page": 3, "per_page": 20, "total": 45 } }

// Error validasi — 422 (format bawaan Laravel)
{ "message": "Nama wajib diisi.", "errors": { "name": ["Nama wajib diisi."] } }

// Error lain
{ "message": "Tidak punya akses ke aplikasi ini." }
```

| Kode | Kapan |
|---|---|
| 200 | sukses baca/ubah |
| 201 | sukses buat |
| 204 | sukses hapus (tanpa body) |
| 401 | belum login / token tidak valid |
| 403 | login tapi tidak berhak |
| 404 | tidak ditemukan (termasuk menu nonaktif bagi non-admin) |
| 422 | validasi gagal |
| 429 | rate limit |

Pesan error untuk user ditulis dalam **Bahasa Indonesia**.

---

## A. API Yapinet

### Publik (tanpa login)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/settings/public` | pengaturan bertanda publik (branding, teks login, kontak) |
| GET | `/api/auth/google/redirect` | mulai login Google |
| GET | `/api/auth/google/callback` | callback Google → redirect ke `/auth/callback?token=` atau `/login?error=` |
| GET | `/api/oauth/user` | dipakai aplikasi anak (OAuth2 Passport) |
| POST | `/api/integrations/handoff/verify` | dipakai aplikasi anak (ticket handoff) |

### User login (`auth:sanctum`)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/me` | profil + flag admin |
| POST | `/api/auth/logout` | hapus token saat ini |
| GET | `/api/menu` | **menu dashboard** user (lihat contoh di bawah) |
| GET | `/api/apps/{slug}` | detail: info menu + ringkasan cache (semua unit yang boleh dilihat) |
| POST | `/api/apps/{slug}/refresh` | paksa refresh ringkasan (rate limit: 1×/menit/user/app) |
| GET | `/api/apps/{slug}/open` | URL tujuan sesuai mode buka (pengganti `/handoff`) |

Contoh `GET /api/menu`:

```json
{
  "data": [
    {
      "slug": "sianggar",
      "code": "SNGR",
      "name": "Sianggar",
      "description": "Aplikasi Pengajuan Anggaran",
      "icon": { "type": "initials", "text": "SG", "url": null },
      "color": "#3E7CB1",
      "open_mode": "new_tab",
      "has_summary": true,
      "summary_status": "warning"
    }
  ]
}
```

### Admin (`auth:sanctum` + `admin`)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/admin/apps` | semua menu termasuk nonaktif, + status koneksi terakhir |
| POST | `/api/admin/apps` | buat menu |
| GET | `/api/admin/apps/{app}` | detail menu (tanpa secret) |
| PUT | `/api/admin/apps/{app}` | ubah menu (field `api_key` tidak dikirim = tidak diubah; `remove_api_key: true` = hapus key) |
| DELETE | `/api/admin/apps/{app}` | soft delete |
| POST | `/api/admin/apps/reorder` | `{ "ids": ["uuid", ...] }` urutan baru |
| POST | `/api/admin/apps/test-connection` | tes URL API dari isi form (belum disimpan); `app_id` opsional untuk memakai key tersimpan |
| POST | `/api/admin/apps/{app}/refresh` | refresh ringkasan sekarang |
| GET | `/api/admin/users` | daftar user (`?search=&status=&page=`) |
| POST | `/api/admin/users` | tambah user (nama, email, is_admin) |
| PUT | `/api/admin/users/{user}` | ubah nama / is_admin / status |
| DELETE | `/api/admin/users/{user}` | hapus permanen |
| GET | `/api/admin/users/{user}/access` | matriks akses user |
| PUT | `/api/admin/users/{user}/access` | set akses sekaligus: `{ "app_ids": ["uuid", ...] }` |
| GET | `/api/admin/settings` | semua pengaturan + definisinya (tipe, default, grup) |
| PUT | `/api/admin/settings` | `{ "values": { "branding.app_name": "..." } }` |
| DELETE | `/api/admin/settings/{key}` | kembalikan ke default |
| GET | `/api/admin/audit-logs` | log (`?action=&user_id=&from=&to=&page=`) |
| POST | `/api/admin/uploads/image` | upload ikon/logo (png/jpg/webp ≤ 2 MB; frontend memperkecil ke 512 px dulu) → `{ data: { url } }` |

Path lama (`/api/dashboard/summary`, `/api/admin/access`, `/api/apps/{code}/handoff`)
dipertahankan sampai frontend baru live, lalu dihapus.

---

## B. Kontrak API Aplikasi Anak — v1

Aplikasi anak menyediakan **satu endpoint** yang URL lengkapnya dimasukkan
admin ke field "URL API ringkasan".

```
GET {url_api}?unit_id={uuid|kosong}
Authorization: Bearer {api_key}        ← jika auth = bearer
{Nama-Header}: {api_key}               ← jika auth = header
Accept: application/json
```

Yapinet memanggilnya dari **server** (scheduler), bukan dari browser — jadi
aplikasi anak **tidak perlu** CORS untuk endpoint ini.

### Respons

```jsonc
{
  "contract_version": 1,
  "status": "ok",                 // ok | warning | critical  (wajib)
  "headline": "3 pengajuan menunggu persetujuan",   // opsional, ≤ 120 karakter
  "updated_at": "2026-10-09T15:00:00+07:00",        // opsional
  "detail_path": "/pengajuan?status=menunggu",      // opsional, ditempel ke URL aplikasi

  // Angka utama untuk kartu ringkas (maks 4 ditampilkan di menu/kartu)
  "metrics": [
    { "label": "Menunggu", "value": 3, "format": "number" },
    { "label": "Realisasi", "value": 0.72, "format": "percent" },
    { "label": "Total Anggaran", "value": 1250000000, "format": "currency" }
  ],

  // Isi halaman detail, dirender generik oleh Yapinet
  "sections": [
    { "type": "stats", "title": "Ringkasan", "items": [
        { "label": "Pengajuan", "value": 12, "format": "number", "trend": "+2" } ] },

    { "type": "table", "title": "Pengajuan Terbaru",
      "columns": [
        { "key": "nomor", "label": "Nomor" },
        { "key": "unit", "label": "Unit" },
        { "key": "nominal", "label": "Nominal", "format": "currency" },
        { "key": "status", "label": "Status", "format": "badge" } ],
      "rows": [ { "nomor": "PA-001", "unit": "SMA", "nominal": 5000000,
                  "status": { "text": "Menunggu", "tone": "warning" } } ],
      "row_link": "/pengajuan/{nomor}" },

    { "type": "list", "title": "Aset Rusak", "items": [
        { "title": "Proyektor Ruang 3", "subtitle": "SMP · 2026-10-01",
          "badge": { "text": "Menunggu Perbaikan", "tone": "warning" },
          "link": "/aset/123" } ] },

    { "type": "progress", "title": "Serapan Anggaran", "items": [
        { "label": "SMA", "value": 0.64 }, { "label": "SMP", "value": 0.41 } ] },

    { "type": "alert", "tone": "critical", "text": "Server backup gagal sejak kemarin." }
  ],

  // Opsional — payload bebas untuk layout khusus lama (deprecated)
  "details": {}
}
```

### Nilai `format`

`number` · `currency` (IDR) · `percent` (0–1) · `date` · `datetime` · `text` · `badge`.
Aturan tampilannya di `formatting.md`.

### Nilai `tone`

`info` · `ok` · `warning` · `critical` · `neutral`.

### Batasan (divalidasi Yapinet, kelebihan dipotong)

| Item | Batas |
|---|---|
| ukuran respons | 512 KB |
| `metrics` | 8 item |
| `sections` | 10 item |
| baris per `table` / item per `list` | 200 |
| waktu respons | timeout = `integration.request_timeout_seconds` (default 5 dtk) |

Respons tidak valid / timeout / HTTP ≠ 2xx → ringkasan disimpan sebagai
`degraded` dengan alasan, **menu tetap tampil**.

### Kompatibilitas

- Respons **tanpa** `contract_version` dianggap versi 0 (format lama:
  `status`, `headline`, `metrics`, `details`) dan tetap diterima.
- Field yang tidak dikenal diabaikan, bukan error.
