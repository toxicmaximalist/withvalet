"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
  ContactDetail,
  ContactListItem,
  FolderDetail,
  FolderListItem,
  OrganizationDetail,
  OrganizationListItem,
  WorkspaceInvitationsState,
  WorkspaceMemberSummary,
} from "@/lib/data";
import type { ActivityListItem } from "@/lib/data";
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

type WorkspaceSlugArg = {
  workspaceSlug: string;
};

type ContactDetailArg = WorkspaceSlugArg & {
  contactId: string;
};

type OrganizationDetailArg = WorkspaceSlugArg & {
  organizationId: string;
};

type FolderDetailArg = WorkspaceSlugArg & {
  folderId: string;
};

type UpdateContactArg = ContactDetailArg & {
  optimistic?: {
    responsibleUserEmail?: string | null;
    responsibleUserName?: string | null;
  };
  payload: UpdateContactPayload;
};

type CreateContactArg = WorkspaceSlugArg & {
  optimistic: {
    responsibleUserEmail?: string | null;
    responsibleUserName?: string | null;
  };
  payload: CreateContactPayload;
};

type DeleteContactArg = ContactDetailArg;

type UpdateOrganizationArg = OrganizationDetailArg & {
  payload: UpdateOrganizationPayload;
};

type CreateFolderArg = WorkspaceSlugArg & {
  payload: CreateFolderPayload;
};

type DeleteFolderArg = FolderDetailArg;

type SyncFolderContactsArg = FolderDetailArg & {
  payload: SyncFolderContactsPayload;
};

type CreateActivityArg = WorkspaceSlugArg & {
  optimistic: {
    contactLastContactDate?: string | null;
    contactName?: string;
    organizationName?: string | null;
  };
  payload: CreateActivityPayload;
};

type UpdateActivityArg = WorkspaceSlugArg & {
  activityId: string;
  contactId: string;
  organizationId?: string | null;
  payload: UpdateActivityPayload;
};

type DeleteActivityArg = WorkspaceSlugArg & {
  activityId: string;
  contactId: string;
  organizationId?: string | null;
};

type UpdateProfileArg = WorkspaceSlugArg & {
  payload: UpdateProfilePayload;
  userId: string;
};

type UpdateWorkspaceSettingsArg = WorkspaceSlugArg & {
  payload: UpdateWorkspaceSettingsPayload;
};

type InviteWorkspaceMemberArg = WorkspaceSlugArg & {
  optimistic: {
    invitedByEmail?: string | null;
    invitedByName?: string | null;
  };
  payload: InviteWorkspaceMemberPayload;
};

type CancelWorkspaceInvitationArg = WorkspaceSlugArg & {
  invitationId: string;
};

type RemoveWorkspaceMemberArg = WorkspaceSlugArg & {
  userId: string;
};

function createListTags<TagType extends string>(
  type: TagType,
  listId: string,
  items: Array<{ id: string }> | undefined,
) {
  return [
    { type, id: listId },
    ...(items?.map((item) => ({ type, id: item.id })) ?? []),
  ] as const;
}

function createWorkspaceListTag<TagType extends string>(
  type: TagType,
  workspaceSlug: string,
) {
  return { type, id: `LIST:${workspaceSlug}` } as const;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function applyContactPatch(
  draft: ContactListItem | ContactDetail | (ContactListItem & { selected: boolean }),
  payload: UpdateContactPayload,
  optimistic?: UpdateContactArg["optimistic"],
) {
  const nextOrganizationName = normalizeOptionalText(payload.organizationName);
  const organizationChanged = (draft.organizationName ?? null) !== nextOrganizationName;
  const nextResponsibleUserId = payload.responsibleUserId?.trim() || null;

  draft.gmail = normalizeOptionalText(payload.gmail);
  draft.linkedin = normalizeOptionalText(payload.linkedin);
  draft.name = payload.name.trim();
  draft.note = normalizeOptionalText(payload.note);
  draft.organizationName = nextOrganizationName;
  draft.responsible_user_id = nextResponsibleUserId;
  draft.responsibleUserEmail = nextResponsibleUserId
    ? (optimistic?.responsibleUserEmail ?? draft.responsibleUserEmail)
    : null;
  draft.responsibleUserName = nextResponsibleUserId
    ? (optimistic?.responsibleUserName ?? draft.responsibleUserName)
    : null;
  draft.role = normalizeOptionalText(payload.role);
  draft.status = payload.status;
  draft.telegram = normalizeOptionalText(payload.telegram);
  draft.whatsapp = normalizeOptionalText(payload.whatsapp);

  if (organizationChanged) {
    draft.organization_id = null;
  }
}

function applyOrganizationPatch(
  draft: OrganizationDetail | OrganizationListItem,
  payload: UpdateOrganizationPayload,
) {
  draft.name = payload.name.trim();
  draft.note = normalizeOptionalText(payload.note);
  draft.website = normalizeOptionalText(payload.website);
}

function toContactListItem(contact: ContactDetail): ContactListItem {
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

function shouldAffectLastContact(
  status: Database["public"]["Enums"]["activity_status"],
) {
  return (
    status === "sent" ||
    status === "replied" ||
    status === "followed_up_1" ||
    status === "followed_up_2"
  );
}

function getLatestDate(current: string | null | undefined, next: string) {
  if (!current) {
    return next;
  }

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

function getLastContactDateFromActivities(
  activities: ActivityListItem[],
) {
  return activities.reduce<string | null>((latest, activity) => {
    if (!shouldAffectLastContact(activity.status)) {
      return latest;
    }

    return latest ? getLatestDate(latest, activity.activity_date) : activity.activity_date;
  }, null);
}

export const workspaceQueryOptions = {
  refetchOnFocus: false,
  refetchOnMountOrArgChange: false,
  refetchOnReconnect: false,
} as const;

export const activityQueryOptions = {
  ...workspaceQueryOptions,
} as const;

export const workspaceApi = createApi({
  reducerPath: "workspaceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "same-origin",
  }),
  keepUnusedDataFor: 300,
  tagTypes: [
    "Contacts",
    "Organizations",
    "Folders",
    "Activities",
    "Members",
    "Invitations",
  ],
  endpoints: (builder) => ({
    getContacts: builder.query<ContactListItem[], WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/contacts`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Contacts", `LIST:${workspaceSlug}`, result),
    }),
    getContactDetail: builder.query<ContactDetail, ContactDetailArg>({
      query: ({ workspaceSlug, contactId }) =>
        `/workspaces/${workspaceSlug}/contacts/${contactId}`,
      providesTags: (result, _error, { workspaceSlug, contactId }) => [
        { type: "Contacts" as const, id: `LIST:${workspaceSlug}` },
        { type: "Contacts" as const, id: contactId },
        ...(result?.folders.map((folder) => ({ type: "Folders" as const, id: folder.id })) ?? []),
        ...(result?.activities.map((activity) => ({
          type: "Activities" as const,
          id: activity.id,
        })) ?? []),
      ],
    }),
    getOrganizations: builder.query<OrganizationListItem[], WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/organizations`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Organizations", `LIST:${workspaceSlug}`, result),
    }),
    getOrganizationDetail: builder.query<
      OrganizationDetail,
      OrganizationDetailArg
    >({
      query: ({ workspaceSlug, organizationId }) =>
        `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
      providesTags: (result, _error, { workspaceSlug, organizationId }) => [
        { type: "Organizations" as const, id: `LIST:${workspaceSlug}` },
        { type: "Organizations" as const, id: organizationId },
        ...(result?.contacts.map((contact) => ({ type: "Contacts" as const, id: contact.id })) ??
          []),
        ...(result?.activities.map((activity) => ({
          type: "Activities" as const,
          id: activity.id,
        })) ?? []),
      ],
    }),
    getFolders: builder.query<FolderListItem[], WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/folders`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Folders", `LIST:${workspaceSlug}`, result),
    }),
    getFolderDetail: builder.query<FolderDetail, FolderDetailArg>({
      query: ({ workspaceSlug, folderId }) =>
        `/workspaces/${workspaceSlug}/folders/${folderId}`,
      providesTags: (result, _error, { workspaceSlug, folderId }) => [
        { type: "Folders" as const, id: `LIST:${workspaceSlug}` },
        { type: "Folders" as const, id: folderId },
        ...(result?.contacts.map((contact) => ({ type: "Contacts" as const, id: contact.id })) ??
          []),
      ],
    }),
    getWorkspaceActivities: builder.query<ActivityListItem[], WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/outreach`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Activities", `LIST:${workspaceSlug}`, result),
    }),
    getWorkspaceMembers: builder.query<WorkspaceMemberSummary[], WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/members`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Members", `LIST:${workspaceSlug}`, result?.map((member) => ({
          id: member.userId,
        }))),
    }),
    getWorkspaceInvitations: builder.query<WorkspaceInvitationsState, WorkspaceSlugArg>({
      query: ({ workspaceSlug }) => `/workspaces/${workspaceSlug}/invitations`,
      providesTags: (result, _error, { workspaceSlug }) =>
        createListTags("Invitations", `LIST:${workspaceSlug}`, result?.invitations),
    }),
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileArg>({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "PATCH",
        url: `/workspaces/${workspaceSlug}/settings/profile`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error ? [] : [createWorkspaceListTag("Members", workspaceSlug)],
      async onQueryStarted(
        { workspaceSlug, userId, payload },
        { dispatch, getState, queryFulfilled },
      ) {
        const fullName = payload.fullName.trim();
        const state = getState();
        const contacts = workspaceApi.endpoints.getContacts.select({ workspaceSlug })(state).data ?? [];
        const contactIds = contacts
          .filter((contact) => contact.responsible_user_id === userId)
          .map((contact) => contact.id);
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceMembers",
              { workspaceSlug },
              (draft) => {
                const member = draft.find((item) => item.userId === userId);

                if (member) {
                  member.fullName = fullName;
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              draft.forEach((contact) => {
                if (contact.responsible_user_id === userId) {
                  contact.responsibleUserName = fullName;
                }
              });
            }),
          ),
        ];

        contactIds.forEach((contactId) => {
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getContactDetail",
                { workspaceSlug, contactId },
                (draft) => {
                  if (draft.responsible_user_id === userId) {
                    draft.responsibleUserName = fullName;
                  }
                },
              ),
            ),
          );
        });

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceMembers",
              { workspaceSlug },
              (draft) => {
                const member = draft.find((item) => item.userId === userId);

                if (member) {
                  member.fullName = data.profile.fullName;
                  member.email = data.profile.email;
                }
              },
            ),
          );
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    updateWorkspaceSettings: builder.mutation<
      UpdateWorkspaceSettingsResponse,
      UpdateWorkspaceSettingsArg
    >({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "PATCH",
        url: `/workspaces/${workspaceSlug}/settings/workspace`,
      }),
    }),
    inviteWorkspaceMember: builder.mutation<
      InviteWorkspaceMemberResponse,
      InviteWorkspaceMemberArg
    >({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "POST",
        url: `/workspaces/${workspaceSlug}/invitations`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error ? [] : [createWorkspaceListTag("Invitations", workspaceSlug)],
      async onQueryStarted(
        { workspaceSlug, payload, optimistic },
        { dispatch, queryFulfilled },
      ) {
        const tempId = `temp-invitation-${crypto.randomUUID()}`;
        const patch = dispatch(
          workspaceApi.util.updateQueryData(
            "getWorkspaceInvitations",
            { workspaceSlug },
            (draft) => {
              if (!draft.isAvailable) {
                return;
              }

              draft.invitations.unshift({
                createdAt: new Date().toISOString(),
                email: payload.email.trim().toLowerCase(),
                id: tempId,
                invitedByEmail: optimistic.invitedByEmail ?? null,
                invitedByName: optimistic.invitedByName ?? null,
                role: "member",
              });
            },
          ),
        );

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceInvitations",
              { workspaceSlug },
              (draft) => {
                const index = draft.invitations.findIndex((item) => item.id === tempId);

                if (index < 0) {
                  return;
                }

                if (data.alreadyMember || !data.invitation) {
                  draft.invitations.splice(index, 1);
                  return;
                }

                draft.invitations[index] = data.invitation;
              },
            ),
          );
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    cancelWorkspaceInvitation: builder.mutation<
      CancelWorkspaceInvitationResponse,
      CancelWorkspaceInvitationArg
    >({
      query: ({ workspaceSlug, invitationId }) => ({
        method: "DELETE",
        url: `/workspaces/${workspaceSlug}/invitations/${invitationId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug, invitationId }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Invitations", workspaceSlug),
              { type: "Invitations" as const, id: invitationId },
            ],
      async onQueryStarted(
        { workspaceSlug, invitationId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          workspaceApi.util.updateQueryData(
            "getWorkspaceInvitations",
            { workspaceSlug },
            (draft) => {
              const index = draft.invitations.findIndex((item) => item.id === invitationId);

              if (index >= 0) {
                draft.invitations.splice(index, 1);
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    removeWorkspaceMember: builder.mutation<
      RemoveWorkspaceMemberResponse,
      RemoveWorkspaceMemberArg
    >({
      query: ({ workspaceSlug, userId }) => ({
        method: "DELETE",
        url: `/workspaces/${workspaceSlug}/members/${userId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug, userId }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Members", workspaceSlug),
              createWorkspaceListTag("Contacts", workspaceSlug),
              { type: "Members" as const, id: userId },
            ],
      async onQueryStarted(
        { workspaceSlug, userId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          workspaceApi.util.updateQueryData(
            "getWorkspaceMembers",
            { workspaceSlug },
            (draft) => {
              const index = draft.findIndex((item) => item.userId === userId);

              if (index >= 0) {
                draft.splice(index, 1);
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    createContact: builder.mutation<CreateContactResponse, CreateContactArg>({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "POST",
        url: `/workspaces/${workspaceSlug}/contacts`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Organizations", workspaceSlug),
              createWorkspaceListTag("Members", workspaceSlug),
            ],
      async onQueryStarted(
        { workspaceSlug, payload, optimistic },
        { dispatch, queryFulfilled },
      ) {
        const tempId = `temp-contact-${crypto.randomUUID()}`;
        const optimisticContact: ContactListItem = {
          created_at: new Date().toISOString(),
          gmail: normalizeOptionalText(payload.gmail),
          id: tempId,
          last_contact_date: null,
          linkedin: normalizeOptionalText(payload.linkedin),
          name: payload.name.trim(),
          note: normalizeOptionalText(payload.note),
          organization_id: null,
          organizationName: normalizeOptionalText(payload.organizationName),
          responsible_user_id: payload.responsibleUserId?.trim() || null,
          responsibleUserEmail: optimistic.responsibleUserEmail ?? null,
          responsibleUserName: optimistic.responsibleUserName ?? null,
          role: normalizeOptionalText(payload.role),
          status: payload.status,
          telegram: normalizeOptionalText(payload.telegram),
          updated_at: new Date().toISOString(),
          whatsapp: normalizeOptionalText(payload.whatsapp),
          workspace_id: workspaceSlug,
        };
        const patch = dispatch(
          workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
            draft.unshift(optimisticContact);
          }),
        );

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const index = draft.findIndex((item) => item.id === tempId);

              if (index >= 0) {
                draft[index] = data.contact;
              } else {
                draft.unshift(data.contact);
              }
            }),
          );
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    updateContact: builder.mutation<UpdateContactResponse, UpdateContactArg>({
      query: ({ workspaceSlug, contactId, payload }) => ({
        body: payload,
        method: "PATCH",
        url: `/workspaces/${workspaceSlug}/contacts/${contactId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Organizations", workspaceSlug),
              createWorkspaceListTag("Folders", workspaceSlug),
            ],
      async onQueryStarted(
        { workspaceSlug, contactId, optimistic, payload },
        { dispatch, queryFulfilled },
      ) {
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                applyContactPatch(draft, payload, optimistic);
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContacts",
              { workspaceSlug },
              (draft) => {
                const contact = draft.find((item) => item.id === contactId);

                if (contact) {
                  applyContactPatch(contact, payload, optimistic);
                }
              },
            ),
          ),
        ];

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              () => data.contact,
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const index = draft.findIndex((item) => item.id === contactId);

              if (index >= 0) {
                draft[index] = toContactListItem(data.contact);
              }
            }),
          );
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    deleteContact: builder.mutation<DeleteContactResponse, DeleteContactArg>({
      query: ({ workspaceSlug, contactId }) => ({
        method: "DELETE",
        url: `/workspaces/${workspaceSlug}/contacts/${contactId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug, contactId }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Organizations", workspaceSlug),
              createWorkspaceListTag("Folders", workspaceSlug),
              createWorkspaceListTag("Activities", workspaceSlug),
              { type: "Contacts" as const, id: contactId },
            ],
      async onQueryStarted(
        { workspaceSlug, contactId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
            const index = draft.findIndex((item) => item.id === contactId);

            if (index >= 0) {
              draft.splice(index, 1);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    updateOrganization: builder.mutation<
      UpdateOrganizationResponse,
      UpdateOrganizationArg
    >({
      query: ({ workspaceSlug, organizationId, payload }) => ({
        body: payload,
        method: "PATCH",
        url: `/workspaces/${workspaceSlug}/organizations/${organizationId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Contacts", workspaceSlug),
              createWorkspaceListTag("Activities", workspaceSlug),
            ],
      async onQueryStarted(
        { workspaceSlug, organizationId, payload },
        { dispatch, queryFulfilled },
      ) {
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getOrganizationDetail",
              { workspaceSlug, organizationId },
              (draft) => {
                applyOrganizationPatch(draft, payload);
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData(
              "getOrganizations",
              { workspaceSlug },
              (draft) => {
                const organization = draft.find((item) => item.id === organizationId);

                if (organization) {
                  applyOrganizationPatch(organization, payload);
                }
              },
            ),
          ),
        ];

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getOrganizationDetail",
              { workspaceSlug, organizationId },
              () => data.organization,
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData(
              "getOrganizations",
              { workspaceSlug },
              (draft) => {
                const index = draft.findIndex((item) => item.id === organizationId);

                if (index >= 0) {
                  draft[index] = data.listItem;
                }
              },
            ),
          );
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    createFolder: builder.mutation<CreateFolderResponse, CreateFolderArg>({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "POST",
        url: `/workspaces/${workspaceSlug}/folders`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error ? [] : [createWorkspaceListTag("Folders", workspaceSlug)],
      async onQueryStarted({ workspaceSlug, payload }, { dispatch, queryFulfilled }) {
        const tempId = `temp-folder-${crypto.randomUUID()}`;
        const tempFolder: FolderListItem = {
          contactCount: 0,
          created_at: new Date().toISOString(),
          id: tempId,
          name: payload.name.trim(),
          workspace_id: workspaceSlug,
        };
        const patch = dispatch(
          workspaceApi.util.updateQueryData("getFolders", { workspaceSlug }, (draft) => {
            draft.unshift(tempFolder);
          }),
        );

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData("getFolders", { workspaceSlug }, (draft) => {
              const index = draft.findIndex((item) => item.id === tempId);

              if (index >= 0) {
                draft[index] = data.folder;
              } else {
                draft.unshift(data.folder);
              }
            }),
          );
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    deleteFolder: builder.mutation<DeleteFolderResponse, DeleteFolderArg>({
      query: ({ workspaceSlug, folderId }) => ({
        method: "DELETE",
        url: `/workspaces/${workspaceSlug}/folders/${folderId}`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug, folderId }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Contacts", workspaceSlug),
              { type: "Folders" as const, id: folderId },
            ],
      async onQueryStarted(
        { workspaceSlug, folderId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          workspaceApi.util.updateQueryData("getFolders", { workspaceSlug }, (draft) => {
            const index = draft.findIndex((item) => item.id === folderId);

            if (index >= 0) {
              draft.splice(index, 1);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patch.undo();
          throw error;
        }
      },
    }),
    syncFolderContacts: builder.mutation<
      SyncFolderContactsResponse,
      SyncFolderContactsArg
    >({
      query: ({ workspaceSlug, folderId, payload }) => ({
        body: payload,
        method: "PUT",
        url: `/workspaces/${workspaceSlug}/folders/${folderId}/contacts`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Contacts", workspaceSlug),
              createWorkspaceListTag("Folders", workspaceSlug),
            ],
      async onQueryStarted(
        { workspaceSlug, folderId, payload },
        { dispatch, queryFulfilled },
      ) {
        const selectedContactIds = new Set(payload.contactIds);
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getFolderDetail",
              { workspaceSlug, folderId },
              (draft) => {
                const selectableContacts = draft.selectableContacts.map((contact) => ({
                  ...contact,
                  selected: selectedContactIds.has(contact.id),
                }));

                draft.selectableContacts = selectableContacts;
                draft.contacts = selectableContacts.filter((contact) => contact.selected);
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData("getFolders", { workspaceSlug }, (draft) => {
              const folder = draft.find((item) => item.id === folderId);

              if (folder) {
                folder.contactCount = payload.contactIds.length;
              }
            }),
          ),
        ];

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getFolderDetail",
              { workspaceSlug, folderId },
              () => data.folder,
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData("getFolders", { workspaceSlug }, (draft) => {
              const folder = draft.find((item) => item.id === folderId);

              if (folder) {
                folder.contactCount = data.folder.contacts.length;
              }
            }),
          );
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    createActivity: builder.mutation<CreateActivityResponse, CreateActivityArg>({
      query: ({ workspaceSlug, payload }) => ({
        body: payload,
        method: "POST",
        url: `/workspaces/${workspaceSlug}/outreach`,
      }),
      invalidatesTags: (_result, error, { workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Activities", workspaceSlug),
              createWorkspaceListTag("Contacts", workspaceSlug),
              createWorkspaceListTag("Organizations", workspaceSlug),
            ],
      async onQueryStarted(
        { workspaceSlug, payload, optimistic },
        { dispatch, queryFulfilled },
      ) {
        const tempId = `temp-activity-${crypto.randomUUID()}`;
        const activityDate = new Date(payload.activityDate).toISOString();
        const shouldUpdateContact = shouldAffectLastContact(payload.status);
        const optimisticActivity: ActivityListItem = {
          activity_date: activityDate,
          contact_id: payload.contactId,
          contactName: optimistic.contactName,
          content: payload.content.trim(),
          created_at: new Date().toISOString(),
          id: tempId,
          organization_id: payload.organizationId ?? null,
          organizationName: optimistic.organizationName ?? null,
          status: payload.status,
          type: payload.type,
          workspace_id: workspaceSlug,
        };
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceActivities",
              { workspaceSlug },
              (draft) => {
                draft.unshift(optimisticActivity);
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId: payload.contactId },
              (draft) => {
                draft.activities.unshift(optimisticActivity);

                if (shouldUpdateContact) {
                  draft.last_contact_date = getLatestDate(draft.last_contact_date, activityDate);
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === payload.contactId);

              if (contact && shouldUpdateContact) {
                contact.last_contact_date = getLatestDate(contact.last_contact_date, activityDate);
              }
            }),
          ),
        ];

        if (payload.organizationId) {
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId: payload.organizationId },
                (draft) => {
                  draft.activities.unshift(optimisticActivity);

                  const contact = draft.contacts.find((item) => item.id === payload.contactId);

                  if (contact && shouldUpdateContact) {
                    contact.last_contact_date = getLatestDate(
                      contact.last_contact_date,
                      activityDate,
                    );
                  }
                },
              ),
            ),
          );
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizations",
                { workspaceSlug },
                (draft) => {
                  const organization = draft.find((item) => item.id === payload.organizationId);

                  if (organization) {
                    organization.activityCount += 1;
                  }
                },
              ),
            ),
          );
        }

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceActivities",
              { workspaceSlug },
              (draft) => {
                const index = draft.findIndex((item) => item.id === tempId);

                if (index >= 0) {
                  draft[index] = data.activity;
                }
              },
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId: payload.contactId },
              (draft) => {
                const index = draft.activities.findIndex((item) => item.id === tempId);

                if (index >= 0) {
                  draft.activities[index] = data.activity;
                }

                draft.last_contact_date = data.contactLastContactDate;
              },
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === payload.contactId);

              if (contact) {
                contact.last_contact_date = data.contactLastContactDate;
              }
            }),
          );

          if (data.organizationId) {
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId: data.organizationId },
                (draft) => {
                  const index = draft.activities.findIndex((item) => item.id === tempId);

                  if (index >= 0) {
                    draft.activities[index] = data.activity;
                  }

                  const contact = draft.contacts.find((item) => item.id === payload.contactId);

                  if (contact) {
                    contact.last_contact_date = data.contactLastContactDate;
                  }
                },
              ),
            );
          }
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    updateActivity: builder.mutation<UpdateActivityResponse, UpdateActivityArg>({
      query: ({ workspaceSlug, activityId, payload }) => ({
        body: payload,
        method: "PATCH",
        url: `/workspaces/${workspaceSlug}/outreach/${activityId}`,
      }),
      invalidatesTags: (_result, error, { activityId, contactId, organizationId, workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Activities", workspaceSlug),
              createWorkspaceListTag("Contacts", workspaceSlug),
              { type: "Activities" as const, id: activityId },
              { type: "Contacts" as const, id: contactId },
              ...(organizationId
                ? [
                    createWorkspaceListTag("Organizations", workspaceSlug),
                    { type: "Organizations" as const, id: organizationId },
                  ]
                : []),
            ],
      async onQueryStarted(
        { workspaceSlug, activityId, contactId, organizationId, payload },
        { dispatch, getState, queryFulfilled },
      ) {
        const state = getState();
        const contactDetail = workspaceApi.endpoints.getContactDetail.select({
          workspaceSlug,
          contactId,
        })(state).data;
        const workspaceActivities = workspaceApi.endpoints.getWorkspaceActivities.select({
          workspaceSlug,
        })(state).data;
        const existingActivity =
          contactDetail?.activities.find((item) => item.id === activityId) ??
          workspaceActivities?.find((item) => item.id === activityId);
        const optimisticActivity: ActivityListItem = {
          activity_date: new Date(payload.activityDate).toISOString(),
          contact_id: contactId,
          contactName: existingActivity?.contactName,
          content: payload.content.trim(),
          created_at: existingActivity?.created_at ?? new Date().toISOString(),
          id: activityId,
          organization_id: organizationId ?? null,
          organizationName: existingActivity?.organizationName ?? null,
          status: payload.status,
          type: payload.type,
          workspace_id: existingActivity?.workspace_id ?? workspaceSlug,
        };
        const nextContactLastContactDate = contactDetail
          ? getLastContactDateFromActivities(
              contactDetail.activities.map((item) =>
                item.id === activityId ? optimisticActivity : item,
              ),
            )
          : undefined;
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceActivities",
              { workspaceSlug },
              (draft) => {
                const index = draft.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft[index] = optimisticActivity;
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                const index = draft.activities.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft.activities[index] = optimisticActivity;
                }

                if (nextContactLastContactDate !== undefined) {
                  draft.last_contact_date = nextContactLastContactDate;
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === contactId);

              if (contact && nextContactLastContactDate !== undefined) {
                contact.last_contact_date = nextContactLastContactDate;
              }
            }),
          ),
        ];

        if (organizationId) {
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId },
                (draft) => {
                  const index = draft.activities.findIndex((item) => item.id === activityId);

                  if (index >= 0) {
                    draft.activities[index] = optimisticActivity;
                  }

                  const contact = draft.contacts.find((item) => item.id === contactId);

                  if (contact && nextContactLastContactDate !== undefined) {
                    contact.last_contact_date = nextContactLastContactDate;
                  }
                },
              ),
            ),
          );
        }

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceActivities",
              { workspaceSlug },
              (draft) => {
                const index = draft.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft[index] = data.activity;
                }
              },
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                const index = draft.activities.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft.activities[index] = data.activity;
                }

                draft.last_contact_date = data.contactLastContactDate;
              },
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === contactId);

              if (contact) {
                contact.last_contact_date = data.contactLastContactDate;
              }
            }),
          );

          if (organizationId) {
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId },
                (draft) => {
                  const index = draft.activities.findIndex((item) => item.id === activityId);

                  if (index >= 0) {
                    draft.activities[index] = data.activity;
                  }

                  const contact = draft.contacts.find((item) => item.id === contactId);

                  if (contact) {
                    contact.last_contact_date = data.contactLastContactDate;
                  }
                },
              ),
            );
          }
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
    deleteActivity: builder.mutation<DeleteActivityResponse, DeleteActivityArg>({
      query: ({ workspaceSlug, activityId }) => ({
        method: "DELETE",
        url: `/workspaces/${workspaceSlug}/outreach/${activityId}`,
      }),
      invalidatesTags: (_result, error, { activityId, contactId, organizationId, workspaceSlug }) =>
        error
          ? []
          : [
              createWorkspaceListTag("Activities", workspaceSlug),
              createWorkspaceListTag("Contacts", workspaceSlug),
              { type: "Activities" as const, id: activityId },
              { type: "Contacts" as const, id: contactId },
              ...(organizationId
                ? [
                    createWorkspaceListTag("Organizations", workspaceSlug),
                    { type: "Organizations" as const, id: organizationId },
                  ]
                : []),
            ],
      async onQueryStarted(
        { workspaceSlug, activityId, contactId, organizationId },
        { dispatch, getState, queryFulfilled },
      ) {
        const state = getState();
        const contactDetail = workspaceApi.endpoints.getContactDetail.select({
          workspaceSlug,
          contactId,
        })(state).data;
        const nextContactLastContactDate = contactDetail
          ? getLastContactDateFromActivities(
              contactDetail.activities.filter((item) => item.id !== activityId),
            )
          : undefined;
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getWorkspaceActivities",
              { workspaceSlug },
              (draft) => {
                const index = draft.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft.splice(index, 1);
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                const index = draft.activities.findIndex((item) => item.id === activityId);

                if (index >= 0) {
                  draft.activities.splice(index, 1);
                }

                if (nextContactLastContactDate !== undefined) {
                  draft.last_contact_date = nextContactLastContactDate;
                }
              },
            ),
          ),
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === contactId);

              if (contact && nextContactLastContactDate !== undefined) {
                contact.last_contact_date = nextContactLastContactDate;
              }
            }),
          ),
        ];

        if (organizationId) {
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId },
                (draft) => {
                  const index = draft.activities.findIndex((item) => item.id === activityId);

                  if (index >= 0) {
                    draft.activities.splice(index, 1);
                  }

                  const contact = draft.contacts.find((item) => item.id === contactId);

                  if (contact && nextContactLastContactDate !== undefined) {
                    contact.last_contact_date = nextContactLastContactDate;
                  }
                },
              ),
            ),
          );
          patches.push(
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizations",
                { workspaceSlug },
                (draft) => {
                  const organization = draft.find((item) => item.id === organizationId);

                  if (organization && organization.activityCount > 0) {
                    organization.activityCount -= 1;
                  }
                },
              ),
            ),
          );
        }

        try {
          const { data } = await queryFulfilled;

          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                draft.last_contact_date = data.contactLastContactDate;
              },
            ),
          );
          dispatch(
            workspaceApi.util.updateQueryData("getContacts", { workspaceSlug }, (draft) => {
              const contact = draft.find((item) => item.id === data.contactId);

              if (contact) {
                contact.last_contact_date = data.contactLastContactDate;
              }
            }),
          );

          if (organizationId) {
            dispatch(
              workspaceApi.util.updateQueryData(
                "getOrganizationDetail",
                { workspaceSlug, organizationId },
                (draft) => {
                  const contact = draft.contacts.find((item) => item.id === data.contactId);

                  if (contact) {
                    contact.last_contact_date = data.contactLastContactDate;
                  }
                },
              ),
            );
          }
        } catch (error) {
          patches.reverse().forEach((patch) => patch.undo());
          throw error;
        }
      },
    }),
  }),
});

export const {
  useCancelWorkspaceInvitationMutation,
  useCreateContactMutation,
  useCreateActivityMutation,
  useCreateFolderMutation,
  useDeleteContactMutation,
  useDeleteActivityMutation,
  useDeleteFolderMutation,
  useGetContactDetailQuery,
  useGetContactsQuery,
  useGetFolderDetailQuery,
  useGetFoldersQuery,
  useGetOrganizationDetailQuery,
  useGetOrganizationsQuery,
  useGetWorkspaceActivitiesQuery,
  useGetWorkspaceInvitationsQuery,
  useGetWorkspaceMembersQuery,
  useInviteWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
  useSyncFolderContactsMutation,
  useUpdateProfileMutation,
  useUpdateActivityMutation,
  useUpdateContactMutation,
  useUpdateOrganizationMutation,
  useUpdateWorkspaceSettingsMutation,
} = workspaceApi;
