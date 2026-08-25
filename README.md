# react-pdf-previewer

A React PDF previewer built on `react-pdf` / `pdfjs-dist`. Toolbar (search,
zoom, rotate, print, download, fullscreen), a thumbnails sidebar, and its own
text-layer highlighting for search hits.

Headless-first: `usePdfViewer()` holds all state and behavior with no markup
of its own, and `<PdfViewer>` is one styled consumer of it. Styling is plain
CSS driven by custom properties — no Tailwind required, though a `classNames`
prop lets Tailwind users pass utilities straight in. No i18n or router
dependencies.

## Install

```bash
npm install react-pdf-previewer react react-dom react-pdf
```

`react-pdf` pins its own `pdfjs-dist` internally, so you do not install
`pdfjs-dist` or `lucide-react` yourself.

## Use

```tsx
import { PdfViewer } from 'react-pdf-previewer'
import 'react-pdf-previewer/styles.css'

function Preview() {
  return (
    <div style={{ height: 720 }}>
      <PdfViewer file="/report.pdf" name="Q3 report" onClose={() => console.log('closed')} />
    </div>
  )
}
```

`file` accepts a URL string or a `File` (from an `<input type="file">`).

**The viewer fills its parent, so the parent must have a height.** A percentage
height, a viewport unit, or a flex/grid track all work; an auto-height parent
leaves the viewer at its `min-height` of 16rem.

Only the pages near the viewport are mounted — the rest reserve their height
and render nothing, so a 200-page document costs a handful of canvases rather
than 200. Tune the margin with `overscan`.

## pdf.js worker

Point the viewer at a worker bundle before it mounts, or per-instance:

```tsx
<PdfViewer file={file} workerSrc="/pdf.worker.min.mjs" />
```

Self-hosting is recommended: copy `pdfjs-dist/build/pdf.worker.min.mjs` into
your public directory and pass its URL. Resolve it through `react-pdf` rather
than from the top of `node_modules` — `react-pdf` pins `pdfjs-dist` exactly and
does not hoist it, so under pnpm and Yarn PnP it is not there:

```js
const reactPdfDir = path.dirname(require.resolve('react-pdf'))
const worker = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs', { paths: [reactPdfDir] })
```

This also guarantees the worker matches the pdf.js build `react-pdf` uses; a
mismatched worker fails at runtime. See `scripts/copy-pdf-worker.mjs` in this
repo for a copy script you can lift.

Without `workerSrc`, the viewer falls back to a jsDelivr build matching your
installed `pdfjs-dist` version and logs a warning in development — fine for a
prototype, not for production.

To configure the worker once for the whole app instead of per-instance:

```ts
import { setPdfWorkerSrc } from 'react-pdf-previewer'
setPdfWorkerSrc('/pdf.worker.min.mjs')
```

## Props

| Prop                                                              | Type                          | Notes                                                        |
| ----------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `file`                                                            | `string \| File`              | Required. Remote URL or in-memory file.                      |
| `workerSrc`                                                       | `string`                      | pdf.js worker URL. See above.                                |
| `name`                                                            | `string`                      | Shown in the header and used as download filename.           |
| `renderTitle`                                                     | `(name: string) => ReactNode` | Replaces the header title, to truncate or annotate it.       |
| `downloadFilename`                                                | `string`                      | Overrides the download filename.                             |
| `onClose`                                                         | `() => void`                  | Adds a close button in the header.                           |
| `labels`                                                          | `Partial<PdfViewerLabels>`    | Override any of the English defaults.                        |
| `classNames`                                                      | `PdfViewerClassNames`         | Per-slot classes, appended to the built-in ones.             |
| `className`, `style`                                              | —                             | Applied to the root element.                                 |
| `icons`                                                           | `Partial<PdfViewerIcons>`     | Swap any bundled icon for your own component.                |
| `features`                                                        | `PdfToolbarFeatures`          | Turn individual toolbar controls off.                        |
| `theme`                                                           | `'light' \| 'dark'`           | Applies the bundled dark token set.                          |
| `toolbarExtra`                                                    | `ReactNode`                   | Extra controls appended to the toolbar.                      |
| `renderToolbar`                                                   | `(viewer) => ReactNode`       | Replaces the entire toolbar.                                 |
| `renderLoading`                                                   | `(progress) => ReactNode`     | Replaces the loading state.                                  |
| `renderError`                                                     | `(error) => ReactNode`        | Replaces the error state.                                    |
| `initialZoom`, `minScale`, `maxScale`, `scaleStep`, `pagePadding` | `number \| 'fit'` / `number`  | Zoom tuning — see `usePdfViewer` below.                      |
| `overscan`                                                        | `number`                      | Pages kept mounted either side of the viewport. Default `2`. |
| `onDocumentLoad`, `onDocumentError`, `onPageChange`               | callbacks                     | Document lifecycle hooks.                                    |

Omitting both `name` and `onClose` hides the header entirely.

Formatting the displayed name:

```tsx
<PdfViewer
  file={file}
  name="quarterly-report-2026-q3.pdf"
  renderTitle={name => <span title={name}>{name.replace(/\.pdf$/, '')}</span>}
/>
```

## Theming

Redefine tokens on any ancestor of the viewer — they inherit down:

```css
:root {
  --rpp-accent: #2563eb;
  --rpp-accent-bg: #eff6ff;
  --rpp-highlight: #93c5fd80;
  --rpp-radius: 10px;
  --rpp-font: 'Inter', system-ui, sans-serif;
}
```

Around 30 tokens cover color, spacing, radius, typography and shadows — see
the top of `styles.css` for the full list and their defaults. A bundled dark
palette is available via `theme="dark"` (or `data-rpp-theme="dark"` if you're
composing the pieces yourself); see `PdfViewerUiProps['theme']`.

Every element also carries a stable `.rpp-*` class, and the `classNames` prop
appends your own class per slot — so Tailwind utilities can be layered on top
without fighting the defaults. See `PdfViewerSlot` in `types.ts` for the full
list of slots.

## Icons

The bundled icons are a small inline SVG set with no dependency of their own.
Their shape (`{ className }`, drawn with `currentColor`) matches lucide-react
and Feather, so either can be passed straight through:

```tsx
import { Search, Download } from 'lucide-react'

;<PdfViewer file={file} icons={{ search: Search, download: Download }} />
```

## Localization

Pass a partial `labels` object — missing keys fall back to English:

```tsx
<PdfViewer
  file={file}
  labels={{
    close: 'Fermer',
    loading: 'Chargement du document…',
    results: ({ current, total }) => `${current} sur ${total}`,
  }}
/>
```

Full label list: see `DEFAULT_LABELS` in `labels.ts`.

## Headless usage

`usePdfViewer()` owns every piece of state — document, page, zoom, rotation,
search, fullscreen — and exposes prop getters to wire up your own markup:

```tsx
import { usePdfViewer } from 'react-pdf-previewer'
import { Document, Page } from 'react-pdf'

function CustomViewer({ file }: { file: string }) {
  const viewer = usePdfViewer({ file, workerSrc: '/pdf.worker.min.mjs' })

  return (
    <div {...viewer.getRootProps()}>
      <button onClick={viewer.previousPage} disabled={!viewer.canGoPrevious}>
        Prev
      </button>
      <span>
        {viewer.page} / {viewer.pageCount}
      </span>
      <button onClick={viewer.nextPage} disabled={!viewer.canGoNext}>
        Next
      </button>

      <Document {...viewer.getDocumentProps()}>
        <div {...viewer.getContainerProps()}>
          {viewer.pageNumbers.map(n => (
            // getPageWrapperProps reserves the height while the page is
            // unmounted, so skipping it does not move the scrollbar.
            <div key={n} {...viewer.getPageWrapperProps(n)}>
              {viewer.shouldRenderPage(n) && <Page {...viewer.getPageProps(n)} />}
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}
```

`<PdfViewerFrame viewer={viewer} {...uiProps} />` renders the built-in UI
against a viewer instance you already created — use it when you need the
state outside the component (e.g. driving a custom toolbar alongside it), the
same way `<PdfViewer>` does internally. See `PdfViewerApi` in
`hooks/usePdfViewer.ts` for the full returned shape.

## Files

- `hooks/usePdfViewer.ts` — all state and behavior, no markup
- `hooks/usePdfSearch.ts`, `useObjectUrl.ts`, `useFullscreen.ts`, `useElementWidth.ts` — the pieces `usePdfViewer` composes
- `components/PdfViewer.tsx` — `<PdfViewer>` and `<PdfViewerFrame>`
- `components/PdfToolbar.tsx` — pagination, zoom, rotate, print, download, search panel
- `components/PdfThumbnails.tsx` — sidebar
- `components/PdfLoading.tsx` — loading and error states
- `components/context.tsx` — slot/class/icon/label resolution shared by the styled components
- `worker.ts` — pdf.js worker setup
- `pdfjs-types.ts` — pdf.js types derived from react-pdf's own props
- `labels.ts`, `icons.tsx`, `types.ts` — customization surface
- `styles.css` — tokens, component styles, and the bundled pdf.js text-/annotation-layer CSS

## Example

`example/` is a small Vite app exercising the viewer end to end (search, zoom,
rotation, thumbnails, theming). It is a pnpm workspace package that depends on
`react-pdf-previewer` with `workspace:*`, so it resolves the built `dist/`
through the real exports map rather than a bundler alias — which means running
it also checks that the published entry points work.

```bash
pnpm install
pnpm run copy-worker
cp path/to/some.pdf example/public/sample.pdf
pnpm --dir example dev
```

`pnpm --dir example dev` rebuilds the package first, so the demo always runs
against current output. While iterating on `src/`, run the package in watch
mode in a second terminal so edits land without restarting Vite:

```bash
pnpm dev
```
