import type { PdfViewerApi } from '../../hooks/usePdfViewer'
import { usePdfUi } from '../PdfUiContext'

export function PageInput({ viewer }: { viewer: PdfViewerApi }) {
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
