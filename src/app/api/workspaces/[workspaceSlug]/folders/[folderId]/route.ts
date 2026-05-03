import { NextResponse } from "next/server";

import { getFolderDetail, getWorkspaceContext } from "@/lib/data";
import { deleteFolderRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; folderId: string }> },
) {
  const { workspaceSlug, folderId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const folder = await getFolderDetail(workspace.id, folderId);

  return NextResponse.json(folder);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; folderId: string }> },
) {
  try {
    const { workspaceSlug, folderId } = await params;
    const result = await deleteFolderRecord(workspaceSlug, folderId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
