import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const isAuthed = localStorage.getItem('slpAdminAuthenticated') === 'true'

  if (!isAuthed) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
