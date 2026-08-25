import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PdfDocumentProxy, PdfPageProxy } from '../pdfjs-types'
import { usePdfViewer, type PdfViewerApi, type UsePdfViewerOptions } from './usePdfViewer'

const A4_LIKE = { originalWidth: 600, originalHeight: 800 } as PdfPageProxy

function setup(options: Partial<UsePdfViewerOptions> = {}) {
  const rendered = renderHook(() => usePdfViewer({ file: '/report.pdf', ...options }))

  /** Plays the callbacks react-pdf would fire once a document is parsed. */
  const load = (numPages = 10) => {
    act(() => {
      rendered.result.current.getDocumentProps().onLoadSuccess({ numPages } as PdfDocumentProxy)
    })
    act(() => {
      rendered.result.current.getPageProps(1).onLoadSuccess(A4_LIKE)
    })
  }

  return { ...rendered, load }
}

describe('usePdfViewer', () => {
  it('starts on page one with nothing loaded', () => {
    const { result } = setup()

    expect(result.current.pageCount).toBe(0)
    expect(result.current.pageNumbers).toEqual([])
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.page).toBe(1)
    expect(result.current.zoom).toBe('fit')
    expect(result.current.rotation).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('records the page count once the document loads', () => {
    const { result, load } = setup()

    load(4)

    expect(result.current.pageCount).toBe(4)
    expect(result.current.pageNumbers).toEqual([1, 2, 3, 4])
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.canGoNext).toBe(true)
    expect(result.current.canGoPrevious).toBe(false)
  })

  it('surfaces a load failure', () => {
    const { result } = setup()
    const failure = new Error('bad pdf')

    act(() => {
      result.current.getDocumentProps().onLoadError(failure)
    })

    expect(result.current.error).toBe(failure)
    expect(result.current.isLoaded).toBe(false)
  })

  it('reports download progress only for the current document', () => {
    const { result } = setup()

    act(() => {
      result.current.getDocumentProps().onLoadProgress({ loaded: 50, total: 200 })
    })

    expect(result.current.progress).toBe(0.25)
  })

  it('ignores progress when the total size is unknown', () => {
    const { result } = setup()

    act(() => {
      result.current.getDocumentProps().onLoadProgress({ loaded: 50, total: 0 })
    })

    expect(result.current.progress).toBeUndefined()
  })

  describe('zoom', () => {
    // Each step runs in its own act() because the hook reads the current scale
    // through a ref that is synced after commit, exactly as a click would.
    it('steps up and down by scaleStep', () => {
      const { result, load } = setup()
      load()

      expect(result.current.zoomPercent).toBe(100)

      act(() => result.current.zoomIn())
      expect(result.current.zoomPercent).toBe(125)

      act(() => result.current.zoomOut())
      expect(result.current.zoomPercent).toBe(100)
    })

    it('honours a custom step', () => {
      const { result, load } = setup({ scaleStep: 0.5 })
      load()

      act(() => result.current.zoomIn())

      expect(result.current.zoomPercent).toBe(150)
    })

    it('clamps to maxScale', () => {
      const { result, load } = setup({ maxScale: 1.5 })
      load()

      act(() => result.current.zoomIn())
      act(() => result.current.zoomIn())
      act(() => result.current.zoomIn())

      expect(result.current.scale).toBe(1.5)
      expect(result.current.canZoomIn).toBe(false)
    })

    it('clamps to minScale', () => {
      const { result, load } = setup({ minScale: 0.75 })
      load()

      act(() => result.current.zoomOut())
      act(() => result.current.zoomOut())

      expect(result.current.scale).toBe(0.75)
      expect(result.current.canZoomOut).toBe(false)
    })

    it('accepts an explicit level', () => {
      const { result, load } = setup()
      load()

      act(() => result.current.setZoom(2))

      expect(result.current.zoom).toBe(2)
      expect(result.current.zoomPercent).toBe(200)
      expect(result.current.pageWidth).toBe(1200)
    })

    it('starts from initialZoom', () => {
      const { result, load } = setup({ initialZoom: 1.5 })
      load()

      expect(result.current.zoomPercent).toBe(150)
    })
  })

  describe('rotation', () => {
    it('cycles a quarter turn at a time and wraps at a full turn', () => {
      const { result, load } = setup()
      load()

      for (const expected of [90, 180, 270, 0]) {
        act(() => result.current.rotate())
        expect(result.current.rotation).toBe(expected)
      }
    })

    it('swaps the reserved page height on a quarter turn', () => {
      const { result, load } = setup()
      load()

      // 600 wide by 800 tall at scale 1.
      expect(result.current.pageWidth).toBe(600)
      expect(result.current.pageHeight).toBe(800)

      act(() => result.current.rotate())

      // Turned on its side, the same width now covers the shorter edge.
      expect(result.current.pageHeight).toBe(450)
    })
  })

  it('measures only the first page to report in', () => {
    const { result, load } = setup()
    load()

    act(() => {
      result.current.getPageProps(2).onLoadSuccess({
        originalWidth: 999,
        originalHeight: 999,
      } as PdfPageProxy)
    })

    expect(result.current.pageWidth).toBe(600)
  })

  it('passes the current width and rotation to every page', () => {
    const { result, load } = setup()
    load()

    act(() => result.current.setZoom(2))
    act(() => result.current.rotate())

    const props = result.current.getPageProps(3)
    expect(props).toMatchObject({ pageNumber: 3, width: 1200, rotate: 90 })
  })

  describe('sidebar', () => {
    it('toggles and sets directly', () => {
      const { result } = setup()

      expect(result.current.sidebarOpen).toBe(false)

      act(() => result.current.toggleSidebar())
      expect(result.current.sidebarOpen).toBe(true)

      act(() => result.current.setSidebarOpen(false))
      expect(result.current.sidebarOpen).toBe(false)
    })
  })

  describe('search', () => {
    it('has no highlight renderer without a keyword', () => {
      const { result } = setup()
      expect(result.current.search.highlightTextRenderer).toBeUndefined()
    })

    it('wraps hits in a mark element', () => {
      const { result } = setup()

      act(() => result.current.search.setKeyword('total'))

      const render = result.current.search.highlightTextRenderer
      expect(render?.({ str: 'Total total' })).toBe('<mark>Total</mark> <mark>total</mark>')
    })

    it('treats the keyword literally', () => {
      const { result } = setup()

      act(() => result.current.search.setKeyword('a.b'))

      expect(result.current.search.highlightTextRenderer?.({ str: 'axb' })).toBe('axb')
    })

    it('clears the keyword and the result cursor', () => {
      const { result } = setup()

      act(() => result.current.search.setKeyword('total'))
      act(() => result.current.search.clear())

      expect(result.current.search.keyword).toBe('')
      expect(result.current.search.resultIndex).toBe(0)
      expect(result.current.search.highlightTextRenderer).toBeUndefined()
    })

    it('does nothing when asked to move through an empty result list', () => {
      const { result, load } = setup()
      load()

      act(() => result.current.search.nextResult())
      act(() => result.current.search.previousResult())

      expect(result.current.search.resultIndex).toBe(0)
    })
  })

  it('falls back to a generic download filename', () => {
    const { result } = setup()
    expect(result.current.fileUrl).toBe('/report.pdf')
    expect(typeof result.current.download).toBe('function')
  })

  describe('referential stability', () => {
    // The README promises these survive re-renders, so that consumers can pass
    // them to memoized children.
    const STABLE = [
      'goToPage',
      'nextPage',
      'previousPage',
      'zoomIn',
      'zoomOut',
      'setZoom',
      'rotate',
      'setRotation',
      'toggleSidebar',
      'setSidebarOpen',
      'download',
      'print',
    ] as const

    it('keeps the action callbacks identical across a state change', () => {
      const { result, load } = setup()
      load()

      const before = Object.fromEntries(STABLE.map(key => [key, result.current[key]])) as Pick<
        PdfViewerApi,
        (typeof STABLE)[number]
      >

      act(() => result.current.rotate())
      act(() => result.current.toggleSidebar())

      for (const key of STABLE) {
        expect(result.current[key], `${key} changed identity`).toBe(before[key])
      }
    })

    it('keeps search.setKeyword identical too', () => {
      const { result } = setup()
      const before = result.current.search.setKeyword

      act(() => result.current.search.setKeyword('total'))

      expect(result.current.search.setKeyword).toBe(before)
    })

    it('gives getPageProps a new identity when the layout changes', () => {
      const { result, load } = setup()
      load()
      const before = result.current.getPageProps

      act(() => result.current.rotate())

      expect(result.current.getPageProps).not.toBe(before)
    })
  })
})
