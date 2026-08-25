import { useCallback, useEffect, useState, type RefObject } from 'react'

export interface FullscreenApi {
  isFullscreen: boolean
  toggle: () => void
  enter: () => void
  exit: () => void
}

export function useFullscreen(
  ref: RefObject<HTMLElement | null>,
  onChange?: (isFullscreen: boolean) => void
): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handle = () => {
      const active = document.fullscreenElement === ref.current
      setIsFullscreen(active)
      onChange?.(active)
    }
    document.addEventListener('fullscreenchange', handle)
    return () => document.removeEventListener('fullscreenchange', handle)
  }, [ref, onChange])

  const enter = useCallback(() => {
    void ref.current?.requestFullscreen?.()
  }, [ref])

  const exit = useCallback(() => {
    void document.exitFullscreen?.()
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) exit()
    else enter()
  }, [enter, exit])

  return { isFullscreen, toggle, enter, exit }
}
