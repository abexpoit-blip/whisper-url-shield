import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function safeRedirectPath(locationHref: string) {
  try {
    const url = new URL(locationHref, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return locationHref.startsWith("/") && !locationHref.startsWith("//")
      ? locationHref
      : "/dashboard";
  }
}

export async function getVerifiedClientSession() {
  if (typeof window === "undefined") return null;

  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) return null;

  let { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return { session: sessionData.session, user: data.user };

  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error || !refreshed.data.session?.access_token) return null;

  sessionData = refreshed.data;
  ({ data, error } = await supabase.auth.getUser());
  if (error || !data.user) return null;

  return { session: sessionData.session, user: data.user };
}

export async function requireClientUser(locationHref: string) {
  if (typeof window === "undefined") return;

  const verified = await getVerifiedClientSession();
  if (verified) return;

  await supabase.auth.signOut();
  throw redirect({ to: "/login", search: { redirect: safeRedirectPath(locationHref) } });
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