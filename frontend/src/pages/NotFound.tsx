import { Link } from 'react-router-dom'
import { usePageTitle } from '../context/SettingsContext'

export default function NotFound() {
  usePageTitle('Tidak ditemukan')
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-accent/20">404</p>
      <h1 className="mt-2 font-display text-xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        Menu ini mungkin sudah dihapus, dinonaktifkan, atau kamu belum diberi akses.
      </p>
      <Link to="/" className="tap-scale mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
