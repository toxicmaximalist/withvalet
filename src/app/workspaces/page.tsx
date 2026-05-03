import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { joinWorkspaceAction } from "@/actions/workspaces";
import { BrandLogo } from "@/components/brand-logo";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { SubmitButton } from "@/components/submit-button";
import { getAccessibleWorkspaces, type WorkspaceSummary } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";
import {
  formatDate,
  getErrorMessage,
  getSupabaseMigrationGuidance,
  getInitials,
  isSupabaseSchemaError,
} from "@/lib/utils";

type WorkspacesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function WorkspaceRow({ workspace }: { workspace: WorkspaceSummary }) {
  return (
    <Link
      href={`/workspaces/${workspace.slug}/contacts`}
      className="group flex items-center gap-4 border-b border-white/8 px-5 py-5 last:border-b-0 hover:bg-white/[0.03]"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-foreground">
        {getInitials(workspace.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-lg font-medium text-foreground">{workspace.name}</h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            {workspace.role}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          /{workspace.slug} · Created {formatDate(workspace.created_at)}
        </p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

export default async function WorkspacesPage({ searchParams }: WorkspacesPageProps) {
  const params = await searchParams;
  let workspaces: WorkspaceSummary[] = [];
  let loadError: string | null = null;

  try {
    workspaces = await getAccessibleWorkspaces();
  } catch (error) {
    loadError = getErrorMessage(error);
  }

  return (
    <main className="auth-screen auth-grid-lines min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="text-center">
            <div className="flex justify-center">
              <BrandLogo size={40} className="mb-4" />
            </div>
            <h1 className="mt-5 text-[2.4rem] font-medium tracking-[-0.05em] text-foreground">
              Welcome back
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted">
              Choose an existing workspace or create a new one. Every contact, organization,
              folder, and outreach record stays isolated inside its workspace.
            </p>
          </div>

          <NoticeBanner
            className="mt-8 rounded-2xl border-white/10 bg-white/[0.035] text-foreground"
            error={getMessageValue(params.error)}
            success={getMessageValue(params.success)}
          />

          {loadError ? (
            <div className="mt-6 rounded-[28px] border border-danger/30 bg-danger/8 p-6">
              <h2 className="text-xl font-semibold text-foreground">Workspace data is not ready</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{loadError}</p>
              {isSupabaseSchemaError(loadError) ? (
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <p>This usually means the Supabase migration has not been applied yet.</p>
                  <p>{getSupabaseMigrationGuidance(loadError)}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10">
            <Link
              href="/onboarding/create-workspace"
              className="flex w-full items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.045] px-6 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.22)] transition hover:border-white/14 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-foreground">
                  <Plus className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">Create Workspace</p>
                  <p className="mt-1 text-sm text-muted">
                    Start a new CRM environment for a team, client, or pipeline.
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted" />
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/8" />
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {workspaces.length ? "Your workspaces" : "No workspaces"}
              </p>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            {workspaces.length ? (
              <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-background-panel/80 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
                {workspaces.map((workspace) => (
                  <WorkspaceRow key={workspace.id} workspace={workspace} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-background-panel/70 px-6 py-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-medium text-foreground">No workspaces yet</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                  Create your first workspace to start managing contacts and outreach, or join one
                  with an invite code below.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Join existing</p>
            <h3 className="mt-3 text-xl font-medium text-foreground">Use an invite code</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              If someone already invited you, paste the workspace invite code here.
            </p>
            <form action={joinWorkspaceAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <FieldLabel htmlFor="inviteCode">Invite code</FieldLabel>
                <TextInput
                  id="inviteCode"
                  name="inviteCode"
                  placeholder="AB12CD34EF"
                  className="h-12 rounded-2xl border-white/14 bg-white/[0.04] px-4"
                  required
                />
              </div>
              <SubmitButton
                className="h-12 rounded-full border-white/5 bg-white/[0.08] px-6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:scale-100 hover:border-white/10 hover:bg-white/[0.11]"
              >
                Join workspace
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
