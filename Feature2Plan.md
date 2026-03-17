# Feature 2 Plan: Search in Notes

## TL;DR

Add a search bar to the sidebar (and a `Ctrl+K` shortcut) that performs
full-text search across all notes using SQLite's built-in FTS5 (Full-Text
Search) extension. Results show the matching class, note title, and a
highlighted snippet. No external search library or index file needed — SQLite
handles everything.

---

## App Context (shared foundation for all features)

**Tech Stack**
- Electron + React + TypeScript (scaffolded with `electron-vite`)
- SQLite via `better-sqlite3` (synchronous, high-performance)
- Tailwind CSS (Notion-inspired minimal styling)

**Core Database Schema** (notes and classes tables must exist first)
```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#e5e7eb',
  icon TEXT DEFAULT '📚',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
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
│       └── search.ts        -- Search handler (Feature 2) ← primary file for this feature
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar.tsx      -- Hosts the SearchBar and navigation
│   │   ├── NoteEditor.tsx   -- Editable content area
│   │   ├── SearchBar.tsx    -- Search input component (Feature 2) ← primary UI file
│   │   └── SearchResults.tsx-- Results list with snippets (Feature 2) ← primary UI file
│   └── types/
│       └── index.ts         -- Shared TS interfaces (Note, Class, SearchResult)
├── package.json
└── electron-builder.yml
```

---

## Feature 2 Implementation Steps

### Phase 1 — FTS5 Virtual Table & Triggers (depends on: core schema above)

1. **Create the FTS5 virtual table** in `electron/db/schema.ts`, run after the `notes` table is created:
   ```sql
   CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
   USING fts5(title, content, content='notes', content_rowid='id');
   ```
   - `content='notes'` makes it a content table — SQLite reads from `notes` for highlight/snippet
   - `content_rowid='id'` maps FTS5 rows to `notes.id`

2. **Create three triggers** to keep the FTS5 index automatically in sync with `notes`:
   ```sql
   -- On insert
   CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
     INSERT INTO notes_fts(rowid, title, content)
       VALUES (new.id, new.title, new.content);
   END;

   -- On delete
   CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
     INSERT INTO notes_fts(notes_fts, rowid, title, content)
       VALUES ('delete', old.id, old.title, old.content);
   END;

   -- On update
   CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
     INSERT INTO notes_fts(notes_fts, rowid, title, content)
       VALUES ('delete', old.id, old.title, old.content);
     INSERT INTO notes_fts(rowid, title, content)
       VALUES (new.id, new.title, new.content);
   END;
   ```

3. **Backfill existing notes** on first run (run once, guarded by a `db_version` pragma):
   ```sql
   INSERT INTO notes_fts(rowid, title, content)
     SELECT id, title, content FROM notes;
   ```
   Guard with: `PRAGMA user_version` — if `user_version = 0`, run backfill then set `PRAGMA user_version = 1`.

---

### Phase 2 — IPC Handler: `notes:search` (depends on: Phase 1)

4. **Create `electron/ipc/search.ts`** with an `ipcMain.handle('notes:search', ...)` handler:
   - Accepts `{ query: string, classId?: number }` from the renderer
   - Sanitizes query: trim whitespace; if empty, return `[]` immediately without querying
   - Appends `*` to the last word to enable prefix matching (e.g., `"lec"` matches `"lecture"`)
   - Executes the following SQL via `better-sqlite3`:
     ```sql
     SELECT
       notes.id          AS noteId,
       notes.class_id    AS classId,
       notes.title,
       classes.name      AS className,
       classes.color     AS classColor,
       snippet(notes_fts, 1, '<mark>', '</mark>', '…', 20) AS snippet,
       notes_fts.rank
     FROM notes_fts
     JOIN notes   ON notes.id        = notes_fts.rowid
     JOIN classes ON classes.id      = notes.class_id
     WHERE notes_fts MATCH ?
       AND (? IS NULL OR notes.class_id = ?)
     ORDER BY notes_fts.rank
     LIMIT 25;
     ```
   - `rank` is a built-in FTS5 column that orders results by relevance (BM25)
   - Returns the array of result rows to the renderer
   - Wraps execution in a try/catch; on FTS5 syntax error (e.g., mismatched quotes), returns `{ error: 'INVALID_QUERY' }` so the UI can show a hint instead of crashing

5. **Preload bridge** — add to `electron/preload.ts` via `contextBridge.exposeInMainWorld`:
   ```ts
   searchNotes: (query: string, classId?: number) =>
     ipcRenderer.invoke('notes:search', { query, classId }),
   ```

---

### Phase 3 — UI Components (parallel with Phase 2)

6. **Create `src/components/SearchBar.tsx`**:
   - Controlled `<input type="text">` with Tailwind styling (rounded, minimal border, magnifier icon)
   - Debounced: uses `useEffect` + `setTimeout` (300ms delay) to avoid firing on every keystroke
   - Calls `window.api.searchNotes(query)` when debounce fires
   - Passes results up via a prop callback or stores them in shared state (React Context or Zustand)
   - Clears results when input is emptied
   - Displays a subtle loading indicator (spinner or pulsing border) while awaiting IPC response

7. **Global keyboard shortcut** — in `App.tsx` or `Sidebar.tsx`, add a `useEffect` with:
   ```ts
   document.addEventListener('keydown', (e) => {
     if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
       e.preventDefault();
       searchInputRef.current?.focus();
     }
   });
   ```

8. **Create `src/components/SearchResults.tsx`**:
   - Renders a floating dropdown or an inline results panel below the `SearchBar`
   - Each result row shows:
     - Colored class badge (using `classColor`) with `className`
     - Note title in bold
     - Snippet text with `<mark>` tags rendered as highlighted spans (yellow background via Tailwind `bg-yellow-200`)
     - **Important**: use `dangerouslySetInnerHTML` carefully — strip all HTML from the snippet except the `<mark>` tags (use a whitelist sanitizer or regex `snippet.replace(/<(?!\/?mark>)[^>]+>/g, '')`) to prevent XSS
   - Clicking a result: calls a navigation handler to open the note (`react-router` or custom routing) and closes the search panel
   - Keyboard navigation: `ArrowUp` / `ArrowDown` to move between results, `Enter` to open, `Escape` to close
   - "No results" empty state with a friendly message: *"No notes match '{query}'"*

9. **Class-scoped search toggle**: on `ClassPage`, render the search bar with a pre-filled `classId` prop — this limits results to notes within that class. A small toggle "Search all classes / Search this class" switches between scoped and global search.

---

## Relevant Files

- `electron/db/schema.ts` — add FTS5 virtual table, three triggers, and backfill logic (guarded by `user_version`)
- `electron/ipc/search.ts` — new file; all search query logic lives here
- `electron/preload.ts` — expose `searchNotes(query, classId?)`
- `electron/main.ts` — register search IPC handler
- `src/components/SearchBar.tsx` — new file; debounced input, Ctrl+K handler
- `src/components/SearchResults.tsx` — new file; result list with snippet highlighting
- `src/components/Sidebar.tsx` — import and render `<SearchBar>` at the top
- `src/pages/ClassPage.tsx` — render scoped `<SearchBar classId={class.id} />`
- `src/types/index.ts` — add `SearchResult` interface `{ noteId, classId, title, className, classColor, snippet }`

---

## Verification

1. Create 3 notes across 2 classes with distinct content. Type a keyword that appears in one note — confirm the correct note appears in results with the correct class badge and a highlighted snippet.
2. Type a partial word (e.g., `"lec"`) — confirm prefix matching returns notes containing `"lecture"`.
3. Clear the search bar — confirm results panel disappears.
4. Press `Ctrl+K` anywhere in the app — confirm the search bar receives focus.
5. Use arrow keys to navigate results and press `Enter` — confirm the correct note opens.
6. Navigate to a class page, search a term — confirm only notes from that class appear when the "this class" scope is selected.
7. Type a search query that matches a note, then update that note's content in the editor — save the note and search again to confirm the FTS index updated automatically (trigger test).
8. Delete a note and confirm it no longer appears in search results (trigger test).
9. Type a malformed FTS5 query (e.g., `"unclosed quote`) — confirm the app shows an error hint rather than crashing.
10. Run `npm run build` and confirm search works in the packaged Windows `.exe`.

---

## Decisions

- **SQLite FTS5 over external libraries**: No extra npm packages needed; FTS5 is bundled with SQLite. Works fully offline with no indexing step.
- **Prefix matching via `*` suffix**: Appended automatically by the IPC handler so the UI stays simple — users don't need to type wildcards.
- **Result limit of 25**: Keeps the dropdown manageable. Can be made configurable in settings later.
- **XSS prevention**: Snippet HTML is stripped of all tags except `<mark>` before rendering via `dangerouslySetInnerHTML`. This is the only place raw HTML is injected into the DOM.
- **Scoped vs. global search**: Class-scoped search uses an additional `AND notes.class_id = ?` clause — no separate query needed.
- **Keyboard shortcut uses `Ctrl+K`** (Windows standard for search/command palette), not `Cmd+K`, since the target platform is Windows.

---

## Further Considerations

1. **Search history**: Storing the last 5–10 searches in `localStorage` would allow quick re-searches. This is a low-effort v2 enhancement.
2. **Search within open note**: An in-note `Ctrl+F` search (highlighting matches within the editor) is a separate, complementary feature. It can be implemented with the browser's built-in `window.find()` or a rich text editor's search API, and is out of scope for this feature.
