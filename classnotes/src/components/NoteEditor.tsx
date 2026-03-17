import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Note } from '../types'
import SummaryPanel from './SummaryPanel'

interface NoteEditorProps {
  note: Note
  onUpdate: (updated: Note) => void
  onDelete: (noteId: number) => void
}

export default function NoteEditor({ note, onUpdate, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [summaryWidth, setSummaryWidth] = useState(288)
  const [isResizing, setIsResizing] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)

  const MIN_SUMMARY_WIDTH = 240
  const MAX_SUMMARY_WIDTH = 560

  // Sync state when a different note is selected
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id])

  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        const updated = await window.api.updateNote({ id: note.id, title: newTitle, content: newContent })
        onUpdate(updated)
        setSaving(false)
      }, 700)
    },
    [note.id, onUpdate]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setTitle(v)
    scheduleSave(v, content)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setContent(v)
    scheduleSave(title, v)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const layoutEl = layoutRef.current
      if (!layoutEl) return

      const rect = layoutEl.getBoundingClientRect()
      // Summary is anchored on the right side of the editor layout.
      const desiredWidth = rect.right - e.clientX
      const maxAllowedByLayout = Math.max(MIN_SUMMARY_WIDTH, rect.width - 320)
      const clamped = Math.min(
        Math.max(desiredWidth, MIN_SUMMARY_WIDTH),
        Math.min(MAX_SUMMARY_WIDTH, maxAllowedByLayout)
      )

      setSummaryWidth(clamped)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 shrink-0">
        <span className="text-xs text-gray-400">
          {saving ? 'Saving…' : `Last edited ${new Date(note.updated_at).toLocaleString()}`}
        </span>
        <button
          onClick={() => onDelete(note.id)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Delete note
        </button>
      </div>

      <div ref={layoutRef} className="flex flex-1 gap-0 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-y-auto px-8 py-8">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-6 resize-none"
          />

          {/* Body */}
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing…"
            className="flex-1 w-full text-base text-gray-700 placeholder-gray-300 border-none outline-none bg-transparent resize-none leading-relaxed min-h-[400px]"
          />
        </div>

        {/* Drag bar for resizing summary panel */}
        <div
          className={`w-1.5 shrink-0 cursor-col-resize border-l border-transparent transition-colors ${
            isResizing ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizing(true)
          }}
          title="Drag to resize summary"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize summary panel"
        />

        {/* Summary sidebar */}
        <div
          className="shrink-0 overflow-y-auto border-l border-gray-200 px-4 py-6"
          style={{ width: `${summaryWidth}px` }}
        >
          <SummaryPanel noteId={note.id} />
        </div>
      </div>
    </div>
  )
}
