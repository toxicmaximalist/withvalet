import "server-only";

import { z } from "zod";

import {
  getContactDetail,
  getFolderDetail,
  getOrganizationDetail,
  type ActivityListItem,
  type ContactDetail,
} from "@/lib/data";
import { getWorkspaceContext } from "@/lib/data";
import {
  activitySchema,
  activityUpdateSchema,
  contactSchema,
  folderSchema,
  profileSchema,
  organizationSchema,
  workspaceInviteSchema,
  workspaceSchema,
} from "@/lib/validators";
import {
  getErrorMessage,
  getSupabaseMigrationGuidance,
  isContactOwnerFeatureUnavailableError,
  isProfilesPolicyError,
} from "@/lib/utils";
import type {
  CancelWorkspaceInvitationResponse,
  CreateContactPayload,
  CreateContactResponse,
  CreateActivityPayload,
  CreateActivityResponse,
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteContactResponse,
  DeleteActivityResponse,
  DeleteFolderResponse,
  InviteWorkspaceMemberPayload,
  InviteWorkspaceMemberResponse,
  RemoveWorkspaceMemberResponse,
  SyncFolderContactsPayload,
  SyncFolderContactsResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  UpdateActivityPayload,
  UpdateActivityResponse,
  UpdateContactPayload,
  UpdateContactResponse,
  UpdateOrganizationPayload,
  UpdateOrganizationResponse,
  UpdateWorkspaceSettingsPayload,
  UpdateWorkspaceSettingsResponse,
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

function toContactListItem(contact: ContactDetail) {
  return {
    created_at: contact.created_at,
    gmail: contact.gmail,
    id: contact.id,
    last_contact_date: contact.last_contact_date,
    linkedin: contact.linkedin,
    name: contact.name,
    note: contact.note,
    organization_id: contact.organization_id,
    organizationName: contact.organizationName,
    responsible_user_id: contact.responsible_user_id,
    responsibleUserEmail: contact.responsibleUserEmail,
    responsibleUserName: contact.responsibleUserName,
    role: contact.role,
    status: contact.status,
    telegram: contact.telegram,
    updated_at: contact.updated_at,
    whatsapp: contact.whatsapp,
    workspace_id: contact.workspace_id,
  };
}

function requireWorkspaceOwner(role: string) {
  if (role !== "owner") {
    throw new Error("Only workspace owners can manage members.");
  }
}

async function resolveResponsibleUserId(
  supabase: Awaited<ReturnType<typeof getWorkspaceContext>>["supabase"],
  workspaceId: string,
  responsibleUserId: string | null | undefined,
) {
  if (!responsibleUserId) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", responsibleUserId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!membership) {
    throw new Error("Responsible person must be an active workspace member.");
  }

  return membership.user_id;
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
  const responsibleUserId = await resolveResponsibleUserId(
    supabase,
    workspace.id,
    parsed.data.responsibleUserId,
  );

  const updatePayload = {
    gmail: toNullableString(parsed.data.gmail),
    linkedin: toNullableString(parsed.data.linkedin),
    name: parsed.data.name,
    note: toNullableString(parsed.data.note),
    organization_id: organization?.id ?? null,
    responsible_user_id: responsibleUserId,
    role: toNullableString(parsed.data.role),
    status: parsed.data.status,
    telegram: toNullableString(parsed.data.telegram),
    whatsapp: toNullableString(parsed.data.whatsapp),
  };

  let { error } = await supabase
    .from("contacts")
    .update(updatePayload)
    .eq("workspace_id", workspace.id)
    .eq("id", contactId);

  if (error) {
    const message = getErrorMessage(error);

    if (isContactOwnerFeatureUnavailableError(message)) {
      if (responsibleUserId) {
        throw new Error(getSupabaseMigrationGuidance(message));
      }

      const fallbackUpdatePayload = {
        gmail: updatePayload.gmail,
        linkedin: updatePayload.linkedin,
        name: updatePayload.name,
        note: updatePayload.note,
        organization_id: updatePayload.organization_id,
        role: updatePayload.role,
        status: updatePayload.status,
        telegram: updatePayload.telegram,
        whatsapp: updatePayload.whatsapp,
      };
      ({ error } = await supabase
        .from("contacts")
        .update(fallbackUpdatePayload)
        .eq("workspace_id", workspace.id)
        .eq("id", contactId));
    }
  }

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const contact = await getContactDetail(workspace.id, contactId);

  return { contact } satisfies UpdateContactResponse;
}

export async function createContactRecord(
  workspaceSlug: string,
  payload: CreateContactPayload,
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
  const responsibleUserId = await resolveResponsibleUserId(
    supabase,
    workspace.id,
    parsed.data.responsibleUserId,
  );

  const insertPayload = {
    gmail: toNullableString(parsed.data.gmail),
    linkedin: toNullableString(parsed.data.linkedin),
    name: parsed.data.name,
    note: toNullableString(parsed.data.note),
    organization_id: organization?.id ?? null,
    responsible_user_id: responsibleUserId,
    role: toNullableString(parsed.data.role),
    status: parsed.data.status,
    telegram: toNullableString(parsed.data.telegram),
    whatsapp: toNullableString(parsed.data.whatsapp),
    workspace_id: workspace.id,
  };

  let result = await supabase
    .from("contacts")
    .insert(insertPayload)
    .select("id")
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
        .select("id")
        .single();
    }
  }

  if (result.error) {
    throw new Error(getErrorMessage(result.error));
  }

  const contact = await getContactDetail(workspace.id, result.data.id);

  return { contact: toContactListItem(contact) } satisfies CreateContactResponse;
}

export async function deleteContactRecord(
  workspaceSlug: string,
  contactId: string,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", contactId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return { deletedContactId: contactId } satisfies DeleteContactResponse;
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

export async function deleteFolderRecord(workspaceSlug: string, folderId: string) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", folderId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return { deletedFolderId: folderId } satisfies DeleteFolderResponse;
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

export async function updateActivityRecord(
  workspaceSlug: string,
  activityId: string,
  payload: UpdateActivityPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = activityUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid activity details.");
  }

  const { data: existingActivity, error: existingActivityError } = await supabase
    .from("outreach_activities")
    .select("contact_id, organization_id")
    .eq("workspace_id", workspace.id)
    .eq("id", activityId)
    .maybeSingle();

  if (existingActivityError) {
    throw new Error(getErrorMessage(existingActivityError));
  }

  if (!existingActivity) {
    throw new Error("Activity not found.");
  }

  const { data, error } = await supabase
    .from("outreach_activities")
    .update({
      activity_date: new Date(parsed.data.activityDate).toISOString(),
      content: parsed.data.content,
      status: parsed.data.status,
      type: parsed.data.type,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", activityId)
    .select("*")
    .single();
  const activityRow = data as ActivityRow;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const labels = await getActivityLabels(
    workspaceSlug,
    workspace.id,
    existingActivity.contact_id,
    existingActivity.organization_id,
  );

  return {
    activity: {
      ...activityRow,
      contactName: labels.contactName,
      organizationName: labels.organizationName,
    } satisfies ActivityListItem,
    contactLastContactDate: labels.contactLastContactDate,
    organizationId: existingActivity.organization_id,
  } satisfies UpdateActivityResponse;
}

export async function deleteActivityRecord(workspaceSlug: string, activityId: string) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { data: existingActivity, error: existingActivityError } = await supabase
    .from("outreach_activities")
    .select("contact_id, organization_id")
    .eq("workspace_id", workspace.id)
    .eq("id", activityId)
    .maybeSingle();

  if (existingActivityError) {
    throw new Error(getErrorMessage(existingActivityError));
  }

  if (!existingActivity) {
    throw new Error("Activity not found.");
  }

  const { error } = await supabase
    .from("outreach_activities")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", activityId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const labels = await getActivityLabels(
    workspaceSlug,
    workspace.id,
    existingActivity.contact_id,
    existingActivity.organization_id,
  );

  return {
    contactId: existingActivity.contact_id,
    contactLastContactDate: labels.contactLastContactDate,
    deletedActivityId: activityId,
    organizationId: existingActivity.organization_id,
  } satisfies DeleteActivityResponse;
}

export async function updateProfileRecord(
  workspaceSlug: string,
  payload: UpdateProfilePayload,
) {
  const { supabase, user } = await getWorkspaceContext(workspaceSlug);
  const parsed = profileSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid profile details.");
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.fullName,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      email: user.email ?? "",
      full_name: parsed.data.fullName,
      id: user.id,
    });
  const profileMessage = profileError ? getErrorMessage(profileError) : null;

  if (profileMessage && !isProfilesPolicyError(profileMessage)) {
    throw new Error(profileMessage);
  }

  return {
    guidance: profileMessage ? getSupabaseMigrationGuidance(profileMessage) : null,
    profile: {
      email: user.email ?? "",
      fullName: parsed.data.fullName,
      userId: user.id,
    },
    profileWriteDeferred: Boolean(profileMessage),
  } satisfies UpdateProfileResponse;
}

export async function updateWorkspaceSettingsRecord(
  workspaceSlug: string,
  payload: UpdateWorkspaceSettingsPayload,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  const parsed = workspaceSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid workspace details.");
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
    })
    .eq("id", workspace.id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    workspace: {
      ...workspace,
      name: parsed.data.name,
    },
  } satisfies UpdateWorkspaceSettingsResponse;
}

export async function inviteWorkspaceMemberRecord(
  workspaceSlug: string,
  payload: InviteWorkspaceMemberPayload,
) {
  const { supabase, user, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role);
  const parsed = workspaceInviteSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid invite email.");
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(getErrorMessage(existingProfileError));
  }

  if (existingProfile?.id) {
    const { data: existingMembership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (membershipError) {
      throw new Error(getErrorMessage(membershipError));
    }

    if (existingMembership) {
      return {
        alreadyMember: true,
        invitation: null,
      } satisfies InviteWorkspaceMemberResponse;
    }
  }

  const { data, error } = await supabase
    .from("workspace_invitations")
    .upsert(
      {
        email: normalizedEmail,
        invited_by: user.id,
        role: "member",
        workspace_id: workspace.id,
      },
      { onConflict: "workspace_id,email" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    alreadyMember: false,
    invitation: {
      createdAt: data.created_at,
      email: data.email,
      id: data.id,
      invitedByEmail: user.email ?? null,
      invitedByName:
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length
          ? user.user_metadata.full_name.trim()
          : null,
      role: data.role,
    },
  } satisfies InviteWorkspaceMemberResponse;
}

export async function cancelWorkspaceInvitationRecord(
  workspaceSlug: string,
  invitationId: string,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role);
  const parsed = z.uuid().safeParse(invitationId);

  if (!parsed.success) {
    throw new Error("Invalid invitation id.");
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.data);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return { invitationId: parsed.data } satisfies CancelWorkspaceInvitationResponse;
}

export async function removeWorkspaceMemberRecord(
  workspaceSlug: string,
  userId: string,
) {
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role);
  const parsed = z.uuid().safeParse(userId);

  if (!parsed.success) {
    throw new Error("Invalid member id.");
  }

  if (parsed.data === workspace.owner_id) {
    throw new Error("The workspace owner cannot be removed.");
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("user_id", parsed.data);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return { userId: parsed.data } satisfies RemoveWorkspaceMemberResponse;
}
