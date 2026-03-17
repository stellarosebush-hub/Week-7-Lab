import { useState } from 'react'
import ProfileGrid from '../components/ProfileGrid'
import ServiceSelection from '../components/ServiceSelection'
import { initialPathologists } from '../data/pathologists'

const defaultService = ''

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

export default function HomePage() {
  const [selectedService, setSelectedService] = useState(defaultService)
  const [pathologists] = useState(loadProfiles)

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,#ccfbf1_0,#f8fafc_42%,#ffffff_90%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-10 pt-14 sm:px-8 md:pt-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
              Patient Intake
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Start care with clarity and confidence
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Follow a short intake flow, choose your service path, and review our
              pathologist team by specialty and qualifications.
            </p>
          </div>
        </div>
      </section>

      <ServiceSelection
        selectedService={selectedService}
        onSelect={setSelectedService}
      />

      <ProfileGrid pathologists={pathologists} />
    </main>
  )
}
