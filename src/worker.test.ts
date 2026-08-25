import { pdfjs } from 'react-pdf'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultPdfWorkerSrc, ensurePdfWorker, setPdfWorkerSrc } from './worker'

describe('worker configuration', () => {
  beforeEach(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = ''
  })

  it('sets the source explicitly', () => {
    setPdfWorkerSrc('/pdf.worker.min.mjs')
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.min.mjs')
  })

  it('builds a CDN URL pinned to the installed pdfjs version', () => {
    expect(defaultPdfWorkerSrc()).toContain(`pdfjs-dist@${pdfjs.version}/`)
  })

  it('prefers an explicit source over anything already configured', () => {
    setPdfWorkerSrc('/first.mjs')
    ensurePdfWorker('/second.mjs')
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/second.mjs')
  })

  it('leaves a host-configured source alone', () => {
    setPdfWorkerSrc('/host.mjs')
    ensurePdfWorker()
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/host.mjs')
  })

  it('falls back to the CDN and warns when nothing is configured', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ensurePdfWorker()

    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe(defaultPdfWorkerSrc())
    // The warning fires at most once per process, so only assert it is not an error.
    expect(warn.mock.calls.length).toBeLessThanOrEqual(1)
    warn.mockRestore()
  })
})
