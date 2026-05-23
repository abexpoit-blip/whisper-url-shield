import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

async function bearerFromCurrentRequest() {
  // Dynamic import keeps `@tanstack/react-start/server` out of the static
  // client-bundle graph (import-protection blocks that specifier).
  const mod = await import("@tanstack/react-start/server");
  const request = mod.getRequest();
  const authHeader = request?.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) throw new Error("Your session is loading. Please refresh once.");
  return token;
}

function createUserScopedClient(token: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Backend auth environment is missing on the VPS.");

  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const requireSelfHostedAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = await bearerFromCurrentRequest();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.id) {
      throw new Error(`Your session expired. Please sign in again. (${error?.message ?? "invalid token"})`);
    }

    return next({
      context: {
        supabase: createUserScopedClient(token),
        userId: data.user.id,
        user: data.user,
        claims: { sub: data.user.id, email: data.user.email ?? null },
      },
    });
  },
);

export async function requireSelfHostedUser() {
  const token = await bearerFromCurrentRequest();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new Error(`Your session expired. Please sign in again. (${error?.message ?? "invalid token"})`);
  }
  return { userId: data.user.id, user: data.user, supabase: supabaseAdmin };
}

export async function requireSelfHostedAdmin() {
  const auth = await requireSelfHostedUser();
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: auth.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
  return auth;
}