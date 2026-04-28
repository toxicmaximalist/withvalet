import { NextResponse } from "next/server";

import { getContacts, getWorkspaceContext } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const contacts = await getContacts(workspace.id);

  return NextResponse.json(contacts);
}
