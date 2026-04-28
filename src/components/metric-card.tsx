import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  accent?: "default" | "red";
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  accent = "default",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "panel relative overflow-hidden rounded-[26px] p-5",
        accent === "red" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/70 before:to-transparent",
        className,
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
    </div>
  );
}
