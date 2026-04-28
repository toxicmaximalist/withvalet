"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";

const routeLabels = [
  { match: "/contacts/", label: "Contact Record" },
  { match: "/contacts", label: "Contacts" },
  { match: "/organizations/", label: "Organization Record" },
  { match: "/organizations", label: "Organizations" },
  { match: "/folders/", label: "Folder" },
  { match: "/folders", label: "Folders" },
  { match: "/outreach", label: "Outreach" },
  { match: "/settings", label: "Settings" },
];

function getRouteLabel(pathname: string) {
  return routeLabels.find((entry) => pathname.includes(entry.match))?.label ?? "Workspace";
}

function getBackLink(pathname: string, workspaceSlug: string) {
  if (pathname.includes("/contacts/")) {
    return {
      href: `/workspaces/${workspaceSlug}/contacts`,
      label: "Back to Contacts",
    };
  }

  if (pathname.includes("/organizations/")) {
    return {
      href: `/workspaces/${workspaceSlug}/organizations`,
      label: "Back to Organizations",
    };
  }

  if (pathname.includes("/folders/")) {
    return {
      href: `/workspaces/${workspaceSlug}/folders`,
      label: "Back to Folders",
    };
  }

  return null;
}

export function WorkspaceTopbar({
  workspaceName,
  workspaceSlug,
}: {
  workspaceName: string;
  workspaceSlug: string;
}) {
  const pathname = usePathname();
  const routeLabel = getRouteLabel(pathname);
  const backLink = getBackLink(pathname, workspaceSlug);

  return (
    <div className="sticky top-0 z-30 border-b border-white/8 bg-[#0b0b0c]/95 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          {backLink ? (
            <Link
              href={backLink.href}
              className="mb-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted hover:border-white/16 hover:bg-white/[0.04] hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {backLink.label}
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base font-medium text-foreground">
              {routeLabel}
            </h1>
            <p className="truncate text-sm text-muted">
              {workspaceName} · /{workspaceSlug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/workspaces/${workspaceSlug}/settings`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
          >
            <Settings2 className="size-4" />
            Workspace settings
          </Link>
        </div>
      </div>
    </div>
  );
}
