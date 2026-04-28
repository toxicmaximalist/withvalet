"use server";

import { redirect } from "next/navigation";

import { requireUser, setLastWorkspaceCookie } from "@/lib/auth";
import { buildPathWithMessage, redirectWithMessage } from "@/lib/navigation";
import { getErrorMessage, slugify } from "@/lib/utils";
import { joinWorkspaceSchema, workspaceSchema } from "@/lib/validators";

async function createWorkspaceWithUniqueSlug(
  name: string,
  userId: string,
  redirectBase: string,
) {
  const { supabase } = await requireUser();
  const baseSlug = slugify(name) || "workspace";

  for (let index = 0; index < 5; index += 1) {
    const slug =
      index === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase
      .from("workspaces")
      .insert({
        name,
        owner_id: userId,
        slug,
      });

    if (!error) {
      await setLastWorkspaceCookie(slug);
      redirect(`/workspaces/${slug}/contacts`);
    }

    if (error.code === "23505") {
      continue;
    }

    redirect(
      buildPathWithMessage(
        redirectBase,
        "error",
        getErrorMessage(error),
      ),
    );
  }

  redirect(
    buildPathWithMessage(
      redirectBase,
      "error",
      "Could not create workspace because the generated slug kept colliding. Please try again.",
    ),
  );
}

export async function createWorkspaceAction(formData: FormData) {
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/onboarding/create-workspace",
      "error",
      parsed.error.issues[0]?.message ?? "Invalid workspace details.",
    );
  }

  const { user } = await requireUser();
  await createWorkspaceWithUniqueSlug(
    parsed.data.name,
    user.id,
    "/onboarding/create-workspace",
  );
}

export async function quickCreateWorkspaceAction(formData: FormData) {
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/workspaces",
      "error",
      parsed.error.issues[0]?.message ?? "Invalid workspace details.",
    );
  }

  const { user } = await requireUser();
  await createWorkspaceWithUniqueSlug(parsed.data.name, user.id, "/workspaces");
}

export async function joinWorkspaceAction(formData: FormData) {
  const parsed = joinWorkspaceSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/workspaces",
      "error",
      parsed.error.issues[0]?.message ?? "Invalid invite code.",
    );
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("join_workspace_by_invite_code", {
    invite_code_input: parsed.data.inviteCode.toUpperCase(),
  });

  if (error || !data?.[0]) {
    redirectWithMessage("/workspaces", "error", error?.message ?? "Could not join workspace.");
  }

  await setLastWorkspaceCookie(data[0].slug);
  redirect(`/workspaces/${data[0].slug}/contacts`);
}
