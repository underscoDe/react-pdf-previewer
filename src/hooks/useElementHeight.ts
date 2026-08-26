import { useEffect, useState } from 'react'

/**
 * Height of `element`, minus `inset`, kept current across resizes. Takes the
 * node rather than a ref so it re-measures when the element mounts. A
 * ref-based effect would read `null` once and never fire again.
 */
export function useElementHeight(element: HTMLElement | null, inset = 0): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!element) return

    const update = () => setHeight(Math.max(element.clientHeight - inset, 0))
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, inset])

  return height
}
