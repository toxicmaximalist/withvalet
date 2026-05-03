import { NextResponse } from "next/server";

import { getContactDetail, getWorkspaceContext } from "@/lib/data";
import {
  deleteContactRecord,
  updateContactRecord,
} from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { UpdateContactPayload } from "@/lib/workspace-mutation-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; contactId: string }> },
) {
  const { workspaceSlug, contactId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const contact = await getContactDetail(workspace.id, contactId);

  return NextResponse.json(contact);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; contactId: string }> },
) {
  try {
    const { workspaceSlug, contactId } = await params;
    const payload = (await request.json()) as UpdateContactPayload;
    const result = await updateContactRecord(workspaceSlug, contactId, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; contactId: string }> },
) {
  try {
    const { workspaceSlug, contactId } = await params;
    const result = await deleteContactRecord(workspaceSlug, contactId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
