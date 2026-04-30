"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  Globe,
  Link2,
  Mail,
  MessageCircleMore,
  Send,
  StickyNote,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { FieldLabel, TextArea, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import { cn, formatDate, getErrorMessage, getInitials } from "@/lib/utils";
import type { ContactListItem } from "@/lib/data";
import {
  activityQueryOptions,
  useGetOrganizationDetailQuery,
  useUpdateOrganizationMutation,
} from "@/store/workspace-api";

type OrganizationDetailViewProps = {
  error?: string;
  organizationId: string;
  success?: string;
  workspaceSlug: string;
};

export function OrganizationDetailView({
  error,
  organizationId,
  success,
  workspaceSlug,
}: OrganizationDetailViewProps) {
  const [selectedContact, setSelectedContact] = useState<ContactListItem | null>(null);
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const queryArg = { workspaceSlug, organizationId };
  const { data, isFetching, isLoading } = useGetOrganizationDetailQuery(
    queryArg,
    activityQueryOptions,
  );
  const [updateOrganization, updateOrganizationState] = useUpdateOrganizationMutation();
  const organization = data;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await updateOrganization({
        organizationId,
        payload: {
          name: String(formData.get("name") ?? ""),
          note: String(formData.get("note") ?? ""),
          website: String(formData.get("website") ?? ""),
        },
        workspaceSlug,
      }).unwrap();
      showSuccess("Organization updated.");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  if (isLoading && !organization) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-muted">
        Loading organization...
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-danger">
        Unable to load organization.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Organization profile"
          title={organization.name}
          description={`Update company details and review every linked contact${isFetching ? " · Refreshing live data" : "."}`}
        />

        <NoticeBanner error={noticeError} success={noticeSuccess} />

        <div className="grid gap-6 xl:grid-cols-[minmax(420px,0.92fr)_minmax(460px,1.08fr)]">
          <section className="panel rounded-[30px] p-6">
            <div className="flex items-start gap-4 border-b border-white/8 pb-6">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] text-lg font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {getInitials(organization.name) || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Company profile
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  {organization.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {organization.contacts.length} linked contact
                  {organization.contacts.length === 1 ? "" : "s"} and {organization.activities.length}{" "}
                  activity record{organization.activities.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ContextCard
                icon={UserRound}
                label="Linked contacts"
                value={`${organization.contacts.length} active relationship${organization.contacts.length === 1 ? "" : "s"}`}
              />
              <ContextCard
                icon={CalendarDays}
                label="Outreach records"
                value={`${organization.activities.length} activity item${organization.activities.length === 1 ? "" : "s"}`}
              />
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="organizationId" value={organization.id} />

              <div>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <InputWithIcon icon={Building2}>
                  <TextInput
                    id="name"
                    name="name"
                    defaultValue={organization.name}
                    placeholder="Acme Ventures"
                    required
                    className="pl-11"
                  />
                </InputWithIcon>
              </div>

              <div>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <InputWithIcon icon={Globe}>
                  <TextInput
                    id="website"
                    name="website"
                    defaultValue={organization.website ?? ""}
                    placeholder="https://company.com"
                    className="pl-11"
                  />
                </InputWithIcon>
              </div>

              <div>
                <FieldLabel htmlFor="note">Note</FieldLabel>
                <InputWithIcon icon={StickyNote} alignTop>
                  <TextArea
                    id="note"
                    name="note"
                    defaultValue={organization.note ?? ""}
                    placeholder="Fund thesis, relationship context, warm intro paths, or any company notes..."
                    className="min-h-40 pl-11"
                  />
                </InputWithIcon>
              </div>

              <SubmitButton loading={updateOrganizationState.isLoading}>
                Save organization
              </SubmitButton>
            </form>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Linked contacts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Contact roster
              </h2>
              <p className="mt-2 text-sm text-muted">
                Click a contact to inspect details without leaving this page.
              </p>
            </div>

            {organization.contacts.length ? (
              <OrganizationContactTable
                contacts={organization.contacts}
                onSelect={setSelectedContact}
              />
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No contacts linked yet
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Assign contacts to this organization and they will show up here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <OrganizationContactDrawer
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}

function OrganizationContactTable({
  contacts,
  onSelect,
}: {
  contacts: ContactListItem[];
  onSelect: (contact: ContactListItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0f1012]">
      <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_120px_150px_32px] gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:grid">
        <span>Contact</span>
        <span>Role</span>
        <span>Status</span>
        <span>Last touch</span>
        <span />
      </div>

      <div className="divide-y divide-white/8">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onSelect(contact)}
            className="group grid w-full gap-3 bg-[#0f1012] px-4 py-4 text-left hover:bg-[#15171b] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_120px_150px_32px] lg:items-center lg:gap-4 lg:px-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#17191d] text-xs font-semibold text-foreground">
                  {getInitials(contact.name) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {contact.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {contact.gmail ?? contact.linkedin ?? contact.telegram ?? "No channel set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted">
              {contact.role || "No role set"}
            </div>

            <div>
              <StatusBadge status={contact.status} />
            </div>

            <div className="text-xs text-muted-foreground">
              {formatDate(contact.last_contact_date, "No activity", "MMM d, yyyy")}
            </div>

            <div className="flex justify-end text-muted transition group-hover:text-foreground">
              <span className="text-lg leading-none">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OrganizationContactDrawer({
  contact,
  onClose,
  workspaceSlug,
}: {
  contact: ContactListItem | null;
  onClose: () => void;
  workspaceSlug: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        contact ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Close contact details"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity",
          contact ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/10 bg-[#09090b]/96 shadow-[-24px_0_80px_rgba(0,0,0,0.5)] transition-transform duration-300",
          contact ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Linked contact
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              {contact?.name ?? "Contact"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {contact ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="flex justify-start">
              <Link
                href={`/workspaces/${workspaceSlug}/contacts/${contact.id}`}
                onClick={onClose}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                View contact
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Relationship snapshot
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">
                    {contact.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {contact.role || "No role set"}
                  </p>
                </div>
                <StatusBadge status={contact.status} />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {contact.note || "No private notes added for this contact yet."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerMeta
                icon={CalendarDays}
                label="Last contact"
                value={formatDate(contact.last_contact_date, "No activity yet", "MMMM d, yyyy")}
              />
              <DrawerMeta
                icon={Building2}
                label="Organization"
                value={contact.organizationName ?? "Unassigned"}
              />
              <DrawerMeta
                icon={Send}
                label="Telegram"
                value={contact.telegram || "Not added"}
              />
              <DrawerMeta
                icon={Link2}
                label="LinkedIn"
                value={
                  contact.linkedin ? (
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground hover:text-accent"
                    >
                      {contact.linkedin}
                    </a>
                  ) : (
                    "Not added"
                  )
                }
              />
              <DrawerMeta
                icon={MessageCircleMore}
                label="WhatsApp"
                value={contact.whatsapp || "Not added"}
              />
              <DrawerMeta
                icon={Mail}
                label="Gmail"
                value={contact.gmail || "Not added"}
              />
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function InputWithIcon({
  alignTop = false,
  children,
  icon: Icon,
}: {
  alignTop?: boolean;
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-4 z-10 size-4 text-muted-foreground",
          alignTop ? "top-4" : "top-1/2 -translate-y-1/2",
        )}
      />
      {children}
    </div>
  );
}

function ContextCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-3 text-sm text-muted">{value}</div>
    </div>
  );
}

function DrawerMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-3 text-sm leading-6 text-foreground">{value}</div>
    </div>
  );
}
