"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { importOutreachActivitiesFile } from "@/lib/workspace-imports";
import { getErrorMessage } from "@/lib/utils";
import { createActivityRecord } from "@/lib/workspace-mutations";
import type { Database } from "@/types/database";

export async function createActivityAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") || `/workspaces/${workspaceSlug}/outreach`;
  try {
    await createActivityRecord(workspaceSlug, {
      activityDate: String(formData.get("activityDate") ?? ""),
      contactId: String(formData.get("contactId") ?? ""),
      content: String(formData.get("content") ?? ""),
      organizationId: String(formData.get("organizationId") ?? "") || null,
      status: String(formData.get("status") ?? "") as Database["public"]["Enums"]["activity_status"],
      type: String(formData.get("type") ?? "") as Database["public"]["Enums"]["activity_type"],
    });
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/outreach`);
  revalidatePath(returnTo);
  redirectWithMessage(returnTo, "success", "Activity logged.");
}

export async function importActivitiesAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const file = formData.get("file");
  const returnTo =
    String(formData.get("returnTo") ?? "") || `/workspaces/${workspaceSlug}/outreach`;

  if (!(file instanceof File) || !file.size) {
    redirectWithMessage(returnTo, "error", "Choose a CSV or Excel file to import.");
  }

  let result: Awaited<ReturnType<typeof importOutreachActivitiesFile>>;

  try {
    result = await importOutreachActivitiesFile(workspaceSlug, file);
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
  revalidatePath(`/workspaces/${workspaceSlug}/outreach`);
  redirectWithMessage(
    returnTo,
    "success",
    `Imported ${result.createdActivities} outreach activities. ${result.createdContacts} contacts created, ${result.updatedContacts} contacts matched or refreshed, ${result.skippedActivities} activities skipped.`,
  );
}

export async function deleteAllActivitiesAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") || `/workspaces/${workspaceSlug}/outreach`;
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase
    .from("outreach_activities")
    .delete()
    .eq("workspace_id", workspace.id);

  if (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/outreach`);
  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
  revalidatePath(`/workspaces/${workspaceSlug}/organizations`);
  redirectWithMessage(returnTo, "success", "All outreach activities deleted.");
}
