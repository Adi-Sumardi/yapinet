import type { CSSProperties } from 'react'
import type { AttentionItem, Insight, Metric, Tone } from '../../lib/types'
import { InfoIcon } from '../../components/icons'
import type { HeroLayout } from './auto'
import { INSIGHT_ICONS } from './theme'
import { AnimatedNumber, Gauge, InView, RichText, Ring } from './viz'

/** Panel atas halaman detail: angka utama + cerita + ubin + cincin/gauge (v1.2). */
export function HeroPanel({ layout, accent }: { layout: HeroLayout; accent: string }) {
  const { hero, side, tiles } = layout
  return (
    <InView
      as="section"
      aria-label="Ringkasan utama"
      className="hero-glow grid items-center gap-8 overflow-hidden rounded-[28px] p-6 text-white sm:p-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      style={{ '--hero-accent': accent } as CSSProperties}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <span className="anim-fade-up text-xs font-semibold uppercase tracking-[0.08em] text-[#9fc2e3]">{hero.label}</span>
        <AnimatedNumber
          value={hero.value}
          format={hero.format}
          className="font-display text-6xl font-extrabold leading-none tracking-tight sm:text-7xl lg:text-8xl"
        />
        {hero.story && (
          <p className="anim-fade-up max-w-xl text-base leading-relaxed text-[#cfe2f2] sm:text-lg" style={{ '--i': 2 } as CSSProperties}>
            <RichText text={hero.story} strongClass="font-semibold text-white" />
          </p>
        )}
        {tiles.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {tiles.map((m, i) => (
              <div
                key={m.label}
                className="anim-fade-up rounded-2xl bg-accent-mid/90 px-4 py-3.5"
                style={{ '--i': i + 3 } as CSSProperties}
              >
                <AnimatedNumber value={m.value} format={m.format} className="font-display text-2xl font-bold" />
                <p className="text-[13px] leading-snug text-[#b7d0e8]">{m.label}</p>
                {m.trend && <p className="mt-0.5 text-xs font-semibold" style={{ color: accent }}>{m.trend.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {side.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-end">
          {side.map((m, i) => (
            <SideMetric key={m.label} metric={m} accent={accent} big={i === 0} />
          ))}
        </div>
      )}
    </InView>
  )
}

function SideMetric({ metric, accent, big }: { metric: Metric; accent: string; big: boolean }) {
  const label = `${metric.label}: ${metric.hint ?? ''}`
  if (metric.progress === undefined) {
    return (
      <div className="anim-pop rounded-2xl bg-accent-mid/90 px-5 py-4 text-center">
        <AnimatedNumber value={metric.value} format={metric.format} className="font-display text-3xl font-bold" />
        <p className="text-[13px] text-[#b7d0e8]">{metric.label}</p>
      </div>
    )
  }
  // Di dalam lingkaran selalu persen (muat); nilai lain (Rp7,85 M) jadi keterangan.
  const isPercent = metric.format === 'percent' || metric.format === 'progress'
  const inner = (
    <>
      <AnimatedNumber
        value={isPercent ? metric.value : metric.progress}
        format="percent"
        className={`font-display font-extrabold ${big ? 'text-4xl' : 'text-2xl'}`}
      />
      <span className="max-w-[120px] text-xs leading-tight text-[#b7d0e8]">{metric.label}</span>
    </>
  )
  return (
    <figure className="m-0 flex flex-col items-center gap-2">
      {metric.display === 'gauge' ? (
        <Gauge value={metric.progress} width={big ? 230 : 170} color={accent} track="rgba(255,255,255,0.14)" label={label}>
          {inner}
        </Gauge>
      ) : (
        <Ring value={metric.progress} size={big ? 190 : 140} color={accent} track="rgba(255,255,255,0.14)" label={label}>
          {inner}
        </Ring>
      )}
      <figcaption className="max-w-[240px] text-center text-sm text-[#cfe2f2]">
        {!isPercent && (
          <AnimatedNumber value={metric.value} format={metric.format} className="block font-display text-lg font-bold text-white" />
        )}
        {metric.hint}
      </figcaption>
    </figure>
  )
}

const INSIGHT_STYLE: Record<Tone, { box: string; icon: string; strong: string }> = {
  critical: { box: 'border-crit/25', icon: 'bg-crit-soft text-crit', strong: 'font-semibold text-crit' },
  warning: { box: 'border-warn/30', icon: 'bg-warn-soft text-warn', strong: 'font-semibold text-[#8a6212]' },
  ok: { box: 'border-good/25', icon: 'bg-good-soft text-good', strong: 'font-semibold text-good' },
  info: { box: 'border-line-soft', icon: 'bg-accent-soft text-accent', strong: 'font-semibold text-accent-deep' },
  neutral: { box: 'border-line-soft', icon: 'bg-surface-soft text-ink-soft', strong: 'font-semibold text-accent-deep' },
}

/** Kartu "Sorotan": kalimat bermakna dari data, muncul bergiliran. */
export function InsightCards({ insights, auto }: { insights: Insight[]; auto: boolean }) {
  return (
    <InView as="section" aria-labelledby="sorotan" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="sorotan" className="font-display text-lg font-bold text-ink">
          Sorotan
        </h2>
        {auto && <span className="text-xs text-ink-faint">disusun otomatis dari data</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((item, i) => {
          const style = INSIGHT_STYLE[item.tone] ?? INSIGHT_STYLE.neutral
          const Icon = item.icon ? INSIGHT_ICONS[item.icon] : InfoIcon
          return (
            <article
              key={i}
              className={`anim-fade-up flex gap-3.5 rounded-[20px] border bg-surface p-4 sm:p-5 ${style.box}`}
              style={{ '--i': i } as CSSProperties}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
                <Icon size={21} />
              </span>
              <p className="text-[15px] leading-relaxed text-ink/85">
                <RichText text={item.text} strongClass={style.strong} />
              </p>
            </article>
          )
        })}
      </div>
    </InView>
  )
}

const BANNER: Record<Tone, { box: string; dot: string; title: string; text: string; link: string }> = {
  critical: { box: 'border-crit/25 bg-crit-soft', dot: 'bg-crit text-crit', title: 'text-[#7d2323]', text: 'text-[#8e4141]', link: 'text-crit' },
  warning: { box: 'border-warn/30 bg-[#fff7e8]', dot: 'bg-warn text-warn', title: 'text-[#3d2a06]', text: 'text-[#6e5523]', link: 'text-[#7a5a14]' },
  info: { box: 'border-accent/20 bg-accent-soft', dot: 'bg-accent text-accent', title: 'text-accent-deep', text: 'text-ink-soft', link: 'text-accent' },
  ok: { box: 'border-good/25 bg-good-soft', dot: 'bg-good text-good', title: 'text-[#17694a]', text: 'text-ink-soft', link: 'text-good' },
  neutral: { box: 'border-line-soft bg-surface', dot: 'bg-ink-faint text-ink-faint', title: 'text-ink', text: 'text-ink-soft', link: 'text-accent' },
}

/** Banner "Perlu perhatian"; yang kritis punya titik berdenyut. */
export function AttentionBanners({ items, onOpen }: { items: AttentionItem[]; onOpen: (path: string) => void }) {
  return (
    <InView as="section" aria-label="Perlu perhatian" className="grid gap-3 md:grid-cols-2">
      {items.map((item, i) => {
        const style = BANNER[item.tone] ?? BANNER.neutral
        return (
          <div
            key={i}
            role="note"
            className={`anim-fade-up flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] border px-4 py-3.5 sm:px-5 ${style.box} ${items.length === 1 ? 'md:col-span-2' : ''}`}
            style={{ '--i': i } as CSSProperties}
          >
            <span className={`relative h-2.5 w-2.5 shrink-0 rounded-full ${style.dot} ${item.tone === 'critical' ? 'live-dot' : ''}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-bold ${style.title}`}>{item.title}</p>
              {item.description && <p className={`text-sm ${style.text}`}>{item.description}</p>}
            </div>
            {item.link && (
              <button
                type="button"
                onClick={() => onOpen(item.link!)}
                className={`min-h-11 text-sm font-semibold hover:underline ${style.link}`}
              >
                {item.link_label ?? 'Lihat di aplikasi'} →
              </button>
            )}
          </div>
        )
      })}
    </InView>
  )
}
