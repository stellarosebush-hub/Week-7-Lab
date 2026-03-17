import { ipcMain } from 'electron'
import db from '../db/client'
import type { SearchResult } from '../../src/types'

export function registerSearchHandlers(): void {
  ipcMain.handle(
    'notes:search',
    (_e, { query, classId }: { query: string; classId?: number }) => {
      const trimmed = query.trim()
      if (!trimmed) return []

      // Append * to the last token for prefix matching; sanitize special chars
      const ftsQuery = trimmed
        .replace(/["*]/g, '') // strip chars that break FTS5 syntax
        .split(/\s+/)
        .filter(Boolean)
        .map((token, i, arr) => (i === arr.length - 1 ? `${token}*` : token))
        .join(' ')

      try {
        const rows = db
          .prepare(`
            SELECT
              notes.id          AS noteId,
              notes.class_id    AS classId,
              notes.title,
              classes.name      AS className,
              classes.color     AS classColor,
              snippet(notes_fts, 1, '<mark>', '</mark>', '…', 20) AS snippet,
              notes_fts.rank
            FROM notes_fts
            JOIN notes   ON notes.id   = notes_fts.rowid
            JOIN classes ON classes.id = notes.class_id
            WHERE notes_fts MATCH ?
              AND (? IS NULL OR notes.class_id = ?)
            ORDER BY notes_fts.rank
            LIMIT 25
          `)
          .all(ftsQuery, classId ?? null, classId ?? null) as SearchResult[]

        return rows
      } catch {
        return { error: { code: 'INVALID_QUERY', message: 'Invalid search query. Try different keywords.' } }
      }
    }
  )
}
