import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { configureMockPdf } from '../../test/react-pdf-stub'
import { PdfViewer } from './PdfViewer'

const FILE = '/report.pdf'

/** Renders and waits for the document to load. Deliberately not keyed off a
 *  button name, so tests that translate the labels still work. */
async function renderViewer(props: Partial<Parameters<typeof PdfViewer>[0]> = {}) {
  const result = render(<PdfViewer file={FILE} {...props} />)
  await waitFor(() => expect(result.container.querySelector('.rpp-toolbar')).not.toBeNull())
  return result
}

describe('PdfViewer', () => {
  it('renders the toolbar once the document loads', async () => {
    await renderViewer()

    for (const name of ['Search', 'Previous page', 'Next page', 'Rotate', 'Print', 'Download']) {
      expect(screen.getByRole('button', { name })).toBeTruthy()
    }
    expect(screen.getByLabelText('Go to page')).toBeTruthy()
  })

  it('shows the error state when the document fails', async () => {
    configureMockPdf({ failWith: new Error('nope') })

    render(<PdfViewer file={FILE} />)

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
  })

  describe('header', () => {
    it('is hidden without a name or a close handler', async () => {
      const { container } = await renderViewer()
      expect(container.querySelector('.rpp-header')).toBeNull()
    })

    it('shows the name', async () => {
      await renderViewer({ name: 'Q3 report' })
      expect(screen.getByText('Q3 report')).toBeTruthy()
    })

    it('calls onClose from the close button', async () => {
      const onClose = vi.fn()
      await renderViewer({ name: 'Q3 report', onClose })

      await userEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(onClose).toHaveBeenCalledOnce()
    })

    it('lets renderTitle replace the title', async () => {
      await renderViewer({
        name: 'quarterly.pdf',
        renderTitle: name => <span data-testid="title">{name.replace(/\.pdf$/, '')}</span>,
      })

      expect(screen.getByTestId('title').textContent).toBe('quarterly')
    })
  })

  describe('features', () => {
    it('hides individual controls', async () => {
      await renderViewer({ features: { download: false, print: false } })

      expect(screen.queryByRole('button', { name: 'Download' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Print' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Rotate' })).toBeTruthy()
    })

    it('hides the whole pagination group', async () => {
      await renderViewer({ features: { pagination: false } })

      expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull()
      expect(screen.queryByLabelText('Go to page')).toBeNull()
    })

    it('drops the search panel with search off', async () => {
      const { container } = render(<PdfViewer file={FILE} features={{ search: false }} />)
      await screen.findByRole('button', { name: 'Rotate' })

      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
      expect(container.querySelector('.rpp-search-panel')).toBeNull()
    })

    it('hides the view mode toggle', async () => {
      await renderViewer({ features: { viewMode: false } })

      expect(screen.queryByRole('button', { name: 'Single page' })).toBeNull()
    })
  })

  describe('view mode', () => {
    it('toggles between continuous and single from the toolbar', async () => {
      await renderViewer()

      // Continuous by default: the button offers to switch to single.
      const toSingle = screen.getByRole('button', { name: 'Single page' })
      expect(toSingle.dataset.active).toBeUndefined()

      await userEvent.click(toSingle)

      // Now in single mode: the button offers to switch back, and reads active.
      const toContinuous = await screen.findByRole('button', { name: 'Continuous' })
      expect(toContinuous.dataset.active).toBe('true')
    })

    it('shows only the current page in single mode, and follows navigation', async () => {
      // jsdom reports a zero-sized viewport, so continuous mode already mounts a
      // single page here; what matters is that single mode tracks the current
      // page as it changes. The window-vs-single split is covered in the DOM
      // hook test, which paints a real geometry.
      configureMockPdf({ numPages: 6 })
      await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: 'Single page' }))

      await waitFor(() => expect(screen.getAllByTestId('page')).toHaveLength(1))
      expect(screen.getByTestId('page').dataset.page).toBe('1')

      await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

      await waitFor(() => expect(screen.getByTestId('page').dataset.page).toBe('2'))
      expect(screen.getAllByTestId('page')).toHaveLength(1)
    })
  })

  describe('search panel', () => {
    it('opens and closes from the toolbar', async () => {
      const { container } = await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: 'Search' }))
      expect(container.querySelector('.rpp-search-panel')).not.toBeNull()

      await userEvent.click(screen.getByRole('button', { name: 'Search' }))
      expect(container.querySelector('.rpp-search-panel')).toBeNull()
    })

    it('closes on Escape', async () => {
      const { container } = await renderViewer()
      await userEvent.click(screen.getByRole('button', { name: 'Search' }))

      await userEvent.keyboard('{Escape}')

      await waitFor(() => expect(container.querySelector('.rpp-search-panel')).toBeNull())
    })
  })

  describe('zoom menu', () => {
    it('opens and applies a preset', async () => {
      await renderViewer()
      const trigger = screen.getByRole('button', { name: /%$/ })

      await userEvent.click(trigger)
      await userEvent.click(screen.getByRole('menuitem', { name: '200%' }))

      await waitFor(() => expect(screen.getByRole('button', { name: '200%' })).toBeTruthy())
    })

    it('marks the active level', async () => {
      await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: /%$/ }))

      expect(screen.getByRole('menuitem', { name: 'Fit width' }).dataset.active).toBe('true')
    })

    it('offers a fit-page entry alongside fit-width', async () => {
      await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: /%$/ }))

      expect(screen.getByRole('menuitem', { name: 'Fit width' })).toBeTruthy()
      expect(screen.getByRole('menuitem', { name: 'Fit page' })).toBeTruthy()
    })
  })

  describe('thumbnails', () => {
    it('toggles the sidebar from the toolbar', async () => {
      configureMockPdf({ numPages: 4 })
      const { container } = await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: 'Thumbnails' }))

      expect(container.querySelector('.rpp-sidebar')).not.toBeNull()
      expect(screen.getAllByTestId('thumbnail')).toHaveLength(4)
    })
  })

  describe('customization', () => {
    it('appends per-slot classes without dropping the built-in ones', async () => {
      const { container } = await renderViewer({
        classNames: { root: 'my-root', toolbar: 'my-toolbar' },
      })

      const root = container.querySelector('.rpp-root')
      expect(root?.className).toContain('my-root')
      expect(container.querySelector('.rpp-toolbar')?.className).toContain('my-toolbar')
    })

    it('applies className and style to the root', async () => {
      const { container } = await renderViewer({
        className: 'outer',
        style: { opacity: 0.5 },
      })

      const root = container.querySelector('.rpp-root') as HTMLElement
      expect(root.className).toContain('outer')
      expect(root.style.opacity).toBe('0.5')
    })

    it('overrides labels, falling back to English for the rest', async () => {
      await renderViewer({ labels: { search: 'Rechercher' } })

      expect(screen.getByRole('button', { name: 'Rechercher' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Rotate' })).toBeTruthy()
    })

    it('swaps an icon for a custom component', async () => {
      const CustomSearch = () => <svg data-testid="custom-search" />
      await renderViewer({ icons: { search: CustomSearch } })

      expect(screen.getByTestId('custom-search')).toBeTruthy()
    })

    it('marks the dark theme on the root', async () => {
      const { container } = await renderViewer({ theme: 'dark' })

      expect(container.querySelector('.rpp-root')?.getAttribute('data-rpp-theme')).toBe('dark')
    })

    it('appends extra toolbar controls', async () => {
      await renderViewer({ toolbarExtra: <button type="button">Share</button> })

      expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy()
    })

    it('replaces the whole toolbar', async () => {
      render(
        <PdfViewer file={FILE} renderToolbar={viewer => <div>pages: {viewer.pageCount}</div>} />
      )

      expect(await screen.findByText('pages: 3')).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Rotate' })).toBeNull()
    })
  })

  describe('pages', () => {
    it('mounts only the pages inside the render window', async () => {
      configureMockPdf({ numPages: 20 })
      const { container } = await renderViewer()

      // jsdom reports a zero-sized viewport, so the window stays at its initial
      // page. What matters is that it is a window, not the whole document.
      const wrappers = container.querySelectorAll('.rpp-page-wrapper')
      expect(wrappers).toHaveLength(20)
      expect(screen.getAllByTestId('page').length).toBeLessThan(20)
    })

    it('gives every page the current rotation', async () => {
      await renderViewer()

      await userEvent.click(screen.getByRole('button', { name: 'Rotate' }))

      await waitFor(() => {
        expect(screen.getAllByTestId('page')[0]?.dataset.rotate).toBe('90')
      })
    })
  })

  describe('pagination', () => {
    it('disables the previous button on the first page', async () => {
      await renderViewer()

      const previous = screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement
      expect(previous.disabled).toBe(true)
    })

    it('shows the page count', async () => {
      configureMockPdf({ numPages: 7 })
      await renderViewer()

      expect(screen.getByText('/ 7')).toBeTruthy()
    })

    it('rejects an out-of-range page and restores the current one', async () => {
      configureMockPdf({ numPages: 7 })
      await renderViewer()

      const input = screen.getByLabelText('Go to page') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '99')
      await userEvent.tab()

      expect(input.value).toBe('1')
    })
  })
})
