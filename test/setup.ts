import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetMockPdf } from './react-pdf-stub'
import { installResizeObserverStub, resetResizeObservers } from './resize-observer'

// jsdom ships no ResizeObserver and no real scrollTo. Stubbing them keeps the
// failures meaningful: a test that breaks is about the viewer, not the DOM.
installResizeObserverStub()

Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number) {
  if (typeof options === 'object' && typeof options?.top === 'number') {
    this.scrollTop = options.top
  }
} as Element['scrollTo']

URL.createObjectURL = vi.fn(() => 'blob:mock')
URL.revokeObjectURL = vi.fn()

afterEach(() => {
  cleanup()
  resetMockPdf()
  resetResizeObservers()
  vi.clearAllMocks()
})
