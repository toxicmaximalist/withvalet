import { ContactsView } from "@/components/workspace/contacts-view";
import { getMessageValue } from "@/lib/navigation";

type ContactsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactsPage({
  params,
  searchParams,
}: ContactsPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;

  return (
    <ContactsView
      error={getMessageValue(query.error)}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
