import { ContactDetailView } from "@/components/workspace/contact-detail-view";
import { getMessageValue } from "@/lib/navigation";

type ContactDetailPageProps = {
  params: Promise<{ workspaceSlug: string; contactId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactDetailPage({
  params,
  searchParams,
}: ContactDetailPageProps) {
  const { workspaceSlug, contactId } = await params;
  const query = await searchParams;

  return (
    <ContactDetailView
      contactId={contactId}
      error={getMessageValue(query.error)}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
