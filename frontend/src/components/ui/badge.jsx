import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium tracking-tight transition-all duration-150 tabular-nums select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs",
        secondary:
          "border-zinc-200/90 bg-zinc-100/90 text-zinc-800 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-200",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-950/60 dark:text-rose-200 font-semibold",
        outline:
          "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
        success:
          "border-emerald-300/80 bg-emerald-50 text-emerald-800 dark:border-emerald-600/50 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold",
        warning:
          "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-600/50 dark:bg-amber-950/60 dark:text-amber-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
