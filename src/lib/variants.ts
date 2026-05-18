// Pre-lander variants + automatic A/B selection (epsilon-greedy bandit).
// Variant content is now stored in the `prelander_variants` DB table
// and is editable from the admin UI at /admin/variants.

export type VariantSection = { heading: string; body: string };

export type Variant = {
  id: string;          // uuid (db pk)
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: VariantSection[];
  outro: string;
};

export type VariantStat = { slug: string; total: number; humans: number };

/**
 * Epsilon-greedy bandit using REAL conversion rate as the winning metric.
 *  - cold start (any variant < 20 verify attempts): explore equally
 *  - else: 80% pick best by Laplace-smoothed conversion rate, 20% explore
 *
 * Laplace smoothing ((humans + 1) / (total + 2)) prevents a variant with
 * 1/1 (100%) from beating one with 40/50 (80%) on tiny samples.
 */
export function pickVariant(slugs: string[], stats: VariantStat[]): string {
  if (slugs.length === 0) throw new Error("No active variants");
  if (slugs.length === 1) return slugs[0];

  const statsBySlug = new Map(stats.map((s) => [s.slug, s]));
  const minSampled = slugs.reduce(
    (m, slug) => Math.min(m, statsBySlug.get(slug)?.total ?? 0),
    Infinity,
  );

  if (minSampled < 20) {
    return slugs[Math.floor(Math.random() * slugs.length)];
  }

  if (Math.random() < 0.2) {
    return slugs[Math.floor(Math.random() * slugs.length)];
  }

  let best = slugs[0];
  let bestRate = -1;
  for (const slug of slugs) {
    const s = statsBySlug.get(slug);
    const total = s?.total ?? 0;
    const humans = s?.humans ?? 0;
    const rate = (humans + 1) / (total + 2);
    if (rate > bestRate) { bestRate = rate; best = slug; }
  }
  return best;
}
