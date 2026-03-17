import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialPathologists } from '../data/pathologists'

function loadProfiles() {
  const saved = localStorage.getItem('slpPathologistProfiles')

  if (!saved) {
    return initialPathologists
  }

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPathologists
  } catch {
    return initialPathologists
  }
}

export default function AdminEditorPage() {
  const [profiles, setProfiles] = useState(loadProfiles)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const canSave = useMemo(
    () =>
      profiles.every(
        (p) =>
          p.name.trim() && p.specialty.trim() && p.qualifications.trim() && p.bio.trim(),
      ),
    [profiles],
  )

  const handleChange = (id, field, value) => {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === id ? { ...profile, [field]: value } : profile,
      ),
    )
    setStatus('')
  }

  const handleSave = () => {
    localStorage.setItem('slpPathologistProfiles', JSON.stringify(profiles))
    setStatus('Profiles saved.')
  }

  const handleLogout = () => {
    localStorage.removeItem('slpAdminAuthenticated')
    navigate('/admin/login')
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Protected Area
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Edit pathologist profiles
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Log out
        </button>
      </div>

      <div className="space-y-6">
        {profiles.map((profile) => (
          <section
            key={profile.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">Profile {profile.id}</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input
                  value={profile.name}
                  onChange={(event) =>
                    handleChange(profile.id, 'name', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Specialty
                <input
                  value={profile.specialty}
                  onChange={(event) =>
                    handleChange(profile.id, 'specialty', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Qualifications
                <input
                  value={profile.qualifications}
                  onChange={(event) =>
                    handleChange(profile.id, 'qualifications', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Bio
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(event) =>
                    handleChange(profile.id, 'bio', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </label>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Save changes
        </button>
        {status && <p className="text-sm font-medium text-teal-700">{status}</p>}
      </div>
    </main>
  )
}
