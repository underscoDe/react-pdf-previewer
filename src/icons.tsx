import type { ReactNode } from 'react'
import type { PdfIconProps, PdfViewerIcons } from './types'

// A 24x24 stroked set, so the package needs no icon library of its own. The
// shape matches lucide-react and Feather, which can be passed to `icons` as-is.
function Icon({ className, children }: PdfIconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

const ChevronDown = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

const ChevronUp = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="m18 15-6-6-6 6" />
  </Icon>
)

const CircleX = (props: PdfIconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </Icon>
)

const Download = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Icon>
)

const FileText = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </Icon>
)

const FileWarning = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
)

const LayoutGrid = (props: PdfIconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Icon>
)

const SinglePage = (props: PdfIconProps) => (
  <Icon {...props}>
    <rect x="6" y="3" width="12" height="18" rx="1" />
  </Icon>
)

const ContinuousView = (props: PdfIconProps) => (
  <Icon {...props}>
    <rect x="6" y="2" width="12" height="9" rx="1" />
    <rect x="6" y="13" width="12" height="9" rx="1" />
  </Icon>
)

const Maximize = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
)

const Minimize = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </Icon>
)

const Printer = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Icon>
)

const RotateCw = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
)

const Search = (props: PdfIconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
)

const X = (props: PdfIconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
)

const ZoomIn = (props: PdfIconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </Icon>
)

const ZoomOut = (props: PdfIconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M8 11h6" />
  </Icon>
)

export const DEFAULT_ICONS: PdfViewerIcons = {
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  close: CircleX,
  download: Download,
  error: FileWarning,
  file: FileText,
  fullscreen: Maximize,
  exitFullscreen: Minimize,
  print: Printer,
  rotate: RotateCw,
  search: Search,
  thumbnails: LayoutGrid,
  singlePage: SinglePage,
  continuousView: ContinuousView,
  x: X,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
}
