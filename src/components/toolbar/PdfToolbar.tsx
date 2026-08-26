import { useState, type ReactNode } from 'react'
import type { PdfViewerApi } from '../../hooks/usePdfViewer'
import type { PdfToolbarFeatures } from '../../types'
import { Spinner } from '../Spinner'
import { usePdfUi } from '../PdfUiContext'
import { PageInput } from './PageInput'
import { SearchPanel } from './SearchPanel'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarGroup } from './ToolbarGroup'
import { ZoomMenu } from './ZoomMenu'

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
  const isSingle = viewer.viewMode === 'single'
  const ViewModeIcon = isSingle ? icons.continuousView : icons.singlePage

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
            {
              key: 'viewMode',
              node: enabled('viewMode') && (
                <ToolbarButton
                  onClick={() => viewer.setViewMode(isSingle ? 'continuous' : 'single')}
                  label={isSingle ? labels.continuousView : labels.singlePageView}
                  active={isSingle}
                >
                  <ViewModeIcon />
                </ToolbarButton>
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
