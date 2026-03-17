export default function ProfileGrid({ pathologists }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
        Meet Our Team
      </p>
      <h2 className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl">
        Speech-language pathologists
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {pathologists.map((provider) => (
          <article
            key={provider.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <img
              src={provider.image}
              alt={`Portrait of ${provider.name}`}
              className="h-48 w-full object-cover"
            />
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-semibold text-slate-900">{provider.name}</h3>
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
                Specialty: {provider.specialty}
              </p>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Qualifications: {provider.qualifications}
              </p>
              <p className="text-sm leading-6 text-slate-600">{provider.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
