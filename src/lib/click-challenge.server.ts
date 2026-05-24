// Server-only HMAC challenge token helpers.
// Stateless — no DB row per click — safe for 5-10M clicks/day.

const TOKEN_TTL_SECONDS = 300; // 5 minutes

function getSecret(): string {
  const s =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SESSION_SECRET ||
    "";
  if (!s) throw new Error("challenge secret unavailable");
  return s;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type ChallengePayload = {
  linkId: string;
  target: string; // final offer URL chosen at issue time
  routedTo: "safe" | "offer" | "ours";
  issuedAt: number;
};

export async function issueChallengeToken(p: ChallengePayload): Promise<string> {
  // target stored server-side via signing; client never sees it until verified.
  const body = JSON.stringify(p);
  const bodyB64 = b64urlEncode(new TextEncoder().encode(body));
  const sig = await hmac(bodyB64);
  return `${bodyB64}.${sig}`;
}

export async function verifyChallengeToken(token: string): Promise<ChallengePayload | null> {
  try {
    const [bodyB64, sig] = token.split(".");
    if (!bodyB64 || !sig) return null;
    const expected = await hmac(bodyB64);
    if (!timingSafeEqual(sig, expected)) return null;
    const json = new TextDecoder().decode(b64urlDecode(bodyB64));
    const p = JSON.parse(json) as ChallengePayload;
    if (!p.linkId || !p.target || !p.issuedAt) return null;
    const ageSec = (Date.now() - p.issuedAt) / 1000;
    if (ageSec < 0 || ageSec > TOKEN_TTL_SECONDS) return null;
    return p;
  } catch {
    return null;
  }
}
