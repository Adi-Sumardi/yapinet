import { useEffect, type RefObject } from 'react'

/** Fokus terkunci di dalam dialog, Esc menutup, scroll halaman dikunci (rules/design.md → Aksesibilitas). */
export function useDialogA11y(
  ref: RefObject<HTMLElement | null>,
  { onEscape, initialFocus }: { onEscape: () => void; initialFocus?: RefObject<HTMLElement | null> },
) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ;(initialFocus?.current ?? ref.current)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return

      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
