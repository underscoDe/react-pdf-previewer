import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useObjectUrl } from './useObjectUrl'

describe('useObjectUrl', () => {
  it('passes a URL string straight through', () => {
    const { result } = renderHook(() => useObjectUrl('/report.pdf'))
    expect(result.current).toBe('/report.pdf')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('never revokes a URL it did not create', () => {
    const { unmount } = renderHook(() => useObjectUrl('/report.pdf'))
    unmount()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('wraps a File and revokes the URL on unmount', () => {
    const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf' })
    const { result, unmount } = renderHook(() => useObjectUrl(file))

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(result.current).toBe('blob:mock')

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('keeps the same URL while the file is unchanged', () => {
    const file = new File(['pdf'], 'report.pdf')
    const { result, rerender } = renderHook(() => useObjectUrl(file))
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('releases the previous URL when the file changes', () => {
    const first = new File(['a'], 'a.pdf')
    const second = new File(['b'], 'b.pdf')
    const { rerender } = renderHook(({ file }) => useObjectUrl(file), {
      initialProps: { file: first },
    })

    rerender({ file: second })

    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
  })
})
