import React from 'react'

export default function WelcomePage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full text-center select-none">
      <div className="max-w-sm">
        <div className="text-5xl mb-4">📓</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to ClassNotes</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Select a class from the sidebar to view your notes, or create a new class to get started.
        </p>
        <p className="text-xs text-gray-400">
          Press <kbd className="bg-gray-100 border border-gray-300 rounded px-1 font-mono">Ctrl+K</kbd> anytime to search across all your notes.
        </p>
      </div>
    </div>
  )
}
