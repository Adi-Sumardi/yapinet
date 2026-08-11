import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import LogoMark from '../components/LogoMark'
import HeroPattern from '../components/HeroPattern'

export default function Login() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { token, must_change_password } = await api.login(email, password)
      setToken(token)
      await refresh()
      navigate(must_change_password ? '/ganti-password' : '/', { replace: true })
    } catch {
      setError('Email atau password salah.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-surface md:flex-row">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-accent-deep via-accent-mid to-accent px-8 py-16 text-center text-white md:flex-[1.1] md:px-14">
        <HeroPattern />
        <div className="relative z-10 max-w-sm">
          <LogoMark size="lg" className="mx-auto mb-7" />
          <h1 className="font-display text-2xl font-bold leading-snug md:text-3xl">
            Satu Aplikasi, Semua Layanan Yayasan
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            Yapinet menghubungkan akademik, keuangan, SDM, dan operasional dalam satu ekosistem super app.
          </p>
        </div>
        <p className="absolute bottom-8 text-[11px] text-white/50">© 2026 Yayasan — Yapinet</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-xl font-bold text-ink">Masuk ke Yapinet</h2>
          <p className="mt-1 text-sm text-ink-soft">Gunakan email dan password akun Yapinet Anda.</p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
                placeholder="nama@yayasan.id"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="tap-scale mt-1.5 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-ink-faint">Butuh bantuan akses? Hubungi Admin Yayasan.</p>
        </div>
      </div>
    </div>
  )
}
