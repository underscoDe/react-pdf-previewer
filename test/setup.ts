import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetMockPdf } from './react-pdf-stub'

// jsdom implements neither of these, and the viewer measures and scrolls its
// container on mount. Stubbing them keeps the failures meaningful: a test that
// breaks is about the viewer, not about the environment.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

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
  vi.clearAllMocks()
})
