import { Fragment, type ReactNode } from 'react'
import { usePdfUi } from '../PdfUiContext'

export interface ToolbarItem {
  key: string
  node: ReactNode
}

function Separator() {
  const { slot } = usePdfUi()
  return <span className={slot('separator')} aria-hidden="true" />
}

/**
 * Renders the items that have content, separated by a rule. Driving the rules
 * from the surviving items is what keeps them correct as features are turned
 * off, instead of a thicket of conditionals around each one.
 */
export function ToolbarGroup({ items }: { items: ToolbarItem[] }) {
  const { slot } = usePdfUi()
  const visible = items.filter(item => item.node)

  if (visible.length === 0) return null

  return (
    <div className={slot('toolbarGroup')}>
      {visible.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 && <Separator />}
          {item.node}
        </Fragment>
      ))}
    </div>
  )
}
