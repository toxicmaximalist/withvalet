import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function FieldLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn(
        "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-[#0f1012] px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-muted focus:border-accent/35 focus:bg-[#131418] focus:shadow-[0_0_0_1px_rgba(251,75,78,0.1),0_0_28px_rgba(214,31,44,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-white/10 bg-[#0f1012] px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-muted focus:border-accent/35 focus:bg-[#131418] focus:shadow-[0_0_0_1px_rgba(251,75,78,0.1),0_0_28px_rgba(214,31,44,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-[#0f1012] px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-accent/35 focus:bg-[#131418] focus:shadow-[0_0_0_1px_rgba(251,75,78,0.1),0_0_28px_rgba(214,31,44,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
