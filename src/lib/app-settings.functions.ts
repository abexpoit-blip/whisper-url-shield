import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("app_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      fallback_url: z.string().url(),
      our_adsterra_url: z.string().url(),
      injection_threshold: z.number().int().min(100).max(1_000_000),
      injection_count: z.number().int().min(1).max(10_000),
      daily_redirect_enabled: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // RLS restricts to admin role; double check anyway
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Admin only");

    const { error } = await context.supabase
      .from("app_settings")
      .update(data)
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Daily auto-redirect: returns the fallback URL the FIRST time the user
 * hits the dashboard each calendar day (UTC). Subsequent calls same day → null.
 */
export const consumeDailyRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: settings } = await context.supabase
      .from("app_settings")
      .select("fallback_url, daily_redirect_enabled")
      .eq("id", true)
      .maybeSingle();

    if (!settings || !settings.daily_redirect_enabled) return { url: null as string | null };

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("last_daily_redirect_at")
      .eq("id", context.userId)
      .single();

    const last = profile?.last_daily_redirect_at ? new Date(profile.last_daily_redirect_at) : null;
    const now = new Date();
    const sameUTCDay =
      !!last &&
      last.getUTCFullYear() === now.getUTCFullYear() &&
      last.getUTCMonth() === now.getUTCMonth() &&
      last.getUTCDate() === now.getUTCDate();

    if (sameUTCDay) return { url: null as string | null };

    await context.supabase
      .from("profiles")
      .update({ last_daily_redirect_at: now.toISOString() })
      .eq("id", context.userId);

    return { url: settings.fallback_url as string };
  });
