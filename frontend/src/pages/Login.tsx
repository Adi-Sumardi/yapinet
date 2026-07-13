import { googleLoginUrl } from '../lib/api'

export default function Login() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-paper">
          Y
        </div>
        <h1 className="text-2xl font-semibold text-ink">Yapinet</h1>
        <p className="max-w-xs text-sm text-ink-soft">
          Portal pengawasan lintas unit untuk BPH, Pembina, dan Pengawas Yayasan.
        </p>
      </div>

      <a
        href={googleLoginUrl()}
        className="flex items-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:shadow-md"
      >
        <GoogleIcon />
        Masuk dengan Google
      </a>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}
