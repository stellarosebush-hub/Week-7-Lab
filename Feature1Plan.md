# Feature 1 Plan: Summarize Class Notes

## TL;DR

Add a "Summarize" button to each note and class page. The app sends the note
content to a locally-running Ollama model via its REST API, stores the result
in SQLite, and displays it in a side panel. No internet or API key required.

---

## App Context (shared foundation for all features)

**Tech Stack**
- Electron + React + TypeScript (scaffolded with `electron-vite`)
- SQLite via `better-sqlite3` (synchronous, high-performance)
- Tailwind CSS (Notion-inspired minimal styling)
- Ollama (local LLM runtime, e.g., `llama3.2` or `mistral`)

**Core Database Schema**
```sql
CREATE TABLE classes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#e5e7eb',
  icon       TEXT DEFAULT '📚',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  content    TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Project Structure**
```
/
├── electron/
│   ├── main.ts              -- Electron entry; registers IPC handlers; opens window
│   ├── preload.ts           -- contextBridge exposing window.api to renderer
│   ├── db/
│   │   ├── schema.ts        -- Runs CREATE TABLE IF NOT EXISTS on startup
│   │   └── client.ts        -- Exports the single better-sqlite3 Database instance
│   └── ipc/
│       ├── notes.ts         -- CRUD handlers for notes & classes
│       ├── summary.ts       -- Summarization handler (Feature 1)
│       └── search.ts        -- Search handler (Feature 2)
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar.tsx      -- Class list + navigation
│   │   ├── NoteEditor.tsx   -- Editable content area
│   │   ├── SummaryPanel.tsx -- Summary display (Feature 1)
│   │   └── SearchBar.tsx    -- Search input (Feature 2)
│   └── types/
│       └── index.ts         -- Shared TS interfaces (Note, Class, Summary)
├── package.json
└── electron-builder.yml     -- Windows packaging config
```

---

## Feature 1 Implementation Steps

### Phase 1 — Database Extension (depends on: core schema above)

1. **Add `summaries` table** to `electron/db/schema.ts`:
   ```sql
   CREATE TABLE IF NOT EXISTS summaries (
     id           INTEGER PRIMARY KEY AUTOINCREMENT,
     note_id      INTEGER REFERENCES notes(id) ON DELETE CASCADE,
     class_id     INTEGER REFERENCES classes(id) ON DELETE CASCADE,
     summary_text TEXT NOT NULL,
     model_used   TEXT NOT NULL,
     generated_at TEXT DEFAULT (datetime('now'))
   );
   ```
   - `note_id` is non-null for individual note summaries
   - `class_id` with `note_id = NULL` represents a whole-class summary

2. **Add unique index** to allow upsert pattern:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_note ON summaries(note_id)
     WHERE note_id IS NOT NULL;
   CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_class ON summaries(class_id)
     WHERE note_id IS NULL;
   ```

---

### Phase 2 — IPC Handler: `note:summarize` (depends on: Phase 1)

3. **Create `electron/ipc/summary.ts`** with an `ipcMain.handle('note:summarize', ...)` handler that:
   - Accepts `{ noteId: number }` or `{ classId: number }` from the renderer
   - If `noteId`: fetches `SELECT content, title FROM notes WHERE id = ?`
   - If `classId`: fetches all notes for the class and concatenates them with headings
   - Builds an Ollama request payload:
     ```json
     {
       "model": "llama3.2",
       "messages": [
         {
           "role": "user",
           "content": "Summarize the following class notes in 3–5 concise bullet points. Focus on key concepts, definitions, and takeaways.\n\n{content}"
         }
       ],
       "stream": false
     }
     ```
   - Posts to `http://127.0.0.1:11434/api/chat` using Node's built-in `fetch` (Node 18+, included with Electron 28+)
   - On success: upserts into `summaries` table using `INSERT OR REPLACE`
   - On network error (Ollama not running): throws a typed error `{ code: 'OLLAMA_UNAVAILABLE' }` so the UI can show a friendly message
   - Returns `{ summaryText: string, generatedAt: string, modelUsed: string }`

4. **Preload bridge** — add to `electron/preload.ts` via `contextBridge.exposeInMainWorld`:
   ```ts
   summarizeNote:  (noteId: number)  => ipcRenderer.invoke('note:summarize', { noteId }),
   summarizeClass: (classId: number) => ipcRenderer.invoke('note:summarize', { classId }),
   getSummary:     (noteId: number)  => ipcRenderer.invoke('note:getSummary', { noteId }),
   ```

5. **Add `note:getSummary` handler**: fetches existing summary from `summaries` table so the UI can restore it on page load without regenerating.

---

### Phase 3 — UI: `SummaryPanel.tsx` (parallel with Phase 2)

6. **Create `src/components/SummaryPanel.tsx`**:
   - Rendered as a collapsible right-side panel on `NotePage` and `ClassPage`
   - States managed with React `useState`:
     - `idle` — shows "Summarize" button
     - `loading` — shows spinner + "Generating summary…"
     - `done` — shows summary bullet list + "Last generated: [timestamp]" + "Regenerate" link
     - `error` — shows error message with a link to Ollama setup instructions
   - On mount: calls `window.api.getSummary(noteId)` to restore cached summary
   - "Summarize" / "Regenerate" button calls `window.api.summarizeNote(noteId)` and transitions states
   - Parses bullet-point lines from the returned `summaryText` (split on `\n- ` or `\n• `)
     and renders them as a styled `<ul>` for clean Notion-like formatting

7. **Wire into `NotePage.tsx`**: render `<SummaryPanel noteId={note.id} />` in a right column or below the editor, toggled by a toolbar button (e.g., a ✦ icon).

8. **Wire into `ClassPage.tsx`**: render `<SummaryPanel classId={class.id} />` at the top of the class page with a "Summarize All Notes" heading and the same loading/done/error states.

---

### Phase 4 — Error Handling & Ollama Setup UX

9. **Ollama availability check**: on app startup in `main.ts`, attempt a `HEAD http://127.0.0.1:11434` request. If it fails, store a flag in app state. Surface a non-blocking banner in the UI: *"Ollama is not running. Start it to enable summarization."* with a button to open the [Ollama download page](https://ollama.com) in the system browser.

10. **Model availability**: if Ollama returns `404` (model not found), catch and surface: *"Model 'llama3.2' not found. Run `ollama pull llama3.2` in a terminal."*

---

## Relevant Files

- `electron/db/schema.ts` — add `summaries` table and unique indexes
- `electron/ipc/summary.ts` — new file; all Ollama communication lives here
- `electron/preload.ts` — expose `summarizeNote`, `summarizeClass`, `getSummary`
- `electron/main.ts` — register summary IPC handlers; run Ollama health check on startup
- `src/components/SummaryPanel.tsx` — new file; all summary UI lives here
- `src/pages/NotePage.tsx` — import and render `<SummaryPanel noteId={...} />`
- `src/pages/ClassPage.tsx` — import and render `<SummaryPanel classId={...} />`
- `src/types/index.ts` — add `Summary` interface `{ id, noteId, classId, summaryText, modelUsed, generatedAt }`

---

## Verification

1. Start Ollama (`ollama serve`) and pull a model (`ollama pull llama3.2`). Open the app, open a note with content, click "Summarize" — confirm the summary panel populates within ~10s.
2. Close and reopen the app on the same note — confirm the cached summary is restored without a new API call.
3. Click "Regenerate" — confirm a new summary is fetched and the timestamp updates.
4. Stop Ollama, click "Summarize" — confirm the error state appears with a helpful message (no crash).
5. Open a class page, click "Summarize All Notes" with 3+ notes — confirm all notes are included in the prompt and a class-level summary is returned.
6. Run `npm run build` and confirm the packaged Windows `.exe` can connect to Ollama running on the same machine.

---

## Decisions

- **Offline-only**: Ollama runs locally; no data ever leaves the user's machine.
- **No streaming UI for now**: `stream: false` keeps the IPC handler simple. Streaming can be added later via `ipcMain.emit` for a typewriter effect.
- **Cache-first**: summaries are stored and restored from SQLite; regeneration is always opt-in.
- **Model is hardcoded** to `llama3.2` initially; a settings page to change the model is out of scope for this feature.
- **Class-level summary excluded from initial scope**: Steps 8 and 10 (class-level) are documented but can be deferred to a v2 if time is limited.

---

## Further Considerations

1. **Summary quality**: The prompt `"Summarize in 3–5 bullet points"` works well for short notes. For very long notes (>2000 words), consider chunking and summarizing per-section, then summarizing the summaries. This is a v2 enhancement.
2. **Model size vs. speed**: `llama3.2` (3B) is fast on a laptop CPU (~5-15s). `mistral` (7B) produces better summaries but may take 30-60s without a GPU. Consider exposing model choice in a simple settings dropdown.
