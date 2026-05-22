import { supabase } from "@/integrations/supabase/client";

const SUPPORTED_TOKEN_ALGORITHMS = new Set(["HS256", "ES256", "RS256"]);

let refreshPromise: Promise<string | null> | null = null;

function decodeJwtPart(part: string) {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(padded)) as Record<string, unknown>;
}

export function tokenLooksUsable(token: string) {
  try {
    const [headerPart, payloadPart] = token.split(".");
    if (!headerPart || !payloadPart) return false;
    const header = decodeJwtPart(headerPart);
    return typeof header.alg === "string" && SUPPORTED_TOKEN_ALGORITHMS.has(header.alg);
  } catch {
    return false;
  }
}

export function safeRedirectPath(locationHref?: string | null) {
  if (typeof window === "undefined") return "/dashboard";
  if (!locationHref) return "/dashboard";

  try {
    const url = new URL(locationHref, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return locationHref.startsWith("/") && !locationHref.startsWith("//")
      ? locationHref
      : "/dashboard";
  }
}

export async function refreshSupabaseSessionOnce() {
  if (!refreshPromise) {
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => {
        if (!error && data.session?.access_token) return data.session.access_token;
        return supabase.auth.getSession().then(({ data: current }) => current.session?.access_token ?? null);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function redirectToLoginPreservingPath() {
  if (typeof window === "undefined") return;
  const redirect = encodeURIComponent(safeRedirectPath(window.location.href));
  window.location.replace(`/login?redirect=${redirect}`);
}