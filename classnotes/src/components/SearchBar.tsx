import React, { forwardRef, useEffect, useRef } from 'react'

interface SearchBarProps {
  query: string
  isLoading: boolean
  onSearch: (query: string) => void
  onClear: () => void
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ query, isLoading, onSearch, onClear }, ref) => {
    const [value, setValue] = React.useState(query)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      setValue(query)
    }, [query])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value
      setValue(nextValue)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (!nextValue.trim()) {
        onClear()
        return
      }
      debounceTimer.current = setTimeout(() => {
        onSearch(nextValue)
      }, 300)
    }

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
      }
    }, [])

    return (
      <div className="relative">
        {/* Magnifier icon */}
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          🔍
        </span>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Search notes…"
          className="w-full pl-8 pr-7 py-1.5 text-sm bg-white border border-gray-200 rounded-md
                     text-gray-800 placeholder-gray-400 outline-none
                     focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClear();
              (e.target as HTMLInputElement).blur()
            }
          }}
        />

        {/* Loading / clear button */}
        {isLoading ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-spin">
            ◌
          </span>
        ) : value ? (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            onClick={() => {
              setValue('')
              onClear()
            }}
            tabIndex={-1}
          >
            ✕
          </button>
        ) : null}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'
export default SearchBar
