import { Thumbnail } from 'react-pdf'
import type { PdfItemClick } from '../pdfjs-types'
import { usePdfUi } from './context'

const THUMBNAIL_WIDTH = 148

export interface PdfThumbnailsProps {
  pageNumbers: number[]
  currentPage: number
  onSelect: (page: number) => void
}

// Thumbnail reads the PDF from the surrounding Document context, so nothing is
// parsed twice, and renders its own anchor — which is what keeps the list
// keyboard-navigable, and why the wrapper carries no click handler.
export function PdfThumbnails({ pageNumbers, currentPage, onSelect }: PdfThumbnailsProps) {
  const { slot } = usePdfUi()

  return (
    <div className={slot('sidebar', 'rpp-scroll', 'rpp-slide-in')}>
      {pageNumbers.map(pageNumber => (
        <div
          key={pageNumber}
          className={slot('thumbnail')}
          data-active={currentPage === pageNumber ? 'true' : undefined}
          aria-current={currentPage === pageNumber ? 'page' : undefined}
        >
          <Thumbnail
            pageNumber={pageNumber}
            width={THUMBNAIL_WIDTH}
            onItemClick={({ pageNumber: target }: PdfItemClick) => onSelect(target)}
          />
          <p className={slot('thumbnailLabel')}>{pageNumber}</p>
        </div>
      ))}
    </div>
  )
}
