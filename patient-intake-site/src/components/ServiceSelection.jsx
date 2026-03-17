import { serviceOptions } from '../data/pathologists'

export default function ServiceSelection({ selectedService, onSelect }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Step 1
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Select the service you need
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {serviceOptions.map((service) => {
          const isSelected = selectedService === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              className={`group rounded-2xl border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isSelected
                  ? 'border-teal-700 bg-teal-700 text-white ring-teal-700'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50 ring-teal-500'
              }`}
            >
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p
                className={`mt-2 text-sm ${
                  isSelected ? 'text-teal-50' : 'text-slate-600'
                }`}
              >
                {service.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {selectedService
            ? `Selected service: ${selectedService}`
            : 'Choose one option to continue.'}
        </p>
        <button
          type="button"
          disabled={!selectedService}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Next
        </button>
      </div>
    </section>
  )
}
