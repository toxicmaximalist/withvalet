"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
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

  useEffect(() => {
    dispatch(
      workspaceApi.util.prefetch(
        "getContacts",
        { workspaceSlug },
        { ifOlderThan: 60 },
      ),
    );
    dispatch(
      workspaceApi.util.prefetch(
        "getOrganizations",
        { workspaceSlug },
        { ifOlderThan: 60 },
      ),
    );
    dispatch(
      workspaceApi.util.prefetch(
        "getFolders",
        { workspaceSlug },
        { ifOlderThan: 60 },
      ),
    );
    dispatch(
      workspaceApi.util.prefetch(
        "getWorkspaceActivities",
        { workspaceSlug },
        { ifOlderThan: 60 },
      ),
    );
    dispatch(
      workspaceApi.util.prefetch(
        "getWorkspaceMembers",
        { workspaceSlug },
        { ifOlderThan: 60 },
      ),
    );
  }, [dispatch, workspaceSlug]);

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
      <div className="sidebar-panel absolute inset-y-0 left-0 flex min-h-screen flex-col overflow-hidden border-r border-white/8 px-3 py-4">
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

        <div className="sidebar-reveal mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
          <p className="mt-2 text-xs font-medium text-foreground">/{workspaceSlug}</p>
          <Link
            href={`/workspaces/${workspaceSlug}/settings`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
          >
            Open settings
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <form action={logoutAction} className="mt-4">
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
    </aside>
  );
}
