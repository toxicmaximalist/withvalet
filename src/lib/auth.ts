import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getErrorMessage,
  getSupabaseMigrationGuidance,
  isWorkspaceInvitationFeatureUnavailableError,
} from "@/lib/utils";

export const LAST_WORKSPACE_COOKIE = "withvalet:last-workspace";

export const getSessionContext = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});

export async function acceptPendingWorkspaceInvitations(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { error } = await supabase.rpc("accept_workspace_invitations_for_current_user");

  if (!error) {
    return;
  }

  const message = getErrorMessage(error);

  if (isWorkspaceInvitationFeatureUnavailableError(message)) {
    console.warn(getSupabaseMigrationGuidance(message));
    return;
  }

  throw new Error(message);
}

export const requireUser = cache(async () => {
  const { supabase, user } = await getSessionContext();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
});

export async function redirectIfAuthenticated() {
  const { user } = await getSessionContext();

  if (user) {
    redirect("/workspaces");
  }
}

export async function getLastWorkspaceCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_WORKSPACE_COOKIE)?.value ?? null;
}

export async function setLastWorkspaceCookie(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(LAST_WORKSPACE_COOKIE, slug, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
