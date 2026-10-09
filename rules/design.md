# Design System

Identitas: **"Institutional Blue"** — mengikuti `ui-ux/YAPINET.dc.html`.
Token sudah didefinisikan di `frontend/src/index.css` (`@theme`). **Selalu
pakai token**, jangan hex mentah di komponen (pengecualian: warna menu yang
datang dari database).

## Prinsip

1. **Mobile-first.** Pengguna utama (pengurus Yayasan) banyak membuka dari
   HP. Desain di lebar 375 px dulu, lalu `sm:`/`md:`.
2. **Tenang & institusional.** Banyak ruang putih, sedikit warna; warna kuat
   hanya untuk ikon menu dan status.
3. **Satu aksi utama per layar.** Tombol primer satu; sisanya sekunder/ghost.
4. **Status selalu terlihat**: loading, kosong, error, dan "belum tersambung"
   punya tampilan masing-masing — tidak boleh layar kosong putih.
5. **Bahasa Indonesia** untuk semua teks UI (lihat `formatting.md`).

## Token

### Warna (dari `index.css`)

| Token | Hex | Pakai untuk |
|---|---|---|
| `paper` | #f7f9fb | latar halaman |
| `surface` | #ffffff | kartu, panel |
| `surface-soft` | #f2f5f8 | latar sekunder, hover |
| `ink` / `ink-soft` / `ink-faint` | #212b36 / #6b7785 / #9aa5b1 | teks utama / sekunder / label |
| `accent` | #2e6da4 | tombol primer, link |
| `accent-strong` / `accent-deep` / `accent-mid` | | hover, hero gradient |
| `accent-soft` | #eaf3fa | latar badge info |
| `line` / `line-soft` | | border input / border kartu |
| `good` `warn` `crit` (+ `-soft`) | | status ok / warning / critical |

`branding.primary_color` (pengaturan) menimpa `--color-accent` saat runtime:
`document.documentElement.style.setProperty('--color-accent', color)`.
Turunan (`accent-strong`, `accent-soft`) dihitung dengan util `shade()`/`tint()`.

### Warna menu (dinamis)

Admin hanya memilih **satu** warna. Frontend menurunkan:

| Turunan | Rumus | Dipakai |
|---|---|---|
| `color` | apa adanya | lingkaran ikon |
| `soft` | campur 92% putih | latar tile |
| `shadow` | `rgba(color, .35)` | bayangan ikon |
| teks di atas `color` | putih, atau `ink` bila luminans > 0.6 | inisial |

Util: `frontend/src/lib/color.ts` → `menuTheme(hex)`. **Hapus** `appIcons.ts`
setelah migrasi.

### Tipografi

| Peran | Font | Ukuran |
|---|---|---|
| Judul halaman | Poppins (`font-display`) bold | `text-xl` (mobile) / `text-2xl` |
| Judul kartu/section | Poppins bold | `text-base` / `text-sm` |
| Teks isi | Inter | `text-sm` |
| Label/caption | Inter semibold uppercase tracking-wide | `text-xs` / `text-[11px]` |
| Angka metrik | Inter bold `tabular-nums` | `text-lg`–`text-2xl` |

### Spasi, radius, bayangan

- Gutter halaman: `px-4` (mobile) / `px-6`; lebar konten `max-w-5xl` (admin), `max-w-4xl` (user).
- Radius: kartu `rounded-2xl`, input/tombol `rounded-xl` (besar) / `rounded-lg` (kecil), badge `rounded-full`.
- Kartu: `border border-line-soft bg-surface` — **tanpa** bayangan; bayangan hanya untuk ikon menu & elemen melayang (modal, dropdown).
- Interaksi sentuh: kelas `tap-scale`; target sentuh minimal 44×44 px.

### Ikon

- Ikon UI: SVG inline 1 gaya (stroke 2, `currentColor`, 16–20 px) di
  `components/icons/`. **Jangan** emoji (mis. `⚙` sekarang di tile Pengaturan).
- Ikon menu: inisial di lingkaran warna, atau gambar dari admin (dipotong lingkaran, `object-cover`).

## Layout halaman

### User

```
┌──────────────────────────────────────┐
│ [logo] YAPINET          (A) ▾        │  TopBar: logo, avatar → menu (Pengaturan, Admin*, Keluar)
├──────────────────────────────────────┤
│ ⓘ Pengumuman (jika aktif)            │  AnnouncementBanner
│                                      │
│      Selamat Datang di Dashboard     │  dari pengaturan
│           Let's connect              │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │  grid 2 / 3 / 4 kolom
│  │(SG)│ │(SM)│ │(SN)│ │(HR)│         │  MenuTile: ikon, nama, titik status
│  └────┘ └────┘ └────┘ └────┘         │
└──────────────────────────────────────┘
```

Tile "Pengaturan" dihapus dari grid — pindah ke menu avatar (bukan aplikasi).

### Admin

```
┌──────────────────────────────────────────────────────────┐
│ [logo] YAPINET · Admin                    (A) ▾          │
├────────────┬─────────────────────────────────────────────┤
│ Menu       │  Judul halaman              [Aksi primer]   │
│ Pengguna   │  deskripsi singkat                          │
│ Pengaturan │  ┌───────────────────────────────────────┐  │
│ Log        │  │ konten (tabel / form)                 │  │
│            │  └───────────────────────────────────────┘  │
│ ← Dashboard│                                             │
└────────────┴─────────────────────────────────────────────┘
Mobile: sidebar → tab horizontal yang bisa di-scroll di bawah TopBar.
```

Wireframe per fitur admin ada di `system-features.md`.

## Pola status

| Keadaan | Tampilan |
|---|---|
| Loading | skeleton seukuran konten (bukan teks "Memuat…" saja) |
| Kosong | `EmptyState`: ikon, kalimat penjelas, aksi (mis. "Tambah Menu") |
| Error | `ErrorState`: pesan + tombol "Coba lagi" |
| Ringkasan belum tersambung | kartu netral "Integrasi data belum tersedia" + tombol "Buka Aplikasi" |
| Data basi (stale) | badge abu "Diperbarui 3 jam lalu" |
| Status ringkasan | titik/badge: ok=`good`, warning=`warn`, critical=`crit`, degraded=`ink-faint` |

## Notifikasi & Konfirmasi (Toast + Dialog)

**Dilarang** memakai `window.alert`, `window.confirm`, dan `window.prompt`
di mana pun. Semua umpan balik lewat **Toast**, semua konfirmasi lewat
**ConfirmDialog**. Keduanya harus terasa "hidup" dan menarik — bagian dari
identitas Yapinet, bukan kotak polos.

### Toast — umpan balik singkat

```
                                   ┌───────────────────────────────────┐
                                   │▌ ✓  Menu disimpan            ✕   │
                                   │▌    SIAKAD sudah tampil di        │
                                   │▌    dashboard semua pengguna.     │
                                   │▌    [Lihat]                       │
                                   │▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░░░░░░░░░░░░░░░│ ← bar sisa waktu
                                   └───────────────────────────────────┘
```

| Aspek | Spesifikasi |
|---|---|
| Posisi | desktop: kanan atas, di bawah TopBar · mobile: atas tengah, lebar penuh − 16 px |
| Varian | `success` (good) · `error` (crit) · `warning` (warn) · `info` (accent) · `loading` (spinner, tanpa auto-tutup) |
| Anatomi | strip warna kiri 4 px, ikon dalam lingkaran `-soft` berwarna, judul bold + deskripsi opsional, tombol aksi opsional (mis. **Urungkan**, **Lihat**), tombol ✕ |
| Permukaan | `bg-surface/95` + `backdrop-blur`, `rounded-2xl`, bayangan lembut `0 12px 32px rgba(15,42,82,.14)` |
| Animasi masuk | slide + fade dari kanan (mobile: dari atas) 220 ms `cubic-bezier(.2,.8,.2,1)`, ikon "pop" (scale .6 → 1.1 → 1) |
| Animasi keluar | fade + geser 12 px, 160 ms |
| Durasi | success/info 4 dtk · warning 6 dtk · error tetap sampai ditutup · berhenti saat di-hover/disentuh |
| Progres | bar tipis di bawah menunjukkan sisa waktu |
| Tumpukan | maks 3 terlihat; yang lama menyusut di belakang (stack); gesek untuk menutup di mobile |
| Promise | `toast.promise(p, { loading, success, error })` → satu toast berubah dari loading → hasil |
| A11y | `role="status"` (success/info) / `role="alert"` (error), `aria-live`, hormati `prefers-reduced-motion` (tanpa slide, hanya fade) |

Kapan dipakai: hasil simpan/hapus/ubah, Tes Koneksi selesai, gagal jaringan,
salin ke clipboard. **Bukan** untuk pesan validasi form (itu di bawah field).

Untuk hapus yang bisa dibatalkan (nonaktifkan menu, cabut akses): langsung
jalankan + toast dengan tombol **Urungkan** (6 dtk) — lebih cepat dari dialog.

### ConfirmDialog — konfirmasi aksi penting

```
        ┌──────────────────────────────────────────────┐
        │                  ╭──────╮                    │
        │                  │  🗑   │  ← ikon dalam lingkaran crit-soft,
        │                  ╰──────╯     animasi "pulse" halus sekali
        │                                              │
        │          Hapus pengguna ini?                 │
        │                                              │
        │   Fajar (fajar431@admin.paud.belajar.id)     │
        │   tidak akan bisa login lagi. Tindakan ini   │
        │   tidak bisa dibatalkan.                     │
        │                                              │
        │   Ketik HAPUS untuk melanjutkan:  [______]   │ ← hanya untuk aksi sangat berat
        │                                              │
        │   [ Batal ]              [ Ya, hapus ]       │
        └──────────────────────────────────────────────┘
              latar: overlay ink/40 + blur 4 px
```

| Aspek | Spesifikasi |
|---|---|
| Nada | `danger` (crit, untuk hapus), `warning` (warn, untuk nonaktifkan / cabut admin), `default` (accent) |
| Anatomi | ikon besar dalam lingkaran berwarna, judul berupa pertanyaan, deskripsi yang **menyebut objeknya** (nama/email) dan dampaknya, tombol Batal (sekunder) + tombol konfirmasi (warna sesuai nada) |
| Animasi | overlay fade 150 ms; kartu scale .94 → 1 + fade 200 ms; tutup kebalikannya |
| Mobile | jadi **bottom sheet** (geser dari bawah, sudut atas `rounded-t-3xl`, handle kecil) |
| Fokus | fokus awal di tombol **Batal** (aman), `Esc`/klik overlay = batal, fokus terkunci |
| Loading | tombol konfirmasi menampilkan spinner & dialog tidak bisa ditutup sampai selesai; sukses → tutup + toast |
| Ketik-untuk-konfirmasi | wajib untuk hapus permanen pengguna & hapus menu |
| API | `const ok = await confirm({ title, description, tone, confirmLabel })` — promise, dipanggil seperti `window.confirm` tapi dengan UI sendiri |

Teks tombol harus berupa **kata kerja spesifik** ("Ya, hapus", "Nonaktifkan"),
bukan "OK"/"Ya".

## Aksesibilitas

- Kontras teks minimal 4.5:1 (cek warna menu dari admin → util memilih putih/gelap).
- Semua tombol ikon punya `aria-label`.
- Fokus terlihat (`focus-visible:ring-2 ring-accent/40`).
- Modal: fokus terkunci di dalam, `Esc` menutup.
