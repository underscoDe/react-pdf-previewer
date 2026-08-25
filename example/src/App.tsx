import { useState } from 'react'
import { PdfViewerFrame, usePdfViewer, type PdfSource } from 'react-pdf-previewer'

// Self-hosted: example/public/pdf.worker.min.mjs is copied from pdfjs-dist.
const WORKER_SRC = '/pdf.worker.min.mjs'

const ACCENTS = ['crimson', 'blue', 'green'] as const
type Accent = (typeof ACCENTS)[number]

export function App() {
  const [file, setFile] = useState<PdfSource>('/sample.pdf')
  const [closed, setClosed] = useState(false)
  const [accent, setAccent] = useState<Accent>('crimson')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showDownload, setShowDownload] = useState(true)

  const name = typeof file === 'string' ? 'sample.pdf' : file.name
  const viewer = usePdfViewer({ file, workerSrc: WORKER_SRC, downloadFilename: name })

  return (
    <div className="demo">
      <h1>react-pdf-previewer</h1>
      <p className="lede">Local playground. Try the viewer with your own PDF.</p>

      <div className="demo-controls">
        <label className="demo-field">
          <span>Document</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={event => {
              const picked = event.target.files?.[0]
              if (picked) {
                setFile(picked)
                setClosed(false)
              }
            }}
          />
        </label>

        <label className="demo-field">
          <span>Accent</span>
          <select value={accent} onChange={event => setAccent(event.target.value as Accent)}>
            {ACCENTS.map(value => (
              <option key={value} value={value}>
                {value[0]?.toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="demo-field">
          <span>Theme</span>
          <select
            value={theme}
            onChange={event => setTheme(event.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <div className="demo-field">
          <span>Toggles</span>
          <div className="demo-checks">
            <label>
              <input
                type="checkbox"
                checked={showDownload}
                onChange={event => setShowDownload(event.target.checked)}
              />
              Download
            </label>
            <label>
              <input
                type="checkbox"
                checked={viewer.sidebarOpen}
                onChange={event => viewer.setSidebarOpen(event.target.checked)}
              />
              Thumbnails
            </label>
          </div>
        </div>

        <p className="demo-readout">
          page <strong>{viewer.page}</strong> / {viewer.pageCount || '...'} at {viewer.zoomPercent}%
        </p>
      </div>

      {closed ? (
        <div className="demo-closed">
          <p>Closed. That was the header&rsquo;s close button calling onClose.</p>
          <button type="button" onClick={() => setClosed(false)}>
            Reopen
          </button>
        </div>
      ) : (
        <div className="demo-viewer" data-accent={accent}>
          <PdfViewerFrame
            viewer={viewer}
            name={name}
            theme={theme}
            features={{ download: showDownload }}
            renderTitle={label => (
              <>
                {label} <span className="demo-badge">{viewer.pageCount} pages</span>
              </>
            )}
            onClose={() => setClosed(true)}
          />
        </div>
      )}
    </div>
  )
}
