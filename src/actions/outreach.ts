"use server";

import { revalidatePath } from "next/cache";

import { redirectWithMessage } from "@/lib/navigation";
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
