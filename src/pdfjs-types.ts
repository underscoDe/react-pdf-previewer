import type { DocumentProps, PageProps } from 'react-pdf'

// Derived from react-pdf's props rather than imported from `pdfjs-dist`:
// react-pdf pins pdfjs-dist exactly and hides it, so importing it directly can
// resolve a second copy, and pdf.js classes compare nominally.

/** The pdf.js document handle, as react-pdf sees it. */
export type PdfDocumentProxy = Parameters<NonNullable<DocumentProps['onLoadSuccess']>>[0]

/** A loaded page, including react-pdf's added `originalWidth` / `originalHeight`. */
export type PdfPageProxy = Parameters<NonNullable<PageProps['onLoadSuccess']>>[0]

export type PdfLoadProgress = Parameters<NonNullable<DocumentProps['onLoadProgress']>>[0]

export type PdfItemClick = Parameters<NonNullable<DocumentProps['onItemClick']>>[0]
