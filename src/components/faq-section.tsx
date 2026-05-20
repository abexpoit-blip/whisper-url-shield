import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="py-5">
            <button
              className="flex w-full items-start justify-between gap-4 text-left"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="font-medium">{item.question}</span>
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${isOpen ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const HOMEPAGE_FAQ: FaqItem[] = [
  {
    question: "What makes LinkShield different from Bitly or other shorteners?",
    answer:
      "Unlike basic shorteners, LinkShield is built specifically for ad campaigns. It filters out bot and datacenter clicks in real time, geo-targets traffic, and protects your Meta ad accounts — all while giving you live click analytics.",
  },
  {
    question: "How does bot filtering work?",
    answer:
      "LinkShield detects headless browsers, datacenter IPs, VPN farms, and known click-fraud patterns. Suspicious traffic is shown a safe landing page while real users are redirected to your offer instantly.",
  },
  {
    question: "Will this help my Facebook ad account stay safe?",
    answer:
      "Yes. By removing bot clicks and click-fraud traffic from your landing page, LinkShield reduces policy violations and improves your campaign quality score — which helps keep your ad accounts in good standing.",
  },
  {
    question: "Can I use my own custom domain?",
    answer:
      "Absolutely. All Pro and Agency plans support custom domains. You can also rotate multiple domains so one flagged domain doesn't kill your entire campaign.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes — every plan includes a 14-day free trial. No credit card required to start.",
  },
  {
    question: "Which ad platforms are supported?",
    answer:
      "LinkShield works with Facebook, Instagram, TikTok, Google Ads, Snapchat, and any platform where you can use a short link.",
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    question: "Can I upgrade or downgrade at any time?",
    answer:
      "Yes. You can change your plan anytime from your account dashboard. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "We offer a 14-day free trial on every paid plan so you can test all features. After the trial, choose the plan that fits your volume.",
  },
  {
    question: "What happens if I exceed my monthly link limit?",
    answer:
      "You can still view and manage existing links, but creating new ones will pause until your next billing cycle or until you upgrade your plan.",
  },
  {
    question: "Do Agency plans include sub-accounts or white-labeling?",
    answer:
      "Agency plans include team accounts and custom domains. White-labeling is available on request for larger agencies — contact our sales team.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. Enterprise customers can also pay via wire transfer.",
  },
];

export function buildFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function FaqSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: FaqItem[];
}) {
  return (
    <section id="faq" className="border-t border-border/40 bg-card/30">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-12">
          <FaqAccordion items={items} />
        </div>
      </div>
    </section>
  );
}
