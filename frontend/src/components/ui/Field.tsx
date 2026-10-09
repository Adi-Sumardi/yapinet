import { useId, type ComponentProps, type ReactNode } from 'react'

/** Label di atas, hint/error di bawah (rules/components.md → Form). */
function FieldShell({
  id,
  label,
  hint,
  error,
  children,
  className = '',
}: {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-soft">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-crit">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  )
}

const control =
  'w-full rounded-xl border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:ring-2 disabled:bg-surface-soft disabled:text-ink-soft'
const ok = 'border-line focus:border-accent focus:ring-accent/20'
const bad = 'border-crit focus:border-crit focus:ring-crit/20'

type Common = { label?: ReactNode; hint?: ReactNode; error?: string; wrapperClassName?: string }

export function Input({
  label,
  hint,
  error,
  wrapperClassName,
  className = '',
  id,
  ...props
}: ComponentProps<'input'> & Common) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        id={inputId}
        aria-invalid={!!error}
        className={`${control} h-11 ${error ? bad : ok} ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export function Textarea({
  label,
  hint,
  error,
  wrapperClassName,
  className = '',
  id,
  ...props
}: ComponentProps<'textarea'> & Common) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        id={inputId}
        aria-invalid={!!error}
        rows={3}
        className={`${control} py-2.5 ${error ? bad : ok} ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export function Select({
  label,
  hint,
  error,
  wrapperClassName,
  className = '',
  id,
  options,
  ...props
}: ComponentProps<'select'> & Common & { options: { value: string; label: string }[] }) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={inputId}
        aria-invalid={!!error}
        className={`${control} h-11 ${error ? bad : ok} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${checked ? 'bg-accent' : 'bg-line'}`}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}
