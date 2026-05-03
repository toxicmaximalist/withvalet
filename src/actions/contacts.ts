"use server";

import { redirect } from "next/navigation";

import { getWorkspaceContext } from "@/lib/data";
import { updateContactRecord } from "@/lib/workspace-mutations";
import { buildPathWithMessage, redirectWithMessage } from "@/lib/navigation";
import { importContactsFile } from "@/lib/workspace-imports";
import {
  getErrorMessage,
  getSupabaseMigrationGuidance,
  isContactOwnerFeatureUnavailableError,
} from "@/lib/utils";
import { contactSchema } from "@/lib/validators";
import type { Database } from "@/types/database";

async function resolveOrganizationId(
  workspaceSlug: string,
  organizationName: string | undefined,
) {
  const trimmed = organizationName?.trim();

  if (!trimmed) {
    return null;
  }

  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { data: existingOrganization, error: existingOrganizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("workspace_id", workspace.id)
    .ilike("name", trimmed)
    .maybeSingle();
  const existingOrganizationRow =
    existingOrganization as Database["public"]["Tables"]["organizations"]["Row"] | null;

  if (existingOrganizationError) {
    throw new Error(getErrorMessage(existingOrganizationError));
  }

  if (existingOrganizationRow) {
    return existingOrganizationRow.id;
  }

  const { data: createdOrganization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: trimmed,
      workspace_id: workspace.id,
    })
    .select("*")
    .single();
  const createdOrganizationRow =
    createdOrganization as Database["public"]["Tables"]["organizations"]["Row"];

  if (organizationError) {
    throw new Error(getErrorMessage(organizationError));
  }

  return createdOrganizationRow.id;
}

async function resolveResponsibleUserId(
  workspaceSlug: string,
  workspaceId: string,
  responsibleUserId: string | undefined,
) {
  const normalized = responsibleUserId?.trim();

  if (!normalized) {
    return null;
  }

  const { supabase } = await getWorkspaceContext(workspaceSlug);
  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!membership) {
    throw new Error("Responsible person must be an active workspace member.");
  }

  return membership.user_id;
}

export async function createContactAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    organizationName: formData.get("organizationName"),
    responsibleUserId: formData.get("responsibleUserId"),
    telegram: formData.get("telegram"),
    linkedin: formData.get("linkedin"),
    whatsapp: formData.get("whatsapp"),
    gmail: formData.get("gmail"),
    status: formData.get("status"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid contact details.",
    );
  }

  let data:
    | Database["public"]["Tables"]["contacts"]["Row"]
    | undefined;

  try {
    const organizationId = await resolveOrganizationId(
      workspaceSlug,
      parsed.data.organizationName,
    );
    const responsibleUserId = await resolveResponsibleUserId(
      workspaceSlug,
      workspace.id,
      parsed.data.responsibleUserId ?? undefined,
    );

    const insertPayload = {
      gmail: parsed.data.gmail || null,
      linkedin: parsed.data.linkedin || null,
      name: parsed.data.name,
      note: parsed.data.note || null,
      organization_id: organizationId,
      responsible_user_id: responsibleUserId,
      role: parsed.data.role || null,
      status: parsed.data.status,
      telegram: parsed.data.telegram || null,
      whatsapp: parsed.data.whatsapp || null,
      workspace_id: workspace.id,
    };

    let result = await supabase
      .from("contacts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (result.error) {
      const message = getErrorMessage(result.error);

      if (isContactOwnerFeatureUnavailableError(message)) {
        if (responsibleUserId) {
          throw new Error(getSupabaseMigrationGuidance(message));
        }

        const fallbackInsertPayload = {
          gmail: insertPayload.gmail,
          linkedin: insertPayload.linkedin,
          name: insertPayload.name,
          note: insertPayload.note,
          organization_id: insertPayload.organization_id,
          role: insertPayload.role,
          status: insertPayload.status,
          telegram: insertPayload.telegram,
          whatsapp: insertPayload.whatsapp,
          workspace_id: insertPayload.workspace_id,
        };
        result = await supabase
          .from("contacts")
          .insert(fallbackInsertPayload)
          .select("*")
          .single();
      }
    }

    if (result.error) {
      throw result.error;
    }

    data = result.data;
  } catch (error) {
    redirectWithMessage(`/workspaces/${workspaceSlug}/contacts`, "error", getErrorMessage(error));
  }

  if (!data) {
    redirectWithMessage(`/workspaces/${workspaceSlug}/contacts`, "error", "Contact could not be created.");
  }

  redirect(
    buildPathWithMessage(
      `/workspaces/${workspace.slug}/contacts/${data.id}`,
      "success",
      "Contact created.",
    ),
  );
}

export async function updateContactAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  try {
    await updateContactRecord(workspaceSlug, contactId, {
      gmail: String(formData.get("gmail") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? ""),
      organizationName: String(formData.get("organizationName") ?? ""),
      responsibleUserId: String(formData.get("responsibleUserId") ?? ""),
      role: String(formData.get("role") ?? ""),
      status: String(formData.get("status") ?? "") as Database["public"]["Enums"]["contact_status"],
      telegram: String(formData.get("telegram") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
    });
  } catch (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts/${contactId}`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/contacts/${contactId}`,
    "success",
    "Contact updated.",
  );
}

export async function deleteContactAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", contactId);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts/${contactId}`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/contacts`,
    "success",
    "Contact deleted.",
  );
}

export async function deleteAllContactsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("workspace_id", workspace.id);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/contacts`,
    "success",
    "All contacts deleted.",
  );
}

export async function importContactsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || !file.size) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts`,
      "error",
      "Choose a CSV or Excel file to import.",
    );
  }

  let result: Awaited<ReturnType<typeof importContactsFile>>;

  try {
    result = await importContactsFile(workspaceSlug, file);
  } catch (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/contacts`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/contacts`,
    "success",
    `Imported ${result.totalParsed} contact rows. ${result.created} created, ${result.updated} updated, ${result.skipped} skipped.`,
  );
}
