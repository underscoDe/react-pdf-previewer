import { useState } from 'react'
import type { PdfViewerApi } from '../../hooks/usePdfViewer'
import type { ZoomLevel } from '../../types'
import { usePdfUi } from '../PdfUiContext'

const ZOOM_PRESETS: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

export function ZoomMenu({ viewer }: { viewer: PdfViewerApi }) {
  const { slot, icons, labels } = usePdfUi()
  const [open, setOpen] = useState(false)
  const ChevronDown = icons.chevronDown

  const select = (level: ZoomLevel) => {
    viewer.setZoom(level)
    setOpen(false)
  }

  const levels: Array<{ value: ZoomLevel; text: string }> = [
    { value: 'fit', text: labels.fitWidth },
    { value: 'fit-page', text: labels.fitPage },
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
