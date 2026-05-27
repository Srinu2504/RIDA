import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  pill?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, pill, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full border-[0.5px] border-[#d8d0c0] bg-cream-input px-3.5 py-2 text-xs text-text-mid",
        "placeholder:text-text-faint focus:border-green-primary focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        pill ? "rounded-[20px]" : "rounded-lg",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
