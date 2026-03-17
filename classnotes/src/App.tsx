import React, { useEffect, useState } from 'react'
import type { Class } from './types'
import Sidebar from './components/Sidebar'
import ClassPage from './pages/ClassPage'
import TodoPage from './pages/TodoPage'
import WelcomePage from './pages/WelcomePage'

const CLASS_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
]
const CLASS_ICONS = ['📚', '🧪', '📐', '🌍', '💻', '🎨', '📝', '🔬']

export default function App() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [viewNoteId, setViewNoteId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'welcome' | 'class' | 'tasks'>('welcome')

  useEffect(() => {
    window.api.listClasses().then(setClasses)
  }, [])

  const handleCreateClass = async () => {
    const colorIdx = classes.length % CLASS_COLORS.length
    const iconIdx = classes.length % CLASS_ICONS.length
    const cls = await window.api.createClass({
      name: `Class ${classes.length + 1}`,
      color: CLASS_COLORS[colorIdx],
      icon: CLASS_ICONS[iconIdx]
    })
    setClasses((prev) => [...prev, cls])
    setSelectedClassId(cls.id)
    setViewNoteId(null)
    setActiveView('class')
  }

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Delete this class and all its notes?')) return
    await window.api.deleteClass(id)
    setClasses((prev) => prev.filter((c) => c.id !== id))
    if (selectedClassId === id) {
      setSelectedClassId(null)
      setViewNoteId(null)
      setActiveView('welcome')
    }
  }

  const handleRenameClass = async (id: number, name: string) => {
    const target = classes.find((c) => c.id === id)
    if (!target) return
    const updated = await window.api.updateClass({
      id,
      name,
      color: target.color,
      icon: target.icon
    })
    setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  const handleSelectClass = (id: number) => {
    setSelectedClassId(id)
    setViewNoteId(null)
    setActiveView('class')
  }

  const handleNavigateToNote = (noteId: number, classId: number) => {
    setSelectedClassId(classId)
    setViewNoteId(noteId)
    setActiveView('class')
  }

  const handleSelectTasks = () => {
    setActiveView('tasks')
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-sky-50">
      <Sidebar
        classes={classes}
        selectedClassId={selectedClassId}
        activeView={activeView}
        onSelectClass={handleSelectClass}
        onSelectTasks={handleSelectTasks}
        onCreateClass={handleCreateClass}
        onRenameClass={handleRenameClass}
        onDeleteClass={handleDeleteClass}
        onNavigateToNote={handleNavigateToNote}
      />

      <main className="flex-1 overflow-hidden">
        {activeView === 'tasks' ? (
          <TodoPage classes={classes} />
        ) : selectedClass ? (
          <ClassPage
            key={selectedClass.id}
            cls={selectedClass}
            onNavigateToNote={handleNavigateToNote}
            initialNoteId={viewNoteId}
          />
        ) : (
          <WelcomePage />
        )}
      </main>
    </div>
  )
}
