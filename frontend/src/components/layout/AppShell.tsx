import type { ReactNode } from 'react'
import { useSettings } from '../../context/SettingsContext'
import TopBar from './TopBar'

/** Kerangka halaman user: TopBar + konten + footer branding. */
export default function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const footer = useSettings()['branding.footer_text']
  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <TopBar />
      <main className={`mx-auto w-full flex-1 px-4 pb-16 pt-8 sm:px-6 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {children}
      </main>
      {footer && <footer className="pb-8 text-center text-xs text-ink-faint">{footer}</footer>}
    </div>
  )
}
