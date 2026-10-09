import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertIcon, InfoIcon, TrashIcon } from '../icons'
import Button from './Button'
import { useDialogA11y } from './useDialogA11y'

/**
 * Dialog konfirmasi Yapinet — pengganti window.confirm (rules/design.md →
 * "Notifikasi & Konfirmasi"). Pakai: `if (await confirm({...})) ...`, atau
 * berikan `onConfirm` agar dialog menampilkan spinner sampai aksi selesai.
 */

type Tone = 'danger' | 'warning' | 'default'

export type ConfirmOptions = {
  title: ReactNode
  description?: ReactNode
  tone?: Tone
  confirmLabel?: string
  cancelLabel?: string
  /** Wajib mengetik teks ini (mis. "HAPUS") sebelum tombol aktif — untuk aksi permanen. */
  requireText?: string
  icon?: ReactNode
  onConfirm?: () => Promise<unknown> | unknown
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

const TONE: Record<
  Tone,
  { color: string; soft: string; pulse: string; icon: ReactNode; button: 'danger' | 'warning' | 'primary' }
> = {
  danger: {
    color: 'var(--color-crit)',
    soft: 'var(--color-crit-soft)',
    pulse: 'rgba(214,69,69,0.35)',
    icon: <TrashIcon size={24} />,
    button: 'danger',
  },
  warning: {
    color: 'var(--color-warn)',
    soft: 'var(--color-warn-soft)',
    pulse: 'rgba(179,129,31,0.35)',
    icon: <AlertIcon size={24} />,
    button: 'warning',
  },
  default: {
    color: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
    pulse: 'rgba(46,109,164,0.35)',
    icon: <InfoIcon size={24} />,
    button: 'primary',
  },
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setState({ options, resolve })),
    [],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          options={state.options}
          onClose={(ok) => {
            state.resolve(ok)
            setState(null)
          }}
        />
      )}
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const tone = TONE[options.tone ?? 'default']
  const [typed, setTyped] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const cancel = () => {
    if (!running) onClose(false)
  }

  useDialogA11y(panelRef, { onEscape: cancel, initialFocus: cancelRef })

  const blocked = options.requireText !== undefined && typed.trim().toUpperCase() !== options.requireText.toUpperCase()

  const accept = async () => {
    if (blocked) return
    if (!options.onConfirm) return onClose(true)

    setRunning(true)
    setError(null)
    try {
      await options.onConfirm()
      onClose(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
      setRunning(false)
    }
  }

  return (
    <div
      className="overlay-in fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 backdrop-blur-[4px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && cancel()}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        className="dialog-in w-full rounded-t-3xl bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_rgba(15,42,82,0.18)] outline-none sm:max-w-md sm:rounded-3xl sm:pb-6 sm:pt-7"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div
          className="soft-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: tone.soft, color: tone.color, ['--pulse-color' as string]: tone.pulse }}
        >
          {options.icon ?? tone.icon}
        </div>

        <h2 id="confirm-title" className="mt-4 text-center font-display text-lg font-bold text-ink">
          {options.title}
        </h2>
        {options.description && (
          <div className="mt-2 text-center text-sm leading-relaxed text-ink-soft">{options.description}</div>
        )}

        {options.requireText && (
          <label className="mt-5 block">
            <span className="text-xs font-semibold text-ink-soft">
              Ketik <span className="font-bold text-ink">{options.requireText}</span> untuk melanjutkan
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void accept()}
              autoComplete="off"
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-center text-sm font-semibold uppercase tracking-widest text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-crit-soft px-3.5 py-2.5 text-center text-[13px] text-crit">{error}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Button ref={cancelRef} variant="secondary" onClick={cancel} disabled={running}>
            {options.cancelLabel ?? 'Batal'}
          </Button>
          <Button variant={tone.button} onClick={() => void accept()} loading={running} disabled={blocked}>
            {options.confirmLabel ?? 'Ya, lanjutkan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>')
  return ctx
}
