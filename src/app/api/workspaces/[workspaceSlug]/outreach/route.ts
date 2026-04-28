import { NextResponse } from "next/server";

import { getWorkspaceActivities, getWorkspaceContext } from "@/lib/data";
import { createActivityRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { CreateActivityPayload } from "@/lib/workspace-mutation-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const activities = await getWorkspaceActivities(workspace.id);

  return NextResponse.json(activities);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const payload = (await request.json()) as CreateActivityPayload;
    const result = await createActivityRecord(workspaceSlug, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
