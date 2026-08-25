import { useEffect, useState } from 'react'

/**
 * Width of `element`, minus `inset`, kept current across resizes. Takes the
 * node rather than a ref so it re-measures when the element mounts — a
 * ref-based effect would read `null` once and never fire again.
 */
export function useElementWidth(element: HTMLElement | null, inset = 0): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!element) return

    const update = () => setWidth(Math.max(element.clientWidth - inset, 0))
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, inset])

  return width
}
