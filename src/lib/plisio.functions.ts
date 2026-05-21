import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SlugRe = /^[a-z0-9_-]{2,40}$/;

const CreateInvoiceSchema = z.object({
  package_slug: z.string().trim().regex(SlugRe),
});

// Create a Plisio invoice for the chosen package, persist an upgrade_request,
// and return the hosted checkout URL.
export const createPlisioInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateInvoiceSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const apiKey = process.env.PLISIO_API_KEY;
    if (!apiKey) throw new Error("Plisio is not configured. Admin must add PLISIO_API_KEY.");

    // 1) Load the package
    const { data: pkg, error: pkgErr } = await (supabase as any)
      .from("packages")
      .select("slug,name,price_monthly,price_onetime,billing_period,is_active")
      .eq("slug", data.package_slug)
      .single();
    if (pkgErr || !pkg || !pkg.is_active) throw new Error("Package not available");

    const isLifetime = pkg.billing_period === "lifetime" || Number(pkg.price_onetime) > 0;
    const amount = Number(isLifetime ? pkg.price_onetime : pkg.price_monthly);
    if (!amount || amount <= 0) throw new Error("This plan is free — no payment required.");

    // 2) Load buyer email
    const { data: profile } = await (supabase as any)
      .from("profiles").select("email").eq("id", userId).single();

    // 3) Insert pending upgrade_request first (so webhook can find it)
    const orderNumber = `up_${userId.slice(0, 8)}_${Date.now()}`;
    const { data: reqRow, error: insErr } = await (supabase as any)
      .from("upgrade_requests")
      .insert({
        user_id: userId,
        package_slug: data.package_slug,
        payment_method: "plisio",
        amount,
        transaction_ref: orderNumber,
        plisio_status: "pending",
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    // 4) Build callback URLs (production stable host)
    const origin = process.env.PUBLIC_SITE_URL || "https://sleepox.com";
    const callbackUrl = `${origin}/api/public/plisio-webhook?json=true`;
    const successUrl = `${origin}/upgrade?payment=success`;
    const failUrl = `${origin}/upgrade?payment=failed`;

    // 5) Create Plisio invoice
    const params = new URLSearchParams({
      api_key: apiKey,
      source_amount: amount.toFixed(2),
      source_currency: "USD",
      order_name: `${pkg.name} — ${data.package_slug}`,
      order_number: orderNumber,
      callback_url: callbackUrl,
      success_url: successUrl,
      fail_url: failUrl,
      email: profile?.email ?? "",
    });

    const res = await fetch(`https://api.plisio.net/api/v1/invoices/new?${params.toString()}`);
    const payload: any = await res.json().catch(() => ({}));

    if (!res.ok || payload?.status !== "success" || !payload?.data?.invoice_url) {
      const msg = payload?.data?.message || payload?.message || `Plisio error (${res.status})`;
      // Mark the request failed so admin can see it
      await (supabase as any).from("upgrade_requests")
        .update({ plisio_status: "error", note: msg }).eq("id", reqRow.id);
      throw new Error(msg);
    }

    const invoiceUrl = String(payload.data.invoice_url);
    const txnId = String(payload.data.txn_id ?? "");

    await (supabase as any).from("upgrade_requests")
      .update({ plisio_invoice_id: txnId, plisio_invoice_url: invoiceUrl })
      .eq("id", reqRow.id);

    return { invoice_url: invoiceUrl, txn_id: txnId, request_id: reqRow.id };
  });
