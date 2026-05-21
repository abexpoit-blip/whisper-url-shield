import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireClientUser(locationHref: string) {
  if (typeof window === "undefined") return;

  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return;

  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error || !refreshed.data.session?.access_token) {
    await supabase.auth.signOut();
    throw redirect({ to: "/login", search: { redirect: locationHref } });
  }
}

export async function requireClientAdmin() {
  if (typeof window === "undefined") return;

  let { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session?.access_token) {
      ({ data, error } = await supabase.auth.getUser());
    }
  }

  if (error || !data.user) {
    await supabase.auth.signOut();
    throw redirect({ to: "/control-panel" });
  }

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) throw redirect({ to: "/dashboard" });
}