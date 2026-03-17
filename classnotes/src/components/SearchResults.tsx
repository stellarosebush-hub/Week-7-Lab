import React, { useEffect, useRef, useState } from 'react'
import type { SearchResult } from '../types'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onSelect: (result: SearchResult) => void
  onClose: () => void
}

// Strip all HTML except <mark> tags to prevent XSS
function sanitizeSnippet(raw: string): string {
  return raw.replace(/<(?!\/?mark\b)[^>]+>/gi, '')
}

export default function SearchResults({ results, query, onSelect, onClose }: SearchResultsProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  // Reset active index when results change
  useEffect(() => setActiveIdx(0), [results])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[activeIdx]) {
        onSelect(results[activeIdx])
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [results, activeIdx, onSelect, onClose])

  if (results.length === 0 && query.trim()) {
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg text-sm text-gray-500 px-4 py-3">
        No notes match &ldquo;{query}&rdquo;
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <ul
      ref={listRef}
      className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto"
      role="listbox"
    >
      {results.map((result, idx) => (
        <li
          key={result.noteId}
          role="option"
          aria-selected={idx === activeIdx}
          className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
            idx === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(result)}
          onMouseEnter={() => setActiveIdx(idx)}
        >
          {/* Class badge */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: result.classColor }}
            />
            <span className="text-xs text-gray-500 font-medium">{result.className}</span>
          </div>

          {/* Note title */}
          <p className="text-sm font-semibold text-gray-800 truncate">{result.title}</p>

          {/* Snippet with highlighted terms */}
          <p
            className="text-xs text-gray-500 mt-0.5 line-clamp-2"
            // Safe: we strip all tags except <mark> in sanitizeSnippet
            dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet) }}
          />
        </li>
      ))}
    </ul>
  )
}
