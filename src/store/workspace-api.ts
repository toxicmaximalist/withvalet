"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
  ContactDetail,
  ContactListItem,
  FolderDetail,
  FolderListItem,
  OrganizationDetail,
  OrganizationListItem,
  WorkspaceMemberSummary,
} from "@/lib/data";
import type { ActivityListItem } from "@/lib/data";
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
  payload: UpdateContactPayload;
};

type UpdateOrganizationArg = OrganizationDetailArg & {
  payload: UpdateOrganizationPayload;
};

type CreateFolderArg = WorkspaceSlugArg & {
  payload: CreateFolderPayload;
};

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
) {
  const nextOrganizationName = normalizeOptionalText(payload.organizationName);
  const organizationChanged = (draft.organizationName ?? null) !== nextOrganizationName;

  draft.gmail = normalizeOptionalText(payload.gmail);
  draft.linkedin = normalizeOptionalText(payload.linkedin);
  draft.name = payload.name.trim();
  draft.note = normalizeOptionalText(payload.note);
  draft.organizationName = nextOrganizationName;
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
  return status === "sent" || status === "replied" || status === "completed";
}

function getLatestDate(current: string | null | undefined, next: string) {
  if (!current) {
    return next;
  }

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

export const workspaceQueryOptions = {
  refetchOnFocus: true,
  refetchOnMountOrArgChange: false,
  refetchOnReconnect: true,
} as const;

export const activityQueryOptions = {
  ...workspaceQueryOptions,
  pollingInterval: 60_000,
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
        { workspaceSlug, contactId, payload },
        { dispatch, queryFulfilled },
      ) {
        const patches = [
          dispatch(
            workspaceApi.util.updateQueryData(
              "getContactDetail",
              { workspaceSlug, contactId },
              (draft) => {
                applyContactPatch(draft, payload);
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
                  applyContactPatch(contact, payload);
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
  }),
});

export const {
  useCreateActivityMutation,
  useCreateFolderMutation,
  useGetContactDetailQuery,
  useGetContactsQuery,
  useGetFolderDetailQuery,
  useGetFoldersQuery,
  useGetOrganizationDetailQuery,
  useGetOrganizationsQuery,
  useGetWorkspaceActivitiesQuery,
  useGetWorkspaceMembersQuery,
  useSyncFolderContactsMutation,
  useUpdateContactMutation,
  useUpdateOrganizationMutation,
} = workspaceApi;
