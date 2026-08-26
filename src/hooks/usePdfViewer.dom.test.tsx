import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { flushResizeObservers } from '../../test/resize-observer'
import type { PdfDocumentProxy, PdfPageProxy } from '../pdfjs-types'
import { usePdfViewer, type PdfViewerApi, type UsePdfViewerOptions } from './usePdfViewer'

const PAGE_HEIGHT = 100
const VIEWPORT_HEIGHT = 500
const PAGE_COUNT = 30

let api: PdfViewerApi

function Harness({ overscan }: { overscan?: number }) {
  const viewer = usePdfViewer({ file: '/report.pdf', overscan })

  // Captured after commit rather than during render, so the harness stays a
  // pure component.
  useEffect(() => {
    api = viewer
  })

  return (
    <div {...viewer.getRootProps()}>
      <div {...viewer.getContainerProps()} data-testid="container">
        {viewer.pageNumbers.map(pageNumber => (
          <div
            key={pageNumber}
            {...viewer.getPageWrapperProps(pageNumber)}
            data-testid="wrapper"
            data-page={pageNumber}
          >
            {viewer.shouldRenderPage(pageNumber) && (
              <span data-testid="rendered" data-page={pageNumber} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function rect(top: number, height: number): DOMRect {
  return { top, bottom: top + height, left: 0, right: 0, height, width: 0, x: 0, y: top } as DOMRect
}

/**
 * jsdom lays nothing out, so the tracking effect would only ever see zeroes.
 * This paints a plausible geometry over it: a fixed-height viewport scrolled to
 * `scrollTop`, with uniform pages stacked inside.
 */
function layout(scrollTop: number) {
  const container = screen.getByTestId('container')
  Object.defineProperty(container, 'clientHeight', {
    value: VIEWPORT_HEIGHT,
    configurable: true,
  })
  container.getBoundingClientRect = () => rect(0, VIEWPORT_HEIGHT)

  for (const wrapper of screen.getAllByTestId('wrapper')) {
    const index = Number(wrapper.dataset.page) - 1
    wrapper.getBoundingClientRect = () => rect(index * PAGE_HEIGHT - scrollTop, PAGE_HEIGHT)
  }

  container.dispatchEvent(new Event('scroll'))
}

function renderedPages(): number[] {
  return screen.queryAllByTestId('rendered').map(el => Number(el.dataset.page))
}

function loadDocument() {
  act(() => {
    api.getDocumentProps().onLoadSuccess({ numPages: PAGE_COUNT } as PdfDocumentProxy)
  })
  act(() => {
    api.getPageProps(1).onLoadSuccess({ originalWidth: 600, originalHeight: 800 } as PdfPageProxy)
  })
}

describe('usePdfViewer render window', () => {
  it('mounts a band around the viewport instead of the whole document', async () => {
    render(<Harness />)
    loadDocument()

    // Pages 1 to 6 intersect a 500px viewport, plus two of overscan either side.
    act(() => layout(0))
    await waitFor(() => expect(renderedPages()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]))
  })

  it('reserves the height of every page it does not mount', () => {
    render(<Harness />)
    loadDocument()

    const wrappers = screen.getAllByTestId('wrapper')
    // 600 wide at scale 1, so 800 tall for a 600 by 800 page.
    expect(wrappers[PAGE_COUNT - 1]?.style.height).toBe('800px')
    // The mounted ones size themselves from their content.
    expect(wrappers[0]?.style.height).toBe('')
  })

  it('follows the viewport as it scrolls', async () => {
    render(<Harness />)
    loadDocument()

    act(() => layout(0))
    await waitFor(() => expect(renderedPages()).toContain(1))

    act(() => layout(1000))

    await waitFor(() => {
      expect(renderedPages()).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    })
    expect(api.page).toBe(13)
    expect(renderedPages()).not.toContain(1)
  })

  it('widens the band with overscan', async () => {
    render(<Harness overscan={5} />)
    loadDocument()

    act(() => layout(1000))

    await waitFor(() => expect(renderedPages()[0]).toBe(6))
    expect(renderedPages().at(-1)).toBe(21)
  })

  it('never runs past the ends of the document', async () => {
    render(<Harness overscan={4} />)
    loadDocument()

    act(() => layout(0))

    await waitFor(() => expect(renderedPages()[0]).toBe(1))
    expect(Math.max(...renderedPages())).toBeLessThanOrEqual(PAGE_COUNT)
  })

  it('scrolls the container when asked for a page', async () => {
    render(<Harness />)
    loadDocument()
    act(() => layout(0))
    await waitFor(() => expect(renderedPages()).toContain(1))

    const container = screen.getByTestId('container')
    act(() => api.goToPage(4))

    // Page 4 sits 300px down, less the 16px of page padding.
    expect(container.scrollTop).toBe(284)
  })

  it('gives shouldRenderPage a new identity when the window moves', async () => {
    render(<Harness />)
    loadDocument()
    act(() => layout(0))
    await waitFor(() => expect(renderedPages()).toContain(1))

    const before = api.shouldRenderPage
    act(() => layout(1000))

    await waitFor(() => expect(api.shouldRenderPage).not.toBe(before))
  })

  it('ignores a page that has no wrapper', () => {
    render(<Harness />)
    loadDocument()
    act(() => layout(0))

    const container = screen.getByTestId('container')
    container.scrollTop = 42

    act(() => api.goToPage(999))

    expect(container.scrollTop).toBe(42)
  })
})

// A second harness that maps visiblePageNumbers, the way the real Frame does,
// and reports a fixed container size so fit-page has real dimensions to work
// from. Page padding is 16, so the usable box is the client size minus 32.
const BOX_WIDTH = 1000
const BOX_HEIGHT = 600

function SizedHarness(options: Partial<UsePdfViewerOptions> = {}) {
  const viewer = usePdfViewer({ file: '/report.pdf', ...options })

  useEffect(() => {
    api = viewer
  })

  return (
    <div {...viewer.getRootProps()}>
      <div {...viewer.getContainerProps()} data-testid="container">
        {viewer.visiblePageNumbers.map(pageNumber => (
          <div key={pageNumber} {...viewer.getPageWrapperProps(pageNumber)} data-testid="wrapper">
            <span data-testid="rendered" data-page={pageNumber} />
          </div>
        ))}
      </div>
    </div>
  )
}

function measureContainer(width = BOX_WIDTH, height = BOX_HEIGHT) {
  const container = screen.getByTestId('container')
  Object.defineProperty(container, 'clientWidth', { value: width, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: height, configurable: true })
  act(() => flushResizeObservers())
}

function loadSized() {
  act(() => {
    api.getDocumentProps().onLoadSuccess({ numPages: 10 } as PdfDocumentProxy)
  })
  act(() => {
    api.getPageProps(1).onLoadSuccess({ originalWidth: 600, originalHeight: 800 } as PdfPageProxy)
  })
}

describe('usePdfViewer fit modes', () => {
  it('fits the width by default', () => {
    render(<SizedHarness />)
    measureContainer()
    loadSized()

    // Usable width 968 over a 600-wide page.
    expect(api.scale).toBeCloseTo(968 / 600, 4)
  })

  it('fits the whole page, capping on whichever edge is tighter', () => {
    render(<SizedHarness initialZoom="fit-page" />)
    measureContainer()
    loadSized()

    // min(968/600, 568/800): the short edge wins, so the page fits vertically.
    expect(api.scale).toBeCloseTo(568 / 800, 4)
    expect(api.scale).toBeLessThan(968 / 600)
  })

  it('accounts for rotation when fitting a page', () => {
    render(<SizedHarness initialZoom="fit-page" />)
    measureContainer()
    loadSized()

    act(() => api.rotate())

    // Turned 90 degrees the page is 800 wide by 600 tall, so min(968/800, 568/600).
    expect(api.scale).toBeCloseTo(568 / 600, 4)
  })

  it('renders only the current page in single mode', async () => {
    render(<SizedHarness initialViewMode="single" />)
    measureContainer()
    loadSized()

    await waitFor(() => expect(screen.getAllByTestId('wrapper')).toHaveLength(1))
    expect(screen.getByTestId('rendered').dataset.page).toBe('1')

    act(() => api.nextPage())

    await waitFor(() => expect(screen.getByTestId('rendered').dataset.page).toBe('2'))
    expect(screen.getAllByTestId('wrapper')).toHaveLength(1)
  })
})
