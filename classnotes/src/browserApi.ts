import type { Class, Note, SearchResult } from './types'

type Summary = { summaryText: string; generatedAt: string; modelUsed: string }

type BrowserDb = {
  classes: Class[]
  notes: Note[]
  noteSummaries: Record<number, Summary>
  classSummaries: Record<number, Summary>
}

const DB_KEY = 'classnotes_browser_db'

function nowIso(): string {
  return new Date().toISOString()
}

function readDb(): BrowserDb {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const seed: BrowserDb = {
      classes: [],
      notes: [],
      noteSummaries: {},
      classSummaries: {}
    }
    localStorage.setItem(DB_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(raw) as BrowserDb
  } catch {
    const reset: BrowserDb = {
      classes: [],
      notes: [],
      noteSummaries: {},
      classSummaries: {}
    }
    localStorage.setItem(DB_KEY, JSON.stringify(reset))
    return reset
  }
}

function writeDb(db: BrowserDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function nextId(items: Array<{ id: number }>): number {
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1
}

function summarizeText(text: string): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
  if (sentences.length === 0) return '- No content to summarize yet.'
  return sentences.map((s) => `- ${s}`).join('\n')
}

function buildSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return content.slice(0, 120)
  const start = Math.max(0, idx - 40)
  const end = Math.min(content.length, idx + query.length + 40)
  const chunk = content.slice(start, end)
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
  return chunk.replace(re, '<mark>$1</mark>')
}

export function ensureBrowserApi(): void {
  if (typeof window === 'undefined') return
  if (window.api) return

  window.api = {
    async listClasses() {
      return readDb().classes.sort((a, b) => a.name.localeCompare(b.name))
    },
    async createClass(data) {
      const db = readDb()
      const cls: Class = {
        id: nextId(db.classes),
        name: data.name,
        color: data.color ?? '#e5e7eb',
        icon: data.icon ?? '📚',
        created_at: nowIso()
      }
      db.classes.push(cls)
      writeDb(db)
      return cls
    },
    async updateClass(data) {
      const db = readDb()
      const idx = db.classes.findIndex((c) => c.id === data.id)
      if (idx >= 0) {
        db.classes[idx] = {
          ...db.classes[idx],
          name: data.name,
          color: data.color,
          icon: data.icon
        }
      }
      writeDb(db)
      return db.classes[idx]
    },
    async deleteClass(id) {
      const db = readDb()
      db.classes = db.classes.filter((c) => c.id !== id)
      db.notes = db.notes.filter((n) => n.class_id !== id)
      delete db.classSummaries[id]
      for (const noteId of Object.keys(db.noteSummaries)) {
        const note = db.notes.find((n) => n.id === Number(noteId))
        if (!note) delete db.noteSummaries[Number(noteId)]
      }
      writeDb(db)
      return { ok: true }
    },

    async listNotes(classId) {
      return readDb().notes
        .filter((n) => n.class_id === classId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    },
    async getNote(id) {
      return readDb().notes.find((n) => n.id === id)
    },
    async createNote(data) {
      const db = readDb()
      const note: Note = {
        id: nextId(db.notes),
        class_id: data.classId,
        title: data.title ?? 'Untitled',
        content: '',
        created_at: nowIso(),
        updated_at: nowIso()
      }
      db.notes.push(note)
      writeDb(db)
      return note
    },
    async updateNote(data) {
      const db = readDb()
      const idx = db.notes.findIndex((n) => n.id === data.id)
      if (idx >= 0) {
        db.notes[idx] = {
          ...db.notes[idx],
          title: data.title,
          content: data.content,
          updated_at: nowIso()
        }
      }
      writeDb(db)
      return db.notes[idx]
    },
    async deleteNote(id) {
      const db = readDb()
      db.notes = db.notes.filter((n) => n.id !== id)
      delete db.noteSummaries[id]
      writeDb(db)
      return { ok: true }
    },

    async summarizeNote(noteId) {
      const db = readDb()
      const note = db.notes.find((n) => n.id === noteId)
      if (!note) return { error: { code: 'UNKNOWN', message: 'Note not found' } }
      const summary: Summary = {
        summaryText: summarizeText(`${note.title}. ${note.content}`),
        generatedAt: nowIso(),
        modelUsed: 'browser-extractive'
      }
      db.noteSummaries[noteId] = summary
      writeDb(db)
      return summary
    },
    async summarizeClass(classId) {
      const db = readDb()
      const classNotes = db.notes.filter((n) => n.class_id === classId)
      if (!classNotes.length) return { error: { code: 'UNKNOWN', message: 'No notes in this class yet.' } }
      const text = classNotes.map((n) => `${n.title}. ${n.content}`).join(' ')
      const summary: Summary = {
        summaryText: summarizeText(text),
        generatedAt: nowIso(),
        modelUsed: 'browser-extractive'
      }
      db.classSummaries[classId] = summary
      writeDb(db)
      return summary
    },
    async getNoteSummary(noteId) {
      return readDb().noteSummaries[noteId] ?? null
    },
    async getClassSummary(classId) {
      return readDb().classSummaries[classId] ?? null
    },

    async searchNotes(query, classId) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      const db = readDb()
      const rows = db.notes
        .filter((n) => (classId ? n.class_id === classId : true))
        .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        .map((n) => {
          const cls = db.classes.find((c) => c.id === n.class_id)
          return {
            noteId: n.id,
            classId: n.class_id,
            title: n.title,
            className: cls?.name ?? 'Unknown',
            classColor: cls?.color ?? '#e5e7eb',
            snippet: buildSnippet(n.content || n.title, q)
          } as SearchResult
        })
        .slice(0, 25)
      return rows
    }
  }
}
