import type {
  ActivityListItem,
  ContactDetail,
  FolderDetail,
  FolderListItem,
  OrganizationDetail,
  OrganizationListItem,
} from "@/lib/data";
import type { Database } from "@/types/database";

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
