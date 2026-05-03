import { NextResponse } from "next/server";

import {
  deleteActivityRecord,
  updateActivityRecord,
} from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { UpdateActivityPayload } from "@/lib/workspace-mutation-types";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ workspaceSlug: string; activityId: string }>;
  },
) {
  try {
    const { activityId, workspaceSlug } = await params;
    const payload = (await request.json()) as UpdateActivityPayload;
    const result = await updateActivityRecord(workspaceSlug, activityId, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ workspaceSlug: string; activityId: string }>;
  },
) {
  try {
    const { activityId, workspaceSlug } = await params;
    const result = await deleteActivityRecord(workspaceSlug, activityId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
