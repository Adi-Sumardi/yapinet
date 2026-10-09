# Formatting

Dua bagian: **A. format data yang tampil ke user** dan **B. format kode**.

## A. Format tampilan data

Semua formatter ada di **satu tempat**: `frontend/src/lib/format.ts`.
Komponen tidak memanggil `Intl` / `toLocaleString` langsung.

Locale: `id-ID`. Zona waktu: `Asia/Jakarta` (WIB). Backend mengirim ISO 8601
dengan offset; frontend yang memformat.

| `format` (kontrak API) | Fungsi | Contoh input → output |
|---|---|---|
| `number` | `formatNumber(v)` | `1250` → `1.250` |
| `currency` | `formatRupiah(v)` | `1250000` → `Rp1.250.000` |
| (ringkas) | `formatRupiahShort(v)` | `1250000000` → `Rp1,25 M` · `3400000` → `Rp3,4 jt` |
| `percent` | `formatPercent(v)` (v = 0–1) | `0.725` → `72,5%` |
| `date` | `formatDate(v)` | `2026-10-09` → `9 Okt 2026` |
| `datetime` | `formatDateTime(v)` | → `9 Okt 2026, 16.03` |
| (relatif) | `formatRelative(v)` | → `3 menit lalu`, `kemarin` |
| `text` | apa adanya, dipotong dengan `…` bila melebihi lebar |
| `badge` | `{ text, tone }` → `<Badge>` |

Aturan:
- Angka di kartu metrik pakai `tabular-nums`.
- Nilai kosong/null tampil sebagai `—` (em dash), bukan `0` atau `null`.
- Nominal besar di kartu ringkas pakai versi ringkas; di tabel pakai versi penuh.
- "Diperbarui …" selalu relatif, dengan tooltip waktu lengkap.

### Teks UI (copywriting)

- **Bahasa Indonesia**, kalimat biasa (sentence case): "Tambah menu", bukan "Tambah Menu"
  untuk teks isi. Judul halaman & nama menu boleh Title Case.
- Sapaan "kamu" untuk user (sesuai copy yang ada), konsisten.
- Tombol = kata kerja: "Simpan", "Hapus", "Tes koneksi", "Buka aplikasi".
- Pesan error menjelaskan **apa yang terjadi + apa yang bisa dilakukan**:
  "Email ini belum terdaftar. Minta Admin Yayasan menambahkannya." — bukan "Error 403".
- Istilah baku di seluruh aplikasi:

| Pakai | Jangan |
|---|---|
| Menu / aplikasi | modul, app, tile |
| Pengguna | user, akun (kecuali "akun Google") |
| Hak akses | permission, izin |
| Pengaturan | setting, konfigurasi |
| Ringkasan | summary |
| Nonaktifkan | suspend, disable |

## B. Format kode

| Bahasa | Alat | Perintah | Konfigurasi |
|---|---|---|---|
| PHP | **Laravel Pint** (preset `laravel`) | `cd backend && ./vendor/bin/pint` | `backend/pint.json` |
| TS/TSX/CSS | **Prettier** | `cd frontend && npm run format` | `frontend/.prettierrc` |
| TS/TSX lint | **oxlint** (sudah terpasang) | `cd frontend && npm run lint` | default oxlint |

Prettier (`.prettierrc`), sesuai gaya kode yang sudah ada:

```json
{ "semi": false, "singleQuote": true, "printWidth": 120, "trailingComma": "all" }
```

Aturan:
- Format **sebelum commit**. Commit yang hanya berisi perubahan format dipisah
  dari commit perubahan logika.
- Indentasi: PHP 4 spasi, TS/JSON/CSS 2 spasi. LF, UTF-8, newline di akhir file
  (`.editorconfig` di root).
- Jangan format ulang seluruh file lama saat mengubah sedikit — kecuali
  memang commit khusus formatting.
