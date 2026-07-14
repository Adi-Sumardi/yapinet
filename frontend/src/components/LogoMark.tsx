const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-10 w-10 rounded-xl p-1',
  md: 'h-14 w-14 rounded-2xl p-1.5',
  lg: 'h-24 w-24 rounded-[22px] p-1.5',
}

export default function LogoMark({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-[0_4px_12px_rgba(26,61,110,0.2)] ${SIZE_CLASS[size]} ${className}`}
    >
      <img src="/logo.png" alt="Yapinet" className="h-full w-full rounded-[inherit] object-cover" />
    </div>
  )
}
