# react-pdf-previewer

A React PDF previewer built on `react-pdf` and `pdfjs-dist`. It ships a toolbar
(search, zoom, rotate, print, download, fullscreen), a thumbnails sidebar, and
its own text layer highlighting for search hits.

The package is headless first. `usePdfViewer()` holds all the state and
behaviour with no markup of its own, and `<PdfViewer>` is one styled consumer of
it. Styling is plain CSS driven by custom properties, so Tailwind is not
required, though a `classNames` prop lets Tailwind users pass utilities straight
in. There are no i18n or router dependencies, and no icon library.

## Install

```bash
npm install react-pdf-previewer react react-dom react-pdf
```

`react-pdf` depends on an exact `pdfjs-dist` internally, so you do not install
`pdfjs-dist` yourself.

## Quick start

```tsx
import { PdfViewer } from 'react-pdf-previewer'
import 'react-pdf-previewer/styles.css'

function Preview() {
  return (
    <div style={{ height: 720 }}>
      <PdfViewer file="/report.pdf" name="Q3 report" workerSrc="/pdf.worker.min.mjs" />
    </div>
  )
}
```

`file` accepts a URL string or a `File` from an `<input type="file">`. A `File`
is wrapped in an object URL that is revoked when the file changes or the
component unmounts.

Two things to know before you go further:

**The viewer fills its parent, so the parent needs a height.** A percentage
height, a viewport unit, or a flex or grid track all work. An auto height parent
leaves the viewer at its `min-height` of `16rem`.

**Only the pages near the viewport are mounted.** The rest reserve their height
and render nothing, so a 200 page document costs a handful of canvases instead
of 200. Widen the band with `overscan`.

## pdf.js worker

pdf.js parses documents in a web worker, and you have to tell it where that
worker lives. Pass it per instance:

```tsx
<PdfViewer file={file} workerSrc="/pdf.worker.min.mjs" />
```

Or configure it once for the whole app, before the first viewer mounts:

```ts
import { setPdfWorkerSrc } from 'react-pdf-previewer'

setPdfWorkerSrc('/pdf.worker.min.mjs')
```

Self hosting is recommended. Copy `pdfjs-dist/build/pdf.worker.min.mjs` into
your public directory, resolving it **through `react-pdf`** rather than from the
top of `node_modules`:

```js
const reactPdfDir = path.dirname(require.resolve('react-pdf'))
const worker = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs', { paths: [reactPdfDir] })
```

This matters for two reasons. `react-pdf` pins `pdfjs-dist` exactly and does not
hoist it, so under pnpm or Yarn PnP it is not at the top of `node_modules` at
all. And resolving it this way guarantees the worker matches the pdf.js build
`react-pdf` actually uses; a mismatched worker fails at runtime.
`scripts/copy-pdf-worker.mjs` in this repo is a working copy script you can
lift.

If you omit `workerSrc` and nothing else has configured a worker, the viewer
falls back to a jsDelivr build matching your installed `pdfjs-dist` version and
logs a warning in development. That is fine for a prototype and wrong for
production.

## Props

`<PdfViewer>` takes every option `usePdfViewer()` accepts, plus the UI props
below.

### Document

| Prop               | Type                     | Notes                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------ |
| `file`             | `string \| File`         | Required. Remote URL or in memory file.                |
| `workerSrc`        | `string`                 | pdf.js worker URL. See above.                          |
| `downloadFilename` | `string`                 | Overrides the download filename. Falls back to `name`. |
| `onDocumentLoad`   | `(pdf) => void`          | Fires once the document is parsed.                     |
| `onDocumentError`  | `(error: Error) => void` | Fires when loading fails.                              |
| `onPageChange`     | `(page: number) => void` | Fires as the reader scrolls between pages.             |

### Header

| Prop          | Type                          | Notes                                                  |
| ------------- | ----------------------------- | ------------------------------------------------------ |
| `name`        | `string`                      | Shown in the header, and used as download filename.    |
| `renderTitle` | `(name: string) => ReactNode` | Replaces the header title, to truncate or annotate it. |
| `onClose`     | `() => void`                  | Adds a close button in the header.                     |

Omitting both `name` and `onClose` hides the header entirely.

### Appearance

| Prop         | Type                       | Notes                                            |
| ------------ | -------------------------- | ------------------------------------------------ |
| `classNames` | `PdfViewerClassNames`      | Per slot classes, appended to the built in ones. |
| `className`  | `string`                   | Applied to the root element.                     |
| `style`      | `CSSProperties`            | Applied to the root element.                     |
| `theme`      | `'light' \| 'dark'`        | Applies the bundled dark token set.              |
| `icons`      | `Partial<PdfViewerIcons>`  | Swap any bundled icon for your own component.    |
| `labels`     | `Partial<PdfViewerLabels>` | Override any of the English defaults.            |

### Layout and behaviour

| Prop            | Type                      | Default | Notes                                           |
| --------------- | ------------------------- | ------- | ----------------------------------------------- |
| `features`      | `PdfToolbarFeatures`      | all on  | Turn individual toolbar controls off.           |
| `toolbarExtra`  | `ReactNode`               |         | Extra controls appended to the toolbar.         |
| `renderToolbar` | `(viewer) => ReactNode`   |         | Replaces the entire toolbar.                    |
| `renderLoading` | `(progress) => ReactNode` |         | Replaces the loading state.                     |
| `renderError`   | `(error) => ReactNode`    |         | Replaces the error state.                       |
| `initialZoom`   | `number \| 'fit'`         | `'fit'` | Starting zoom.                                  |
| `minScale`      | `number`                  | `0.5`   | Lower zoom bound.                               |
| `maxScale`      | `number`                  | `3`     | Upper zoom bound.                               |
| `scaleStep`     | `number`                  | `0.25`  | Step for the zoom in and out buttons.           |
| `pagePadding`   | `number`                  | `16`    | Horizontal room subtracted when fitting pages.  |
| `overscan`      | `number`                  | `2`     | Pages kept mounted either side of the viewport. |

## Customizing

There are four levels, from a one line change to owning the markup outright.
Pick the lowest one that does the job.

### 1. Design tokens

Everything visual is driven by custom properties. Redefine them on any ancestor
of the viewer and they inherit down:

```css
:root {
  --rpp-accent: #2563eb;
  --rpp-accent-bg: #eff6ff;
  --rpp-highlight: #93c5fd80;
  --rpp-radius: 10px;
  --rpp-font: 'Inter', system-ui, sans-serif;
}
```

The full set, with their defaults at the top of `styles.css`:

| Group      | Tokens                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| Accent     | `--rpp-accent`, `--rpp-accent-bg`, `--rpp-highlight`                          |
| Surfaces   | `--rpp-surface`, `--rpp-surface-muted`, `--rpp-surface-hover`, `--rpp-canvas` |
| Text       | `--rpp-text`, `--rpp-text-muted`, `--rpp-text-subtle`, `--rpp-text-faint`     |
| Lines      | `--rpp-border`                                                                |
| Error      | `--rpp-danger`, `--rpp-danger-bg`                                             |
| Radius     | `--rpp-radius-sm`, `--rpp-radius`, `--rpp-radius-lg`                          |
| Typography | `--rpp-font`, `--rpp-font-size`, `--rpp-font-size-sm`, `--rpp-font-size-lg`   |
| Shadow     | `--rpp-shadow-sm`, `--rpp-shadow-lg`                                          |
| Scrollbar  | `--rpp-scrollbar-thumb`, `--rpp-scrollbar-thumb-hover`                        |
| Sizing     | `--rpp-toolbar-icon-size`, `--rpp-sidebar-width`                              |

`--rpp-highlight` is the search hit tint. It defaults to yellow, like a
highlighter, so it does not follow `--rpp-accent` on its own. Set both if you
want them to match.

A dark palette ships with the package. Pass `theme="dark"`, or set
`data-rpp-theme="dark"` on the root if you are composing the pieces yourself.

### 2. Your own classes, per slot

Every element carries a stable `.rpp-*` class you can target in CSS. If you use
Tailwind, the `classNames` prop injects utilities per slot instead. They are
appended to the built in classes rather than replacing them, so equal
specificity resolves in your favour:

```tsx
<PdfViewer
  file={file}
  classNames={{
    root: 'shadow-xl ring-1 ring-black/5',
    toolbar: 'bg-slate-900',
    button: 'hover:bg-slate-800',
    page: 'ring-1 ring-black/10',
  }}
/>
```

The slots are `root`, `header`, `title`, `toolbar`, `toolbarGroup`, `button`,
`separator`, `pageInput`, `pageCount`, `zoomTrigger`, `zoomMenu`,
`zoomMenuItem`, `searchPanel`, `searchField`, `searchInput`, `searchStatus`,
`sidebar`, `thumbnail`, `thumbnailLabel`, `container`, `pageList`,
`pageWrapper`, `page`, `loading` and `error`. See `PdfViewerSlot` for the
authoritative list.

### 3. Swapping parts out

Turn controls off with `features`. The keys are `search`, `pagination`, `zoom`,
`rotate`, `print`, `download`, `fullscreen` and `thumbnails`, and all default to
`true`:

```tsx
<PdfViewer file={file} features={{ print: false, download: false }} />
```

Add your own controls to the toolbar, or replace it entirely:

```tsx
<PdfViewer file={file} toolbarExtra={<button onClick={share}>Share</button>} />

<PdfViewer file={file} renderToolbar={viewer => <MyToolbar viewer={viewer} />} />
```

Replace the loading and error states with `renderLoading` and `renderError`, and
the header title with `renderTitle`:

```tsx
<PdfViewer
  file={file}
  name="quarterly-report-2026-q3.pdf"
  renderTitle={name => <span title={name}>{name.replace(/\.pdf$/, '')}</span>}
  renderError={error => <MyError message={error?.message} />}
/>
```

The bundled icons are a small inline SVG set with no dependency of their own.
Their shape, a component taking `{ className }` and drawing with `currentColor`,
matches lucide-react and Feather, so either can be passed straight through:

```tsx
import { Search, Download } from 'lucide-react'

;<PdfViewer file={file} icons={{ search: Search, download: Download }} />
```

The icon keys are `chevronDown`, `chevronUp`, `close`, `download`, `error`,
`file`, `fullscreen`, `exitFullscreen`, `print`, `rotate`, `search`,
`thumbnails`, `x`, `zoomIn` and `zoomOut`.

### 4. Localization

Pass a partial `labels` object. Missing keys fall back to English:

```tsx
<PdfViewer
  file={file}
  labels={{
    close: 'Fermer',
    loading: 'Chargement du document...',
    noResults: 'Aucun résultat',
    results: ({ current, total }) => `${current} sur ${total}`,
  }}
/>
```

`results` is a function so you can handle pluralization. The keys are `close`,
`loading`, `loadError`, `fitWidth`, `goToPage`, `search`, `searchPlaceholder`,
`clearSearch`, `searching`, `noResults`, `results`, `previousResult`,
`nextResult`, `previousPage`, `nextPage`, `zoomIn`, `zoomOut`, `rotate`,
`print`, `download`, `thumbnails`, `fullscreen` and `exitFullscreen`. The
defaults are exported as `DEFAULT_LABELS`.

## Headless usage

`usePdfViewer()` owns every piece of state: document, page, zoom, rotation,
search, fullscreen, and which pages are worth mounting. It renders nothing.
Spread its prop getters onto your own markup:

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

Navigation, zoom, rotation and the document actions keep a stable identity
across renders, so they are safe to pass to memoized children:
`goToPage`, `nextPage`, `previousPage`, `zoomIn`, `zoomOut`, `setZoom`,
`rotate`, `setRotation`, `toggleSidebar`, `setSidebarOpen`, `download`, `print`
and `search.setKeyword`.

The rest change when the state they read changes, which is what you want:
`search.nextResult` and `search.previousResult` follow the result list, and
`shouldRenderPage` follows the scroll position.

If you want the built in UI but need the state outside the component, for
instance to drive your own controls alongside it, create the instance yourself
and hand it to `<PdfViewerFrame>`. That is exactly what `<PdfViewer>` does
internally:

```tsx
const viewer = usePdfViewer({ file, workerSrc })

return (
  <>
    <button onClick={() => viewer.setSidebarOpen(!viewer.sidebarOpen)}>Thumbnails</button>
    <span>
      {viewer.page} / {viewer.pageCount}
    </span>
    <PdfViewerFrame viewer={viewer} name="report.pdf" theme="dark" />
  </>
)
```

`PdfViewerApi` in `hooks/usePdfViewer.ts` documents the full returned shape. The
smaller hooks it composes are exported too: `usePdfSearch`, `useObjectUrl`,
`useFullscreen` and `useElementWidth`.

## Server side rendering

The whole package is client side and ships a `"use client"` directive, so it can
be imported from a React Server Component in the Next.js App Router. The pdf.js
worker is configured during render rather than at module scope, which keeps the
module safe to evaluate under SSR and in test runners.

## Files

| Path                                 | Contents                                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| `hooks/usePdfViewer.ts`              | All state and behaviour, no markup                               |
| `hooks/usePdfSearch.ts`              | Background keyword scan over the document                        |
| `hooks/useObjectUrl.ts`              | Turns a `File` into a revocable object URL                       |
| `hooks/useFullscreen.ts`             | Fullscreen state for an element                                  |
| `hooks/useElementWidth.ts`           | Width of an element, kept current across resizes                 |
| `components/PdfViewer.tsx`           | `<PdfViewer>` and `<PdfViewerFrame>`                             |
| `components/PdfToolbar.tsx`          | Pagination, zoom, rotate, print, download, search panel          |
| `components/PdfThumbnails.tsx`       | Thumbnails sidebar                                               |
| `components/PdfLoading.tsx`          | Loading and error states                                         |
| `components/context.tsx`             | Slot, class, icon and label resolution for the styled components |
| `worker.ts`                          | pdf.js worker setup                                              |
| `pdfjs-types.ts`                     | pdf.js types derived from react-pdf's own props                  |
| `labels.ts`, `icons.tsx`, `types.ts` | Customization surface                                            |
| `styles.css`                         | Tokens, component styles, bundled pdf.js layer CSS               |

## Development

This repo is a pnpm workspace. The root is the published package and `example/`
is a private member that depends on it with `workspace:*`, so it resolves the
built `dist/` through the real exports map instead of a bundler alias. Running
the example therefore also checks that the published entry points work.

```bash
pnpm install
pnpm run copy-worker
cp path/to/some.pdf example/public/sample.pdf
pnpm --dir example dev
```

`pnpm --dir example dev` rebuilds the package first, so the demo always runs
against current output. While iterating on `src/`, run the package in watch mode
in a second terminal so edits land without restarting Vite:

```bash
pnpm dev
```

Other scripts:

| Script                 | Does                                         |
| ---------------------- | -------------------------------------------- |
| `pnpm build`           | Bundle ESM, CJS and type declarations        |
| `pnpm dev`             | Same, in watch mode                          |
| `pnpm typecheck`       | `tsc --noEmit`                               |
| `pnpm lint`            | ESLint, including the React hooks rules      |
| `pnpm format`          | Prettier over the repo                       |
| `pnpm format:check`    | Prettier in check mode                       |
| `pnpm run copy-worker` | Copy the pdf.js worker into `example/public` |

## License

MIT
