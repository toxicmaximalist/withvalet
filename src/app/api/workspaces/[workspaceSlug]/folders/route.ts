import { NextResponse } from "next/server";

import { getFolders, getWorkspaceContext } from "@/lib/data";
import { createFolderRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { CreateFolderPayload } from "@/lib/workspace-mutation-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const folders = await getFolders(workspace.id);

  return NextResponse.json(folders);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const payload = (await request.json()) as CreateFolderPayload;
    const result = await createFolderRecord(workspaceSlug, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
