import { z } from "zod";

import {
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
} from "@/lib/constants";

const trimmedString = z.string().trim();

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = loginSchema.extend({
  fullName: trimmedString.min(2, "Name must be at least 2 characters."),
});

export const workspaceSchema = z.object({
  name: trimmedString.min(2, "Workspace name must be at least 2 characters."),
});

export const profileSchema = z.object({
  fullName: trimmedString.min(2, "Name must be at least 2 characters."),
});

export const workspaceInviteSchema = z.object({
  email: z.email(),
});

export const joinWorkspaceSchema = z.object({
  inviteCode: trimmedString
    .min(6, "Invite code is required.")
    .max(20, "Invite code is too long."),
});

export const contactSchema = z.object({
  name: trimmedString.min(2, "Name must be at least 2 characters."),
  role: trimmedString.optional().or(z.literal("")),
  organizationName: trimmedString.optional().or(z.literal("")),
  responsibleUserId: z.union([z.uuid(), z.literal(""), z.null()]).optional(),
  telegram: trimmedString.optional().or(z.literal("")),
  linkedin: trimmedString.optional().or(z.literal("")),
  whatsapp: trimmedString.optional().or(z.literal("")),
  gmail: z.email().optional().or(z.literal("")),
  status: z.enum(CONTACT_STATUSES),
  note: trimmedString.optional().or(z.literal("")),
});

export const folderSchema = z.object({
  name: trimmedString.min(2, "Folder name must be at least 2 characters."),
});

export const activitySchema = z.object({
  contactId: z.uuid(),
  organizationId: z.union([z.uuid(), z.literal(""), z.null()]).optional(),
  type: z.enum(ACTIVITY_TYPES),
  status: z.enum(ACTIVITY_STATUSES),
  content: trimmedString.min(1, "Activity content is required."),
  activityDate: trimmedString.min(1, "Activity date is required."),
});

export const activityUpdateSchema = activitySchema.omit({
  contactId: true,
  organizationId: true,
});

export const organizationSchema = z.object({
  name: trimmedString.min(2, "Organization name must be at least 2 characters."),
  website: z.url().optional().or(z.literal("")),
  note: trimmedString.optional().or(z.literal("")),
});
