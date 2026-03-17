import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { initSchema } from './db/schema'
import { registerNotesHandlers } from './ipc/notes'
import { registerSummaryHandlers } from './ipc/summary'
import { registerSearchHandlers } from './ipc/search'
import { registerTaskHandlers } from './ipc/tasks'

// Initialize database before anything else
initSchema()

// Register all IPC handlers
registerNotesHandlers()
registerSummaryHandlers()
registerSearchHandlers()
registerTaskHandlers()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ClassNotes',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Open external links in the default browser, not in Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
