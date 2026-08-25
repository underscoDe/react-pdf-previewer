import { useEffect, useState } from 'react'
import type { PdfDocumentProxy } from '../pdfjs-types'
import { escapeRegExp } from '../utils'

interface SearchState {
  keyword: string
  pages: number[]
}

export interface PdfSearchResult {
  /** One entry per match, holding the page it sits on. */
  pages: number[]
  isSearching: boolean
}

const NO_PAGES: number[] = []

/**
 * Scans the document for a keyword. Matches are counted per text item, keeping
 * the total consistent with the highlight layer, which cannot mark a match
 * spanning two items either.
 */
export function usePdfSearch(pdf: PdfDocumentProxy | null, keyword: string): PdfSearchResult {
  const [result, setResult] = useState<SearchState>({ keyword: '', pages: [] })

  useEffect(() => {
    if (!pdf || !keyword) return

    let cancelled = false

    const scan = async () => {
      const regex = new RegExp(escapeRegExp(keyword), 'gi')
      const found: number[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        if (cancelled) return

        for (const item of content.items) {
          if (!('str' in item)) continue
          const count = item.str.match(regex)?.length ?? 0
          for (let i = 0; i < count; i++) found.push(pageNumber)
        }
      }

      if (!cancelled) setResult({ keyword, pages: found })
    }

    void scan()
    return () => {
      cancelled = true
    }
  }, [pdf, keyword])

  // Guards against a previous keyword's results leaking into the current one
  // mid-scan, and makes an empty list mean "no match" only once that scan ends.
  const isDone = result.keyword === keyword

  return {
    pages: isDone ? result.pages : NO_PAGES,
    isSearching: Boolean(pdf && keyword) && !isDone,
  }
}
