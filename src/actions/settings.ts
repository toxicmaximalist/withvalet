"use server";
import { z } from "zod";

import { getWorkspaceContext } from "@/lib/data";
import { redirectWithMessage } from "@/lib/navigation";
import {
  getErrorMessage,
  getSupabaseMigrationGuidance,
  isProfilesPolicyError,
  isWorkspaceInvitationFeatureUnavailableError,
} from "@/lib/utils";
import {
  profileSchema,
  workspaceInviteSchema,
  workspaceSchema,
} from "@/lib/validators";

const workspaceMemberActionSchema = z.object({
  targetId: z.uuid(),
});

function requireWorkspaceOwner(workspaceRole: string, workspaceSlug: string) {
  if (workspaceRole !== "owner") {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      "Only workspace owners can manage members.",
    );
  }
}

export async function updateWorkspaceSettingsAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid workspace details.",
    );
  }

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
    })
    .eq("id", workspace.id);

  if (error) {
    const message = getErrorMessage(error);

    if (isWorkspaceInvitationFeatureUnavailableError(message)) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/settings`,
        "error",
        getSupabaseMigrationGuidance(message),
      );
    }

    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      message,
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Workspace updated.",
  );
}

export async function updateProfileAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, user } = await getWorkspaceContext(workspaceSlug);

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid profile details.",
    );
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.fullName,
    },
  });

  if (authError) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      authError.message,
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      email: user.email ?? "",
      full_name: parsed.data.fullName,
      id: user.id,
    });

  if (profileError && !isProfilesPolicyError(getErrorMessage(profileError))) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(profileError),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    profileError
      ? `Profile updated in your account. ${getSupabaseMigrationGuidance(getErrorMessage(profileError))}`
      : "Profile updated.",
  );
}

export async function regenerateInviteCodeAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);

  const { error } = await supabase.rpc("regenerate_workspace_invite_code", {
    target_workspace_id: workspace.id,
  });

  if (error) {
    const message = getErrorMessage(error);

    if (isWorkspaceInvitationFeatureUnavailableError(message)) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/settings`,
        "error",
        getSupabaseMigrationGuidance(message),
      );
    }

    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      message,
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Invite code regenerated.",
  );
}

export async function inviteWorkspaceMemberAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, user, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role, workspaceSlug);

  const parsed = workspaceInviteSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      parsed.error.issues[0]?.message ?? "Invalid invite email.",
    );
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(existingProfileError),
    );
  }

  if (existingProfile?.id) {
    const { data: existingMembership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (membershipError) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/settings`,
        "error",
        getErrorMessage(membershipError),
      );
    }

    if (existingMembership) {
      redirectWithMessage(
        `/workspaces/${workspaceSlug}/settings`,
        "success",
        "That person already has workspace access.",
      );
    }
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .upsert(
      {
        email: normalizedEmail,
        invited_by: user.id,
        role: "member",
        workspace_id: workspace.id,
      },
      { onConflict: "workspace_id,email" },
    );

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Invitation saved. The invite will activate when that email signs in.",
  );
}

export async function cancelWorkspaceInvitationAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role, workspaceSlug);

  const parsed = workspaceMemberActionSchema.safeParse({
    targetId: formData.get("invitationId"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      "Invalid invitation id.",
    );
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.data.targetId);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Invitation cancelled.",
  );
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const { supabase, workspace } = await getWorkspaceContext(workspaceSlug);
  requireWorkspaceOwner(workspace.role, workspaceSlug);

  const parsed = workspaceMemberActionSchema.safeParse({
    targetId: formData.get("userId"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      "Invalid member id.",
    );
  }

  if (parsed.data.targetId === workspace.owner_id) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      "The workspace owner cannot be removed.",
    );
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("user_id", parsed.data.targetId);

  if (error) {
    redirectWithMessage(
      `/workspaces/${workspaceSlug}/settings`,
      "error",
      getErrorMessage(error),
    );
  }

  redirectWithMessage(
    `/workspaces/${workspaceSlug}/settings`,
    "success",
    "Member removed.",
  );
}
