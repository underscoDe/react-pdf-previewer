import { usePdfUi } from './context'

export interface PdfLoadingProps {
  /** 0 to 1, or `undefined` when the total size is unknown. */
  progress?: number
}

export function PdfLoading({ progress }: PdfLoadingProps) {
  const { slot, icons, labels } = usePdfUi()
  const percent = progress === undefined ? null : Math.round(progress * 100)
  const FileIcon = icons.file

  return (
    <div className={slot('loading')}>
      <div className="rpp-loading-badge">
        <span className="rpp-loading-pulse" />
        <span className="rpp-loading-icon">
          <FileIcon />
        </span>
      </div>

      <div className="rpp-loading-body">
        <p className="rpp-loading-label">{labels.loading}</p>

        <div
          className="rpp-progress"
          role="progressbar"
          aria-label={labels.loading}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
        >
          {percent === null ? (
            <span className="rpp-progress-sweep" />
          ) : (
            <span className="rpp-progress-bar" style={{ width: `${percent}%` }} />
          )}
        </div>

        {percent !== null && <p className="rpp-progress-percent">{percent}%</p>}
      </div>
    </div>
  )
}

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
