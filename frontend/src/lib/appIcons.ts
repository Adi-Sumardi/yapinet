export type AppTheme = {
  initials: string
  category: string
  color: string // solid circle background
  shadow: string // tinted shadow to match color
  soft: string // pastel tile background
}

/**
 * Identitas visual per aplikasi — inisial + warna berbeda per aplikasi,
 * mengikuti pola moduleDefs di ui-ux/YAPINET.dc.html. Warna dipilih dari
 * palet referensi tersebut untuk aplikasi yang cocok fungsinya, sisanya
 * diberi warna baru yang belum dipakai.
 */
const THEME: Record<string, AppTheme> = {
  SNGR: {
    initials: 'SG',
    category: 'Aplikasi Pengajuan Anggaran',
    color: '#3E7CB1',
    shadow: 'rgba(62,124,177,0.35)',
    soft: '#eef4f9',
  }, // Sianggar
  SMYA: {
    initials: 'SM',
    category: 'Aplikasi Sistem Manajemen Aset YAPI',
    color: '#4CAF7D',
    shadow: 'rgba(76,175,125,0.35)',
    soft: '#eef8f2',
  }, // Simaya
  SMNK: {
    initials: 'MK',
    category: 'Aplikasi Sistem Manajemen Meeting, Notulensi, dan Follow up',
    color: '#2FA8B0',
    shadow: 'rgba(47,168,176,0.3)',
    soft: '#eaf7f8',
  }, // Simonik
  SMOY: {
    initials: 'SY',
    category: 'Aplikasi Sistem Manajemen Peminjaman Mobil YAPI',
    color: '#5C6BC0',
    shadow: 'rgba(92,107,192,0.35)',
    soft: '#eef0fb',
  }, // Simoy
  SHRS: {
    initials: 'HR',
    category: 'Aplikasi Sistem Manajemen Kepegawaian YAPI',
    color: '#1c1c1e',
    shadow: 'rgba(28,28,30,0.3)',
    soft: '#f1f1f2',
  }, // SiHaris
  SMNS: {
    initials: 'SN',
    category: 'Aplikasi Sistem Monitoring Warga Asrama',
    color: '#9C5FC0',
    shadow: 'rgba(156,95,192,0.35)',
    soft: '#f8f0fb',
  }, // Simonas
  ESPP: {
    initials: 'SP',
    category: 'Aplikasi Sistem Manajemen Pembayaran SPP Murid',
    color: '#E0A527',
    shadow: 'rgba(224,165,39,0.35)',
    soft: '#fdf6e8',
  }, // e-SPP
  SIAK: {
    initials: 'SA',
    category: 'Aplikasi Sistem Informasi Akademik',
    color: '#E0A527',
    shadow: 'rgba(224,165,39,0.35)',
    soft: '#fdf6e8',
  }, // SIAKAD
  PMB: {
    initials: 'PM',
    category: 'Aplikasi Sistem Manajemen Penerimaan Murid Baru',
    color: '#1F6FA6',
    shadow: 'rgba(31,111,166,0.35)',
    soft: '#eaf3fa',
  }, // PMB
  ARSD: {
    initials: 'AD',
    category: 'Aplikasi Sistem Manajemen Arsip Digital',
    color: '#6D4E9C',
    shadow: 'rgba(109,78,156,0.3)',
    soft: '#f2eefa',
  }, // Arsip Digital
  SKLH: {
    initials: 'SK',
    category: 'Aplikasi Sistem Manajemen Sekolah',
    color: '#D9534F',
    shadow: 'rgba(217,83,79,0.35)',
    soft: '#fbeeed',
  }, // Sekolah
  FRNT: {
    initials: 'FO',
    category: 'Aplikasi Sistem Manajemen Front Office',
    color: '#2E8B57',
    shadow: 'rgba(46,139,87,0.3)',
    soft: '#eaf7f0',
  }, // Front Office
}

const FALLBACK: AppTheme = {
  initials: '···',
  category: 'Lainnya',
  color: '#2E6DA4',
  shadow: 'rgba(46,109,164,0.3)',
  soft: '#eaf3fa',
}

export function appTheme(code: string): AppTheme {
  return THEME[code] ?? FALLBACK
}
