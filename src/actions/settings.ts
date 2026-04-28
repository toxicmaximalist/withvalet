"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { workspaceSchema } from "@/lib/validators";

export async function updateWorkspaceSettingsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid workspace details.",
    );
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
    })
    .eq("id", workspace.id);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(error),
    );
  }

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Workspace updated.",
  );
}

export async function regenerateInviteCodeAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase.rpc("regenerate_workspace_invite_code", {
    target_workspace_id: workspace.id,
  });

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(error),
    );
  }

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Invite code regenerated.",
  );
}
