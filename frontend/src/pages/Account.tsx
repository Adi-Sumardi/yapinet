import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../context/SettingsContext'
import { useMenu } from '../features/menu/useMenu'
import MenuIcon from '../features/menu/MenuIcon'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { LogoutIcon } from '../components/icons'

export default function Account() {
  usePageTitle('Akun saya')
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const { data } = useMenu()
  const initials = me?.user.full_name.trim().charAt(0).toUpperCase() ?? 'U'

  return (
    <AppShell>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Akun saya</h1>

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-lg font-bold text-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-ink">{me?.user.full_name}</p>
            <p className="truncate text-sm text-ink-soft">{me?.user.primary_email}</p>
          </div>
          <div className="ml-auto">
            <Badge tone={me?.user.is_admin ? 'info' : 'neutral'}>{me?.user.is_admin ? 'Admin' : 'User'}</Badge>
          </div>
        </div>
      </Card>

      <Card title="Aplikasi yang bisa kamu akses" className="mt-5">
        <div className="flex flex-wrap gap-3">
          {data?.data.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 rounded-xl bg-surface-soft py-1.5 pl-1.5 pr-3.5">
              <MenuIcon icon={item.icon} color={item.color} size="sm" />
              <span className="text-sm font-semibold text-ink">{item.name}</span>
            </div>
          ))}
          {data && data.data.length === 0 && <p className="text-sm text-ink-soft">Belum ada aplikasi.</p>}
        </div>
      </Card>

      <Button
        variant="secondary"
        className="mt-6 w-full text-crit"
        icon={<LogoutIcon size={16} />}
        onClick={() => void logout().then(() => navigate('/login', { replace: true }))}
      >
        Keluar
      </Button>
    </AppShell>
  )
}
