import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  description,
  footer,
  children,
  className,
}: AuthShellProps) {
  return (
    <main className="auth-screen auth-grid-lines relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.03),transparent_14%),radial-gradient(circle_at_50%_18%,rgba(251,75,78,0.08),transparent_12%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={cn("w-full max-w-md text-center", className)}>
          <Link
            href="/"
            className="inline-flex w-full flex-col items-center justify-center text-center"
            aria-label="Go to home"
          >
            <BrandLogo
              size={48}
              className="mb-7 border border-white/10 bg-white/[0.03] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            />
          </Link>

          <h1 className="text-[2rem] font-medium tracking-[-0.04em] text-foreground sm:text-[2.25rem]">
            {title}
          </h1>
          {description ? (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">{description}</p>
          ) : null}

          <div className="mt-9">{children}</div>

          {footer ? <div className="mt-7 text-sm text-muted">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
