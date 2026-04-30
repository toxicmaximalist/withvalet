"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import {
  createContactAction,
  deleteAllContactsAction,
  importContactsAction,
} from "@/actions/contacts";
import { DataTable } from "@/components/data-table";
import {
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { NoticeBanner } from "@/components/notice-banner";
import { OrganizationBadge } from "@/components/organization-badge";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  useGetContactsQuery,
  useGetWorkspaceMembersQuery,
  workspaceQueryOptions,
} from "@/store/workspace-api";

type ContactsViewProps = {
  error?: string;
  success?: string;
  workspaceSlug: string;
};

export function ContactsView({
  error,
  success,
  workspaceSlug,
}: ContactsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const queryArg = { workspaceSlug };
  const { data, isFetching, isLoading } = useGetContactsQuery(queryArg, workspaceQueryOptions);
  const membersQuery = useGetWorkspaceMembersQuery(queryArg, workspaceQueryOptions);
  const contacts = data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-foreground">Contacts</h2>
          <span className="text-sm text-muted">
            {contacts.length}
            {isFetching ? " · Refreshing..." : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteAllModalOpen(true)}
            disabled={!contacts.length}
            className="inline-flex items-center rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete all
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
          >
            Import contacts
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
          >
            New contact
          </button>
        </div>
      </div>

      <NoticeBanner error={error} success={success} />

      <Modal
        open={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        title="Delete all contacts"
        description="This removes every contact in the workspace and will also delete linked outreach activity and folder assignments."
      >
        <form action={deleteAllContactsAction} className="space-y-5">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm leading-6 text-danger">
            This action cannot be undone.
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(false)}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
            >
              Cancel
            </button>
            <SubmitButton
              className="border-danger/40 bg-danger text-white shadow-none hover:scale-100 hover:bg-[#ef4444] hover:shadow-none"
              pendingLabel="Deleting..."
            >
              Delete all contacts
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import contacts"
        description="Upload a CSV or Excel file. The file will be parsed with OpenAI and matched against existing contacts."
      >
        <form action={importContactsAction} className="space-y-4">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <div>
            <FieldLabel htmlFor="contactsImportFile">CSV or Excel file</FieldLabel>
            <input
              id="contactsImportFile"
              name="file"
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              className="w-full rounded-2xl border border-white/10 bg-[#0f1012] px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-sm file:text-foreground"
            />
            <p className="mt-2 text-sm leading-6 text-muted">
              Expected columns can be flexible. OpenAI will normalize names, titles, organizations,
              channels, statuses, and notes before import.
            </p>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Importing...">Import contacts</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create contact"
        description="Add a new person to this workspace pipeline."
      >
        <form action={createContactAction} className="space-y-4">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <TextInput id="name" name="name" placeholder="Ari Bennett" required />
            </div>
            <div>
              <FieldLabel htmlFor="organizationName">Organization</FieldLabel>
              <TextInput
                id="organizationName"
                name="organizationName"
                placeholder="Northstar Labs"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <TextInput id="role" name="role" placeholder="Founder" />
            </div>
            <div>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <SelectInput id="status" name="status" defaultValue="new">
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CONTACT_STATUS_LABELS[status]}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="responsibleUserId">Responsible person</FieldLabel>
            <SelectInput id="responsibleUserId" name="responsibleUserId" defaultValue="">
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName || member.email}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="telegram">Telegram</FieldLabel>
              <TextInput id="telegram" name="telegram" placeholder="@username" />
            </div>
            <div>
              <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
              <TextInput
                id="linkedin"
                name="linkedin"
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
              <TextInput
                id="whatsapp"
                name="whatsapp"
                placeholder="+1 555 000 0000"
              />
            </div>
            <div>
              <FieldLabel htmlFor="gmail">Gmail</FieldLabel>
              <TextInput
                id="gmail"
                name="gmail"
                type="email"
                placeholder="ari@northstarlabs.com"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="note">Note</FieldLabel>
            <TextArea
              id="note"
              name="note"
              placeholder="Context, angle, or relationship notes..."
            />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Create contact</SubmitButton>
          </div>
        </form>
      </Modal>

      {isLoading && !data ? (
        <div className="panel rounded-[24px] px-4 py-8 text-sm text-muted">
          Loading contacts...
        </div>
      ) : (
      <DataTable
        data={contacts}
        emptyState={
          <div className="panel-strong rounded-[30px] border px-8 py-10">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Contacts
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              No contacts yet
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Start building the workspace pipeline by creating a contact manually or importing a
              file.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                New contact
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Import contacts
              </button>
            </div>
          </div>
        }
        columns={[
          {
            key: "name",
            header: "Name",
            render: (contact) => (
              <div>
                <Link
                  href={`/workspaces/${workspaceSlug}/contacts/${contact.id}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {contact.name}
                </Link>
              </div>
            ),
          },
          {
            key: "organization",
            header: "Organization",
            render: (contact) => (
              <OrganizationBadge
                name={contact.organizationName}
                href={
                  contact.organization_id
                    ? `/workspaces/${workspaceSlug}/organizations/${contact.organization_id}`
                    : undefined
                }
              />
            ),
          },
          {
            key: "responsible",
            header: "Responsible",
            render: (contact) => (
              <span className="text-sm text-muted">
                {contact.responsibleUserName || contact.responsibleUserEmail || "Unassigned"}
              </span>
            ),
          },
          {
            key: "linkedin",
            header: "LinkedIn",
            render: (contact) => (
              contact.linkedin ? (
                <Link
                  href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : (
                <span className="text-sm text-muted">No link</span>
              )
            ),
          },
          {
            key: "role",
            header: "Title",
            render: (contact) => (
              <span className="text-sm text-muted">{contact.role || "No title"}</span>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (contact) => (
              <span className="text-sm text-muted">{contact.whatsapp || "No phone"}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (contact) => <StatusBadge status={contact.status} />,
          },
          {
            key: "last-contact",
            header: "Last contact",
            render: (contact) => (
              <span className="text-sm text-muted">
                {formatDate(contact.last_contact_date, "No activity")}
              </span>
            ),
          },
        ]}
      />
      )}
    </div>
  );
}
