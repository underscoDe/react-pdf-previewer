import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PdfDocumentProxy, PdfItemClick, PdfLoadProgress, PdfPageProxy } from '../pdfjs-types'
import type { PdfSource, ZoomLevel } from '../types'
import { downloadFile, printFile } from '../browser'
import { clamp, escapeRegExp } from '../utils'
import { ensurePdfWorker } from '../worker'
import { useElementWidth } from './useElementWidth'
import { useFullscreen } from './useFullscreen'
import { useObjectUrl } from './useObjectUrl'
import { usePdfSearch } from './usePdfSearch'

const DEFAULTS = {
  minScale: 0.5,
  maxScale: 3,
  scaleStep: 0.25,
  pagePadding: 16,
  overscan: 2,
}

const QUARTER_TURN = 90
const FULL_TURN = 360

interface PageSize {
  width: number
  height: number
}

interface RenderRange {
  start: number
  end: number
}

export interface UsePdfViewerOptions {
  /** A remote URL, or a `File` which is wrapped in an object URL and revoked on unmount. */
  file: PdfSource
  /** pdf.js worker URL. Only needed if you have not configured one globally. */
  workerSrc?: string
  initialZoom?: ZoomLevel
  minScale?: number
  maxScale?: number
  scaleStep?: number
  /** Horizontal breathing room subtracted from the container when fitting pages. */
  pagePadding?: number
  /**
   * Pages to keep mounted on either side of the viewport. Raise it to trade
   * memory for fewer blanks when scrolling fast.
   */
  overscan?: number
  /** Filename used by the download action. */
  downloadFilename?: string
  onDocumentLoad?: (pdf: PdfDocumentProxy) => void
  onDocumentError?: (error: Error) => void
  onPageChange?: (page: number) => void
}

export interface PdfSearchApi {
  keyword: string
  setKeyword: (keyword: string) => void
  clear: () => void
  /** One entry per match, holding the page it sits on. */
  matchPages: number[]
  resultCount: number
  resultIndex: number
  isSearching: boolean
  goToResult: (index: number) => void
  nextResult: () => void
  previousResult: () => void
  /** Pass to a `<Page customTextRenderer>` to paint `<mark>` around hits. */
  highlightTextRenderer: ((item: { str: string }) => string) | undefined
}

export interface PdfViewerApi {
  // Document
  file: PdfSource
  fileUrl: string
  pdf: PdfDocumentProxy | null
  pageCount: number
  /** `[1, 2, …, pageCount]`, ready to map over. */
  pageNumbers: number[]
  isLoaded: boolean
  error: Error | null
  /** Download progress from 0 to 1, or `undefined` when not measurable. */
  progress: number | undefined

  // Navigation
  page: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean

  // Zoom
  zoom: ZoomLevel
  setZoom: (zoom: ZoomLevel) => void
  scale: number
  zoomPercent: number
  pageWidth: number
  /** Rendered page height at the current scale and rotation. */
  pageHeight: number
  zoomIn: () => void
  zoomOut: () => void
  canZoomIn: boolean
  canZoomOut: boolean

  // Rotation
  rotation: number
  rotate: () => void
  setRotation: (rotation: number) => void

  // Panels
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  isFullscreen: boolean
  toggleFullscreen: () => void

  search: PdfSearchApi

  // Actions
  download: () => Promise<void>
  print: () => void

  /**
   * Whether a page is close enough to the viewport to be worth mounting. Each
   * mounted page costs a canvas and a text layer, re-rasterized on every width
   * change.
   */
  shouldRenderPage: (pageNumber: number) => boolean

  // Wiring: spread these onto your own markup.
  getRootProps: () => { ref: (node: HTMLElement | null) => void }
  getContainerProps: () => { ref: (node: HTMLElement | null) => void }
  getDocumentProps: () => {
    file: PdfSource
    onLoadSuccess: (pdf: PdfDocumentProxy) => void
    onLoadError: (error: Error) => void
    onLoadProgress: (progress: PdfLoadProgress) => void
    onItemClick: (item: PdfItemClick) => void
  }
  /**
   * Reserves the page's height while it is unmounted, so the scrollbar stays
   * put. Pass `key` yourself: React rejects a spread object carrying one.
   */
  getPageWrapperProps: (pageNumber: number) => {
    ref: (node: HTMLDivElement | null) => void
    style: { height?: number }
  }
  getPageProps: (pageNumber: number) => {
    pageNumber: number
    width: number
    rotate: number
    customTextRenderer: ((item: { str: string }) => string) | undefined
    onLoadSuccess: (page: PdfPageProxy) => void
  }
}

/**
 * The viewer's state and behaviour, with no markup and no styling. Spread the
 * returned prop getters onto your own layout; `<PdfViewer>` is one such consumer.
 */
export function usePdfViewer(options: UsePdfViewerOptions): PdfViewerApi {
  const {
    file,
    workerSrc,
    initialZoom = 'fit',
    minScale = DEFAULTS.minScale,
    maxScale = DEFAULTS.maxScale,
    scaleStep = DEFAULTS.scaleStep,
    pagePadding = DEFAULTS.pagePadding,
    overscan = DEFAULTS.overscan,
    downloadFilename,
    onDocumentLoad,
    onDocumentError,
    onPageChange,
  } = options

  ensurePdfWorker(workerSrc)

  const rootRef = useRef<HTMLElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // State, not a ref: the scroll container only mounts once the document has
  // loaded, and effects that measure it must re-run when it appears.
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const [pdf, setPdf] = useState<PdfDocumentProxy | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState<ZoomLevel>(initialZoom)
  // Intrinsic size of the first page to load. Drives both true-to-size zoom
  // percentages and the height unmounted pages reserve.
  const [natural, setNatural] = useState<PageSize | null>(null)
  const [rotation, setRotation] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [keyword, setKeywordState] = useState('')
  const [resultIndex, setResultIndex] = useState(0)
  const [renderRange, setRenderRange] = useState<RenderRange>({ start: 1, end: 1 })
  // Tagged with its source so a previous document's finished bar never shows
  // while the next one downloads.
  const [progress, setProgress] = useState<{ source: PdfSource; value: number } | null>(null)

  const fileUrl = useObjectUrl(file)
  const { pages: matchPages, isSearching } = usePdfSearch(pdf, keyword)
  const baseWidth = useElementWidth(container, pagePadding * 2)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef)

  const fitScale = natural && baseWidth ? baseWidth / natural.width : 1
  const scale = zoom === 'fit' ? fitScale : zoom
  const pageWidth = (natural?.width ?? baseWidth) * scale

  const isQuarterTurned = rotation % 180 !== 0
  const aspect = natural
    ? isQuarterTurned
      ? natural.width / natural.height
      : natural.height / natural.width
    : 0
  const pageHeight = pageWidth * aspect

  // Read through refs so the action callbacks below stay referentially stable
  // even though they act on values that change on every scroll or zoom. Synced
  // after commit rather than during render, which concurrent rendering forbids;
  // the callbacks only ever run from event handlers, so they see fresh values.
  const pageRef = useRef(page)
  const scaleRef = useRef(scale)

  useEffect(() => {
    pageRef.current = page
    scaleRef.current = scale
  })

  const setRootNode = useCallback((node: HTMLElement | null) => {
    rootRef.current = node
  }, [])

  const setContainerNode = useCallback((node: HTMLElement | null) => setContainer(node), [])

  // Tracks which page the reader is looking at, and which ones are close enough
  // to be worth mounting.
  useEffect(() => {
    if (!container || pageCount === 0) return

    let frame = 0

    const update = () => {
      frame = 0
      const viewTop = container.getBoundingClientRect().top
      const viewBottom = viewTop + container.clientHeight
      const anchor = viewTop + container.clientHeight / 2

      let current = 1
      let first = 0
      let last = 0

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        const el = pageRefs.current.get(pageNumber)
        if (!el) continue

        const { top, bottom } = el.getBoundingClientRect()
        if (top > viewBottom) break
        if (bottom <= viewTop) continue

        if (!first) first = pageNumber
        last = pageNumber
        if (top <= anchor) current = pageNumber
      }

      if (!first) return

      setPage(current)
      setRenderRange(previous => {
        const start = Math.max(1, first - overscan)
        const end = Math.min(pageCount, last + overscan)
        return previous.start === start && previous.end === end ? previous : { start, end }
      })
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // A hidden tab runs no animation frames, so a scroll while backgrounded
    // would leave the window stale and its pages blank on return.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update()
    }

    update()
    container.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      container.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [container, pageCount, pageWidth, pageHeight, rotation, overscan])

  useEffect(() => {
    onPageChange?.(page)
  }, [page, onPageChange])

  const goToPage = useCallback(
    (target: number) => {
      const el = pageRefs.current.get(target)
      if (!container || !el) return

      const offset =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        pagePadding

      container.scrollTo({ top: offset, behavior: 'smooth' })
    },
    [container, pagePadding]
  )

  const nextPage = useCallback(() => goToPage(pageRef.current + 1), [goToPage])
  const previousPage = useCallback(() => goToPage(pageRef.current - 1), [goToPage])

  // Jump to the first hit as soon as a scan resolves.
  useEffect(() => {
    const first = matchPages[0]
    if (first !== undefined) goToPage(first)
  }, [matchPages, goToPage])

  // Stable, so a debounce in the consumer's search field survives re-renders.
  const setKeyword = useCallback((value: string) => {
    setKeywordState(value)
    setResultIndex(0)
  }, [])

  const clearSearch = useCallback(() => setKeyword(''), [setKeyword])

  const goToResult = useCallback(
    (index: number) => {
      const target = matchPages[index]
      if (target === undefined) return
      setResultIndex(index)
      goToPage(target)
    },
    [matchPages, goToPage]
  )

  const nextResult = useCallback(() => {
    if (matchPages.length === 0) return
    goToResult((resultIndex + 1) % matchPages.length)
  }, [goToResult, resultIndex, matchPages.length])

  const previousResult = useCallback(() => {
    if (matchPages.length === 0) return
    goToResult((resultIndex - 1 + matchPages.length) % matchPages.length)
  }, [goToResult, resultIndex, matchPages.length])

  // Built once per keyword, not once per text item. A dense page holds thousands.
  const highlightTextRenderer = useMemo(() => {
    if (!keyword) return undefined

    const regex = new RegExp(escapeRegExp(keyword), 'gi')
    return ({ str }: { str: string }) => str.replace(regex, match => `<mark>${match}</mark>`)
  }, [keyword])

  const zoomIn = useCallback(
    () => setZoom(clamp(scaleRef.current + scaleStep, minScale, maxScale)),
    [scaleStep, minScale, maxScale]
  )

  const zoomOut = useCallback(
    () => setZoom(clamp(scaleRef.current - scaleStep, minScale, maxScale)),
    [scaleStep, minScale, maxScale]
  )

  const rotate = useCallback(() => setRotation(current => (current + QUARTER_TURN) % FULL_TURN), [])

  const toggleSidebar = useCallback(() => setSidebarOpen(open => !open), [])

  const download = useCallback(
    () => downloadFile(fileUrl, downloadFilename ?? 'document.pdf'),
    [fileUrl, downloadFilename]
  )

  const print = useCallback(() => printFile(fileUrl), [fileUrl])

  const shouldRenderPage = useCallback(
    (pageNumber: number) => pageNumber >= renderRange.start && pageNumber <= renderRange.end,
    [renderRange]
  )

  const getRootProps = useCallback(() => ({ ref: setRootNode }), [setRootNode])
  const getContainerProps = useCallback(() => ({ ref: setContainerNode }), [setContainerNode])

  const getDocumentProps = useCallback(
    () => ({
      file,
      onLoadSuccess: (loaded: PdfDocumentProxy) => {
        setPdf(loaded)
        setPageCount(loaded.numPages)
        setError(null)
        onDocumentLoad?.(loaded)
      },
      onLoadError: (loadError: Error) => {
        setError(loadError)
        onDocumentError?.(loadError)
      },
      onLoadProgress: ({ loaded, total }: PdfLoadProgress) =>
        setProgress(total > 0 ? { source: file, value: loaded / total } : null),
      onItemClick: ({ pageNumber }: PdfItemClick) => goToPage(pageNumber),
    }),
    [file, goToPage, onDocumentLoad, onDocumentError]
  )

  const getPageWrapperProps = useCallback(
    (pageNumber: number) => ({
      ref: (node: HTMLDivElement | null) => {
        if (node) pageRefs.current.set(pageNumber, node)
        else pageRefs.current.delete(pageNumber)
      },
      style: shouldRenderPage(pageNumber) ? {} : { height: pageHeight },
    }),
    [shouldRenderPage, pageHeight]
  )

  const getPageProps = useCallback(
    (pageNumber: number) => ({
      pageNumber,
      width: pageWidth,
      rotate: rotation,
      customTextRenderer: highlightTextRenderer,
      // Every page reports in, but only the first to arrive is measured. The
      // rest are laid out from it.
      onLoadSuccess: ({ originalWidth, originalHeight }: PdfPageProxy) =>
        setNatural(current => current ?? { width: originalWidth, height: originalHeight }),
    }),
    [pageWidth, rotation, highlightTextRenderer]
  )

  const pageNumbers = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount]
  )

  const search = useMemo<PdfSearchApi>(
    () => ({
      keyword,
      setKeyword,
      clear: clearSearch,
      matchPages,
      resultCount: matchPages.length,
      resultIndex,
      isSearching,
      goToResult,
      nextResult,
      previousResult,
      highlightTextRenderer,
    }),
    [
      keyword,
      setKeyword,
      clearSearch,
      matchPages,
      resultIndex,
      isSearching,
      goToResult,
      nextResult,
      previousResult,
      highlightTextRenderer,
    ]
  )

  return {
    file,
    fileUrl,
    pdf,
    pageCount,
    pageNumbers,
    isLoaded: pageCount > 0,
    error,
    progress: progress?.source === file ? progress.value : undefined,

    page,
    goToPage,
    nextPage,
    previousPage,
    canGoNext: page < pageCount,
    canGoPrevious: page > 1,

    zoom,
    setZoom,
    scale,
    zoomPercent: Math.round(scale * 100),
    pageWidth,
    pageHeight,
    zoomIn,
    zoomOut,
    canZoomIn: scale < maxScale,
    canZoomOut: scale > minScale,

    rotation,
    rotate,
    setRotation,

    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isFullscreen,
    toggleFullscreen,

    search,

    download,
    print,
    shouldRenderPage,

    getRootProps,
    getContainerProps,
    getDocumentProps,
    getPageWrapperProps,
    getPageProps,
  }
}
