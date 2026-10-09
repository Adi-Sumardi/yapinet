import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { SpinnerIcon } from './components/icons'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import AppDetail from './pages/AppDetail'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import AppsPage from './pages/admin/AppsPage'
import AppEditPage from './pages/admin/AppEditPage'
import UsersPage from './pages/admin/UsersPage'
import UserEditPage from './pages/admin/UserEditPage'
import SettingsPage from './pages/admin/SettingsPage'
import AuditLogPage from './pages/admin/AuditLogPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401/403/404/422 tidak akan berubah dengan diulang.
      retry: (count, error) => count < 2 && !('status' in error && [401, 403, 404, 422].includes(Number(error.status))),
    },
  },
})

function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <SpinnerIcon size={24} className="text-accent" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!me) return <Navigate to="/login" replace />
  if (!me.user.is_admin) return <Navigate to="/" replace />
  return <>{children}</>
}

const admin = (page: ReactNode) => <RequireAdmin>{page}</RequireAdmin>
const user = (page: ReactNode) => <RequireAuth>{page}</RequireAuth>

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  <Route path="/" element={user(<Dashboard />)} />
                  <Route path="/akun" element={user(<Account />)} />
                  <Route path="/settings" element={<Navigate to="/akun" replace />} />

                  <Route path="/admin" element={<Navigate to="/admin/menu" replace />} />
                  <Route path="/admin/menu" element={admin(<AppsPage />)} />
                  <Route path="/admin/menu/baru" element={admin(<AppEditPage />)} />
                  <Route path="/admin/menu/:id" element={admin(<AppEditPage />)} />
                  <Route path="/admin/pengguna" element={admin(<UsersPage />)} />
                  <Route path="/admin/pengguna/:id" element={admin(<UserEditPage />)} />
                  <Route path="/admin/pengaturan" element={admin(<SettingsPage />)} />
                  <Route path="/admin/log" element={admin(<AuditLogPage />)} />
                  <Route path="/admin/*" element={<NotFound />} />

                  {/* Slug menu dinamis — harus paling akhir sebelum 404. */}
                  <Route path="/:slug" element={user(<AppDetail />)} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
