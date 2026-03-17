import React, { useEffect, useState } from 'react'
import type { Class, Note } from '../types'
import NoteEditor from '../components/NoteEditor'
import SummaryPanel from '../components/SummaryPanel'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'
import type { SearchResult } from '../types'

interface ClassPageProps {
  cls: Class
  onNavigateToNote: (noteId: number, classId: number) => void
  initialNoteId?: number | null
}

export default function ClassPage({ cls, onNavigateToNote, initialNoteId = null }: ClassPageProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [scopedQuery, setScopedQuery] = useState('')
  const [scopedResults, setScopedResults] = useState<SearchResult[]>([])
  const [scopedLoading, setScopedLoading] = useState(false)

  useEffect(() => {
    window.api.listNotes(cls.id).then((loaded) => {
      setNotes(loaded)
      if (initialNoteId) {
        const match = loaded.find((n) => n.id === initialNoteId)
        setSelectedNote(match ?? null)
        return
      }
      setSelectedNote(null)
    })
  }, [cls.id, initialNoteId])

  const handleCreateNote = async () => {
    const note = await window.api.createNote({ classId: cls.id, title: 'Untitled' })
    setNotes((prev) => [note, ...prev])
    setSelectedNote(note)
  }

  const handleUpdateNote = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setSelectedNote(updated)
  }

  const handleDeleteNote = async (noteId: number) => {
    await window.api.deleteNote(noteId)
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    setSelectedNote(null)
  }

  const handleScopedSearch = async (query: string) => {
    setScopedQuery(query)
    if (!query.trim()) { setScopedResults([]); return }
    setScopedLoading(true)
    const results = await window.api.searchNotes(query, cls.id)
    setScopedLoading(false)
    setScopedResults(Array.isArray(results) ? results : [])
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Note list panel */}
      <div className="w-56 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Class header */}
        <div className="px-4 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cls.color }}
            />
            <h2 className="text-sm font-semibold text-gray-800 truncate">
              {cls.icon} {cls.name}
            </h2>
          </div>
          <button
            onClick={handleCreateNote}
            className="mt-2 w-full text-xs px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            + New Note
          </button>
        </div>

        {/* Scoped search */}
        <div className="px-3 py-2 border-b border-gray-200 relative">
          <SearchBar
            query={scopedQuery}
            isLoading={scopedLoading}
            onSearch={handleScopedSearch}
            onClear={() => { setScopedQuery(''); setScopedResults([]) }}
          />
          {scopedResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mx-3">
              <SearchResults
                results={scopedResults}
                query={scopedQuery}
                onSelect={(r) => {
                  setScopedResults([])
                  setScopedQuery('')
                  onNavigateToNote(r.noteId, r.classId)
                }}
                onClose={() => { setScopedResults([]); setScopedQuery('') }}
              />
            </div>
          )}
        </div>

        {/* Notes list */}
        <ul className="flex-1 overflow-y-auto py-1">
          {notes.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400 italic">No notes yet.</li>
          )}
          {notes.map((note) => (
            <li
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`px-4 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedNote?.id === note.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              <p className="text-sm text-gray-800 truncate">{note.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
          />
        ) : (
          /* Class overview with class-level summary */
          <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl">{cls.icon}</span>
                <h1 className="text-3xl font-bold text-gray-900">{cls.name}</h1>
              </div>
              <p className="text-sm text-gray-400 mb-8">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>

              <SummaryPanel
                classId={cls.id}
                label="Summarize All Notes"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
