import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring interactive-control inline-flex items-center justify-center gap-2 whitespace-normal rounded-md border text-center text-sm font-semibold text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "border-financial-expense bg-financial-expense text-primary-foreground hover:bg-financial-expense/90",
        outline:
          "border-border bg-card text-foreground hover:border-foreground/45 hover:bg-muted/65",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-muted",
        ghost:
          "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        link:
          "border-transparent text-primary underline-offset-4 hover:underline hover:text-primary-hover rounded-none",
        glass:
          "border-border bg-card text-foreground hover:border-foreground/45 hover:bg-muted/65",
        gradient:
          "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
        gold:
          "border-financial-warning/40 bg-warning-wash text-warning-foreground hover:border-financial-warning/70",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 px-3 py-2 text-xs",
        lg: "min-h-12 px-6 py-2.5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
