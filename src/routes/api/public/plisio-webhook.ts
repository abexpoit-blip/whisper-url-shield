import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Plisio webhook verification:
 *   - sort callback fields, append API_KEY, md5 → must equal `verify_hash`
 *   docs: https://plisio.net/documentation/appendices/script-of-checking-data-from-callback
 */
function verifyPlisio(body: Record<string, string>, apiKey: string): boolean {
  const verifyHash = body.verify_hash;
  if (!verifyHash) return false;
  const clone = { ...body };
  delete clone.verify_hash;
  const ordered = Object.keys(clone).sort().map((k) => clone[k]).join(":");
  const expected = createHash("md5").update(`${ordered}:${apiKey}`).digest("hex");
  return expected === verifyHash;
}

export const Route = createFileRoute("/api/public/plisio-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PLISIO_API_KEY;
        if (!apiKey) return new Response("not configured", { status: 500 });

        const formText = await request.text();
        const params = new URLSearchParams(formText);
        const body: Record<string, string> = {};
        params.forEach((v, k) => { body[k] = v; });

        // Allow JSON callback too (?json=true)
        if (!body.verify_hash && formText.trim().startsWith("{")) {
          try {
            const j = JSON.parse(formText);
            for (const k of Object.keys(j)) body[k] = String(j[k]);
          } catch { /* ignore */ }
        }

        if (!verifyPlisio(body, apiKey)) {
          return new Response("invalid signature", { status: 401 });
        }

        const orderNumber = body.order_number; // our upgrade_requests.id
        const status = body.status; // pending|completed|cancelled|error|expired|mismatch
        if (!orderNumber) return new Response("no order", { status: 400 });

        const { data: req } = await supabaseAdmin
          .from("upgrade_requests")
          .select("id, user_id, package_slug, status")
          .eq("id", orderNumber)
          .maybeSingle();
        if (!req) return new Response("not found", { status: 404 });

        await supabaseAdmin
          .from("upgrade_requests")
          .update({ status })
          .eq("id", req.id);

        if (status === "completed" && req.status !== "completed") {
          // Apply package to user
          const { data: pkg } = await supabaseAdmin
            .from("packages").select("slug, click_quota, link_limit")
            .eq("slug", req.package_slug).single();
          if (pkg) {
            await supabaseAdmin
              .from("profiles")
              .update({
                plan_slug: pkg.slug,
                click_quota: pkg.click_quota,
                link_limit: pkg.link_limit,
                clicks_used: 0,
                clicks_period_start: new Date().toISOString(),
              })
              .eq("id", req.user_id);
          }
        }

        return new Response("ok");
      },
      GET: async () => new Response("ok"),
    },
  },
});
