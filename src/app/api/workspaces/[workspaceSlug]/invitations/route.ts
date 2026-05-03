import { NextResponse } from "next/server";

import { getWorkspaceContext, getWorkspaceInvitations } from "@/lib/data";
import { inviteWorkspaceMemberRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { InviteWorkspaceMemberPayload } from "@/lib/workspace-mutation-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const invitations = await getWorkspaceInvitations(workspace.id);

  return NextResponse.json(invitations);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const payload = (await request.json()) as InviteWorkspaceMemberPayload;
    const result = await inviteWorkspaceMemberRecord(workspaceSlug, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
