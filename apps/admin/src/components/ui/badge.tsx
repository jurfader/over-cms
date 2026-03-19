import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary)]/20',
        secondary:
          'bg-[var(--color-secondary-muted)] text-[var(--color-secondary)] border border-[var(--color-secondary)]/20',
        success:
          'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/20',
        warning:
          'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
        destructive:
          'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] border border-[var(--color-destructive)]/20',
        outline:
          'border border-[var(--color-border-hover)] text-[var(--color-muted-foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
