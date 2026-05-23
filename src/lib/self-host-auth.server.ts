import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function bearerFromCurrentRequest() {
  const request = getRequest();
  const authHeader = request?.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) throw new Error("Your session is loading. Please refresh once.");
  return token;
}

export async function requireSelfHostedUser() {
  const token = bearerFromCurrentRequest();
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