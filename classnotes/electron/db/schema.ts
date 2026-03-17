import db from './client'

export function initSchema(): void {
  // ── Core tables ─────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      color      TEXT    DEFAULT '#e5e7eb',
      icon       TEXT    DEFAULT '📚',
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL DEFAULT 'Untitled',
      content    TEXT    DEFAULT '',
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id      INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      class_id     INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      summary_text TEXT    NOT NULL,
      model_used   TEXT    NOT NULL,
      generated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_note
      ON summaries(note_id) WHERE note_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_class
      ON summaries(class_id) WHERE note_id IS NULL;
  `)

  // ── FTS5 full-text search (Feature 2) ───────────────────────────────────────
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
      USING fts5(title, content, content='notes', content_rowid='id');

    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, content)
        VALUES (new.id, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content)
        VALUES ('delete', old.id, old.title, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, content)
        VALUES ('delete', old.id, old.title, old.content);
      INSERT INTO notes_fts(rowid, title, content)
        VALUES (new.id, new.title, new.content);
    END;
  `)

  // ── One-time backfill for existing notes (guarded by user_version) ──────────
  const version = (db.pragma('user_version', { simple: true }) as number) ?? 0
  if (version < 1) {
    db.exec(`
      INSERT INTO notes_fts(rowid, title, content)
        SELECT id, title, content FROM notes;
      PRAGMA user_version = 1;
    `)
  }
}
