"use client";

import Link from "next/link";
import { useState } from "react";

import { createContactAction } from "@/actions/contacts";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
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
import { useGetContactsQuery, workspaceQueryOptions } from "@/store/workspace-api";

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
  const queryArg = { workspaceSlug };
  const { data, isFetching, isLoading } = useGetContactsQuery(queryArg, workspaceQueryOptions);
  const contacts = data ?? [];

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
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
        >
          New contact
        </button>
      </div>

      <NoticeBanner error={error} success={success} />

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
          <EmptyState
            title="No contacts yet"
            description="Add your first contact to start building a workspace-specific pipeline."
          />
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
            key: "email",
            header: "Email",
            render: (contact) => (
              <span className="text-sm text-foreground">{contact.gmail || "No email"}</span>
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
