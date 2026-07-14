import type { ReactNode } from 'react'
import LogoMark from './LogoMark'

export default function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line-soft bg-surface px-5">
      <div className="flex items-center gap-3">
        <LogoMark size="sm" />
        <span className="font-display text-base font-bold uppercase text-accent-deep">Yapinet</span>
      </div>
      {right}
    </header>
  )
}
