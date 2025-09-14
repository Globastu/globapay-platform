import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
        outline: 
          "text-foreground border-border",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/90",
        error:
          "border-transparent bg-error text-error-foreground shadow hover:bg-error/90",
        info:
          "border-transparent bg-info text-info-foreground shadow hover:bg-info/90",
        // Soft variants with subtle backgrounds
        'success-soft':
          "border-success/20 bg-success/10 text-success hover:bg-success/20",
        'warning-soft':
          "border-warning/20 bg-warning/10 text-warning hover:bg-warning/20",
        'error-soft':
          "border-error/20 bg-error/10 text-error hover:bg-error/20",
        'info-soft':
          "border-info/20 bg-info/10 text-info hover:bg-info/20",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1 h-3 w-3">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }