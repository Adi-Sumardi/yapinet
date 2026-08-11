import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import AppDetail from './pages/AppDetail'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

function RequireAuth({ children, allowMustChangePassword = false }: { children: React.ReactNode; allowMustChangePassword?: boolean }) {
  const { isAuthenticated, loading, me } = useAuth()

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-ink-soft">Memuat…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowMustChangePassword && me?.user.must_change_password) {
    return <Navigate to="/ganti-password" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/ganti-password"
              element={
                <RequireAuth allowMustChangePassword>
                  <ChangePassword />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            <Route
              path="/:slug"
              element={
                <RequireAuth>
                  <AppDetail />
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
