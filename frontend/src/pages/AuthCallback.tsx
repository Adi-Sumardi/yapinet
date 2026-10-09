import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()

  useEffect(() => {
    const token = params.get('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setToken(token)
    void refresh().then(() => navigate('/', { replace: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-ink-soft">
      Menyelesaikan proses masuk…
    </div>
  )
}
