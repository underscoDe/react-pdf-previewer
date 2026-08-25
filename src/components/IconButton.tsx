import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
}

export function IconButton({ label, active, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-active={active ? 'true' : undefined}
      aria-pressed={active === undefined ? undefined : active}
      className={cn('rpp-icon-button', className)}
      {...props}
    />
  )
}
