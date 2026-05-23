import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sleepox — Smart Cloaking for Facebook Ads to Adsterra" },
      { name: "description", content: "Edge-fast bot shield for your Facebook → Adsterra funnel. 99% ad approval, real-time analytics, $50 lifetime unlimited." },
      { property: "og:title", content: "Sleepox — Smart Cloaking for Facebook Ads" },
      { property: "og:description", content: "Send real users to Adsterra, show reviewers a safe page. 30ms edge redirect, geo & device filter, Plisio crypto payment." },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: "🛡️", title: "Smart Bot Shield", desc: "5-layer detection blocks Facebook reviewers, Google bots, and crawlers in 30ms. 99% ad-approval rate." },
  { icon: "⚡", title: "Edge-Fast Redirect", desc: "Cloudflare global network. Real users hit Adsterra in under 30ms — zero loss." },
  { icon: "🌍", title: "Geo Targeting", desc: "Pick allowed countries per link. Block low-payout traffic automatically." },
  { icon: "📱", title: "Device Filter", desc: "Mobile-only, desktop-only, or all. Match your offer to the right audience." },
  { icon: "📊", title: "Real-Time Analytics", desc: "Geo, device, bot ratio, Facebook breakdown — no charts, no lag, just numbers." },
  { icon: "🎯", title: "Ad Health Score", desc: "0-100 score per link. Know which campaign is safe before Facebook flags it." },
  { icon: "🔄", title: "Safe Prelander", desc: "3 ready-made article templates shown to bots — real content, no redirect, status 200." },
  { icon: "💳", title: "Crypto Payment", desc: "Pay with USDT, BTC, LTC via Plisio. No card, no KYC, instant upgrade." },
  { icon: "♾️", title: "Lifetime Unlimited", desc: "$50 once. Unlimited clicks, unlimited links, forever. No recurring." },
];

const PLANS = [
  { name: "Free", price: "$0", period: "forever", clicks: "10,000 clicks / month", links: "1 link", features: ["Smart bot shield", "Real-time stats", "Safe prelander"], cta: "Start free" },
  { name: "Monthly Pro", price: "$5", period: "per month", clicks: "1,000,000 clicks / month", links: "50 links", features: ["Everything in Free", "Geo + device filter", "Priority redirect", "Ad health score"], cta: "Go Pro", highlight: true },
  { name: "Lifetime Unlimited", price: "$50", period: "one-time", clicks: "Unlimited clicks", links: "Unlimited links", features: ["Everything in Pro", "Lifetime access", "No recurring fees", "Priority support"], cta: "Get lifetime" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-mesh text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-gradient-sky">Sleepox</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="hidden sm:inline hover:text-primary">Features</a>
            <a href="#pricing" className="hidden sm:inline hover:text-primary">Pricing</a>
            <Link to="/login" className="hover:text-primary">Login</Link>
            <Link to="/signup" className="rounded-lg bg-sky-gradient px-4 py-2 text-sm font-medium text-primary-foreground sky-glow hover:opacity-90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky px-4 py-1.5 text-xs">
            <span className="live-dot" /> 99% Facebook ad approval rate
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-6xl">
            Send <span className="text-gradient-sky">real users</span><br />
            to Adsterra. Show <span className="text-gradient-sky">reviewers</span> a safe page.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Edge-fast smart cloaking built for Facebook → Adsterra direct-link traffic.
            5-layer bot detection, real-time stats, $50 lifetime unlimited.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup" className="rounded-xl bg-sky-gradient px-8 py-3.5 text-base font-semibold text-primary-foreground sky-glow hover:opacity-90">
              Start free — 10K clicks
            </Link>
            <a href="#pricing" className="rounded-xl border border-sky px-8 py-3.5 text-base font-medium hover:bg-secondary">
              See pricing
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div><div className="text-3xl font-bold text-gradient-sky">30ms</div><div className="mt-1 text-xs text-muted-foreground">Edge redirect</div></div>
            <div><div className="text-3xl font-bold text-gradient-sky">5</div><div className="mt-1 text-xs text-muted-foreground">Detection layers</div></div>
            <div><div className="text-3xl font-bold text-gradient-sky">99%</div><div className="mt-1 text-xs text-muted-foreground">Approval rate</div></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Everything you need to stay on Facebook</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Built from 4 years of ad-cloaking experience. Every feature exists because a ban hurt.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 transition hover:sky-glow">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/30 bg-background/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Simple pricing. No hidden fees.</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Pay with crypto via Plisio. Upgrade or stay free forever.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-8 ${p.highlight ? "glass-panel sky-glow border border-sky" : "glass-card"}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-gradient px-3 py-1 text-xs font-bold text-primary-foreground">MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gradient-sky">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/ {p.period}</span>
                </div>
                <div className="mt-6 space-y-1 text-sm">
                  <div className="font-medium">{p.clicks}</div>
                  <div className="text-muted-foreground">{p.links}</div>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-success">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold ${p.highlight ? "bg-sky-gradient text-primary-foreground sky-glow" : "border border-sky hover:bg-secondary"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Ready to scale without bans?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join thousands of media buyers protecting their Facebook accounts.</p>
        <Link to="/signup" className="mt-8 inline-block rounded-xl bg-sky-gradient px-10 py-4 text-base font-semibold text-primary-foreground sky-glow hover:opacity-90">
          Start free now
        </Link>
      </section>

      <footer className="border-t border-border/30 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sleepox · Smart cloaking for media buyers
      </footer>
    </div>
  );
}
