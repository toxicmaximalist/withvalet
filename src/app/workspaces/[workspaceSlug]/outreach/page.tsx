import { OutreachView } from "@/components/workspace/outreach-view";
import { getMessageValue } from "@/lib/navigation";

type OutreachPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OutreachPage({
  params,
  searchParams,
}: OutreachPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;

  return (
    <OutreachView
      error={getMessageValue(query.error)}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
