import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/cn"

export const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,color,box-shadow,transform] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-[0.5px]",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "bg-[color:var(--accent)] text-[color:var(--accent-fg)]",
          "hover:bg-[color:var(--accent-hover)] shadow-[var(--shadow-sm)]",
        ),
        secondary: cn(
          "bg-[color:var(--bg-elevated)] text-[color:var(--fg)]",
          "border border-[color:var(--border)] hover:bg-[color:var(--bg-subtle)]",
        ),
        ghost: "text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)]",
        danger: cn(
          "bg-[color:var(--danger)] text-white",
          "hover:opacity-90 shadow-[var(--shadow-sm)]",
        ),
        link: "text-[color:var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
        lg: "h-12 px-6 text-base rounded-[var(--radius-md)]",
        icon: "h-9 w-9 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  ),
)
Button.displayName = "Button"
