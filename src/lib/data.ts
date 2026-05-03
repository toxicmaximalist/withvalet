import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import {
  getErrorMessage,
  isWorkspaceInvitationFeatureUnavailableError,
} from "@/lib/utils";
import type { Database } from "@/types/database";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type FolderRow = Database["public"]["Tables"]["folders"]["Row"];
type ActivityRow = Database["public"]["Tables"]["outreach_activities"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceInvitationRow = Database["public"]["Tables"]["workspace_invitations"]["Row"];
type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

export type WorkspaceSummary = WorkspaceRow & {
  role: WorkspaceRole;
};

export type CurrentUserProfile = {
  email: string;
  fullName: string | null;
  userId: string;
};

export type WorkspaceMemberSummary = {
  createdAt: string;
  email: string;
  fullName: string | null;
  role: WorkspaceRole;
  userId: string;
};

export type WorkspaceInvitationSummary = {
  createdAt: string;
  email: string;
  id: string;
  invitedByEmail: string | null;
  invitedByName: string | null;
  role: WorkspaceRole;
};

export type WorkspaceInvitationsState = {
  invitations: WorkspaceInvitationSummary[];
  isAvailable: boolean;
};

export type ContactListItem = ContactRow & {
  organizationName: string | null;
  responsibleUserEmail: string | null;
  responsibleUserName: string | null;
};

export type OrganizationListItem = OrganizationRow & {
  activityCount: number;
  contactCount: number;
};

export type FolderListItem = FolderRow & {
  contactCount: number;
};

export type ActivityListItem = ActivityRow & {
  contactName?: string;
  organizationName?: string | null;
};

export type ContactDetail = ContactListItem & {
  activities: ActivityListItem[];
  folders: FolderRow[];
};

export type OrganizationDetail = OrganizationRow & {
  activities: ActivityListItem[];
  contacts: ContactListItem[];
};

export type FolderDetail = FolderRow & {
  contacts: ContactListItem[];
  selectableContacts: Array<ContactListItem & { selected: boolean }>;
};

function mapById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

const getWorkspaceMemberProfiles = cache(async (workspaceId: string) => {
  const { supabase, user } = await requireUser();
  const currentUserFullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length
      ? user.user_metadata.full_name.trim()
      : null;

  const { data: memberships, error: membershipsError } = await supabase
    .from("workspace_members")
    .select("user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new Error(getErrorMessage(membershipsError));
  }

  const userIds = memberships?.map((membership) => membership.user_id) ?? [];

  if (!userIds.length) {
    return {
      currentUserId: user.id,
      currentUserEmail: user.email ?? "Unknown",
      currentUserFullName,
      memberships: [],
      profileMap: new Map<string, { email: string; full_name: string | null }>(),
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  if (profilesError) {
    throw new Error(getErrorMessage(profilesError));
  }

  return {
    currentUserId: user.id,
    currentUserEmail: user.email ?? "Unknown",
    currentUserFullName,
    memberships: memberships ?? [],
    profileMap: new Map((profiles ?? []).map((profile) => [profile.id, profile])),
  };
});

async function getWorkspaceMemberProfileMap(workspaceId: string) {
  const {
    currentUserEmail,
    currentUserFullName,
    currentUserId,
    memberships,
    profileMap,
  } =
    await getWorkspaceMemberProfiles(workspaceId);

  return new Map(
    memberships.map((membership) => [
      membership.user_id,
      {
        email:
          profileMap.get(membership.user_id)?.email ??
          (membership.user_id === currentUserId ? currentUserEmail : "Unknown"),
        fullName:
          profileMap.get(membership.user_id)?.full_name ??
          (membership.user_id === currentUserId ? currentUserFullName : null),
      },
    ]),
  );
}

export const getAccessibleWorkspaces = cache(async (userId?: string) => {
  const { supabase, user } = await requireUser();
  const targetUserId = userId ?? user.id;

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", targetUserId);

  if (membershipError) {
    throw new Error(getErrorMessage(membershipError));
  }

  const workspaceIds = memberships?.map((membership) => membership.workspace_id) ?? [];

  if (!workspaceIds.length) {
    return [] as WorkspaceSummary[];
  }

  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds)
    .order("name", { ascending: true });

  if (workspaceError) {
    throw new Error(getErrorMessage(workspaceError));
  }

  const membershipMap = new Map(
    memberships?.map((membership) => [membership.workspace_id, membership.role]) ?? [],
  );

  return (
    workspaces?.map((workspace) => ({
      ...workspace,
      role: membershipMap.get(workspace.id) ?? "member",
    })) ?? []
  );
});

export const getWorkspaceContext = cache(async (slug: string) => {
  const { supabase, user } = await requireUser();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(getErrorMessage(workspaceError));
  }

  if (!workspace) {
    redirect("/workspaces");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(getErrorMessage(membershipError));
  }

  if (!membership) {
    redirect("/workspaces");
  }

  return {
    supabase,
    user,
    workspace: {
      ...workspace,
      role: membership.role,
    },
  };
});

export const getWorkspaceLayoutContext = cache(async (slug: string) => {
  const { supabase, user } = await requireUser();
  const workspaces = await getAccessibleWorkspaces(user.id);
  const workspace = workspaces.find((entry) => entry.slug === slug);

  if (!workspace) {
    redirect("/workspaces");
  }

  return { supabase, user, workspace, workspaces };
});

export async function getWorkspaceMembers(workspaceId: string) {
  const {
    currentUserId,
    currentUserEmail,
    currentUserFullName,
    memberships,
    profileMap,
  } = await getWorkspaceMemberProfiles(workspaceId);

  return (
    memberships?.map((membership) => ({
      createdAt: membership.created_at,
      email:
        profileMap.get(membership.user_id)?.email ??
        (membership.user_id === currentUserId ? currentUserEmail : "Unknown"),
      fullName:
        profileMap.get(membership.user_id)?.full_name ??
        (membership.user_id === currentUserId ? currentUserFullName : null),
      role: membership.role,
      userId: membership.user_id,
    })) ?? []
  );
}

export async function getCurrentUserProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const fallbackFullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length
      ? user.user_metadata.full_name.trim()
      : null;

  return {
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? fallbackFullName,
    userId: user.id,
  } satisfies CurrentUserProfile;
}

export async function getWorkspaceInvitations(workspaceId: string) {
  const { supabase } = await requireUser();

  const { data: invitations, error: invitationsError } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (invitationsError) {
    const message = getErrorMessage(invitationsError);

    if (isWorkspaceInvitationFeatureUnavailableError(message)) {
      return {
        invitations: [],
        isAvailable: false,
      } satisfies WorkspaceInvitationsState;
    }

    throw new Error(getErrorMessage(invitationsError));
  }

  const invitedByIds = [
    ...new Set(
      (invitations ?? [])
        .map((invitation) => invitation.invited_by)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  let profileMap = new Map<string, { email: string; full_name: string | null }>();

  if (invitedByIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", invitedByIds);

    if (profilesError) {
      throw new Error(getErrorMessage(profilesError));
    }

    profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        {
          email: profile.email,
          full_name: profile.full_name,
        },
      ]),
    );
  }

  return {
    invitations:
      ((invitations as WorkspaceInvitationRow[] | null)?.map((invitation) => ({
        createdAt: invitation.created_at,
        email: invitation.email,
        id: invitation.id,
        invitedByEmail: invitation.invited_by
          ? profileMap.get(invitation.invited_by)?.email ?? null
          : null,
        invitedByName: invitation.invited_by
          ? profileMap.get(invitation.invited_by)?.full_name ?? null
          : null,
        role: invitation.role,
      })) ?? []) as WorkspaceInvitationSummary[],
    isAvailable: true,
  } satisfies WorkspaceInvitationsState;
}

export async function getContacts(workspaceId: string) {
  const { supabase } = await requireUser();

  const [
    { data: contacts, error: contactsError },
    { data: organizations, error: orgError },
    responsibleProfileMap,
  ] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false }),
      supabase.from("organizations").select("id, name").eq("workspace_id", workspaceId),
      getWorkspaceMemberProfileMap(workspaceId),
    ]);

  if (contactsError) {
    throw new Error(getErrorMessage(contactsError));
  }

  if (orgError) {
    throw new Error(getErrorMessage(orgError));
  }

  const organizationMap = new Map(
    (organizations ?? []).map((organization) => [organization.id, organization.name]),
  );

  return (
    contacts?.map((contact) => ({
      ...contact,
      organizationName: contact.organization_id
        ? organizationMap.get(contact.organization_id) ?? null
        : null,
      responsibleUserEmail: contact.responsible_user_id
        ? responsibleProfileMap.get(contact.responsible_user_id)?.email ?? null
        : null,
      responsibleUserName: contact.responsible_user_id
        ? responsibleProfileMap.get(contact.responsible_user_id)?.fullName ?? null
        : null,
    })) ?? []
  ) as ContactListItem[];
}

export async function getContactDetail(workspaceId: string, contactId: string) {
  const { supabase } = await requireUser();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .maybeSingle();

  if (contactError) {
    throw new Error(getErrorMessage(contactError));
  }

  if (!contact) {
    notFound();
  }

  const [
    { data: organizations, error: organizationsError },
    { data: folderLinks, error: folderLinksError },
    { data: folders, error: foldersError },
    { data: activities, error: activitiesError },
    responsibleProfileMap,
  ] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("workspace_id", workspaceId),
    supabase
      .from("contact_folders")
      .select("folder_id")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", contactId),
    supabase.from("folders").select("*").eq("workspace_id", workspaceId).order("name"),
    supabase
      .from("outreach_activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", contactId)
      .order("activity_date", { ascending: false }),
    getWorkspaceMemberProfileMap(workspaceId),
  ]);

  if (organizationsError || folderLinksError || foldersError || activitiesError) {
    throw new Error(
      getErrorMessage(
        organizationsError ?? folderLinksError ?? foldersError ?? activitiesError,
      ),
    );
  }

  const organizationMap = new Map(
    (organizations ?? []).map((organization) => [organization.id, organization.name]),
  );
  const selectedFolderIds = new Set(
    folderLinks?.map((folderLink) => folderLink.folder_id) ?? [],
  );

  return {
    ...contact,
    activities: (activities ?? []).map((activity) => ({
      ...activity,
      contactName: contact.name,
      organizationName: activity.organization_id
        ? organizationMap.get(activity.organization_id) ?? null
        : null,
    })),
    folders:
      folders?.filter((folder) => selectedFolderIds.has(folder.id)) ?? [],
    organizationName: contact.organization_id
      ? organizationMap.get(contact.organization_id) ?? null
      : null,
    responsibleUserEmail: contact.responsible_user_id
      ? responsibleProfileMap.get(contact.responsible_user_id)?.email ?? null
      : null,
    responsibleUserName: contact.responsible_user_id
      ? responsibleProfileMap.get(contact.responsible_user_id)?.fullName ?? null
      : null,
  } as ContactDetail;
}

export async function getOrganizations(workspaceId: string) {
  const { supabase } = await requireUser();

  const [
    { data: organizations, error: organizationsError },
    { data: contacts, error: contactsError },
    { data: activities, error: activitiesError },
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("workspace_id", workspaceId).order("name"),
    supabase
      .from("contacts")
      .select("id, organization_id")
      .eq("workspace_id", workspaceId),
    supabase
      .from("outreach_activities")
      .select("id, organization_id")
      .eq("workspace_id", workspaceId),
  ]);

  if (organizationsError || contactsError || activitiesError) {
    throw new Error(
      getErrorMessage(organizationsError ?? contactsError ?? activitiesError),
    );
  }

  const contactCounts = new Map<string, number>();
  contacts?.forEach((contact) => {
    if (!contact.organization_id) {
      return;
    }

    contactCounts.set(
      contact.organization_id,
      (contactCounts.get(contact.organization_id) ?? 0) + 1,
    );
  });

  const activityCounts = new Map<string, number>();
  activities?.forEach((activity) => {
    if (!activity.organization_id) {
      return;
    }

    activityCounts.set(
      activity.organization_id,
      (activityCounts.get(activity.organization_id) ?? 0) + 1,
    );
  });

  return (
    organizations?.map((organization) => ({
      ...organization,
      activityCount: activityCounts.get(organization.id) ?? 0,
      contactCount: contactCounts.get(organization.id) ?? 0,
    })) ?? []
  ) as OrganizationListItem[];
}

export async function getOrganizationDetail(
  workspaceId: string,
  organizationId: string,
) {
  const { supabase } = await requireUser();

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError) {
    throw new Error(getErrorMessage(organizationError));
  }

  if (!organization) {
    notFound();
  }

  const [
    { data: contacts, error: contactsError },
    { data: activities, error: activitiesError },
    responsibleProfileMap,
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("outreach_activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", organizationId)
      .order("activity_date", { ascending: false }),
    getWorkspaceMemberProfileMap(workspaceId),
  ]);

  if (contactsError || activitiesError) {
    throw new Error(getErrorMessage(contactsError ?? activitiesError));
  }

  const contactMap = mapById(contacts ?? []);

  return {
    ...organization,
    activities: (activities ?? []).map((activity) => ({
      ...activity,
      contactName: contactMap.get(activity.contact_id)?.name,
      organizationName: organization.name,
    })),
    contacts:
      contacts?.map((contact) => ({
        ...contact,
        organizationName: organization.name,
        responsibleUserEmail: contact.responsible_user_id
          ? responsibleProfileMap.get(contact.responsible_user_id)?.email ?? null
          : null,
        responsibleUserName: contact.responsible_user_id
          ? responsibleProfileMap.get(contact.responsible_user_id)?.fullName ?? null
          : null,
      })) ?? [],
  } as OrganizationDetail;
}

export async function getFolders(workspaceId: string) {
  const { supabase } = await requireUser();

  const [{ data: folders, error: foldersError }, { data: links, error: linksError }] =
    await Promise.all([
      supabase.from("folders").select("*").eq("workspace_id", workspaceId).order("name"),
      supabase
        .from("contact_folders")
        .select("folder_id")
        .eq("workspace_id", workspaceId),
    ]);

  if (foldersError || linksError) {
    throw new Error(getErrorMessage(foldersError ?? linksError));
  }

  const counts = new Map<string, number>();
  links?.forEach((link) => {
    counts.set(link.folder_id, (counts.get(link.folder_id) ?? 0) + 1);
  });

  return (
    folders?.map((folder) => ({
      ...folder,
      contactCount: counts.get(folder.id) ?? 0,
    })) ?? []
  ) as FolderListItem[];
}

export async function getFolderDetail(workspaceId: string, folderId: string) {
  const { supabase } = await requireUser();

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", folderId)
    .maybeSingle();

  if (folderError) {
    throw new Error(getErrorMessage(folderError));
  }

  if (!folder) {
    notFound();
  }

  const [
    { data: contacts, error: contactsError },
    { data: links, error: linksError },
    { data: organizations, error: organizationsError },
    responsibleProfileMap,
  ] =
    await Promise.all([
      supabase.from("contacts").select("*").eq("workspace_id", workspaceId).order("name"),
      supabase
        .from("contact_folders")
        .select("contact_id")
        .eq("workspace_id", workspaceId)
        .eq("folder_id", folderId),
      supabase.from("organizations").select("id, name").eq("workspace_id", workspaceId),
      getWorkspaceMemberProfileMap(workspaceId),
    ]);

  if (contactsError || linksError || organizationsError) {
    throw new Error(
      getErrorMessage(contactsError ?? linksError ?? organizationsError),
    );
  }

  const selectedContactIds = new Set(links?.map((link) => link.contact_id) ?? []);
  const organizationMap = new Map(
    (organizations ?? []).map((organization) => [organization.id, organization.name]),
  );

  const hydratedContacts =
    contacts?.map((contact) => ({
      ...contact,
      organizationName: contact.organization_id
        ? organizationMap.get(contact.organization_id) ?? null
        : null,
      responsibleUserEmail: contact.responsible_user_id
        ? responsibleProfileMap.get(contact.responsible_user_id)?.email ?? null
        : null,
      responsibleUserName: contact.responsible_user_id
        ? responsibleProfileMap.get(contact.responsible_user_id)?.fullName ?? null
        : null,
    })) ?? [];

  return {
    ...folder,
    contacts: hydratedContacts.filter((contact) => selectedContactIds.has(contact.id)),
    selectableContacts: hydratedContacts.map((contact) => ({
      ...contact,
      selected: selectedContactIds.has(contact.id),
    })),
  } as FolderDetail;
}

export async function getWorkspaceActivities(workspaceId: string) {
  const { supabase } = await requireUser();

  const [
    { data: activities, error: activitiesError },
    { data: contacts, error: contactsError },
    { data: organizations, error: organizationsError },
  ] = await Promise.all([
    supabase
      .from("outreach_activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("activity_date", { ascending: false }),
    supabase.from("contacts").select("id, name").eq("workspace_id", workspaceId),
    supabase.from("organizations").select("id, name").eq("workspace_id", workspaceId),
  ]);

  if (activitiesError || contactsError || organizationsError) {
    throw new Error(
      getErrorMessage(activitiesError ?? contactsError ?? organizationsError),
    );
  }

  const contactMap = new Map((contacts ?? []).map((contact) => [contact.id, contact.name]));
  const organizationMap = new Map(
    (organizations ?? []).map((organization) => [organization.id, organization.name]),
  );

  return (
    activities?.map((activity) => ({
      ...activity,
      contactName: contactMap.get(activity.contact_id),
      organizationName: activity.organization_id
        ? organizationMap.get(activity.organization_id) ?? null
        : null,
    })) ?? []
  ) as ActivityListItem[];
}

export async function getContactOptions(workspaceId: string) {
  return getContacts(workspaceId);
}
