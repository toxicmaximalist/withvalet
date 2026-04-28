import { NextResponse } from "next/server";

import { getOrganizations, getWorkspaceContext } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const organizations = await getOrganizations(workspace.id);

  return NextResponse.json(organizations);
}
