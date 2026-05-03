import type {
  ActivityListItem,
  ContactDetail,
  ContactListItem,
  CurrentUserProfile,
  FolderDetail,
  FolderListItem,
  OrganizationDetail,
  OrganizationListItem,
  WorkspaceInvitationSummary,
  WorkspaceSummary,
} from "@/lib/data";
import type { Database } from "@/types/database";

export type CreateContactPayload = {
  gmail?: string;
  linkedin?: string;
  name: string;
  note?: string;
  organizationName?: string;
  responsibleUserId?: string | null;
  role?: string;
  status: Database["public"]["Enums"]["contact_status"];
  telegram?: string;
  whatsapp?: string;
};

export type CreateContactResponse = {
  contact: ContactListItem;
};

export type UpdateContactPayload = {
  gmail?: string;
  linkedin?: string;
  name: string;
  note?: string;
  organizationName?: string;
  responsibleUserId?: string | null;
  role?: string;
  status: Database["public"]["Enums"]["contact_status"];
  telegram?: string;
  whatsapp?: string;
};

export type UpdateContactResponse = {
  contact: ContactDetail;
};

export type DeleteContactResponse = {
  deletedContactId: string;
};

export type UpdateOrganizationPayload = {
  name: string;
  note?: string;
  website?: string;
};

export type UpdateOrganizationResponse = {
  listItem: OrganizationListItem;
  organization: OrganizationDetail;
};

export type CreateFolderPayload = {
  name: string;
};

export type CreateFolderResponse = {
  folder: FolderListItem;
};

export type DeleteFolderResponse = {
  deletedFolderId: string;
};

export type SyncFolderContactsPayload = {
  contactIds: string[];
};

export type SyncFolderContactsResponse = {
  folder: FolderDetail;
};

export type CreateActivityPayload = {
  activityDate: string;
  contactId: string;
  content: string;
  organizationId?: string | null;
  status: Database["public"]["Enums"]["activity_status"];
  type: Database["public"]["Enums"]["activity_type"];
};

export type CreateActivityResponse = {
  activity: ActivityListItem;
  contactLastContactDate: string | null;
  organizationId: string | null;
};

export type UpdateActivityPayload = {
  activityDate: string;
  content: string;
  status: Database["public"]["Enums"]["activity_status"];
  type: Database["public"]["Enums"]["activity_type"];
};

export type UpdateActivityResponse = {
  activity: ActivityListItem;
  contactLastContactDate: string | null;
  organizationId: string | null;
};

export type DeleteActivityResponse = {
  contactId: string;
  contactLastContactDate: string | null;
  deletedActivityId: string;
  organizationId: string | null;
};

export type UpdateProfilePayload = {
  fullName: string;
};

export type UpdateProfileResponse = {
  guidance: string | null;
  profile: CurrentUserProfile;
  profileWriteDeferred: boolean;
};

export type UpdateWorkspaceSettingsPayload = {
  name: string;
};

export type UpdateWorkspaceSettingsResponse = {
  workspace: WorkspaceSummary;
};

export type InviteWorkspaceMemberPayload = {
  email: string;
};

export type InviteWorkspaceMemberResponse = {
  alreadyMember: boolean;
  invitation: WorkspaceInvitationSummary | null;
};

export type CancelWorkspaceInvitationResponse = {
  invitationId: string;
};

export type RemoveWorkspaceMemberResponse = {
  userId: string;
};
