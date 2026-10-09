/**
 * Aksen dekoratif dua lingkaran translusen putih di atas gradient navy —
 * pola yang sama dengan panel branding di ui-ux/YAPINET.dc.html.
 */
export default function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/[0.06]" />
      <div className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-white/[0.05]" />
    </div>
  )
}
