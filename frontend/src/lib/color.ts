/**
 * Turunan warna menu dari SATU warna yang dipilih admin (rules/design.md →
 * "Warna menu"). Menggantikan tabel warna hardcoded di appIcons.ts lama.
 */

type Rgb = [number, number, number]

function parseHex(hex: string): Rgb {
  const clean = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? '2e6da4'
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as Rgb
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Campur dengan putih: amount 0 = warna asli, 1 = putih. */
export function tint(hex: string, amount: number): string {
  return toHex(parseHex(hex).map((v) => v + (255 - v) * amount) as Rgb)
}

/** Campur dengan hitam: amount 0 = warna asli, 1 = hitam. */
export function shade(hex: string, amount: number): string {
  return toHex(parseHex(hex).map((v) => v * (1 - amount)) as Rgb)
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export type MenuTheme = { color: string; soft: string; shadow: string; text: string }

export function menuTheme(hex: string): MenuTheme {
  return {
    color: hex,
    soft: tint(hex, 0.92),
    shadow: rgba(hex, 0.35),
    // Warna terang (mis. kuning) butuh teks gelap agar kontras tetap terbaca.
    text: luminance(hex) > 0.6 ? '#212b36' : '#ffffff',
  }
}

/** Terapkan warna utama dari pengaturan branding ke token CSS. */
export function applyAccent(hex: string): void {
  const root = document.documentElement.style
  root.setProperty('--color-accent', hex)
  root.setProperty('--color-accent-strong', shade(hex, 0.35))
  root.setProperty('--color-accent-soft', tint(hex, 0.9))
}
