import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value?: string | null,
  fallback = "Not set",
  dateFormat = "MMM d, yyyy",
) {
  if (!value) {
    return fallback;
  }

  return format(new Date(value), dateFormat);
}

export function sortByNewestDate<T extends { activity_date: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.activity_date).getTime() - new Date(left.activity_date).getTime(),
  );
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "string"
  ) {
    return error.error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const details =
      "details" in error && typeof error.details === "string" ? error.details : "";
    const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";

    return [error.message, details, hint].filter(Boolean).join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function isSupabaseSchemaError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("workspace_members") ||
    normalized.includes("relation") ||
    normalized.includes("column")
  );
}

export function isMissingSupabaseFunctionError(message: string, functionName: string) {
  const normalized = message.toLowerCase();
  const normalizedFunctionName = functionName.toLowerCase();

  return (
    normalized.includes(normalizedFunctionName) &&
    (normalized.includes("schema cache") || normalized.includes("function"))
  );
}

export function isMissingSupabaseTableError(message: string, tableName: string) {
  const normalized = message.toLowerCase();
  const normalizedTableName = tableName.toLowerCase();

  return (
    normalized.includes(normalizedTableName) &&
    (normalized.includes("schema cache") ||
      normalized.includes("relation") ||
      normalized.includes("table"))
  );
}

export function isMissingSupabaseColumnError(
  message: string,
  tableName: string,
  columnName: string,
) {
  const normalized = message.toLowerCase();
  const normalizedTableName = tableName.toLowerCase();
  const normalizedColumnName = columnName.toLowerCase();

  return (
    normalized.includes(normalizedTableName) &&
    normalized.includes(normalizedColumnName) &&
    (normalized.includes("schema cache") || normalized.includes("column"))
  );
}

export function isWorkspaceInvitationFeatureUnavailableError(message: string) {
  const normalized = message.toLowerCase();

  return (
    isMissingSupabaseFunctionError(
      message,
      "accept_workspace_invitations_for_current_user",
    ) ||
    isMissingSupabaseTableError(message, "workspace_invitations") ||
    (normalized.includes("workspace_id") && normalized.includes("ambiguous"))
  );
}

export function isContactOwnerFeatureUnavailableError(message: string) {
  return isMissingSupabaseColumnError(
    message,
    "contacts",
    "responsible_user_id",
  );
}

export function isProfilesPolicyError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("profiles") &&
    normalized.includes("row-level security policy")
  );
}

export function getSupabaseMigrationGuidance(message: string) {
  if (isWorkspaceInvitationFeatureUnavailableError(message)) {
    return "Apply `supabase/migrations/0002_workspace_email_invites_and_contact_owners.sql`, or run `pnpm db:push` to enable email invitations and automatic invite acceptance.";
  }

  if (isContactOwnerFeatureUnavailableError(message)) {
    return "Apply `supabase/migrations/0002_workspace_email_invites_and_contact_owners.sql`, or run `pnpm db:push` to apply every checked-in migration.";
  }

  if (isProfilesPolicyError(message)) {
    return "Apply `supabase/migrations/0003_profiles_member_visibility.sql`, or run `pnpm db:push` to allow self-managed profiles and workspace member name visibility.";
  }

  return "Apply the SQL files in `supabase/migrations` to your Supabase project in order, or run `pnpm db:push`, then refresh this page.";
}
