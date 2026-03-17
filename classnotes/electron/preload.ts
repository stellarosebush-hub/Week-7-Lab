import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe, typed API to the renderer process via window.api
contextBridge.exposeInMainWorld('api', {
  // ── Classes ────────────────────────────────────────────────────────────────
  listClasses: () =>
    ipcRenderer.invoke('classes:list'),
  createClass: (data: { name: string; color?: string; icon?: string }) =>
    ipcRenderer.invoke('classes:create', data),
  updateClass: (data: { id: number; name: string; color: string; icon: string }) =>
    ipcRenderer.invoke('classes:update', data),
  deleteClass: (id: number) =>
    ipcRenderer.invoke('classes:delete', id),

  // ── Notes ──────────────────────────────────────────────────────────────────
  listNotes: (classId: number) =>
    ipcRenderer.invoke('notes:list', classId),
  getNote: (id: number) =>
    ipcRenderer.invoke('notes:get', id),
  createNote: (data: { classId: number; title?: string }) =>
    ipcRenderer.invoke('notes:create', data),
  updateNote: (data: { id: number; title: string; content: string }) =>
    ipcRenderer.invoke('notes:update', data),
  deleteNote: (id: number) =>
    ipcRenderer.invoke('notes:delete', id),

  // ── Summaries (Feature 1) ──────────────────────────────────────────────────
  summarizeNote: (noteId: number) =>
    ipcRenderer.invoke('note:summarize', { noteId }),
  summarizeClass: (classId: number) =>
    ipcRenderer.invoke('class:summarize', { classId }),
  getNoteSummary: (noteId: number) =>
    ipcRenderer.invoke('note:getSummary', { noteId }),
  getClassSummary: (classId: number) =>
    ipcRenderer.invoke('class:getSummary', { classId }),

  // ── Search (Feature 2) ─────────────────────────────────────────────────────
  searchNotes: (query: string, classId?: number) =>
    ipcRenderer.invoke('notes:search', { query, classId })
})
