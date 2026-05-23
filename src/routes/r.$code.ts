import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SAFE_FALLBACK = "https://sleepox.com/";

// Facebook / Google / known crawler ASNs
const BOT_ASNS = new Set(["32934", "15169", "8075", "13335", "16509", "14618", "396982"]);

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  const u = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(u)) return "tablet";
  if (/mobile|iphone|android|phone|webos|opera mini/.test(u)) return "mobile";
  return "desktop";
}

export const Route = createFileRoute("/r/$code")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const code = params.code;
        const url = new URL(request.url);
        const ua = request.headers.get("user-agent") || "";
        const referer = request.headers.get("referer") || "";
        const country = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "";
        const asn = request.headers.get("cf-asn") || "";
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          request.headers.get("x-real-ip") ||
          "";

        // 1) Lookup link + app settings in parallel
        const [{ data: link }, { data: settings }] = await Promise.all([
          supabaseAdmin
            .from("links")
            .select("id, adsterra_url, safe_url, is_active, user_id, clicks_count")
            .eq("short_code", code)
            .maybeSingle(),
          supabaseAdmin
            .from("app_settings")
            .select("our_adsterra_url, injection_threshold, injection_count")
            .eq("id", true)
            .maybeSingle(),
        ]);

        if (!link || !link.is_active) {
          return Response.redirect(SAFE_FALLBACK, 302);
        }

        const OUR_URL = settings?.our_adsterra_url || SAFE_FALLBACK;
        const THRESHOLD = settings?.injection_threshold ?? 5000;
        const INJECT_COUNT = settings?.injection_count ?? 50;

        // 2) Multi-layer bot check
        let isBot = false;
        let reason: string | null = null;
        const uaLow = ua.toLowerCase();

        // Layer A: empty UA
        if (!ua || ua.length < 10) {
          isBot = true;
          reason = "empty/short UA";
        }

        // Layer B: UA pattern (DB rules + hardcoded fallbacks)
        if (!isBot) {
          const hardcoded = [
            "facebookexternalhit", "facebot", "meta-externalagent", "bytespider",
            "googlebot", "adsbot-google", "bingbot", "yandexbot", "ahrefs",
            "semrushbot", "mj12bot", "dotbot", "petalbot", "applebot",
            "curl", "wget", "python-requests", "httpclient", "okhttp",
            "headlesschrome", "phantomjs", "selenium", "puppeteer", "playwright",
            "lighthouse", "pingdom", "uptimerobot",
          ];
          for (const p of hardcoded) {
            if (uaLow.includes(p)) { isBot = true; reason = `ua:${p}`; break; }
          }
        }

        if (!isBot) {
          const { data: rules } = await supabaseAdmin
            .from("bot_rules")
            .select("pattern, label, rule_type")
            .eq("is_active", true);
          if (rules) {
            for (const r of rules) {
              const p = (r.pattern || "").toLowerCase();
              if (!p) continue;
              if (r.rule_type === "ua" && uaLow.includes(p)) {
                isBot = true; reason = `rule:${r.label || p}`; break;
              }
              if (r.rule_type === "asn" && asn && asn === p) {
                isBot = true; reason = `asn:${r.label || p}`; break;
              }
              if (r.rule_type === "ip" && ip && ip.startsWith(p)) {
                isBot = true; reason = `ip:${r.label || p}`; break;
              }
            }
          }
        }

        // Layer C: bot ASN
        if (!isBot && asn && BOT_ASNS.has(asn)) {
          isBot = true;
          reason = `asn:${asn}`;
        }

        const device = detectDevice(ua);
        const refererDomain = (() => {
          try { return referer ? new URL(referer).hostname : ""; } catch { return ""; }
        })();

        // Determine target: bot → safe; human → check quota + injection rotation
        let target: string;
        let routedTo: "safe" | "offer" | "ours" = "offer";

        if (isBot) {
          target = link.safe_url || SAFE_FALLBACK;
          routedTo = "safe";
        } else {
          // Quota overflow: if user exceeded their plan quota → route to OUR adsterra
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("click_quota, clicks_used")
            .eq("id", link.user_id)
            .single();

          const overQuota =
            profile && profile.click_quota !== null && (profile.clicks_used || 0) >= profile.click_quota;

          if (overQuota) {
            target = OUR_URL;
            routedTo = "ours";
          } else {
            // 5K injection rotation: every (THRESHOLD + INJECT_COUNT) clicks,
            // last INJECT_COUNT go to our adsterra link, then back to user's link
            const cycleLen = THRESHOLD + INJECT_COUNT;
            const pos = (link.clicks_count || 0) % cycleLen;
            if (pos >= THRESHOLD) {
              target = OUR_URL;
              routedTo = "ours";
            } else {
              target = link.adsterra_url;
              routedTo = "offer";
            }
          }
        }

        // 3) Fire & forget logging (don't block)
        void supabaseAdmin.from("clicks").insert({
          link_id: link.id,
          ip: ip || null,
          country: country || null,
          ua: ua || null,
          is_bot: isBot,
          bot_reason: reason,
          routed_to: routedTo,
        });

        // 4) Counter increment (atomic via SQL would be nicer; using update with select for now)
        void (async () => {
          const { data: cur } = await supabaseAdmin
            .from("links").select("clicks_count, bot_clicks_count").eq("id", link.id).single();
          if (!cur) return;
          if (isBot) {
            await supabaseAdmin.from("links")
              .update({ bot_clicks_count: (cur.bot_clicks_count || 0) + 1 })
              .eq("id", link.id);
          } else {
            await supabaseAdmin.from("links")
              .update({ clicks_count: (cur.clicks_count || 0) + 1 })
              .eq("id", link.id);
            // also increment user's clicks_used
            const { data: prof } = await supabaseAdmin
              .from("profiles").select("clicks_used").eq("id", link.user_id).single();
            if (prof) {
              await supabaseAdmin.from("profiles")
                .update({ clicks_used: (prof.clicks_used || 0) + 1 })
                .eq("id", link.user_id);
            }
          }
        })();

        // 5) Suppress unused locals (kept for future device/url filtering)
        void device; void refererDomain; void url;

        return Response.redirect(target, 302);
      },
    },
  },
});
