import { Fragment, useEffect, useState, type ReactNode } from 'react'
import type { PdfViewerApi } from '../hooks/usePdfViewer'
import type { PdfToolbarFeatures, ZoomLevel } from '../types'
import { IconButton, type IconButtonProps } from './IconButton'
import { Spinner } from './Spinner'
import { usePdfUi } from './context'

const ZOOM_PRESETS: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]
const SEARCH_DEBOUNCE_MS = 300

function ToolbarButton(props: IconButtonProps) {
  const { slot } = usePdfUi()
  return <IconButton {...props} className={slot('button', props.className)} />
}

function Separator() {
  const { slot } = usePdfUi()
  return <span className={slot('separator')} aria-hidden="true" />
}

/** Renders the groups that have controls, separated by a rule. */
function ToolbarGroup({ items }: { items: Array<{ key: string; node: ReactNode }> }) {
  const { slot } = usePdfUi()
  const visible = items.filter(item => item.node)

  if (visible.length === 0) return null

  return (
    <div className={slot('toolbarGroup')}>
      {visible.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 && <Separator />}
          {item.node}
        </Fragment>
      ))}
    </div>
  )
}

function PageInput({ viewer }: { viewer: PdfViewerApi }) {
  const { slot, labels } = usePdfUi()

  const commit = (input: HTMLInputElement) => {
    const target = Number(input.value)
    if (Number.isInteger(target) && target >= 1 && target <= viewer.pageCount) {
      viewer.goToPage(target)
    } else {
      input.value = String(viewer.page)
    }
  }

  return (
    <div className="rpp-page-input-wrap">
      <input
        // Remounts on page change so the uncontrolled value follows scrolling.
        key={viewer.page}
        type="text"
        inputMode="numeric"
        defaultValue={String(viewer.page)}
        aria-label={labels.goToPage}
        onBlur={event => commit(event.target)}
        onKeyDown={event => {
          if (event.key === 'Enter') commit(event.currentTarget)
        }}
        className={slot('pageInput')}
      />
      <span className={slot('pageCount')}>/ {viewer.pageCount}</span>
    </div>
  )
}

function ZoomMenu({ viewer }: { viewer: PdfViewerApi }) {
  const { slot, icons, labels } = usePdfUi()
  const [open, setOpen] = useState(false)
  const ChevronDown = icons.chevronDown

  const select = (level: ZoomLevel) => {
    viewer.setZoom(level)
    setOpen(false)
  }

  const levels: Array<{ value: ZoomLevel; text: string }> = [
    { value: 'fit', text: labels.fitWidth },
    ...ZOOM_PRESETS.map(level => ({ value: level, text: `${level * 100}%` })),
  ]

  return (
    <div className="rpp-zoom" onKeyDown={event => event.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={slot('zoomTrigger')}
      >
        {viewer.zoomPercent}%
        <ChevronDown />
      </button>

      {open && (
        <>
          <div className="rpp-zoom-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul className={slot('zoomMenu', 'rpp-slide-down')} role="menu">
            {levels.map(({ value, text }) => (
              <li key={String(value)}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => select(value)}
                  data-active={viewer.zoom === value ? 'true' : undefined}
                  className={slot('zoomMenuItem')}
                >
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function SearchPanel({ viewer, onClose }: { viewer: PdfViewerApi; onClose: () => void }) {
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

export interface PdfToolbarProps {
  viewer: PdfViewerApi
  features?: PdfToolbarFeatures
  /** Appended to the right-hand group, after the built-in controls. */
  extra?: ReactNode
}

export function PdfToolbar({ viewer, features, extra }: PdfToolbarProps) {
  const { slot, icons, labels } = usePdfUi()
  const [searchOpen, setSearchOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const enabled = (feature: keyof PdfToolbarFeatures) => features?.[feature] ?? true

  const closeSearch = () => {
    setSearchOpen(false)
    viewer.search.clear()
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await viewer.download()
    } finally {
      setIsDownloading(false)
    }
  }

  const SearchIcon = icons.search
  const ChevronUp = icons.chevronUp
  const ChevronDown = icons.chevronDown
  const ZoomOutIcon = icons.zoomOut
  const ZoomInIcon = icons.zoomIn
  const RotateIcon = icons.rotate
  const PrintIcon = icons.print
  const DownloadIcon = icons.download
  const ThumbnailsIcon = icons.thumbnails
  const FullscreenIcon = viewer.isFullscreen ? icons.exitFullscreen : icons.fullscreen

  const documentActions = [
    enabled('rotate') && (
      <ToolbarButton key="rotate" onClick={viewer.rotate} label={labels.rotate}>
        <RotateIcon />
      </ToolbarButton>
    ),
    enabled('print') && (
      <ToolbarButton key="print" onClick={viewer.print} label={labels.print}>
        <PrintIcon />
      </ToolbarButton>
    ),
    enabled('download') && (
      <ToolbarButton
        key="download"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        label={labels.download}
      >
        {isDownloading ? <Spinner /> : <DownloadIcon />}
      </ToolbarButton>
    ),
  ].filter(Boolean)

  return (
    <div className={slot('toolbar')}>
      <div className="rpp-toolbar-row">
        <ToolbarGroup
          items={[
            {
              key: 'panels',
              node: (enabled('thumbnails') || enabled('search')) && (
                <>
                  {enabled('thumbnails') && (
                    <ToolbarButton
                      onClick={viewer.toggleSidebar}
                      label={labels.thumbnails}
                      active={viewer.sidebarOpen}
                    >
                      <ThumbnailsIcon />
                    </ToolbarButton>
                  )}
                  {enabled('search') && (
                    <ToolbarButton
                      onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                      label={labels.search}
                      active={searchOpen}
                    >
                      <SearchIcon />
                    </ToolbarButton>
                  )}
                </>
              ),
            },
            {
              key: 'pagination',
              node: enabled('pagination') && (
                <>
                  <ToolbarButton
                    onClick={viewer.previousPage}
                    disabled={!viewer.canGoPrevious}
                    label={labels.previousPage}
                  >
                    <ChevronUp />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={viewer.nextPage}
                    disabled={!viewer.canGoNext}
                    label={labels.nextPage}
                  >
                    <ChevronDown />
                  </ToolbarButton>
                  <PageInput viewer={viewer} />
                </>
              ),
            },
          ]}
        />

        <ToolbarGroup
          items={[
            {
              key: 'zoom',
              node: enabled('zoom') && (
                <>
                  <ToolbarButton
                    onClick={viewer.zoomOut}
                    disabled={!viewer.canZoomOut}
                    label={labels.zoomOut}
                  >
                    <ZoomOutIcon />
                  </ToolbarButton>
                  <ZoomMenu viewer={viewer} />
                  <ToolbarButton
                    onClick={viewer.zoomIn}
                    disabled={!viewer.canZoomIn}
                    label={labels.zoomIn}
                  >
                    <ZoomInIcon />
                  </ToolbarButton>
                </>
              ),
            },
            { key: 'actions', node: documentActions.length > 0 && documentActions },
            {
              key: 'fullscreen',
              node: enabled('fullscreen') && (
                <ToolbarButton
                  onClick={viewer.toggleFullscreen}
                  label={viewer.isFullscreen ? labels.exitFullscreen : labels.fullscreen}
                  active={viewer.isFullscreen}
                >
                  <FullscreenIcon />
                </ToolbarButton>
              ),
            },
            { key: 'extra', node: extra },
          ]}
        />
      </div>

      {enabled('search') && searchOpen && <SearchPanel viewer={viewer} onClose={closeSearch} />}
    </div>
  )
}
