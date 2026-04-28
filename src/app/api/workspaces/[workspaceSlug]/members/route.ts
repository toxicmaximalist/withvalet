import { NextResponse } from "next/server";

import { getWorkspaceContext, getWorkspaceMembers } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const members = await getWorkspaceMembers(workspace.id);

  return NextResponse.json(members);
}
