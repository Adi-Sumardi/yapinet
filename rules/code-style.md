# Code Style

## Umum

- **Komentar dalam Bahasa Indonesia**, menjelaskan *kenapa* (keputusan,
  batasan hosting, bug yang dihindari) — bukan mengulang *apa* yang sudah jelas
  dari kode. Ini sudah jadi kebiasaan repo; pertahankan.
- **Identifier dalam Bahasa Inggris** (`openUrl`, `grantToAll`), kecuali
  istilah domain yang memang Indonesia dan dipakai aplikasi anak
  (`jumlah_aset`, `tanggal_lapor`).
- Fungsi pendek, satu tanggung jawab. Early return daripada `if` bersarang.
- Tidak ada kode mati / komentar kode lama. Hapus; git menyimpan riwayatnya.
- Tidak ada nilai ajaib: angka/string yang bermakna jadi konstanta, enum, atau pengaturan.

## PHP / Laravel

- PSR-12 via Pint (`formatting.md`).
- Type hint penuh: parameter, return type, properti. `void` bila tidak mengembalikan apa-apa.
- Gunakan fitur PHP 8.3: `readonly` class untuk DTO, enum, named arguments,
  constructor property promotion, `match`.
- Dependency lewat **injeksi** (constructor / method), bukan `app()` di tengah
  logika (kecuali resolver dinamis).
- `config()` hanya untuk nilai dari `.env`; pengaturan yang bisa diubah admin
  lewat `SettingsService`. **`env()` hanya boleh di file `config/`** (agar
  `config:cache` di produksi tidak memutus nilainya).
- Penamaan:

| Jenis | Pola | Contoh |
|---|---|---|
| Controller | `{Resource}Controller` | `Admin\AppController` |
| FormRequest | `{Verb}{Resource}Request` | `StoreAppRequest` |
| Resource | `{Resource}Resource` | `MenuItemResource` |
| Action | kata kerja, `__invoke` | `GrantDefaultAccess` |
| Service | `{Domain}Service` / kata benda | `SettingsService`, `AuditLogger` |
| Enum | tunggal | `OpenMode::NewTab` (value `new_tab`) |
| Test | `{Fitur}Test`, method `test_kalimat_perilaku` | `test_admin_can_reorder_menu` |

## TypeScript / React

- `strict` aktif. **Tanpa `any`**; pakai `unknown` + penyempitan.
- `type` untuk bentuk data & props (bukan `interface`, sesuai kode sekarang).
- Komponen: `export default function NamaKomponen()`; hook: `useNama`.
- File: komponen `PascalCase.tsx`, util/hook `camelCase.ts`.
- Import urut: library → `@/`/relatif lib → komponen → tipe. Tanpa import tak terpakai.
- State turunan dihitung (`useMemo` bila mahal), bukan disalin ke `useState`.
- `useEffect` hanya untuk sinkronisasi dengan dunia luar; jangan untuk
  menghitung data dari props.
- Tidak ada `console.log` yang ter-commit.
- Env var frontend hanya `VITE_API_URL`; konfigurasi lain dari `/api/settings/public`.

## Tes

- Backend: **feature test** untuk setiap endpoint baru (sukses, validasi gagal,
  tidak berhak). Jalankan `php artisan test` sebelum commit — harus hijau.
- Panggilan HTTP ke aplikasi anak di-fake (`Http::fake()` / mock Guzzle);
  Socialite di-mock (`Socialite::shouldReceive(...)`) seperti di `GoogleLoginTest`.
- Frontend: minimal `npx tsc -b` dan `npm run build` lulus.

## Git

- Branch: kerja kecil langsung di `main` boleh (kebiasaan repo); fase
  penataan ulang → branch `refactor/fase-N-...` lalu merge.
- Pesan commit gaya **Conventional Commits**, bahasa Inggris, imperatif:
  `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
  Baris pertama ≤ 72 karakter; badan menjelaskan *kenapa*.
- Satu commit = satu perubahan logis. Jangan campur refactor + fitur + format.
- **Jangan pernah commit**: `.env`, `secret.md`, `storage/oauth-*.key`,
  `database.sqlite`, `dist/`.
