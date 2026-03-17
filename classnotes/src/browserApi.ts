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

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are',
  'was', 'were', 'be', 'by', 'as', 'at', 'it', 'this', 'that', 'from', 'but', 'not',
  'we', 'you', 'they', 'he', 'she', 'i', 'our', 'your', 'their', 'can', 'could', 'will',
  'would', 'should', 'has', 'have', 'had', 'do', 'does', 'did', 'if', 'then', 'than'
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
}

function topKeywords(text: string): Set<string> {
  const freq = new Map<string, number>()
  for (const token of tokenize(text)) {
    freq.set(token, (freq.get(token) ?? 0) + 1)
  }
  return new Set(
    [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)
  )
}

function summarizeText(text: string): string {
  const normalized = text.trim()
  if (!normalized) return '- No content to summarize yet.'

  const sentences = splitSentences(normalized)
  if (sentences.length === 0) return `- ${normalized.slice(0, 220)}`

  const keywords = topKeywords(normalized)
  const scored = sentences.map((sentence, idx) => {
    const words = tokenize(sentence)
    const keywordHits = words.reduce((acc, w) => acc + (keywords.has(w) ? 1 : 0), 0)

    // Prefer informative sentence lengths and reward explicit concept cues.
    const lengthScore = words.length >= 8 && words.length <= 32 ? 1.5 : 0.5
    const cueScore = /\b(defined as|therefore|because|means|formula|example|important|key)\b/i.test(sentence)
      ? 1.5
      : 0

    // Coverage factor: encourage picking sentences across full note (start/middle/end).
    const position = idx / Math.max(1, sentences.length - 1)
    const coverageBoost = position > 0.2 && position < 0.8 ? 1 : 0.7

    return {
      sentence,
      idx,
      score: keywordHits + lengthScore + cueScore + coverageBoost
    }
  })

  // Pick top candidates, then force broad coverage by selecting across thirds.
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const top = sorted.slice(0, 12)
  const thirds = [0, 0.33, 0.66, 1]
  const selected: Array<{ sentence: string; idx: number }> = []

  for (let t = 0; t < 3; t += 1) {
    const start = thirds[t]
    const end = thirds[t + 1]
    const pick = top.find((item) => {
      const pos = item.idx / Math.max(1, sentences.length - 1)
      return pos >= start && pos <= end && !selected.some((s) => s.idx === item.idx)
    })
    if (pick) selected.push({ sentence: pick.sentence, idx: pick.idx })
  }

  for (const item of top) {
    if (selected.length >= 5) break
    if (!selected.some((s) => s.idx === item.idx)) {
      selected.push({ sentence: item.sentence, idx: item.idx })
    }
  }

  if (selected.length === 0) {
    return sentences.slice(0, 4).map((s) => `- ${s}`).join('\n')
  }

  return selected
    .sort((a, b) => a.idx - b.idx)
    .map((item) => `- ${item.sentence.replace(/\s+/g, ' ').trim()}`)
    .join('\n')
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
