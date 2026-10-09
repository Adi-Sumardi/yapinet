/** URL slug (huruf kecil) <-> kode aplikasi di App Registry backend. */
const SLUG_TO_CODE: Record<string, string> = {
  sianggar: 'SNGR',
  simaya: 'SMYA',
  simonik: 'SMNK',
  simoy: 'SMOY',
  siharis: 'SHRS',
  simonas: 'SMNS',
  espp: 'ESPP',
  siakad: 'SIAK',
  pmb: 'PMB',
  'arsip-digital': 'ARSD',
  sekolah: 'SKLH',
  'front-office': 'FRNT',
}

const CODE_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_CODE).map(([slug, code]) => [code, slug]),
)

/** Nama tampilan sebagai fallback saat belum ada baris ringkasan (cards) untuk aplikasi ini. */
const CODE_TO_NAME: Record<string, string> = {
  SNGR: 'Sianggar',
  SMYA: 'Simaya',
  SMNK: 'Simonik',
  SMOY: 'Simoy',
  SHRS: 'SiHaris',
  SMNS: 'Simonas',
  ESPP: 'e-SPP',
  SIAK: 'SIAKAD',
  PMB: 'PMB',
  ARSD: 'Arsip Digital',
  SKLH: 'Sekolah',
  FRNT: 'Front Office',
}

export function slugToCode(slug: string): string | undefined {
  return SLUG_TO_CODE[slug.toLowerCase()]
}

export function codeToSlug(code: string): string {
  return CODE_TO_SLUG[code] ?? code.toLowerCase()
}

export function codeToName(code: string): string {
  return CODE_TO_NAME[code] ?? code
}
