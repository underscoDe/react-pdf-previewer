import type { ComponentType } from 'react'

/** Sizes pages to the viewer width (`'fit'`) or to an absolute scale factor. */
export type ZoomLevel = number | 'fit'

/** A remote URL or an in-memory file, e.g. from an `<input type="file">`. */
export type PdfSource = string | File

/**
 * Styleable parts of the built-in UI. Classes passed per slot via `classNames`
 * are appended to the defaults, not substituted for them.
 */
export type PdfViewerSlot =
  | 'root'
  | 'header'
  | 'title'
  | 'toolbar'
  | 'toolbarGroup'
  | 'button'
  | 'separator'
  | 'pageInput'
  | 'pageCount'
  | 'zoomTrigger'
  | 'zoomMenu'
  | 'zoomMenuItem'
  | 'searchPanel'
  | 'searchField'
  | 'searchInput'
  | 'searchStatus'
  | 'sidebar'
  | 'thumbnail'
  | 'thumbnailLabel'
  | 'container'
  | 'pageList'
  | 'pageWrapper'
  | 'page'
  | 'loading'
  | 'error'

export type PdfViewerClassNames = Partial<Record<PdfViewerSlot, string>>

/** Icons paint with `currentColor`; the surrounding button owns size and color. */
export interface PdfIconProps {
  className?: string
}

export type PdfIconComponent = ComponentType<PdfIconProps>

/** Override any icon; unset keys keep the bundled SVG. */
export interface PdfViewerIcons {
  chevronDown: PdfIconComponent
  chevronUp: PdfIconComponent
  close: PdfIconComponent
  download: PdfIconComponent
  error: PdfIconComponent
  file: PdfIconComponent
  fullscreen: PdfIconComponent
  exitFullscreen: PdfIconComponent
  print: PdfIconComponent
  rotate: PdfIconComponent
  search: PdfIconComponent
  thumbnails: PdfIconComponent
  x: PdfIconComponent
  zoomIn: PdfIconComponent
  zoomOut: PdfIconComponent
}

/** Which toolbar controls to render. All default to `true`. */
export interface PdfToolbarFeatures {
  search?: boolean
  pagination?: boolean
  zoom?: boolean
  rotate?: boolean
  print?: boolean
  download?: boolean
  fullscreen?: boolean
  thumbnails?: boolean
}
