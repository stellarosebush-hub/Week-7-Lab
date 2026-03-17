import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

const dbPath = path.join(app.getPath('userData'), 'classnotes.db')
const db = new Database(dbPath)

// Enable WAL mode for better performance and concurrent reads
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db
