import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DEFAULT_ICONS } from '../icons'
import { DEFAULT_LABELS, type PdfViewerLabels } from '../labels'
import type { PdfViewerClassNames, PdfViewerIcons, PdfViewerSlot } from '../types'
import { cn } from '../utils'

interface PdfUi {
  classNames: PdfViewerClassNames
  icons: PdfViewerIcons
  labels: PdfViewerLabels
}

const PdfUiContext = createContext<PdfUi>({
  classNames: {},
  icons: DEFAULT_ICONS,
  labels: DEFAULT_LABELS,
})

interface PdfUiProviderProps {
  classNames?: PdfViewerClassNames
  icons?: Partial<PdfViewerIcons>
  labels?: Partial<PdfViewerLabels>
  children: ReactNode
}

export function PdfUiProvider({ classNames, icons, labels, children }: PdfUiProviderProps) {
  const value = useMemo<PdfUi>(
    () => ({
      classNames: classNames ?? {},
      icons: { ...DEFAULT_ICONS, ...icons },
      labels: { ...DEFAULT_LABELS, ...labels },
    }),
    [classNames, icons, labels]
  )

  return <PdfUiContext.Provider value={value}>{children}</PdfUiContext.Provider>
}

export interface PdfUiApi extends PdfUi {
  /**
   * Built-in class for a slot plus the consumer's, which comes last so equal
   * specificity resolves in their favour.
   */
  slot: (name: PdfViewerSlot, ...extra: Array<string | false | undefined>) => string
}

export function usePdfUi(): PdfUiApi {
  const context = useContext(PdfUiContext)

  return useMemo(
    () => ({
      ...context,
      slot: (name, ...extra) => cn(`rpp-${toKebab(name)}`, ...extra, context.classNames[name]),
    }),
    [context]
  )
}

const kebabCache = new Map<string, string>()

function toKebab(value: string): string {
  let cached = kebabCache.get(value)
  if (!cached) {
    cached = value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    kebabCache.set(value, cached)
  }
  return cached
}
