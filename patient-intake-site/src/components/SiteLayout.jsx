import { Link, Outlet, useLocation } from 'react-router-dom'

const navLinkClass = (active) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    active
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function SiteLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
            Harbor Speech Intake
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className={navLinkClass(location.pathname === '/')}>
              Intake
            </Link>
            <Link
              to="/admin/login"
              className={navLinkClass(location.pathname.startsWith('/admin'))}
            >
              Staff
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
