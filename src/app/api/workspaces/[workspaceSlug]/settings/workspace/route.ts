import { NextResponse } from "next/server";

import { updateWorkspaceSettingsRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { UpdateWorkspaceSettingsPayload } from "@/lib/workspace-mutation-types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const payload = (await request.json()) as UpdateWorkspaceSettingsPayload;
    const result = await updateWorkspaceSettingsRecord(workspaceSlug, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
