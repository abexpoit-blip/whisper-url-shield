import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

const ConfigSchema = z.object({
  ip_rate_limit_per_min: z.number().int().min(1).max(10000),
  ip_rate_limit_window_sec: z.number().int().min(5).max(3600),
  suspicious_action: z.enum(["block", "safe_page", "allow"]),
  block_threshold_score: z.number().int().min(10).max(500),
  safe_page_message: z.string().min(1).max(500),
});

export const getProtectionConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("bot_protection_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProtectionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConfigSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("bot_protection_config")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProtectionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("clicks")
      .select("is_bot,bot_reason")
      .gte("created_at", since)
      .limit(10000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const total = rows.length;
    const bots = rows.filter((r) => r.is_bot).length;
    const blocked = rows.filter((r) => r.bot_reason?.startsWith("blocked:")).length;
    const safe = rows.filter((r) => r.bot_reason?.startsWith("safe:")).length;
    const rateLimited = rows.filter((r) => r.bot_reason?.includes("rate:")).length;
    return { total, bots, blocked, safe, rateLimited };
  });
