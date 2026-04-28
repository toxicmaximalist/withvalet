"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { folderSchema } from "@/lib/validators";

export async function createFolderAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = folderSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/folders`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid folder details.",
    );
  }

  const { error } = await supabase.from("folders").insert({
    name: parsed.data.name,
    workspace_id: workspace.id,
  });

  if (error) {
    redirectWithMessage(`/workspaces/${workspaceSlug}/folders`, "error", getErrorMessage(error));
  }

  revalidatePath(`/workspaces/${workspaceSlug}/folders`);
  redirectWithMessage(`/workspaces/${workspaceSlug}/folders`, "success", "Folder created.");
}

export async function syncFolderContactsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const folderId = String(formData.get("folderId") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const selectedContactIds = new Set(
    formData
      .getAll("contactIds")
      .map((value) => String(value))
      .filter(Boolean),
  );

  const { data: existingLinks, error: existingLinksError } = await supabase
    .from("contact_folders")
    .select("contact_id")
    .eq("workspace_id", workspace.id)
    .eq("folder_id", folderId);

  if (existingLinksError) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/folders/${folderId}`,
      "error",
      getErrorMessage(existingLinksError),
    );
  }

  const existingContactIds = new Set(
    existingLinks?.map((link) => link.contact_id) ?? [],
  );

  const toInsert = [...selectedContactIds].filter(
    (contactId) => !existingContactIds.has(contactId),
  );
  const toDelete = [...existingContactIds].filter(
    (contactId) => !selectedContactIds.has(contactId),
  );

  if (toDelete.length) {
    const { error: deleteError } = await supabase
      .from("contact_folders")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("folder_id", folderId)
      .in("contact_id", toDelete);

    if (deleteError) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/folders/${folderId}`,
        "error",
        getErrorMessage(deleteError),
      );
    }
  }

  if (toInsert.length) {
    const { error: insertError } = await supabase.from("contact_folders").insert(
      toInsert.map((contactId) => ({
        contact_id: contactId,
        folder_id: folderId,
        workspace_id: workspace.id,
      })),
    );

    if (insertError) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/folders/${folderId}`,
        "error",
        getErrorMessage(insertError),
      );
    }
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
