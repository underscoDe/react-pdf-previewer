# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the version stays below 1.0, a minor bump may carry a breaking change; those
are always listed under Changed or Removed.

## [Unreleased]

## [0.1.0]

Initial release.

### Added

- `<PdfViewer>`, a viewer with a toolbar (search, pagination, zoom, rotate,
  print, download, fullscreen), a thumbnails sidebar, and search highlighting in
  the text layer.
- `usePdfViewer()`, holding all the state and behaviour with no markup, and
  `<PdfViewerFrame>` for driving the built-in UI from an instance you own.
- Theming through about 30 CSS custom properties, plus a bundled dark palette
  behind `theme="dark"`.
- Per-slot class injection with `classNames`, for Tailwind and other utility
  frameworks.
- `features` to turn individual toolbar controls off, and `toolbarExtra`,
  `renderToolbar`, `renderTitle`, `renderLoading` and `renderError` to replace
  parts outright.
- Swappable icons through `icons`, matching the shape lucide-react and Feather
  use. The bundled set is inline SVG, so the package needs no icon library.
- Localization through `labels`, with English defaults exported as
  `DEFAULT_LABELS`.
- Lazy page rendering: only pages near the viewport are mounted, the rest reserve
  their height. `overscan` tunes the band.
- `setPdfWorkerSrc()` and a `workerSrc` option, with a development-only CDN
  fallback and a warning when no worker is configured.
- Single-page view mode, alongside continuous scroll. Set it with the
  `initialViewMode` option (`'continuous'` | `'single'`), read and change it
  through `viewMode` / `setViewMode`, and toggle it from the toolbar (the
  `viewMode` feature flag, `singlePageView` / `continuousView` labels and
  icons). Single mode mounts only the current page.
- A `'fit-page'` zoom level, alongside `'fit'` (fit width). It scales a whole
  page into view, capping on whichever edge is tighter, and accounts for
  rotation. Available on `initialZoom`, `setZoom`, the `fitPage` label and the
  zoom menu.
- `visiblePageNumbers` on the viewer API (the pages the page list should render,
  which is just the current page in single mode) and a `useElementHeight` hook,
  the vertical counterpart to `useElementWidth`.

[unreleased]: https://github.com/underscoDe/react-pdf-previewer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/underscoDe/react-pdf-previewer/releases/tag/v0.1.0
