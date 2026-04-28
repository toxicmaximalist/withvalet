"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
};

export function WorkspaceSwitcher({
  currentWorkspaceSlug,
  workspaces,
}: {
  currentWorkspaceSlug: string;
  workspaces: WorkspaceOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    workspaces.forEach((workspace) => {
      router.prefetch(`/workspaces/${workspace.slug}/contacts`);
    });
  }, [router, workspaces]);

  return (
    <div className="relative">
      <select
        aria-label="Switch workspace"
        value={currentWorkspaceSlug}
        onChange={(event) => {
          const nextHref = `/workspaces/${event.target.value}/contacts`;
          router.prefetch(nextHref);
          startTransition(() => {
            router.push(nextHref);
          });
        }}
        className="panel w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-sm font-medium text-foreground"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.slug} className="bg-background-panel text-foreground">
            {workspace.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
