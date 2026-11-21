import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-xs font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-semibold",
        primary:
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-semibold",
        destructive:
          "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 font-medium",
        outline:
          "border border-zinc-200/90 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] font-medium",
        secondary:
          "bg-zinc-100 text-zinc-800 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium",
        ghost:
          "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 font-medium",
        link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100 p-0 h-auto font-medium",
      },
      size: {
        default: "h-8.5 px-3 py-1.5",
        sm: "h-7.5 rounded-md px-2.5 text-[11px]",
        lg: "h-9.5 rounded-lg px-4 text-sm",
        icon: "h-8.5 w-8.5 rounded-lg",
        iconSm: "h-7 w-7 rounded-md p-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
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
