import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/workspaces" : "/signup";
  const primaryLabel = user ? "Open app" : "Get started";

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505]">
      <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,75,78,0.14),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,#080808_0%,#050505_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <BrandLogo size={22} rounded={false} />
            <span className="tracking-[0.18em] text-muted-foreground uppercase">WithValet</span>
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.08em] text-foreground sm:text-6xl lg:text-7xl">
            Open-source outreach CRM for teams that want ownership, not lock-in.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            Manage contacts, assign responsible teammates, track outreach, and keep your pipeline
            in one place. WithValet is open source, so you can run it, inspect it, and extend it
            yourself.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 items-center rounded-full border border-white/10 bg-white/[0.08] px-6 text-sm font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] hover:border-white/15 hover:bg-white/[0.12]"
            >
              {primaryLabel}
            </Link>
            <Link
              href="https://github.com/toxicmaximalist/withvalet"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 text-sm font-medium text-foreground hover:border-accent/40 hover:bg-white/[0.03]"
            >
              View repository
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            MIT-style workflow, self-host friendly, and built in the open.
          </p>
        </div>
      </section>
    </main>
  );
}
