export default function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="tablist" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
            value === item.value
              ? 'bg-accent text-white shadow-[0_4px_12px_rgba(46,109,164,0.25)]'
              : 'text-ink-soft hover:bg-surface-soft hover:text-ink'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
