export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Falls back to a new tab so a blocked fetch still leaves a way to the document.
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Download failed with status ${response.status}`)

    const objectUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

export function printFile(url: string): void {
  const frame = document.createElement('iframe')
  frame.style.display = 'none'
  frame.src = url
  frame.onload = () => {
    const frameWindow = frame.contentWindow
    if (!frameWindow) return
    frameWindow.addEventListener('afterprint', () => frame.remove())
    frameWindow.print()
  }
  document.body.appendChild(frame)
}
