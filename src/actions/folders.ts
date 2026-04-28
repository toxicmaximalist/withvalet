"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import {
  createFolderRecord,
  syncFolderContactsRecord,
} from "@/lib/workspace-mutations";

export async function createFolderAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  try {
    await createFolderRecord(workspaceSlug, {
      name: String(formData.get("name") ?? ""),
    });
  } catch (error) {
    redirectWithMessage(`/workspaces/${workspaceSlug}/folders`, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/folders`);
  redirectWithMessage(`/workspaces/${workspaceSlug}/folders`, "success", "Folder created.");
}

export async function syncFolderContactsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const folderId = String(formData.get("folderId") ?? "");
  try {
    await syncFolderContactsRecord(workspaceSlug, folderId, {
      contactIds: formData
        .getAll("contactIds")
        .map((value) => String(value))
        .filter(Boolean),
    });
  } catch (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/folders/${folderId}`,
      "error",
      getErrorMessage(error),
    );
  }

  revalidatePath(`/workspaces/${workspaceSlug}/folders`);
  revalidatePath(`/workspaces/${workspaceSlug}/folders/${folderId}`);
  redirectWithMessage(
    `/workspaces/${workspaceSlug}/folders/${folderId}`,
    "success",
    "Folder membership updated.",
  );
}

export async function deleteFolderAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const folderId = String(formData.get("folderId") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", folderId);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/folders/${folderId}`,
      "error",
      getErrorMessage(error),
    );
  }

  revalidatePath(`/workspaces/${workspaceSlug}/folders`);
  redirectWithMessage(`/workspaces/${workspaceSlug}/folders`, "success", "Folder deleted.");
}
