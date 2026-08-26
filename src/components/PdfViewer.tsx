import type { CSSProperties, ReactNode } from 'react'
import { Document, Page } from 'react-pdf'
import { usePdfViewer, type PdfViewerApi, type UsePdfViewerOptions } from '../hooks/usePdfViewer'
import type { PdfViewerLabels } from '../labels'
import type { PdfToolbarFeatures, PdfViewerClassNames, PdfViewerIcons } from '../types'
import { PdfError } from './PdfError'
import { PdfLoading } from './PdfLoading'
import { PdfThumbnails } from './PdfThumbnails'
import { PdfToolbar } from './toolbar/PdfToolbar'
import { IconButton } from './IconButton'
import { PdfUiProvider, usePdfUi } from './PdfUiContext'

export interface PdfViewerUiProps {
  /** Shown in the header. Omit both `name` and `onClose` to hide the header. */
  name?: string
  /** Replaces the header title, e.g. to truncate or annotate the name. */
  renderTitle?: (name: string) => ReactNode
  /** Renders a close button in the header. */
  onClose?: () => void
  /** Partial translations; missing keys fall back to English. */
  labels?: Partial<PdfViewerLabels>
  /** Per-slot classes, appended to the built-in ones. */
  classNames?: PdfViewerClassNames
  /** Class for the root element. */
  className?: string
  style?: CSSProperties
  /** Swap any icon for your own component. */
  icons?: Partial<PdfViewerIcons>
  /** Turn individual toolbar controls off. */
  features?: PdfToolbarFeatures
  /** Applies the bundled dark token set. */
  theme?: 'light' | 'dark'
  /** Extra controls appended to the right-hand toolbar group. */
  toolbarExtra?: ReactNode
  /** Replaces the entire toolbar. */
  renderToolbar?: (viewer: PdfViewerApi) => ReactNode
  renderLoading?: (progress: number | undefined) => ReactNode
  renderError?: (error: Error | null) => ReactNode
}

export interface PdfViewerFrameProps extends PdfViewerUiProps {
  /** A live instance from `usePdfViewer()`. */
  viewer: PdfViewerApi
}

/**
 * The default UI, driven by a viewer instance you own. Use it when you need the
 * state outside the component; otherwise `<PdfViewer>` creates one for you.
 */
export function PdfViewerFrame({
  viewer,
  labels,
  classNames,
  icons,
  ...props
}: PdfViewerFrameProps) {
  return (
    <PdfUiProvider labels={labels} classNames={classNames} icons={icons}>
      <Frame viewer={viewer} {...props} />
    </PdfUiProvider>
  )
}

type FrameProps = Omit<PdfViewerFrameProps, 'labels' | 'classNames' | 'icons'>

function Frame({
  viewer,
  name,
  renderTitle,
  onClose,
  className,
  style,
  features,
  theme,
  toolbarExtra,
  renderToolbar,
  renderLoading,
  renderError,
}: FrameProps) {
  const { slot, icons, labels } = usePdfUi()
  const CloseIcon = icons.close

  const showHeader = Boolean(name || onClose)
  const status = (node: ReactNode) => <div className="rpp-status">{node}</div>

  return (
    <div
      {...viewer.getRootProps()}
      data-rpp-theme={theme}
      className={slot('root', className)}
      style={style}
    >
      {showHeader && (
        <div className={slot('header')}>
          {name ? (
            <div className={slot('title')}>{renderTitle ? renderTitle(name) : name}</div>
          ) : (
            <span />
          )}
          {onClose && (
            <IconButton onClick={onClose} label={labels.close} className="rpp-close-button">
              <CloseIcon />
            </IconButton>
          )}
        </div>
      )}

      {viewer.isLoaded &&
        (renderToolbar ? (
          renderToolbar(viewer)
        ) : (
          <PdfToolbar viewer={viewer} features={features} extra={toolbarExtra} />
        ))}

      <Document
        {...viewer.getDocumentProps()}
        className="rpp-document"
        loading={status(
          renderLoading ? renderLoading(viewer.progress) : <PdfLoading progress={viewer.progress} />
        )}
        error={status(renderError ? renderError(viewer.error) : <PdfError />)}
        noData={status(renderError ? renderError(viewer.error) : <PdfError />)}
      >
        {viewer.sidebarOpen && (
          <PdfThumbnails
            pageNumbers={viewer.pageNumbers}
            currentPage={viewer.page}
            onSelect={viewer.goToPage}
          />
        )}

        <div {...viewer.getContainerProps()} className={slot('container', 'rpp-scroll')}>
          <div className={slot('pageList')}>
            {viewer.visiblePageNumbers.map(pageNumber => (
              <div
                key={pageNumber}
                {...viewer.getPageWrapperProps(pageNumber)}
                className={slot('pageWrapper')}
              >
                {viewer.shouldRenderPage(pageNumber) && (
                  <Page {...viewer.getPageProps(pageNumber)} className={slot('page')} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Document>
    </div>
  )
}

export interface PdfViewerProps extends UsePdfViewerOptions, PdfViewerUiProps {}

/**
 * Toolbar, thumbnails sidebar, search highlighting and fullscreen, themeable
 * through CSS custom properties. Give the parent a height; the viewer fills it.
 */
export function PdfViewer({
  // Pulling the UI props out leaves exactly the hook's options behind, so a new
  // option reaches usePdfViewer without being listed here.
  name,
  renderTitle,
  onClose,
  labels,
  classNames,
  className,
  style,
  icons,
  features,
  theme,
  toolbarExtra,
  renderToolbar,
  renderLoading,
  renderError,
  ...options
}: PdfViewerProps) {
  const viewer = usePdfViewer({
    ...options,
    downloadFilename: options.downloadFilename ?? name ?? 'document.pdf',
  })

  return (
    <PdfViewerFrame
      viewer={viewer}
      name={name}
      renderTitle={renderTitle}
      onClose={onClose}
      labels={labels}
      classNames={classNames}
      className={className}
      style={style}
      icons={icons}
      features={features}
      theme={theme}
      toolbarExtra={toolbarExtra}
      renderToolbar={renderToolbar}
      renderLoading={renderLoading}
      renderError={renderError}
    />
  )
}
