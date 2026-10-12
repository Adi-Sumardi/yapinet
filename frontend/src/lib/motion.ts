import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Hook animasi halaman detail (rules/design.md → Animasi): gerak hanya saat
 * elemen terlihat, sekali per tampil, dan mati total bila pengguna memilih
 * "kurangi gerak" di perangkatnya.
 */

const REDUCED = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED).matches
}

/** true setelah elemen pertama kali masuk layar (tidak kembali false). */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => prefersReducedMotion() || typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (inView || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView])

  return [ref, inView]
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Angka yang menghitung dari nilai sebelumnya (0 saat pertama) ke `target`.
 * Saat filter berganti, angka bergerak dari nilai lama ke nilai baru.
 */
export function useCountUp(target: number, active: boolean, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const from = useRef(value)

  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion() || !Number.isFinite(target)) {
      from.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const current = begin + (target - begin) * easeOutCubic(t)
      from.current = current
      setValue(current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return value
}
