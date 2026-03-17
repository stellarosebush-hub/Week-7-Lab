import { ipcMain } from 'electron'
import db from '../db/client'
import type { Note, Summary } from '../../src/types'

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat'
const MODEL = 'llama3.2'

const PROMPT_PREFIX =
  'Summarize the following class notes in 3–5 concise bullet points. ' +
  'Focus on key concepts, definitions, and takeaways.\n\n'

async function fetchOllamaSummary(text: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: PROMPT_PREFIX + text }],
        stream: false
      })
    })
  } catch {
    throw { code: 'OLLAMA_UNAVAILABLE', message: 'Cannot connect to Ollama. Make sure it is running.' }
  }

  if (res.status === 404) {
    throw { code: 'MODEL_NOT_FOUND', message: `Model '${MODEL}' not found. Run: ollama pull ${MODEL}` }
  }

  if (!res.ok) {
    throw { code: 'UNKNOWN', message: `Ollama returned status ${res.status}` }
  }

  const data = await res.json() as { message?: { content?: string } }
  return data?.message?.content?.trim() ?? ''
}

export function registerSummaryHandlers(): void {
  // Summarize a single note
  ipcMain.handle('note:summarize', async (_e, { noteId }: { noteId: number }) => {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as Note | undefined
    if (!note) return { error: { code: 'UNKNOWN', message: 'Note not found' } }

    try {
      const summaryText = await fetchOllamaSummary(
        `Title: ${note.title}\n\n${note.content}`
      )
      db.prepare(`
        INSERT INTO summaries (note_id, summary_text, model_used)
        VALUES (?, ?, ?)
        ON CONFLICT(note_id) DO UPDATE SET
          summary_text = excluded.summary_text,
          model_used   = excluded.model_used,
          generated_at = datetime('now')
      `).run(noteId, summaryText, MODEL)

      const saved = db
        .prepare('SELECT * FROM summaries WHERE note_id = ?')
        .get(noteId) as Summary
      return { summaryText: saved.summary_text, generatedAt: saved.generated_at, modelUsed: saved.model_used }
    } catch (err) {
      return { error: err }
    }
  })

  // Summarize all notes in a class
  ipcMain.handle('class:summarize', async (_e, { classId }: { classId: number }) => {
    const notes = db
      .prepare('SELECT * FROM notes WHERE class_id = ? ORDER BY updated_at DESC')
      .all(classId) as Note[]

    if (notes.length === 0) {
      return { error: { code: 'UNKNOWN', message: 'No notes in this class yet.' } }
    }

    const combined = notes
      .map((n) => `## ${n.title}\n${n.content}`)
      .join('\n\n---\n\n')

    try {
      const summaryText = await fetchOllamaSummary(combined)
      db.prepare(`
        INSERT INTO summaries (class_id, summary_text, model_used)
        VALUES (?, ?, ?)
        ON CONFLICT(class_id) WHERE note_id IS NULL DO UPDATE SET
          summary_text = excluded.summary_text,
          model_used   = excluded.model_used,
          generated_at = datetime('now')
      `).run(classId, summaryText, MODEL)

      const saved = db
        .prepare('SELECT * FROM summaries WHERE class_id = ? AND note_id IS NULL')
        .get(classId) as Summary
      return { summaryText: saved.summary_text, generatedAt: saved.generated_at, modelUsed: saved.model_used }
    } catch (err) {
      return { error: err }
    }
  })

  // Get cached summary for a note
  ipcMain.handle('note:getSummary', (_e, { noteId }: { noteId: number }) => {
    const row = db
      .prepare('SELECT * FROM summaries WHERE note_id = ?')
      .get(noteId) as Summary | undefined
    if (!row) return null
    return { summaryText: row.summary_text, generatedAt: row.generated_at, modelUsed: row.model_used }
  })

  // Get cached summary for a class
  ipcMain.handle('class:getSummary', (_e, { classId }: { classId: number }) => {
    const row = db
      .prepare('SELECT * FROM summaries WHERE class_id = ? AND note_id IS NULL')
      .get(classId) as Summary | undefined
    if (!row) return null
    return { summaryText: row.summary_text, generatedAt: row.generated_at, modelUsed: row.model_used }
  })
}
