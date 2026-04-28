"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { activitySchema } from "@/lib/validators";

export async function createActivityAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") || `/workspaces/${workspaceSlug}/outreach`;
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = activitySchema.safeParse({
    activityDate: formData.get("activityDate"),
    contactId: formData.get("contactId"),
    content: formData.get("content"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      returnTo,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid activity details.",
    );
  }

  let organizationId =
    parsed.data.organizationId && parsed.data.organizationId !== ""
      ? parsed.data.organizationId
      : null;

  if (!organizationId) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("organization_id")
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.contactId)
      .maybeSingle();

    organizationId = contact?.organization_id ?? null;
  }

  const { error } = await supabase.from("outreach_activities").insert({
    activity_date: new Date(parsed.data.activityDate).toISOString(),
    contact_id: parsed.data.contactId,
    content: parsed.data.content,
    organization_id: organizationId,
    status: parsed.data.status,
    type: parsed.data.type,
    workspace_id: workspace.id,
  });

  if (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/outreach`);
  revalidatePath(returnTo);
  redirectWithMessage(returnTo, "success", "Activity logged.");
}
