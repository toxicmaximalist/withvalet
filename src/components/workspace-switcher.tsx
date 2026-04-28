"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { useAppDispatch } from "@/store/hooks";
import { workspaceApi } from "@/store/workspace-api";

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
  const dispatch = useAppDispatch();
  const [, startTransition] = useTransition();

  useEffect(() => {
    workspaces.forEach((workspace) => {
      router.prefetch(`/workspaces/${workspace.slug}/contacts`);
      dispatch(
        workspaceApi.util.prefetch(
          "getContacts",
          { workspaceSlug: workspace.slug },
          { ifOlderThan: 60 },
        ),
      );
    });
  }, [dispatch, router, workspaces]);

  return (
    <div className="relative">
      <select
        aria-label="Switch workspace"
        value={currentWorkspaceSlug}
        onChange={(event) => {
          const nextHref = `/workspaces/${event.target.value}/contacts`;
          const nextWorkspaceSlug = event.target.value;
          router.prefetch(nextHref);
          dispatch(
            workspaceApi.util.prefetch(
              "getContacts",
              { workspaceSlug: nextWorkspaceSlug },
              { force: true },
            ),
          );
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
