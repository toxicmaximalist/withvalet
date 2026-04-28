import "server-only";

import { z } from "zod";

import {
  getContactDetail,
  getFolderDetail,
  getOrganizationDetail,
  type ActivityListItem,
} from "@/lib/data";
import { getWorkspaceContext } from "@/lib/data";
import {
  activitySchema,
  contactSchema,
  folderSchema,
  organizationSchema,
} from "@/lib/validators";
import { getErrorMessage } from "@/lib/utils";
import type {
  CreateActivityPayload,
  CreateActivityResponse,
  CreateFolderPayload,
  CreateFolderResponse,
  SyncFolderContactsPayload,
  SyncFolderContactsResponse,
  UpdateContactPayload,
  UpdateContactResponse,
  UpdateOrganizationPayload,
  UpdateOrganizationResponse,
} from "@/lib/workspace-mutation-types";
import type { Database } from "@/types/database";

const contactIdsSchema = z.object({
  contactIds: z.array(z.uuid()),
});

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ActivityRow = Database["public"]["Tables"]["outreach_activities"]["Row"];

function toNullableString(value: string | undefined) {
  return value && value.length ? value : null;
}

async function resolveOrganizationRecord(
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
  const existingOrganizationRow = existingOrganization as OrganizationRow | null;

  if (existingOrganizationError) {
    throw new Error(getErrorMessage(existingOrganizationError));
  }

  if (existingOrganizationRow) {
    return existingOrganizationRow;
  }

  const { data: createdOrganization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: trimmed,
      workspace_id: workspace.id,
    })
    .select("*")
    .single();
  const createdOrganizationRow = createdOrganization as OrganizationRow;

  if (organizationError) {
    throw new Error(getErrorMessage(organizationError));
  }

  return createdOrganizationRow;
}

export async function updateContactRecord(
  workspaceSlug: string,
  contactId: string,
  payload: UpdateContactPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid contact details.");
  }

  const organization = await resolveOrganizationRecord(
    workspaceSlug,
    parsed.data.organizationName,
  );

  const { error } = await supabase
    .from("contacts")
    .update({
      gmail: toNullableString(parsed.data.gmail),
      linkedin: toNullableString(parsed.data.linkedin),
      name: parsed.data.name,
      note: toNullableString(parsed.data.note),
      organization_id: organization?.id ?? null,
      role: toNullableString(parsed.data.role),
      status: parsed.data.status,
      telegram: toNullableString(parsed.data.telegram),
      whatsapp: toNullableString(parsed.data.whatsapp),
    })
    .eq("workspace_id", workspace.id)
    .eq("id", contactId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const contact = await getContactDetail(workspace.id, contactId);

  return { contact } satisfies UpdateContactResponse;
}

export async function updateOrganizationRecord(
  workspaceSlug: string,
  organizationId: string,
  payload: UpdateOrganizationPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = organizationSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid organization details.");
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      note: toNullableString(parsed.data.note),
      website: toNullableString(parsed.data.website),
    })
    .eq("workspace_id", workspace.id)
    .eq("id", organizationId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const organization = await getOrganizationDetail(workspace.id, organizationId);

  return {
    listItem: {
      ...organization,
      activityCount: organization.activities.length,
      contactCount: organization.contacts.length,
    },
    organization,
  } satisfies UpdateOrganizationResponse;
}

export async function createFolderRecord(
  workspaceSlug: string,
  payload: CreateFolderPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = folderSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid folder details.");
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name: parsed.data.name,
      workspace_id: workspace.id,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    folder: {
      ...data,
      contactCount: 0,
    },
  } satisfies CreateFolderResponse;
}

export async function syncFolderContactsRecord(
  workspaceSlug: string,
  folderId: string,
  payload: SyncFolderContactsPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = contactIdsSchema.safeParse({
    contactIds: payload.contactIds.filter(Boolean),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid folder membership.");
  }

  const selectedContactIds = new Set(parsed.data.contactIds);
  const { data: existingLinks, error: existingLinksError } = await supabase
    .from("contact_folders")
    .select("contact_id")
    .eq("workspace_id", workspace.id)
    .eq("folder_id", folderId);

  if (existingLinksError) {
    throw new Error(getErrorMessage(existingLinksError));
  }

  const existingContactIds = new Set(existingLinks?.map((link) => link.contact_id) ?? []);
  const toInsert = [...selectedContactIds].filter((contactId) => !existingContactIds.has(contactId));
  const toDelete = [...existingContactIds].filter((contactId) => !selectedContactIds.has(contactId));

  if (toDelete.length) {
    const { error: deleteError } = await supabase
      .from("contact_folders")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("folder_id", folderId)
      .in("contact_id", toDelete);

    if (deleteError) {
      throw new Error(getErrorMessage(deleteError));
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
      throw new Error(getErrorMessage(insertError));
    }
  }

  const folder = await getFolderDetail(workspace.id, folderId);

  return { folder } satisfies SyncFolderContactsResponse;
}

async function getActivityLabels(
  workspaceSlug: string,
  workspaceId: string,
  contactId: string,
  organizationId: string | null,
) {
  const { supabase } = await getWorkspaceContext(workspaceSlug);

  const [{ data: contact, error: contactError }, organizationResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("name, last_contact_date")
      .eq("workspace_id", workspaceId)
      .eq("id", contactId)
      .maybeSingle(),
    organizationId
      ? supabase
          .from("organizations")
          .select("name")
          .eq("workspace_id", workspaceId)
          .eq("id", organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (contactError || organizationResult.error) {
    throw new Error(getErrorMessage(contactError ?? organizationResult.error));
  }

  return {
    contactLastContactDate: contact?.last_contact_date ?? null,
    contactName: contact?.name,
    organizationName: organizationResult.data?.name ?? null,
  };
}

export async function createActivityRecord(
  workspaceSlug: string,
  payload: CreateActivityPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = activitySchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid activity details.");
  }

  let organizationId =
    parsed.data.organizationId && parsed.data.organizationId !== ""
      ? parsed.data.organizationId
      : null;

  if (!organizationId) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("organization_id")
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.contactId)
      .maybeSingle();

    if (contactError) {
      throw new Error(getErrorMessage(contactError));
    }

    organizationId = contact?.organization_id ?? null;
  }

  const { data, error } = await supabase
    .from("outreach_activities")
    .insert({
      activity_date: new Date(parsed.data.activityDate).toISOString(),
      contact_id: parsed.data.contactId,
      content: parsed.data.content,
      organization_id: organizationId,
      status: parsed.data.status,
      type: parsed.data.type,
      workspace_id: workspace.id,
    })
    .select("*")
    .single();
  const activityRow = data as ActivityRow;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const labels = await getActivityLabels(
    workspaceSlug,
    workspace.id,
    parsed.data.contactId,
    organizationId,
  );

  return {
    activity: {
      ...activityRow,
      contactName: labels.contactName,
      organizationName: labels.organizationName,
    } satisfies ActivityListItem,
    contactLastContactDate: labels.contactLastContactDate,
    organizationId,
  } satisfies CreateActivityResponse;
}
