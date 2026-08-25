import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PdfDocumentProxy } from '../pdfjs-types'
import { usePdfSearch } from './usePdfSearch'

/** Minimal stand-in for the pdf.js document handle usePdfSearch reads. */
function fakePdf(pages: string[][]): PdfDocumentProxy {
  return {
    numPages: pages.length,
    getPage: async (pageNumber: number) => ({
      getTextContent: async () => ({
        items: (pages[pageNumber - 1] ?? []).map(str => ({ str })),
      }),
    }),
  } as unknown as PdfDocumentProxy
}

describe('usePdfSearch', () => {
  it('reports nothing without a keyword', () => {
    const { result } = renderHook(() => usePdfSearch(fakePdf([['total']]), ''))
    expect(result.current.pages).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  it('reports nothing without a document', () => {
    const { result } = renderHook(() => usePdfSearch(null, 'total'))
    expect(result.current.isSearching).toBe(false)
  })

  it('returns one entry per match, holding its page', async () => {
    const pdf = fakePdf([['total due'], ['nothing here'], ['total', 'total again']])

    const { result } = renderHook(() => usePdfSearch(pdf, 'total'))

    await waitFor(() => expect(result.current.isSearching).toBe(false))
    // Page 1 has one match, page 3 has two, each counted per text item.
    expect(result.current.pages).toEqual([1, 3, 3])
  })

  it('counts repeats inside a single text item', async () => {
    const { result } = renderHook(() => usePdfSearch(fakePdf([['ab ab ab']]), 'ab'))

    await waitFor(() => expect(result.current.pages).toEqual([1, 1, 1]))
  })

  it('matches case-insensitively', async () => {
    const { result } = renderHook(() => usePdfSearch(fakePdf([['Total']]), 'total'))

    await waitFor(() => expect(result.current.pages).toEqual([1]))
  })

  it('treats the keyword literally rather than as a pattern', async () => {
    const { result } = renderHook(() => usePdfSearch(fakePdf([['a.b'], ['axb']]), 'a.b'))

    await waitFor(() => expect(result.current.isSearching).toBe(false))
    expect(result.current.pages).toEqual([1])
  })

  it('skips items that carry no text', async () => {
    const pdf = {
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({ items: [{ type: 'beginMarkedContent' }, { str: 'total' }] }),
      }),
    } as unknown as PdfDocumentProxy

    const { result } = renderHook(() => usePdfSearch(pdf, 'total'))

    await waitFor(() => expect(result.current.pages).toEqual([1]))
  })

  it('holds results back until the scan for the current keyword finishes', async () => {
    const pdf = fakePdf([['alpha beta']])
    const { result, rerender } = renderHook(({ keyword }) => usePdfSearch(pdf, keyword), {
      initialProps: { keyword: 'alpha' },
    })

    await waitFor(() => expect(result.current.pages).toEqual([1]))

    rerender({ keyword: 'beta' })
    // The previous keyword's results must not leak into the new one.
    expect(result.current.isSearching).toBe(true)
    expect(result.current.pages).toEqual([])

    await waitFor(() => expect(result.current.pages).toEqual([1]))
  })

  it('abandons a scan when the document goes away', async () => {
    const getPage = vi.fn(async () => ({
      getTextContent: async () => ({ items: [{ str: 'total' }] }),
    }))
    const pdf = { numPages: 50, getPage } as unknown as PdfDocumentProxy

    const { unmount } = renderHook(() => usePdfSearch(pdf, 'total'))
    unmount()

    const afterUnmount = getPage.mock.calls.length
    await new Promise(resolve => setTimeout(resolve, 20))
    // The loop checks its cancelled flag between pages, so it stops early.
    expect(getPage.mock.calls.length).toBeLessThan(50)
    expect(getPage.mock.calls.length).toBeLessThanOrEqual(afterUnmount + 1)
  })
})
