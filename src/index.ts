// Styled components: the batteries-included path.
export { PdfViewer, PdfViewerFrame } from './components/PdfViewer'
export type { PdfViewerProps, PdfViewerFrameProps, PdfViewerUiProps } from './components/PdfViewer'
export { PdfToolbar } from './components/toolbar/PdfToolbar'
export type { PdfToolbarProps } from './components/toolbar/PdfToolbar'
export { PdfThumbnails } from './components/PdfThumbnails'
export type { PdfThumbnailsProps } from './components/PdfThumbnails'
export { PdfLoading } from './components/PdfLoading'
export { PdfError } from './components/PdfError'
export type { PdfLoadingProps } from './components/PdfLoading'
export { IconButton } from './components/IconButton'
export type { IconButtonProps } from './components/IconButton'
export { Spinner } from './components/Spinner'

// Headless: all of the behaviour, none of the markup.
export { usePdfViewer } from './hooks/usePdfViewer'
export type { UsePdfViewerOptions, PdfViewerApi, PdfSearchApi } from './hooks/usePdfViewer'
export { usePdfSearch } from './hooks/usePdfSearch'
export type { PdfSearchResult } from './hooks/usePdfSearch'
export { useObjectUrl } from './hooks/useObjectUrl'
export { useFullscreen } from './hooks/useFullscreen'
export type { FullscreenApi } from './hooks/useFullscreen'
export { useElementWidth } from './hooks/useElementWidth'
export { useElementHeight } from './hooks/useElementHeight'

// pdf.js worker configuration.
export { setPdfWorkerSrc, defaultPdfWorkerSrc, ensurePdfWorker } from './worker'

// pdf.js handles, derived from react-pdf so they always match its own copy.
export type { PdfDocumentProxy, PdfPageProxy, PdfLoadProgress, PdfItemClick } from './pdfjs-types'

// Customization surface.
export { DEFAULT_LABELS } from './labels'
export type { PdfViewerLabels } from './labels'
export { DEFAULT_ICONS } from './icons'
export type {
  PdfSource,
  ZoomLevel,
  ViewMode,
  PdfViewerSlot,
  PdfViewerClassNames,
  PdfViewerIcons,
  PdfIconProps,
  PdfIconComponent,
  PdfToolbarFeatures,
} from './types'
