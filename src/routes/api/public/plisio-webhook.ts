import { createFileRoute } from "@tanstack/react-router";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Plisio sends POST callback with JSON body (when ?json=true is on callback_url).
// Verification: HMAC-SHA1(sorted_post_minus_verify_hash, api_secret).
// Reference: https://plisio.net/documentation/endpoints/callback
export const Route = createFileRoute("/api/public/plisio-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PLISIO_API_KEY;
        if (!apiKey) return new Response("not configured", { status: 500 });

        let payload: Record<string, any>;
        try {
          payload = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const verifyHash = String(payload.verify_hash ?? "");
        if (!verifyHash) return new Response("missing hash", { status: 401 });

        // Build HMAC over post body minus verify_hash, keys sorted ascending.
        const clone: Record<string, any> = { ...payload };
        delete clone.verify_hash;
        const sorted = Object.keys(clone).sort().reduce<Record<string, any>>((acc, k) => {
          acc[k] = clone[k];
          return acc;
        }, {});
        // Plisio serializes via PHP http_build_query equivalent; their docs accept
        // JSON of sorted object as well. Try both formats and accept either match.
        const jsonBody = JSON.stringify(sorted);
        const expectedJson = createHmac("sha1", apiKey).update(jsonBody).digest("hex");

        const formBody = Object.entries(sorted)
          .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
          .join("&");
        const expectedForm = createHmac("sha1", apiKey).update(formBody).digest("hex");

        const provided = Buffer.from(verifyHash);
        const okJson = provided.length === expectedJson.length &&
          timingSafeEqual(provided, Buffer.from(expectedJson));
        const okForm = provided.length === expectedForm.length &&
          timingSafeEqual(provided, Buffer.from(expectedForm));

        if (!okJson && !okForm) {
          console.warn("Plisio webhook hash mismatch", {
            txn: payload.txn_id, expectedJson, expectedForm, got: verifyHash,
          });
          return new Response("invalid signature", { status: 401 });
        }

        const txnId = String(payload.txn_id ?? "");
        const orderNumber = String(payload.order_number ?? "");
        const status = String(payload.status ?? "");

        // Find the matching upgrade_request
        const { data: req, error: reqErr } = await (supabaseAdmin as any)
          .from("upgrade_requests")
          .select("id,user_id,package_slug,status")
          .or(`plisio_invoice_id.eq.${txnId},transaction_ref.eq.${orderNumber}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reqErr || !req) {
          console.warn("Plisio webhook: request not found", { txnId, orderNumber });
          return new Response("ok", { status: 200 }); // Don't retry forever
        }

        // Persist latest plisio status for admin visibility
        await (supabaseAdmin as any).from("upgrade_requests")
          .update({ plisio_status: status, plisio_invoice_id: txnId })
          .eq("id", req.id);

        // Auto-approve on completion (covers both completed & mismatched-overpay)
        const success = status === "completed" || status === "mismatch";
        if (success && req.status !== "approved") {
          await (supabaseAdmin as any).from("upgrade_requests")
            .update({
              status: "approved",
              reviewed_at: new Date().toISOString(),
              note: `Auto-approved by Plisio (${status})`,
            })
            .eq("id", req.id);
          await (supabaseAdmin as any).from("profiles")
            .update({ plan_slug: req.package_slug })
            .eq("id", req.user_id);
        } else if ((status === "cancelled" || status === "error" || status === "expired") &&
                   req.status === "pending") {
          await (supabaseAdmin as any).from("upgrade_requests")
            .update({ status: "rejected", note: `Plisio: ${status}` })
            .eq("id", req.id);
        }

        // Quiet hash sanity log for ops (helps confirm format on first real callback)
        const sanity = createHash("sha1").update(txnId).digest("hex").slice(0, 8);
        console.log(`Plisio webhook handled txn=${txnId} status=${status} sig=${sanity}`);

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("plisio webhook alive", { status: 200 }),
    },
  },
});
