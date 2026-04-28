import { NextResponse } from "next/server";

import { getOrganizationDetail, getWorkspaceContext } from "@/lib/data";
import { updateOrganizationRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { UpdateOrganizationPayload } from "@/lib/workspace-mutation-types";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ workspaceSlug: string; organizationId: string }> },
) {
  const { workspaceSlug, organizationId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const organization = await getOrganizationDetail(workspace.id, organizationId);

  return NextResponse.json(organization);
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ workspaceSlug: string; organizationId: string }> },
) {
  try {
    const { workspaceSlug, organizationId } = await params;
    const payload = (await request.json()) as UpdateOrganizationPayload;
    const result = await updateOrganizationRecord(workspaceSlug, organizationId, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
