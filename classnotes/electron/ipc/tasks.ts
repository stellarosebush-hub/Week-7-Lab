import { ipcMain } from 'electron'
import db from '../db/client'
import type { Task } from '../../src/types'

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:list', () => {
    return db.prepare(`
      SELECT tasks.*
      FROM tasks
      ORDER BY CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END, due_date ASC, created_at DESC
    `).all() as Task[]
  })

  ipcMain.handle('tasks:create', (_e, { classId, title, dueDate }: { classId: number; title: string; dueDate?: string | null }) => {
    const info = db.prepare(
      'INSERT INTO tasks (class_id, title, due_date, progress, status) VALUES (?, ?, ?, ?, ?)'
    ).run(classId, title, dueDate ?? null, 0, 'Not Started')

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) as Task
  })

  ipcMain.handle('tasks:update', (_e, { id, classId, title, dueDate, progress, status }: { id: number; classId: number; title: string; dueDate?: string | null; progress: number; status: Task['status'] }) => {
    db.prepare(
      'UPDATE tasks SET class_id = ?, title = ?, due_date = ?, progress = ?, status = ? WHERE id = ?'
    ).run(classId, title, dueDate ?? null, progress, status, id)

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task
  })

  ipcMain.handle('tasks:delete', (_e, id: number) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return { ok: true }
  })
}
