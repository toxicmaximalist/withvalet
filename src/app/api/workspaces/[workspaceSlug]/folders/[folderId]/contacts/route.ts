import { NextResponse } from "next/server";

import { syncFolderContactsRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { SyncFolderContactsPayload } from "@/lib/workspace-mutation-types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; folderId: string }> },
) {
  try {
    const { workspaceSlug, folderId } = await params;
    const payload = (await request.json()) as SyncFolderContactsPayload;
    const result = await syncFolderContactsRecord(workspaceSlug, folderId, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
