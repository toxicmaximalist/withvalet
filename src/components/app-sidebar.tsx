"use client";

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

  return (
    <aside className="relative hidden min-h-screen border-r border-white/8 bg-[#0b0b0c] lg:block">
      <div className="relative flex h-full flex-col px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <BrandLogo size={28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{workspaceName}</p>
          </div>
        </div>

        <div className="mt-3">
          <WorkspaceSwitcher currentWorkspaceSlug={workspaceSlug} workspaces={workspaces} />
        </div>

        <div className="mt-6 flex-1">
          <p className="px-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Records
          </p>
          <nav className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active = pathname.includes(`/${item.key}`);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={`/workspaces/${workspaceSlug}/${item.key}`}
                prefetch
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted hover:bg-white/[0.03] hover:text-foreground",
                  active &&
                    "bg-white/[0.08] text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          </nav>
        </div>

        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">/{workspaceSlug}</p>
          <Link
            href={`/workspaces/${workspaceSlug}/settings`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            Open settings
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <form action={logoutAction} className="mt-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:border-white/16 hover:bg-white/[0.03] hover:text-foreground">
            <LogOut className="size-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
