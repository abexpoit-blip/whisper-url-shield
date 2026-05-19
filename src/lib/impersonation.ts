// Admin impersonation helpers — stash the admin session, swap in the target
// user's session via a magic-link token, then restore the admin session on exit.
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "lovable.impersonation.adminSession.v1";

export interface StoredAdminSession {
  access_token: string;
  refresh_token: string;
  adminEmail: string | null;
  targetEmail: string;
  startedAt: number;
}

export function isImpersonating(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.sessionStorage.getItem(STORAGE_KEY);
}

export function readImpersonation(): StoredAdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredAdminSession; } catch { return null; }
}

export async function beginImpersonation(opts: {
  hashedToken: string;
  targetEmail: string;
}): Promise<void> {
  const { data: cur } = await supabase.auth.getSession();
  const session = cur.session;
  if (!session) throw new Error("No active admin session.");

  const me = await supabase.auth.getUser();
  const stash: StoredAdminSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    adminEmail: me.data.user?.email ?? null,
    targetEmail: opts.targetEmail,
    startedAt: Date.now(),
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stash));

  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: opts.hashedToken,
  });
  if (error) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    throw new Error(error.message);
  }
}

export async function exitImpersonation(): Promise<void> {
  const stash = readImpersonation();
  if (!stash) return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  const { error } = await supabase.auth.setSession({
    access_token: stash.access_token,
    refresh_token: stash.refresh_token,
  });
  if (error) throw new Error(error.message);
}
