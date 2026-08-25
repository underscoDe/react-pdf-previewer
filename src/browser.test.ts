import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadFile, printFile } from './browser'

describe('downloadFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves the blob through a temporary anchor', async () => {
    const blob = new Blob(['pdf'])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => blob }))
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await downloadFile('/report.pdf', 'report.pdf')

    expect(click).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    click.mockRestore()
  })

  it('falls back to a new tab when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403 }))
    )
    const open = vi.fn()
    vi.stubGlobal('open', open)

    await downloadFile('/report.pdf', 'report.pdf')

    expect(open).toHaveBeenCalledWith('/report.pdf', '_blank', 'noopener')
  })
})

describe('printFile', () => {
  it('removes the hidden frame once printing finishes', () => {
    printFile('/report.pdf')

    const frame = document.querySelector('iframe')
    expect(frame).not.toBeNull()
    expect(frame?.style.display).toBe('none')

    const print = vi.fn()
    const listeners: Record<string, () => void> = {}
    Object.defineProperty(frame, 'contentWindow', {
      value: {
        print,
        addEventListener: (type: string, handler: () => void) => {
          listeners[type] = handler
        },
      },
    })

    frame?.onload?.(new Event('load'))
    expect(print).toHaveBeenCalledOnce()

    listeners.afterprint?.()
    expect(document.querySelector('iframe')).toBeNull()
  })
})
