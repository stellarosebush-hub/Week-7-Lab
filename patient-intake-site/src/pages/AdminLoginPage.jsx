import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO_PASSWORD = 'Office1234'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()

    if (password === DEMO_PASSWORD) {
      localStorage.setItem('slpAdminAuthenticated', 'true')
      navigate('/admin/editor')
      return
    }

    setError('Incorrect password. Please try again.')
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-6 py-10 sm:px-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Staff Access
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Admin profile editor login
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This section is not for patients. Enter the office password to edit
          pathologist profiles.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            required
          />

          {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

          <button
            type="submit"
            className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Enter editor
          </button>
        </form>

        <p className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Demo note: this password gate is for prototype use only and must be
          replaced with secure authentication before production.
        </p>
      </div>
    </main>
  )
}
