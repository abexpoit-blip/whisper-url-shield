# Phase 6 — Per-link Insights + Auto-tune Weights

দুটো independent feature, একই phase-এ।

---

## Part A — Per-link User Dashboard (Bot Insights)

**লক্ষ্য:** Link owner নিজের link-এ কতজন human/bot এসেছে, কোথা থেকে এসেছে, কোন UA সবচেয়ে বেশি block হচ্ছে — সেটা দেখবে। Admin না, owner-এর জন্য।

বর্তমানে `analytics.$linkId.tsx` শুধু aggregate stats দেখায়। নতুন সেকশন যোগ হবে সেখানেই — আলাদা route লাগবে না।

### নতুন সার্ভার ফাংশন
`src/lib/link-insights.functions.ts`:
- `getLinkBotInsights({ linkId, sinceHours })` — owner-scoped (RLS via `requireSupabaseAuth`)
- Returns:
  - Source breakdown (direct / silent / blocked / verify-silent) — count + pass%
  - Top 10 blocked UAs (substring + count)
  - Top reasons (flatten signals.reasons array, count)
  - Hourly timeline (last 24h): human vs bot per hour
  - Country breakdown: top 10 country with bot% 

### UI Changes
`src/routes/analytics.$linkId.tsx`:
- নতুন "Bot Insights" tab/section যোগ
- 4টা card: source pie/bars, hourly timeline (simple bars), top blocked UAs, top reasons
- "Last 24h / 7d / 30d" toggle

---

## Part B — Auto-tune Signal Weights (Admin)

**লক্ষ্য:** Manually weight tune করার বদলে, last 7-day data থেকে কোন সিগন্যাল আসলে bot ধরে আর কোনটা false-positive — সেটা analyze করে weight suggest/apply করবে।

### Algorithm (simple, explainable)
প্রতিটা সিগন্যাল reason-এর জন্য:
- `appears_in_blocked` = কতবার এই reason blocked clicks-এ এসেছে
- `appears_in_passed` = কতবার পাশ-হওয়া clicks-এ এসেছে
- `precision` = appears_in_blocked / (appears_in_blocked + appears_in_passed)
- New weight suggestion:
  - precision > 0.9 → high weight (e.g. 30)
  - precision 0.7–0.9 → medium (15)
  - precision 0.5–0.7 → low (5)
  - precision < 0.5 → 0 (move to soft_reasons)

### নতুন সার্ভার ফাংশন
`src/lib/admin-tune.functions.ts`:
- `analyzeSignalWeights({ sinceDays })` — admin-only, computes precision per signal
- `applyTunedWeights({ weights, softReasons })` — writes to `bot_protection_config`

### UI
`src/routes/admin.protection.tsx` (existing) — নতুন "Auto-tune" section:
- "Analyze last 7 days" button → table দেখাবে: signal, blocked_n, passed_n, precision, current_weight, suggested_weight
- "Apply suggested weights" button → confirm modal → updates config

---

## Files to Create/Modify

**Create:**
- `src/lib/link-insights.functions.ts` (new)
- `src/lib/admin-tune.functions.ts` (new)

**Modify:**
- `src/routes/analytics.$linkId.tsx` — add Bot Insights section
- `src/routes/admin.protection.tsx` — add Auto-tune section

**No DB migration needed** — সব existing tables থেকে compute হবে।

---

## Deploy (after build)

```bash
cd /opt/sleepox-app-new && \
  git checkout -- src/routeTree.gen.ts 2>/dev/null; \
  git pull && npm run build 2>&1 | tail -5 && \
  pm2 restart sleepox --update-env && sleep 3 && \
  curl -sI http://localhost:3000/admin/protection | head -2
```

Log check:
```bash
pm2 logs sleepox --lines 30 --nostream | grep -iE "insights|tune|error"
```

---

**Approve করলে build শুরু করব।** কোনো change চাইলে বলুন (e.g. precision thresholds অন্যরকম, অন্য কোথাও UI বসাতে চান)।
