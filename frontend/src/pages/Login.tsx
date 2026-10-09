import { Navigate, useSearchParams } from 'react-router-dom'
import { googleLoginUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { usePageTitle, useSettings } from '../context/SettingsContext'
import LogoMark from '../components/layout/LogoMark'
import HeroPattern from '../components/layout/HeroPattern'
import { AlertIcon } from '../components/icons'

const LOGIN_ERRORS: Record<string, string> = {
  not_registered: 'Email Google Anda belum terdaftar. Minta Admin Yayasan menambahkan email Anda.',
  suspended: 'Akun Anda dinonaktifkan. Hubungi Admin Yayasan.',
  google_failed: 'Gagal masuk dengan Google. Silakan coba lagi.',
}

export default function Login() {
  usePageTitle('Masuk')
  const settings = useSettings()
  const { isAuthenticated } = useAuth()
  const [params] = useSearchParams()
  const errorCode = params.get('error')
  const error = errorCode ? (LOGIN_ERRORS[errorCode] ?? LOGIN_ERRORS.google_failed) : null

  if (isAuthenticated) return <Navigate to="/" replace />

  const contact = settings['contact.admin_whatsapp'] || settings['contact.admin_email']

  return (
    <div className="flex min-h-svh flex-col bg-surface md:flex-row">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-accent-deep via-accent-mid to-accent px-8 py-16 text-center text-white md:flex-[1.1] md:px-14">
        <HeroPattern />
        <div className="relative z-10 max-w-sm">
          <LogoMark size="lg" className="mx-auto mb-7" />
          <h1 className="font-display text-2xl font-bold leading-snug md:text-3xl">{settings['login.headline']}</h1>
          {settings['login.subtitle'] && (
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/75">{settings['login.subtitle']}</p>
          )}
        </div>
        {settings['branding.footer_text'] && (
          <p className="absolute bottom-8 text-[11px] text-white/50">{settings['branding.footer_text']}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-xl font-bold text-ink">Masuk ke {settings['branding.app_name']}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Masuk dengan akun Google yang sudah didaftarkan oleh Admin Yayasan.
          </p>

          {error && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-crit-soft p-4 text-sm text-crit" role="alert">
              <AlertIcon className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <a
            href={googleLoginUrl()}
            className="tap-scale mt-7 flex items-center justify-center gap-3 rounded-xl border border-line bg-surface px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <GoogleIcon />
            <span className="text-sm font-semibold text-ink">Masuk dengan Google</span>
          </a>

          {settings['login.help_text'] && (
            <p className="mt-7 text-center text-xs text-ink-faint">{settings['login.help_text']}</p>
          )}
          {contact && <p className="mt-1 text-center text-xs font-semibold text-ink-soft">{contact}</p>}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}
