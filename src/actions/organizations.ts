"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { organizationSchema } from "@/lib/validators";

export async function updateOrganizationAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    note: formData.get("note"),
    website: formData.get("website"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid organization details.",
    );
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      note: parsed.data.note || null,
      website: parsed.data.website || null,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", organizationId);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
      "error",
      getErrorMessage(error),
    );
  }

  revalidatePath(`/workspaces/${workspaceSlug}/organizations`);
  revalidatePath(`/workspaces/${workspaceSlug}/organizations/${organizationId}`);
  redirectWithMessage(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
    "success",
    "Organization updated.",
  );
}
