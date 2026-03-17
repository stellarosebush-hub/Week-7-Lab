import React, { useEffect, useState } from 'react'

type SummaryState = 'idle' | 'loading' | 'done' | 'error'

interface SummaryPanelProps {
  noteId?: number
  classId?: number
  label?: string
}

interface SummaryData {
  summaryText: string
  generatedAt: string
  modelUsed: string
}

export default function SummaryPanel({ noteId, classId, label = 'Summarize' }: SummaryPanelProps) {
  const [state, setState] = useState<SummaryState>('idle')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [open, setOpen] = useState(false)

  // Restore cached summary on mount
  useEffect(() => {
    if (noteId !== undefined) {
      window.api.getNoteSummary(noteId).then((res) => {
        if (res) { setSummary(res); setState('done'); setOpen(true) }
      })
    } else if (classId !== undefined) {
      window.api.getClassSummary(classId).then((res) => {
        if (res) { setSummary(res); setState('done'); setOpen(true) }
      })
    }
  }, [noteId, classId])

  const handleSummarize = async () => {
    setState('loading')
    setErrorMsg('')
    setOpen(true)

    let res
    if (noteId !== undefined) {
      res = await window.api.summarizeNote(noteId)
    } else if (classId !== undefined) {
      res = await window.api.summarizeClass(classId)
    } else {
      return
    }

    if ('error' in res) {
      setState('error')
      setErrorMsg(res.error.message)
    } else {
      setSummary(res)
      setState('done')
    }
  }

  // Parse bullet points from the summary text
  const bullets: string[] = summary
    ? summary.summaryText
        .split('\n')
        .map((l) => l.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)
    : []

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header / toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <button
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-base">{open ? '▾' : '▸'}</span>
          ✦ AI Summary
        </button>

        {state !== 'loading' && (
          <button
            onClick={handleSummarize}
            className="text-xs px-2.5 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {state === 'done' ? 'Regenerate' : label}
          </button>
        )}
      </div>

      {/* Body */}
      {open && (
        <div className="px-4 py-3">
          {state === 'idle' && (
            <p className="text-sm text-gray-400 italic">
              Click &ldquo;{label}&rdquo; to generate an AI summary of this note.
            </p>
          )}

          {state === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-spin text-base">◌</span>
              Generating summary…
            </div>
          )}

          {state === 'done' && summary && (
            <>
              <ul className="space-y-1.5 mb-3">
                {bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400">
                Generated {new Date(summary.generatedAt).toLocaleString()} · {summary.modelUsed}
              </p>
            </>
          )}

          {state === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="font-medium mb-1">Could not generate summary</p>
              <p className="text-xs">{errorMsg}</p>
              {errorMsg.includes('Ollama') && (
                <p className="text-xs mt-1">
                  Make sure Ollama is running:{' '}
                  <code className="bg-red-100 px-1 rounded font-mono">ollama serve</code>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
