import { redirect } from "next/navigation";

import { getLastWorkspaceCookie } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const lastWorkspaceSlug = await getLastWorkspaceCookie();

  if (lastWorkspaceSlug) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("slug", lastWorkspaceSlug)
      .maybeSingle();

    if (workspace) {
      redirect(`/workspaces/${workspace.slug}/contacts`);
    }
  }

  redirect("/workspaces");
}
