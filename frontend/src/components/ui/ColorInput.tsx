import type { ReactNode } from 'react'

const PRESETS = [
  '#3E7CB1',
  '#4CAF7D',
  '#2FA8B0',
  '#9C5FC0',
  '#1C1C1E',
  '#5C6BC0',
  '#E0A527',
  '#1F6FA6',
  '#6D4E9C',
  '#D9534F',
  '#2E8B57',
  '#E8743B',
]

export default function ColorInput({
  label,
  value,
  onChange,
  error,
}: {
  label?: ReactNode
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-semibold text-ink-soft">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Pilih warna ${color}`}
            onClick={() => onChange(color)}
            className={`tap-scale h-8 w-8 rounded-full ring-offset-2 transition ${value.toUpperCase() === color ? 'ring-2 ring-ink' : 'hover:scale-110'}`}
            style={{ background: color }}
          />
        ))}
        <label className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface pl-1.5 pr-3">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#2E6DA4'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-6 w-6 cursor-pointer rounded-md border-0 bg-transparent p-0"
            aria-label="Warna custom"
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 bg-transparent text-xs font-semibold uppercase text-ink focus:outline-none"
            maxLength={7}
          />
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-crit">{error}</p>}
    </div>
  )
}
