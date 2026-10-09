import type { ComponentProps, ReactNode } from 'react'
import { SpinnerIcon } from '../icons'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong shadow-[0_4px_12px_rgba(46,109,164,0.25)]',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-soft',
  ghost: 'text-ink-soft hover:bg-surface-soft hover:text-ink',
  danger: 'bg-crit text-white hover:brightness-95 shadow-[0_4px_12px_rgba(214,69,69,0.28)]',
  warning: 'bg-warn text-white hover:brightness-95 shadow-[0_4px_12px_rgba(179,129,31,0.28)]',
}

const SIZE = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-11 gap-2 rounded-xl px-4.5 text-sm',
}

type Props = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: keyof typeof SIZE
  loading?: boolean
  icon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`tap-scale inline-flex shrink-0 items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {loading ? <SpinnerIcon size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
    </button>
  )
}
