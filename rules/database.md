# Database

## Aturan umum

- **Produksi MySQL/MariaDB, lokal SQLite.** Setiap migrasi & query harus
  jalan di keduanya. Hindari SQL mentah khusus satu engine; kalau terpaksa,
  cabangkan dengan `DB::getDriverName()`.
- **Primary key UUID** (`$table->uuid('id')->primary()` + `HasUuids` di model).
  Pengecualian: tabel bawaan Laravel/Passport.
- **Jangan pernah mengubah migrasi yang sudah jalan di produksi.** Buat
  migrasi baru. (Cek: `php artisan migrate:status` di server.)
- **Perubahan data produksi** (mis. menonaktifkan menu) dilakukan lewat
  **migrasi**, bukan seeder dan bukan tinker manual — supaya tercatat di git
  dan ikut jalan di `deploy.sh`. Contoh: `2026_10_09_100000_update_app_menu_siakad.php`.
- **Seeder hanya untuk instalasi baru / lokal.** Jangan jalankan `db:seed` di
  produksi (akan menimpa URL yang sudah diatur admin).
- Nama tabel: jamak, `snake_case` (`apps`, `user_app_access`). Nama kolom
  `snake_case`. Boolean diawali `is_`/`has_`/`can_`. Waktu diakhiri `_at`.
- Setiap foreign key eksplisit: `constrained()->cascadeOnDelete()` atau
  `nullOnDelete()` — pilih dengan sadar dan beri komentar bila tidak jelas.
- Kolom yang sering difilter/diurutkan diberi index (`is_active`, `sort_order`, `action`, `created_at`).
- **Jangan** buat `unique` yang melibatkan kolom nullable — di MySQL `NULL`
  tidak dianggap sama, jadi uniknya bocor. Pakai kolom kunci non-null
  (lihat `scope_key` di bawah).
- `enum` boleh untuk nilai yang benar-benar tetap; untuk nilai yang mungkin
  bertambah (mode buka, tipe auth) pakai `string` + validasi di aplikasi.
- Secret disimpan terenkripsi lewat cast `encrypted` di model. Nama kolom
  **tidak** diberi akhiran `_encrypted`.
- Backup database sebelum deploy yang berisi migrasi (`mysqldump` via SSH).

## Skema target

### `apps` (menu aplikasi) — diubah

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | |
| code | string(20) unique | huruf besar, mis. `SNGR`, `SIAKAD` |
| slug | string(50) unique | untuk URL, mis. `sianggar` |
| name | string(100) | |
| description | string(255) null | |
| icon_type | string(20) | `initials` / `image` |
| icon_text | string(3) null | inisial |
| icon_url | string null | path upload / URL gambar |
| color | string(7) | hex `#RRGGBB` |
| sort_order | unsigned int, index | |
| is_active | bool, index | tampil di dashboard |
| open_url | string | **ganti nama** dari `public_url` |
| open_mode | string(20) | `link` / `new_tab` / `handoff` / `oauth` |
| sso_path | string null | **ganti nama** dari `sso_endpoint` |
| summary_url | string null | URL API **lengkap**; null = menu tanpa ringkasan |
| auth_type | string(20) | `none` / `bearer` / `header` |
| auth_header | string(100) null | nama header bila `auth_type = header` |
| refresh_minutes | unsigned smallint null | null = pakai pengaturan global |
| detail_layout | string(30) | `auto` / `link_only` / nama layout khusus |
| grant_to_all | bool | auto-grant menu ini ke semua user |
| last_checked_at | timestamp null | hasil fetch terakhir |
| last_check_ok | bool null | |
| last_check_message | string null | |
| timestamps, deleted_at | | soft delete |

Migrasi dari kolom lama:
`summary_url = rtrim(base_url,'/') . '/' . ltrim(summary_endpoint,'/')`,
`open_url = public_url ?? base_url`, `slug` dari `appSlugs.ts` sekarang,
`icon_text`/`color` dari `appIcons.ts` sekarang, `sort_order` dari
`DashboardController::$order`. Kolom lama dihapus di migrasi terpisah
setelah frontend baru live.

### `app_credentials` — diubah

| Kolom | Tipe | Catatan |
|---|---|---|
| app_id | uuid unique FK cascade | |
| api_key | text null | cast `encrypted`; ganti nama dari `api_key_encrypted` |
| sso_signing_key | text null | cast `encrypted` |
| rotated_at | timestamp null | |

Secret dipisah dari `apps` supaya tidak ikut terserialisasi/ter-log saat
model `apps` dikirim ke mana pun.

### `settings` — baru

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid PK | |
| key | string(100) unique | dot-notation, harus terdaftar di `config/settings.php` |
| value | json | |
| updated_by | uuid null FK users nullOnDelete | |
| timestamps | | |

Hanya nilai yang **diubah** admin yang punya baris. Definisi (tipe, default,
validasi, grup, publik) ada di `config/settings.php`.

### `users` — role

Role hanya dua: **Admin** dan **User**, disimpan di `users.is_admin`
(boolean, sudah ada). Tidak ada tabel role/permission.

### `user_app_access` — diubah

Baris = user **boleh melihat** menu itu. Tidak ada peran per menu.
- **Hapus** kolom `yayasan_role` dan `can_act`.
- Tambah `scope_key` string(36) **not null**, isi `'all'` atau UUID unit.
- Ganti `unique(user_id, app_id, unit_id)` → `unique(user_id, app_id, scope_key)`.
- `granted_by`, `granted_at` tetap (untuk riwayat).

### `app_summary_cache` — diubah

- Tambah `scope_key` (sama seperti di atas), unique `(app_id, scope_key)`.
- Tambah `sections` json null, `contract_version` tinyint, `error_message` string null.
- `status` jadi string (tambah nilai di masa depan tanpa ubah enum).

### `audit_log` — dipakai penuh

`action` terstandar (string, index), format `domain.kata_kerja`:

| action | kapan |
|---|---|
| `auth.login` / `auth.login_rejected` / `auth.logout` | autentikasi |
| `app.opened` | user membuka aplikasi |
| `admin.app_created` / `admin.app_updated` / `admin.app_deleted` / `admin.apps_reordered` | menu |
| `admin.user_created` / `admin.user_updated` / `admin.user_deleted` | pengguna |
| `admin.access_updated` | hak akses |
| `admin.settings_updated` | pengaturan |

`metadata` berisi perubahan (`before`/`after`) **tanpa** secret. `user_id`
jadi nullable + `nullOnDelete` agar log tetap ada saat user dihapus.

### Legacy — dihapus di fase hardening

`users.password`, `users.must_change_password`, `config('yapinet.default_password')`
(migrasi lama masih membacanya — sediakan fallback sebelum menghapus config),
tabel `notifications` (belum dipakai; hapus atau pakai sungguhan).

## Checklist migrasi baru

- [ ] Nama file deskriptif: `YYYY_MM_DD_HHMMSS_verb_object.php`
- [ ] `down()` benar-benar membalik `up()`
- [ ] Jalan di SQLite (`php artisan migrate:fresh` lokal) **dan** MySQL
- [ ] Tidak ada `unique` di kolom nullable
- [ ] Ada komentar singkat *kenapa* (bahasa Indonesia), bukan *apa*
- [ ] Tes fitur yang bergantung skema ikut diperbarui
