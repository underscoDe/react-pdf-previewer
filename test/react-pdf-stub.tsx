import { useEffect, type ReactNode } from 'react'

/**
 * Stand-in for react-pdf. It mirrors the parts this package touches: the pdfjs
 * namespace, and the three components whose callbacks drive the viewer's state.
 */

export const pdfjs = {
  GlobalWorkerOptions: { workerSrc: '' },
  version: '4.8.69',
}

interface MockPdfConfig {
  numPages: number
  originalWidth: number
  originalHeight: number
  /** When set, Document reports failure instead of success. */
  failWith: Error | null
}

const DEFAULTS: MockPdfConfig = {
  numPages: 3,
  originalWidth: 600,
  originalHeight: 800,
  failWith: null,
}

let config: MockPdfConfig = { ...DEFAULTS }

export function configureMockPdf(next: Partial<MockPdfConfig>): void {
  config = { ...config, ...next }
}

export function resetMockPdf(): void {
  config = { ...DEFAULTS }
  pdfjs.GlobalWorkerOptions.workerSrc = ''
}

interface DocumentStubProps {
  children?: ReactNode
  className?: string
  loading?: ReactNode
  error?: ReactNode
  noData?: ReactNode
  onLoadSuccess?: (pdf: { numPages: number }) => void
  onLoadError?: (error: Error) => void
  onItemClick?: (item: { pageNumber: number; pageIndex: number }) => void
}

export function Document({
  children,
  className,
  error,
  onLoadSuccess,
  onLoadError,
}: DocumentStubProps) {
  const { failWith, numPages } = config

  useEffect(() => {
    if (failWith) onLoadError?.(failWith)
    else onLoadSuccess?.({ numPages })
    // Fires once per document, the way react-pdf does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failWith, numPages])

  return (
    <div className={className} data-testid="document">
      {failWith ? error : children}
    </div>
  )
}

interface PageStubProps {
  pageNumber: number
  width?: number
  rotate?: number
  className?: string
  customTextRenderer?: (item: { str: string }) => string
  onLoadSuccess?: (page: { originalWidth: number; originalHeight: number }) => void
}

export function Page({ pageNumber, width, rotate, className, onLoadSuccess }: PageStubProps) {
  useEffect(() => {
    onLoadSuccess?.({
      originalWidth: config.originalWidth,
      originalHeight: config.originalHeight,
    })
  }, [onLoadSuccess])

  return (
    <div
      className={className}
      data-testid="page"
      data-page={pageNumber}
      data-width={width}
      data-rotate={rotate}
    />
  )
}

interface ThumbnailStubProps {
  pageNumber: number
  width?: number
  onItemClick?: (item: { pageNumber: number; pageIndex: number }) => void
}

export function Thumbnail({ pageNumber, onItemClick }: ThumbnailStubProps) {
  return (
    <a
      href="#"
      className="react-pdf__Thumbnail"
      data-testid="thumbnail"
      data-page={pageNumber}
      onClick={event => {
        event.preventDefault()
        onItemClick?.({ pageNumber, pageIndex: pageNumber - 1 })
      }}
    >
      page {pageNumber}
    </a>
  )
}
