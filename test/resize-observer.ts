// A ResizeObserver stub that records its observers, so a test can drive a
// re-measure on demand. jsdom ships no ResizeObserver, and the viewer measures
// its container through one; the callback reads the element's clientWidth /
// clientHeight when fired.

type ObserverEntry = { callback: ResizeObserverCallback; element: Element }

const observers = new Set<ObserverEntry>()

class ResizeObserverStub implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(element: Element): void {
    observers.add({ callback: this.callback, element })
  }

  unobserve(element: Element): void {
    for (const entry of observers) {
      if (entry.callback === this.callback && entry.element === element) observers.delete(entry)
    }
  }

  disconnect(): void {
    for (const entry of observers) {
      if (entry.callback === this.callback) observers.delete(entry)
    }
  }
}

export function installResizeObserverStub(): void {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

/** Fires every observer, so hooks that measure an element re-read its size. */
export function flushResizeObservers(): void {
  for (const { callback, element } of observers) {
    callback([{ target: element } as ResizeObserverEntry], {} as ResizeObserver)
  }
}

export function resetResizeObservers(): void {
  observers.clear()
}
