# Detail Pages — Analisis & Desain Halaman Detail per Aplikasi

> Status: **DESAIN** (2026-10-09). Mockup visual: kanvas "Yapinet — Desain
> Halaman Detail" (7 artboard). Angka di mockup adalah contoh.
> Sumber analisis: kode tiap aplikasi (dibaca saja, tidak diubah).

## Untuk siapa halaman ini

Pengurus yayasan (Admin & User Yapinet) yang **mengawasi lintas unit**, bukan
operator harian. Maka setiap halaman detail menjawab tiga pertanyaan, berurutan:

1. **Apa yang perlu saya tindak lanjuti sekarang?** → *Perlu perhatian*
2. **Bagaimana kondisinya secara umum?** → *Angka kunci* (+ tren)
3. **Unit mana yang berbeda dari yang lain?** → *Perbandingan antar-unit*

Detail operasional (input data, approval) tetap di aplikasi asal — setiap
kartu punya tautan langsung ke halaman terkait di aplikasi itu.

## Pola halaman (sama untuk semua aplikasi)

| # | Bagian | Isi | Sumber di kontrak |
|---|---|---|---|
| 1 | Header | ikon, nama, status (Aman/Perlu perhatian/Kritis), "diperbarui X lalu", tombol Buka & Segarkan | data menu + `status`, `updated_at` |
| 2 | Filter | chip filter yang **disediakan aplikasi** (unit, tahun ajaran, gelombang, periode…) | `filters[]` (baru) |
| 3 | Perlu perhatian | maks 3 kartu, nada kritis/perhatian/info, kalimat + rincian + tautan | `attention[]` (baru) |
| 4 | Angka kunci | 4 kartu angka + keterangan / tren / bar | `metrics[]` (+ `trend`, `hint`, `progress`) |
| 5 | Perbandingan | tabel per unit dengan sel bar & penanda nilai menyimpang | `sections[]` type `table` (format `progress`, `emphasis`) |
| 6 | Grafik & daftar | grafik tren / funnel / sebaran + daftar yang bisa ditindaklanjuti | `sections[]` |
| 7 | Catatan sumber | domain sumber, versi kontrak, catatan privasi | otomatis |

### Prinsip

- **Agregat dulu, individu hanya untuk pengecualian.** Nama siswa, gaji
  perorangan, dan data calon murid **tidak** dikirim ke Yapinet.
- **Setiap angka punya pembanding** (periode lalu, target, atau rata-rata unit lain)
  — angka tanpa konteks tidak bisa ditindaklanjuti.
- **Status dihitung aplikasi asal** dengan aturan yang tertulis (tabel per
  aplikasi di bawah), supaya "Kritis" berarti sama di mana pun.
- **Filter dikirim aplikasi**, bukan dipetakan Yapinet — menghindari masalah
  pemetaan unit lintas sistem (UUID Yapinet ≠ id unit lokal, lihat komentar di
  `YapinetSummaryController` Sianggar).

## Kontrak ringkasan v1.1 (tambahan, kompatibel mundur)

Semua field v1 tetap berlaku (`rules/api.md` bagian B). Tambahan:

```jsonc
{
  "contract_version": 2,
  "filters": [
    { "key": "unit", "label": "Unit", "default": "all",
      "options": [{ "value": "all", "label": "Semua unit" }, { "value": "smp", "label": "SMP" }] }
  ],
  "attention": [
    { "tone": "critical", "title": "3 pengajuan tertunda lebih dari 14 hari",
      "description": "Tertua: SMP — Renovasi lab IPA (21 hari)",
      "link": "/pengajuan?status=menunggu", "link_label": "Lihat antrean",
      "when": { "unit": "all" } }
  ],
  "metrics": [
    { "label": "Realisasi", "value": 0.61, "format": "percent",
      "hint": "Rp7,6 M terserap", "progress": 0.61,
      "trend": { "text": "▲ 6 dari bulan lalu", "tone": "critical" },
      "when": { "unit": "all" } }
  ],
  "sections": [
    { "type": "table", "title": "Perbandingan antar sekolah",
      "columns": [{ "key": "spp", "label": "SPP terbayar", "format": "progress" }],
      "rows": [{ "unit": "SMP 55", "spp": 0.61, "_emphasis": { "spp": "critical" } }] },
    { "type": "funnel", "title": "Alur pendaftaran",
      "items": [{ "label": "Formulir dikirim", "value": 612 }, { "label": "Diterima", "value": 214 }] },
    { "type": "chart", "variant": "columns", "title": "Penerimaan SPP 6 bulan", "format": "percent",
      "items": [{ "label": "Mei", "value": 0.88 }], "highlight_last": true },
    { "type": "chart", "variant": "stacked", "title": "Kehadiran 7 hari",
      "series": [{ "key": "tepat", "label": "Tepat waktu", "tone": "ok" }, { "key": "telat", "label": "Terlambat", "tone": "warning" }],
      "items": [{ "label": "Sen", "tepat": 0.88, "telat": 0.05 }] }
  ]
}
```

| Tambahan | Arti |
|---|---|
| `filters[]` | chip filter; nilai terpilih dicocokkan ke `when` |
| `when` (di attention, metric, section) | tampil hanya bila semua key cocok dengan filter terpilih; tanpa `when` = selalu tampil. Aplikasi mengirim varian per nilai filter dalam satu payload (Yapinet membaca cache, tidak fan-out saat filter diganti) |
| `attention[]` | maks 3 ditampilkan; urut kritis → perhatian → info |
| metric `hint`, `progress` (0–1), `trend {text, tone}` | keterangan, bar mini, dan pembanding |
| table format `progress`, baris `_emphasis {kolom: tone}` | sel bar & penanda nilai menyimpang |
| section `funnel` | tahapan berurutan, menampilkan % terhadap tahap pertama & penurunan terbesar |
| chart `variant` `columns` / `stacked` / `horizontal` (default) | grafik kolom waktu, kolom bertumpuk, atau bar horizontal |

Batas ukuran tetap 512 KB; dengan varian per filter, kirim maksimal ~8 nilai per filter.

## Analisis per aplikasi

Kolom **Sekarang** = apa yang sudah dikirim endpoint ringkasan hari ini.

### 1. Sianggar (`sianggar-next`) — anggaran
- **Sekarang:** ✅ endpoint ada. Kirim jumlah pengajuan menunggu/disetujui/ditolak, APBS & realisasi (per unit, per tahun ajaran), 10 pengajuan terbaru — di `details` (layout khusus).
- **Tambahkan:** LPJ (belum masuk / melewati batas — ada alur LPJ di aplikasi), posisi pengajuan di tahap approval mana & sudah berapa hari, tren bulanan.
- **Status:** Kritis = ada pengajuan menunggu > 14 hari; Perlu perhatian = ada yang menunggu, LPJ terlambat, atau serapan unit ≥ 90%.
- **Bagian:** serapan per unit (progress), antrean persetujuan (list + umur), pengajuan terbaru (tabel). Filter: unit, tahun ajaran.

### 2. SIAKAD (`sekolah`) — akademik & keuangan sekolah
- **Sekarang:** ❌ belum ada endpoint (404).
- **Data tersedia:** `Student`, `SchoolUnit`, `Classroom`, `AttendanceRecord`/`DailyRecord` (presensi), `Bill`/`Payment` (SPP via e-SPP VA), `PointRecord`/`PointThreshold`, `Achievement`.
- **Tampilkan:** siswa aktif, kehadiran hari ini (S/I/A), % penerimaan SPP bulan ini, total tunggakan; perbandingan per sekolah; tren penerimaan 6 bulan; prestasi terbaru.
- **Status:** Kritis = siswa menunggak ≥ 3 bulan melebihi ambang; Perlu perhatian = kehadiran unit turun > 5 poin dari rata-rata 4 minggu, siswa melewati ambang poin.
- **Privasi:** nama siswa tidak dikirim. Filter: unit, tahun ajaran, bulan.

### 3. PMB (`pmb`) — penerimaan murid baru
- **Sekarang:** ❌ belum ada endpoint (404).
- **Data tersedia:** `Registration.stage` (form_submitted → admin_verification → payment_form → data_completion → data_validation → test_phase → acceptance_review → accepted/rejected → uang_pangkal_payment → enrolled), `SelectionBatch` (gelombang), `SelectionTrack` (jalur), `SchoolUnit`, `StudentBill`.
- **Tampilkan:** pendaftar (vs TA lalu), diterima, resmi terdaftar, keterisian kuota; **funnel tahapan**; per unit vs kuota; pendaftar per minggu; pendapatan formulir & uang pangkal.
- **Status:** Perhatian = verifikasi menumpuk > 3 hari, kuota unit < 50% menjelang tutup gelombang, diterima belum bayar uang pangkal mendekati batas.
- **Privasi:** tanpa data calon murid. Filter: unit, gelombang, jalur.

### 4. SiHaris (`SiHaris/laravel-be`) — kepegawaian
- **Sekarang:** ❌ belum ada endpoint (404).
- **Data tersedia:** `Employee`, `Department`, `Attendance`/`AttendanceRecap`, `LeaveRequest`, `OvertimeRequest`, `Reimbursement`, `ApprovalRecord`, `Payroll`.
- **Tampilkan:** pegawai aktif, hadir hari ini, terlambat, menunggu persetujuan; kehadiran 7 hari (bertumpuk tepat/terlambat); antrean persetujuan per jenis; per unit kerja (kehadiran, keterlambatan, beban gaji total).
- **Status:** Perhatian = approval > 3 hari, keterlambatan unit > 2× rata-rata, payroll belum diproses mendekati tutup buku.
- **Privasi:** gaji hanya total per unit. Filter: unit kerja, periode.

### 5. Simonas (`simonas-app`) — asrama
- **Sekarang:** ✅ endpoint ada. Kirim warga aktif/cuti/alumni + **daftar warga berikut IPK & poin per nama** di `details`.
- **Ubah:** ganti daftar nama penuh menjadi agregat (sebaran IPK, poin per aspek, per asrama); nama hanya untuk pengecualian (IPK < 2,75) dan sebaiknya tetap di Simonas.
- **Status:** Perhatian = ada warga IPK < 2,75 atau rasio cuti > 20% (aturan lama dipertahankan).
- **Filter:** asrama, semester.

### 6. Simonik (`notedpro-kolaborasi`) — meeting & tindak lanjut
- **Sekarang:** ✅ endpoint ada. Kirim total meeting, follow-up terbuka, tugas overdue, 10 meeting terakhir, follow-up, jadwal berikutnya.
- **Tambahkan:** tindak lanjut tanpa PIC, tingkat penyelesaian tepat waktu, penyelesaian per penanggung jawab.
- **Status:** Kritis = tugas overdue ≥ ambang (sekarang `CRITICAL_OVERDUE_THRESHOLD`); Perhatian = ada overdue.
- **Filter:** periode, forum rapat.

### 7. Simaya (`~/Adi/Laravel/simaya-app`) — aset
- **Sekarang:** ✅ endpoint ada. Kirim jumlah & nilai aset per unit, daftar aset rusak dan penyusutan (sampel).
- **Bug di endpoint sekarang:** jumlah "aset rusak" dihitung dari **sampel maks. 50 per unit**, bukan total — headline bisa lebih kecil dari kenyataan; total aset ikut menghitung aset yang sudah dihapus/dihibahkan.
- **Tambahkan:** nilai buku (sudah ada `book_value`), usulan penghapusan/hibah/sumbangan yang menunggu (`asset_dispositions.status = pending`), mutasi draf (`asset_transfers`), umur aset rusak.
- **Status:** Perhatian = aset rusak belum ditangani > 30 hari, usulan penghapusan menunggu; Kritis = rasio rusak > 20% (aturan lama).
- **Filter:** unit, kategori.

## Roadmap implementasi (Fase 3 lanjutan)

1. **Yapinet:** dukung kontrak v1.1 di `SummaryContract` & renderer (`filters`/`when`, `attention`, metric `trend/hint/progress`, `funnel`, chart `variant`, table `progress`/`_emphasis`). Halaman detail mengikuti pola di atas. Tes dengan payload contoh di repo.
2. **Aplikasi yang sudah punya endpoint** (Sianggar, Simonas, Simonik, Simaya): naikkan ke v1.1, perbaiki bug Simaya, kurangi data pribadi Simonas. Layout khusus lama dihapus satu per satu.
3. **Aplikasi baru** (SIAKAD, PMB, SiHaris): buat endpoint v1.1 dari nol (middleware API key + controller, pola sama dengan yang sudah ada).

Perubahan di repo aplikasi anak hanya dikerjakan atas persetujuan pemiliknya.
