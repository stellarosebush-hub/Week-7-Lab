import type { Class, Note, SearchResult, Task } from './types'

interface SummaryResult {
  summaryText: string
  generatedAt: string
  modelUsed: string
}
interface ApiError {
  error: { code: string; message: string }
}

interface ClassNotesApi {
  // Classes
  listClasses: () => Promise<Class[]>
  createClass: (data: { name: string; color?: string; icon?: string }) => Promise<Class>
  updateClass: (data: { id: number; name: string; color: string; icon: string }) => Promise<Class>
  deleteClass: (id: number) => Promise<{ ok: boolean }>

  // Notes
  listNotes: (classId: number) => Promise<Note[]>
  getNote: (id: number) => Promise<Note | undefined>
  createNote: (data: { classId: number; title?: string }) => Promise<Note>
  updateNote: (data: { id: number; title: string; content: string }) => Promise<Note>
  deleteNote: (id: number) => Promise<{ ok: boolean }>

  // Summaries
  summarizeNote: (noteId: number) => Promise<SummaryResult | ApiError>
  summarizeClass: (classId: number) => Promise<SummaryResult | ApiError>
  getNoteSummary: (noteId: number) => Promise<SummaryResult | null>
  getClassSummary: (classId: number) => Promise<SummaryResult | null>

  // Search
  searchNotes: (query: string, classId?: number) => Promise<SearchResult[] | ApiError>

  // Tasks
  listTasks: () => Promise<Task[]>
  createTask: (data: { classId: number; title: string; dueDate?: string | null }) => Promise<Task>
  updateTask: (data: { id: number; classId: number; title: string; dueDate?: string | null; progress: number; status: Task['status'] }) => Promise<Task>
  deleteTask: (id: number) => Promise<{ ok: boolean }>
}

declare global {
  interface Window {
    api: ClassNotesApi
  }
}
