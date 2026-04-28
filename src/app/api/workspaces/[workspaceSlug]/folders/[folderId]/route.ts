import { NextResponse } from "next/server";

import { getFolderDetail, getWorkspaceContext } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; folderId: string }> },
) {
  const { workspaceSlug, folderId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const folder = await getFolderDetail(workspace.id, folderId);

  return NextResponse.json(folder);
}
