import Link from "next/link";
import { ArrowRight } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="panel-strong flex min-h-72 flex-col items-start justify-center rounded-[30px] border px-8 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">CRM state</p>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h3>
      <p className="mt-3 max-w-lg text-sm leading-7 text-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-foreground hover:border-accent/40 hover:bg-white/[0.03]"
        >
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
