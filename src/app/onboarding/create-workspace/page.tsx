import Link from "next/link";

import { createWorkspaceAction } from "@/actions/workspaces";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getMessageValue } from "@/lib/navigation";

type CreateWorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreateWorkspacePage({
  searchParams,
}: CreateWorkspacePageProps) {
  await requireUser();
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="panel-strong w-full max-w-xl rounded-[32px] border p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Onboarding</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Create your first workspace
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
          Workspaces isolate members, contacts, organizations, folders, and outreach activity. You
          can add more later.
        </p>

        <NoticeBanner
          className="mt-6"
          error={getMessageValue(params.error)}
          success={getMessageValue(params.success)}
        />

        <form action={createWorkspaceAction} className="mt-6 space-y-5">
          <div>
            <FieldLabel htmlFor="name">Workspace name</FieldLabel>
            <TextInput id="name" name="name" placeholder="Valet Ventures" required />
          </div>
          <SubmitButton>Create workspace</SubmitButton>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already part of a team?{" "}
          <Link href="/workspaces" className="text-foreground underline decoration-accent/40 underline-offset-4">
            Go to workspace chooser
          </Link>
        </p>
      </div>
    </main>
  );
}
