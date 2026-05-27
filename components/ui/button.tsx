import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-primary disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-green-primary text-cream-surface hover:bg-[#245a42] disabled:bg-cream-border disabled:text-text-muted",
        outline:
          "rounded-lg border-[1.5px] border-green-primary bg-transparent text-green-primary hover:bg-green-pale",
        ghost: "rounded-lg text-green-primary hover:bg-green-pale",
        danger:
          "rounded-lg border border-[#c0392b] bg-transparent text-[#c0392b] hover:bg-[#fdecea]",
        pill: "rounded-[20px] border-[1.5px] border-green-primary bg-transparent text-green-primary hover:bg-green-pale",
        cream:
          "rounded-lg border-[0.5px] border-cream-border bg-cream-surface text-text-mid hover:bg-green-pale",
      },
      size: {
        default: "h-10 px-[18px] py-2",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
