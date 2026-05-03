import { NextResponse } from "next/server";

import { removeWorkspaceMemberRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string; workspaceSlug: string }> },
) {
  try {
    const { userId, workspaceSlug } = await params;
    const result = await removeWorkspaceMemberRecord(workspaceSlug, userId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
