import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import LogoMark from '../components/LogoMark'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setSubmitting(true)

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      await refresh()
      navigate('/', { replace: true })
    } catch {
      setError('Gagal mengganti password. Periksa password lama Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-sm">
        <LogoMark size="md" className="mx-auto mb-6" />
        <h2 className="text-center font-display text-xl font-bold text-ink">Ganti Password</h2>
        <p className="mt-1 text-center text-sm text-ink-soft">
          Untuk keamanan, ganti password default Anda sebelum melanjutkan.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="tap-scale mt-1.5 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Menyimpan…' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
