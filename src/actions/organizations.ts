"use server";

import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { updateOrganizationRecord } from "@/lib/workspace-mutations";

export async function updateOrganizationAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  try {
    await updateOrganizationRecord(workspaceSlug, organizationId, {
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
  } catch (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
    "success",
    "Organization updated.",
  );
}
