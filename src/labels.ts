/** User-facing strings; override any subset via the `labels` prop. */
export interface PdfViewerLabels {
  close: string
  loading: string
  loadError: string
  fitWidth: string
  fitPage: string
  goToPage: string
  singlePageView: string
  continuousView: string
  search: string
  searchPlaceholder: string
  clearSearch: string
  searching: string
  noResults: string
  // Rendered as "1 of 12"; a function so callers can localize pluralization.
  results: (params: { current: number; total: number }) => string
  previousResult: string
  nextResult: string
  previousPage: string
  nextPage: string
  zoomIn: string
  zoomOut: string
  rotate: string
  print: string
  download: string
  thumbnails: string
  fullscreen: string
  exitFullscreen: string
}

export const DEFAULT_LABELS: PdfViewerLabels = {
  close: 'Close',
  loading: 'Loading document…',
  loadError: 'The document could not be loaded.',
  fitWidth: 'Fit width',
  fitPage: 'Fit page',
  goToPage: 'Go to page',
  singlePageView: 'Single page',
  continuousView: 'Continuous',
  search: 'Search',
  searchPlaceholder: 'Search in document',
  clearSearch: 'Clear search',
  searching: 'Searching…',
  noResults: 'No results',
  results: ({ current, total }) => `${current} of ${total}`,
  previousResult: 'Previous result',
  nextResult: 'Next result',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  rotate: 'Rotate',
  print: 'Print',
  download: 'Download',
  thumbnails: 'Thumbnails',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
}
