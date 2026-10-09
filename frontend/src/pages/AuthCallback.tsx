import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { SpinnerIcon } from '../components/icons'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    // Hapus token dari URL segera agar tidak tersimpan di riwayat/screenshot (rules/security.md §1).
    window.history.replaceState(null, '', '/auth/callback')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setToken(token)
    void refresh().then(() => navigate('/', { replace: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-sm text-ink-soft">
      <SpinnerIcon size={22} className="text-accent" />
      Menyelesaikan proses masuk…
    </div>
  )
}
