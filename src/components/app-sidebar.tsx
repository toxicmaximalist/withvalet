"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderKanban,
  LogOut,
  MessageSquareMore,
  Settings2,
  Users2,
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { workspaceApi } from "@/store/workspace-api";

type AppSidebarProps = {
  workspaceName: string;
  workspaceSlug: string;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

const navigation = [
  { key: "contacts", label: "Contacts", icon: Users2 },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "folders", label: "Folders", icon: FolderKanban },
  { key: "outreach", label: "Outreach", icon: MessageSquareMore },
  { key: "settings", label: "Settings", icon: Settings2 },
];

export function AppSidebar({
  workspaceName,
  workspaceSlug,
  workspaces,
}: AppSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  function prefetchSection(section: string) {
    if (section === "contacts") {
      dispatch(
        workspaceApi.util.prefetch(
          "getContacts",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
      return;
    }

    if (section === "organizations") {
      dispatch(
        workspaceApi.util.prefetch(
          "getOrganizations",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
      return;
    }

    if (section === "folders") {
      dispatch(
        workspaceApi.util.prefetch(
          "getFolders",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
      return;
    }

    if (section === "outreach") {
      dispatch(
        workspaceApi.util.prefetch(
          "getWorkspaceActivities",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
      dispatch(
        workspaceApi.util.prefetch(
          "getContacts",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
      return;
    }

    if (section === "settings") {
      dispatch(
        workspaceApi.util.prefetch(
          "getWorkspaceMembers",
          { workspaceSlug },
          { ifOlderThan: 30 },
        ),
      );
    }
  }

  return (
    <aside className="sidebar-rail group/sidebar relative z-40 hidden overflow-visible lg:block">
      <div className="sidebar-panel flex h-screen flex-col border-r border-white/8 px-3 py-4">
        <div className="flex min-h-10 items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl">
            <BrandLogo size={24} rounded={false} />
          </div>
          <div className="sidebar-reveal min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-[-0.04em] text-foreground">
              {workspaceName}
            </p>
          </div>
        </div>

        <div className="sidebar-reveal mt-3">
          <WorkspaceSwitcher currentWorkspaceSlug={workspaceSlug} workspaces={workspaces} />
        </div>

        <div className="mt-5 flex-1">
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const active =
                pathname === `/workspaces/${workspaceSlug}/${item.key}` ||
                pathname.startsWith(`/workspaces/${workspaceSlug}/${item.key}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={`/workspaces/${workspaceSlug}/${item.key}`}
                  prefetch
                  onMouseEnter={() => prefetchSection(item.key)}
                  className={cn(
                    "flex min-h-11 items-center rounded-[18px] px-2.5 text-muted outline-none hover:bg-white/[0.05] hover:text-foreground focus-visible:bg-white/[0.05] focus-visible:text-foreground",
                    active &&
                      "bg-white/[0.12] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                  )}
                >
                  <div className="flex w-full items-center justify-center gap-3 group-hover/sidebar:justify-start">
                    <span className="flex size-9 shrink-0 items-center justify-center">
                      <Icon className="size-5" />
                    </span>
                    <span className="sidebar-reveal min-w-0 flex-1 text-sm font-medium">
                      <span className="truncate">{item.label}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <form action={logoutAction}>
            <button className="flex min-h-11 w-full items-center rounded-[18px] px-2.5 text-muted hover:border-white/16 hover:bg-white/[0.04] hover:text-foreground">
              <div className="flex w-full items-center justify-center gap-3 group-hover/sidebar:justify-start">
                <span className="flex size-9 shrink-0 items-center justify-center">
                  <LogOut className="size-5" />
                </span>
                <span className="sidebar-reveal min-w-0 flex-1 text-left text-sm font-medium">
                  Log out
                </span>
              </div>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
