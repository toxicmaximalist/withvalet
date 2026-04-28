"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getWorkspaceContext } from "@/lib/data";
import { updateContactRecord } from "@/lib/workspace-mutations";
import { buildPathWithMessage, redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
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

export async function createContactAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    organizationName: formData.get("organizationName"),
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

  const organizationId = await resolveOrganizationId(
    workspaceSlug,
    parsed.data.organizationName,
  );

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      gmail: parsed.data.gmail || null,
      linkedin: parsed.data.linkedin || null,
      name: parsed.data.name,
      note: parsed.data.note || null,
      organization_id: organizationId,
      role: parsed.data.role || null,
      status: parsed.data.status,
      telegram: parsed.data.telegram || null,
      whatsapp: parsed.data.whatsapp || null,
      workspace_id: workspace.id,
    })
    .select("*")
    .single();

  if (error) {
    redirectWithMessage(`/workspaces/${workspaceSlug}/contacts`, "error", getErrorMessage(error));
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

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
  revalidatePath(`/workspaces/${workspaceSlug}/contacts/${contactId}`);
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

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
  redirectWithMessage(
    `/workspaces/${workspaceSlug}/contacts`,
    "success",
    "Contact deleted.",
  );
}
