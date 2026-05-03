import { NextResponse } from "next/server";

import { updateProfileRecord } from "@/lib/workspace-mutations";
import { getErrorMessage } from "@/lib/utils";
import type { UpdateProfilePayload } from "@/lib/workspace-mutation-types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const payload = (await request.json()) as UpdateProfilePayload;
    const result = await updateProfileRecord(workspaceSlug, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 400 });
  }
}
