"use server";

import { redirect } from "next/navigation";

import { buildPathWithMessage } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validators";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(buildPathWithMessage("/login", "error", parsed.error.issues[0]?.message ?? "Invalid credentials."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(buildPathWithMessage("/login", "error", error.message));
  }

  redirect("/workspaces");
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirect(buildPathWithMessage("/signup", "error", parsed.error.issues[0]?.message ?? "Invalid signup details."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    redirect(buildPathWithMessage("/signup", "error", error.message));
  }

  redirect("/workspaces");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
