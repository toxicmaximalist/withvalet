import { NextResponse } from "next/server";

import { cancelWorkspaceInvitationRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ invitationId: string; workspaceSlug: string }>;
  },
) {
  try {
    const { invitationId, workspaceSlug } = await params;
    const result = await cancelWorkspaceInvitationRecord(workspaceSlug, invitationId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
