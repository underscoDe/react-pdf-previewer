import { cn } from '../utils'

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('rpp-spinner', className)} />
}
