import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const resolveLink = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(1).max(32) }).parse(input),
  )
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") || "";
    const referer = getRequestHeader("referer") || "";
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for") ||
      "";
    const country = getRequestHeader("cf-ipcountry") || null;

    const { data: link } = await supabaseAdmin
      .from("links")
      .select("id, destination_url, status, title")
      .eq("short_code", data.code)
      .maybeSingle();

    if (!link || link.status !== "active") return { found: false as const };

    const lowerUa = ua.toLowerCase();
    const botPatterns = [
      "bot",
      "crawler",
      "spider",
      "facebookexternalhit",
      "facebookcatalog",
      "meta-externalagent",
      "headless",
      "curl",
      "wget",
      "python",
      "scrapy",
      "preview",
      "slurp",
      "lighthouse",
    ];
    const isBot = botPatterns.some((p) => lowerUa.includes(p)) || !ua;
    const botReason = isBot
      ? botPatterns.find((p) => lowerUa.includes(p)) || "missing-ua"
      : null;

    await supabaseAdmin.from("clicks").insert({
      link_id: link.id,
      ip_address: ip || null,
      country,
      user_agent: ua || null,
      referer: referer || null,
      is_bot: isBot,
      bot_reason: botReason,
    });

    if (isBot) {
      const { data: current } = await supabaseAdmin
        .from("links")
        .select("bot_clicks_count")
        .eq("id", link.id)
        .single();
      if (current) {
        await supabaseAdmin
          .from("links")
          .update({ bot_clicks_count: current.bot_clicks_count + 1 })
          .eq("id", link.id);
      }
    } else {
      const { data: current } = await supabaseAdmin
        .from("links")
        .select("clicks_count")
        .eq("id", link.id)
        .single();
      if (current) {
        await supabaseAdmin
          .from("links")
          .update({ clicks_count: current.clicks_count + 1 })
          .eq("id", link.id);
      }
    }

    return {
      found: true as const,
      // Only send destination to non-bots — bots never see the real URL
      destination: isBot ? null : link.destination_url,
      title: link.title || "Article",
      isBot,
    };
  });

export const Route = createFileRoute("/r/$code")({
  loader: async ({ params }) => {
    const result = await resolveLink({ data: { code: params.code } });
    if (!result.found) throw notFound();
    return result;
  },
  component: PreLanderPage,
  head: () => ({
    meta: [
      { title: "Health & Wellness Tips — Daily Reads" },
      {
        name: "description",
        content:
          "Practical lifestyle, wellness and productivity tips for everyday readers.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This article doesn't exist or has been removed.
        </p>
      </div>
    </div>
  ),
});

function PreLanderPage() {
  const data = Route.useLoaderData();
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Real-user verification: requires JS, mouse/touch capability, and a short delay.
  // Bots without JS just see the safe article content below.
  useEffect(() => {
    if (data.isBot || !data.destination) return;

    let humanSignals = 0;
    const bump = () => {
      humanSignals += 1;
      if (humanSignals >= 1) setReady(true);
    };

    window.addEventListener("mousemove", bump, { once: true });
    window.addEventListener("touchstart", bump, { once: true });
    window.addEventListener("scroll", bump, { once: true });
    window.addEventListener("keydown", bump, { once: true });

    // Fallback: mark ready after 1.5s even without interaction (still requires JS = no crawler)
    const fallback = window.setTimeout(() => setReady(true), 1500);

    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("touchstart", bump);
      window.removeEventListener("scroll", bump);
      window.removeEventListener("keydown", bump);
      window.clearTimeout(fallback);
    };
  }, [data]);

  useEffect(() => {
    if (!ready || !data.destination) return;
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer);
          window.location.replace(data.destination!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ready, data.destination]);

  const goNow = () => {
    if (data.destination) window.location.replace(data.destination);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
          <span className="font-bold tracking-tight text-lg">Daily Reads</span>
          <nav className="text-sm text-muted-foreground space-x-4 hidden sm:block">
            <span>Wellness</span>
            <span>Lifestyle</span>
            <span>Productivity</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="prose prose-invert max-w-none">
          <p className="text-sm uppercase tracking-wider text-primary mb-3">
            Featured Article
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            5 Simple Habits That Can Transform Your Daily Routine
          </h1>
          <p className="text-muted-foreground mb-8">
            Published today · 4 min read
          </p>

          <p className="mb-4 leading-relaxed">
            Building a healthier, more productive routine doesn't require a
            complete life overhaul. Small, consistent habits — practiced daily —
            create the biggest long-term changes. Here are five evidence-backed
            habits anyone can start this week.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            1. Start your morning with water
          </h2>
          <p className="mb-4 leading-relaxed">
            After 7-8 hours of sleep your body is mildly dehydrated. A glass of
            water before coffee helps kickstart your metabolism and improves
            focus throughout the morning.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Move for 10 minutes
          </h2>
          <p className="mb-4 leading-relaxed">
            You don't need a gym. A brisk 10-minute walk, light stretching, or a
            short bodyweight session is enough to boost circulation and mood.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            3. Plan three priorities
          </h2>
          <p className="mb-4 leading-relaxed">
            Instead of a long to-do list, pick the three most important tasks
            for the day. This reduces decision fatigue and helps you finish what
            actually matters.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            4. Take screen-free breaks
          </h2>
          <p className="mb-4 leading-relaxed">
            Every 60-90 minutes, step away from screens for a few minutes. Your
            eyes, posture, and concentration will all benefit.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            5. Wind down with a routine
          </h2>
          <p className="mb-6 leading-relaxed">
            A consistent evening routine signals your body it's time to rest.
            Dim the lights, avoid heavy meals, and try reading instead of
            scrolling.
          </p>

          <p className="leading-relaxed">
            Try one habit this week. Once it sticks, add the next. Small steps
            compound into big results.
          </p>
        </article>

        {/* Continue card — only shown / activated for real users with JS */}
        {!data.isBot && data.destination && (
          <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
            {!ready ? (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Loading next article...
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please wait a moment while we prepare your content.
                </p>
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Continuing in {countdown}...
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You're being taken to the next page.
                </p>
                <button
                  onClick={goNow}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  Continue now
                </button>
              </>
            )}
          </div>
        )}

        {data.isBot && (
          <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Thanks for reading. Browse more articles on our homepage.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-10">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground text-center">
          © Daily Reads · Wellness & lifestyle articles for everyday readers.
        </div>
      </footer>
    </div>
  );
}
