import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-retrowave',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-retro-primary to-retro-sunset text-primary-foreground border border-retro-primary/20 hover:shadow-synthwave-glow-sm hover:scale-105 hover:border-retro-primary',
        destructive:
          'bg-gradient-to-r from-destructive to-red-500 text-destructive-foreground border border-destructive/30 hover:shadow-[0_0_20px_hsl(var(--destructive))] hover:scale-105',
        outline:
          'border border-retro-primary/50 bg-gradient-to-br from-background/80 to-retro-earth-pink/5 backdrop-blur-sm hover:bg-gradient-to-br hover:from-retro-primary/10 hover:to-retro-sunset/5 hover:text-retro-primary hover:border-retro-primary hover:shadow-synthwave-glow-sm',
        secondary:
          'bg-gradient-to-br from-secondary to-retro-earth-pink/20 text-secondary-foreground border border-retro-coral/30 hover:from-secondary/80 hover:to-retro-dust-rose/20 hover:border-retro-coral/60',
        ghost: 'hover:bg-gradient-to-br hover:from-retro-primary/10 hover:to-retro-earth-pink/5 hover:text-retro-primary transition-all duration-300',
        link: 'text-retro-primary underline-offset-4 hover:underline hover:text-glow-soft',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
