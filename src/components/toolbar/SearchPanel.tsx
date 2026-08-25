import { useEffect, useState } from 'react'
import type { PdfViewerApi } from '../../hooks/usePdfViewer'
import { IconButton } from '../IconButton'
import { usePdfUi } from '../PdfUiContext'
import { ToolbarButton } from './ToolbarButton'

const SEARCH_DEBOUNCE_MS = 300

export function SearchPanel({ viewer, onClose }: { viewer: PdfViewerApi; onClose: () => void }) {
  const { slot, icons, labels } = usePdfUi()
  const { search } = viewer
  // Pulled out so the debounce below depends on the stable setter rather than
  // the search object, which changes as results come in and would restart it.
  const { setKeyword } = search
  const [input, setInput] = useState(search.keyword)

  const SearchIcon = icons.search
  const XIcon = icons.x
  const ChevronUp = icons.chevronUp
  const ChevronDown = icons.chevronDown

  const isPending = search.isSearching || input !== search.keyword

  // Searching as you type means clearing the field also clears the highlights,
  // which submit-only never would.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(input), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, setKeyword])

  return (
    <div className={slot('searchPanel', 'rpp-slide-down')}>
      <div className={slot('searchField')}>
        <SearchIcon />
        <input
          autoFocus
          type="text"
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') onClose()
            if (event.key === 'Enter') search.nextResult()
          }}
          placeholder={labels.searchPlaceholder}
          className={slot('searchInput')}
        />
        {input && (
          <IconButton
            onClick={() => setInput('')}
            label={labels.clearSearch}
            className="rpp-search-clear"
          >
            <XIcon />
          </IconButton>
        )}
      </div>

      {input && (
        <div className="rpp-search-results">
          <span className={slot('searchStatus')} role="status">
            {isPending
              ? labels.searching
              : search.resultCount > 0
                ? labels.results({ current: search.resultIndex + 1, total: search.resultCount })
                : labels.noResults}
          </span>
          {!isPending && search.resultCount > 0 && (
            <>
              <ToolbarButton onClick={search.previousResult} label={labels.previousResult}>
                <ChevronUp />
              </ToolbarButton>
              <ToolbarButton onClick={search.nextResult} label={labels.nextResult}>
                <ChevronDown />
              </ToolbarButton>
            </>
          )}
        </div>
      )}

      <ToolbarButton onClick={onClose} label={labels.close}>
        <XIcon />
      </ToolbarButton>
    </div>
  )
}
