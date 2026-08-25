import { pdfjs } from 'react-pdf'

let warned = false

/**
 * Points pdf.js at its worker bundle. Call before the first viewer mounts, or
 * pass `workerSrc` to `usePdfViewer` / `<PdfViewer>` instead.
 */
export function setPdfWorkerSrc(src: string): void {
  pdfjs.GlobalWorkerOptions.workerSrc = src
}

/** CDN URL matching the pdfjs-dist version actually installed in the host app. */
export function defaultPdfWorkerSrc(): string {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

/**
 * Resolves the worker without clobbering a value the host already set. Called
 * from render rather than at module scope, which would break SSR, RSC and test
 * runners.
 */
export function ensurePdfWorker(src?: string): void {
  if (src) {
    pdfjs.GlobalWorkerOptions.workerSrc = src
    return
  }

  if (pdfjs.GlobalWorkerOptions.workerSrc) return

  pdfjs.GlobalWorkerOptions.workerSrc = defaultPdfWorkerSrc()

  if (!warned && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    warned = true
    console.warn(
      '[react-pdf-previewer] No pdf.js worker configured, falling back to a CDN build. ' +
        'For production, self-host the worker and pass `workerSrc`. See ' +
        'https://github.com/underscoDe/react-pdf-previewer#pdfjs-worker'
    )
  }
}
