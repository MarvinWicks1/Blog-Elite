import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-white hover:opacity-90",
        destructive: "text-white hover:opacity-90",
        outline: "border hover:opacity-90",
        secondary: "hover:opacity-80",
        ghost: "hover:opacity-90",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Get base classes and add inline styles for colors
    const baseClasses = buttonVariants({ variant, size, className })
    const getVariantStyles = () => {
      switch (variant) {
        case 'default':
          return { backgroundColor: '#2563eb', color: 'white' }
        case 'destructive':
          return { backgroundColor: '#dc2626', color: 'white' }
        case 'outline':
          return { 
            backgroundColor: 'white', 
            color: '#111827',
            border: '1px solid #d1d5db'
          }
        case 'secondary':
          return { backgroundColor: '#f3f4f6', color: '#111827' }
        case 'ghost':
          return { backgroundColor: 'transparent', color: '#111827' }
        case 'link':
          return { backgroundColor: 'transparent', color: '#2563eb' }
        default:
          return { backgroundColor: '#2563eb', color: 'white' }
      }
    }
    
    return (
      <Comp
        className={baseClasses}
        style={getVariantStyles()}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
