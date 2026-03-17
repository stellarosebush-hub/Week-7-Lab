import React, { useEffect, useRef, useState } from 'react'
import type { Class, SearchResult } from '../types'
import SearchBar from './SearchBar'
import SearchResults from './SearchResults'

interface SidebarProps {
  classes: Class[]
  selectedClassId: number | null
  activeView: 'welcome' | 'class' | 'tasks'
  onSelectClass: (id: number) => void
  onSelectTasks: () => void
  onCreateClass: () => void
  onRenameClass: (id: number, name: string) => void
  onDeleteClass: (id: number) => void
  onNavigateToNote: (noteId: number, classId: number) => void
}

export default function Sidebar({
  classes,
  selectedClassId,
  activeView,
  onSelectClass,
  onSelectTasks,
  onCreateClass,
  onRenameClass,
  onDeleteClass,
  onNavigateToNote
}: SidebarProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K: focus the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const results = await window.api.searchNotes(query)
    setIsSearching(false)
    if (Array.isArray(results)) {
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    setSearchResults([])
    setSearchQuery('')
    onNavigateToNote(result.noteId, result.classId)
  }

  return (
    <aside className="flex flex-col w-64 h-screen bg-gray-50 border-r border-gray-200 shrink-0">
      {/* App title */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800 tracking-tight">📓 ClassNotes</h1>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-gray-200 relative">
        <SearchBar
          ref={searchInputRef}
          query={searchQuery}
          isLoading={isSearching}
          onSearch={handleSearch}
          onClear={() => { setSearchQuery(''); setSearchResults([]) }}
        />
        {(searchResults.length > 0 || (searchQuery.trim() && !isSearching)) && (
          <div className="absolute left-0 right-0 top-full z-50 mx-3">
            <SearchResults
              results={searchResults}
              query={searchQuery}
              onSelect={handleSelectResult}
              onClose={() => { setSearchResults([]); setSearchQuery('') }}
            />
          </div>
        )}
      </div>

      <div className="px-2 py-2 border-b border-gray-200">
        <button
          onClick={onSelectTasks}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            activeView === 'tasks'
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span>✅</span>
          <span className="font-medium">To-Do List</span>
        </button>
      </div>

      {/* Classes list */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</span>
          <button
            onClick={onCreateClass}
            className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
            title="New class"
          >
            +
          </button>
        </div>

        {classes.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-400 italic">
            No classes yet. Click + to add one.
          </p>
        )}

        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`group flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-colors ${
              activeView === 'class' && selectedClassId === cls.id
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => onSelectClass(cls.id)}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cls.color }}
            />
            <span className="text-sm font-medium truncate flex-1">{cls.icon} {cls.name}</span>
            <button
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity text-xs px-1"
              onClick={(e) => {
                e.stopPropagation()
                const nextName = prompt('Rename class', cls.name)?.trim()
                if (nextName && nextName !== cls.name) {
                  onRenameClass(cls.id, nextName)
                }
              }}
              title="Rename class"
            >
              ✎
            </button>
            <button
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs px-1"
              onClick={(e) => { e.stopPropagation(); onDeleteClass(cls.id) }}
              title="Delete class"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>

      {/* Keyboard shortcut hint */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          <kbd className="bg-gray-100 border border-gray-300 rounded px-1 font-mono">Ctrl+K</kbd> to search
        </p>
      </div>
    </aside>
  )
}
