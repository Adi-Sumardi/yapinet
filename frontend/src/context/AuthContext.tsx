import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, clearToken, getToken, type Me } from '../lib/api'

type AuthState = {
  me: Me | null
  loading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const refresh = async () => {
    if (!getToken()) {
      setMe(null)
      setLoading(false)
      return
    }

    try {
      const data = await api.me()
      setMe(data)
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      clearToken()
      setMe(null)
      // Jangan tinggalkan data user sebelumnya di cache (menu, admin, dll).
      queryClient.clear()
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <AuthContext.Provider value={{ me, loading, isAuthenticated: !!me, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
