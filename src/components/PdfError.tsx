import { usePdfUi } from './PdfUiContext'

export function PdfError() {
  const { slot, icons, labels } = usePdfUi()
  const ErrorIcon = icons.error

  return (
    <div className={slot('error')} role="alert">
      <span className="rpp-error-badge">
        <ErrorIcon />
      </span>
      <p className="rpp-error-message">{labels.loadError}</p>
    </div>
  )
}
