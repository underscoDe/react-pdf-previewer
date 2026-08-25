import { useEffect, useMemo } from 'react'
import type { PdfSource } from '../types'

/** Resolves a document to a URL usable by `<a download>` and the print frame. */
export function useObjectUrl(file: PdfSource): string {
  // Built during render so the URL exists on first paint; the effect only frees it.
  const url = useMemo(() => (typeof file === 'string' ? file : URL.createObjectURL(file)), [file])

  useEffect(() => {
    if (typeof file === 'string') return
    return () => URL.revokeObjectURL(url)
  }, [file, url])

  return url
}
