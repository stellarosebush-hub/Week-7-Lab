import { ipcMain } from 'electron'
import db from '../db/client'
import type { Class, Note } from '../../src/types'

export function registerNotesHandlers(): void {
  // ── Classes ──────────────────────────────────────────────────────────────────
  ipcMain.handle('classes:list', () => {
    return db.prepare('SELECT * FROM classes ORDER BY name ASC').all() as Class[]
  })

  ipcMain.handle('classes:create', (_e, { name, color, icon }: Partial<Class>) => {
    const stmt = db.prepare(
      'INSERT INTO classes (name, color, icon) VALUES (?, ?, ?)'
    )
    const info = stmt.run(name ?? 'New Class', color ?? '#e5e7eb', icon ?? '📚')
    return db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .get(info.lastInsertRowid) as Class
  })

  ipcMain.handle('classes:update', (_e, { id, name, color, icon }: Partial<Class> & { id: number }) => {
    db.prepare(
      'UPDATE classes SET name = ?, color = ?, icon = ? WHERE id = ?'
    ).run(name, color, icon, id)
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(id) as Class
  })

  ipcMain.handle('classes:delete', (_e, id: number) => {
    db.prepare('DELETE FROM classes WHERE id = ?').run(id)
    return { ok: true }
  })

  // ── Notes ────────────────────────────────────────────────────────────────────
  ipcMain.handle('notes:list', (_e, classId: number) => {
    return db
      .prepare('SELECT * FROM notes WHERE class_id = ? ORDER BY updated_at DESC')
      .all(classId) as Note[]
  })

  ipcMain.handle('notes:get', (_e, id: number) => {
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined
  })

  ipcMain.handle('notes:create', (_e, { classId, title }: { classId: number; title?: string }) => {
    const stmt = db.prepare(
      'INSERT INTO notes (class_id, title, content) VALUES (?, ?, ?)'
    )
    const info = stmt.run(classId, title ?? 'Untitled', '')
    return db
      .prepare('SELECT * FROM notes WHERE id = ?')
      .get(info.lastInsertRowid) as Note
  })

  ipcMain.handle('notes:update', (_e, { id, title, content }: { id: number; title: string; content: string }) => {
    db.prepare(
      `UPDATE notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(title, content, id)
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note
  })

  ipcMain.handle('notes:delete', (_e, id: number) => {
    db.prepare('DELETE FROM notes WHERE id = ?').run(id)
    return { ok: true }
  })
}
