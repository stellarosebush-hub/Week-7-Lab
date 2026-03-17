// Core domain types shared between main process and renderer

export interface Class {
  id: number
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Note {
  id: number
  class_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Summary {
  id: number
  note_id: number | null
  class_id: number | null
  summary_text: string
  model_used: string
  generated_at: string
}

export interface SearchResult {
  noteId: number
  classId: number
  title: string
  className: string
  classColor: string
  snippet: string
}

export interface Task {
  id: number
  class_id: number
  title: string
  due_date: string | null
  progress: number
  status: 'Not Started' | 'In Progress' | 'Done'
  created_at: string
}

// IPC channel response shapes
export interface IpcError {
  code: 'OLLAMA_UNAVAILABLE' | 'MODEL_NOT_FOUND' | 'INVALID_QUERY' | 'UNKNOWN'
  message: string
}

export type SummarizeResponse =
  | { summaryText: string; generatedAt: string; modelUsed: string }
  | { error: IpcError }
