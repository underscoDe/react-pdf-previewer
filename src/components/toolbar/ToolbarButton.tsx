import { IconButton, type IconButtonProps } from '../IconButton'
import { usePdfUi } from '../PdfUiContext'

/** An IconButton wearing the toolbar's own sizing and hover treatment. */
export function ToolbarButton(props: IconButtonProps) {
  const { slot } = usePdfUi()
  return <IconButton {...props} className={slot('button', props.className)} />
}
