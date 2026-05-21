import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listRecentClicks } from "@/lib/admin-clicks.functions";

export const Route = createFileRoute("/admin/clicks")({
  head: () => ({ meta: [{ title: "Recent Clicks — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminClicksPage,
});

type Row = {
  id: string;
  created_at: string;
  link_id: string;
  bot_score: number | null;
  challenge_passed: boolean;
  fingerprint_hash: string | null;
  signals: Record<string, unknown> | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referer_host: string | null;
};

type Summary = {
  windowHours: number;
  totalInWindow: number;
  avgScore: number | null;
  bySource: Record<string, { total: number; passed: number; blocked: number; avgScore: number }>;
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-emerald-500/15 text-emerald-600",
  silent: "bg-amber-500/15 text-amber-700",
  blocked: "bg-red-500/15 text-red-600",
  "verify-silent": "bg-blue-500/15 text-blue-700",
  backfill: "bg-purple-500/15 text-purple-700",
  unknown: "bg-muted text-muted-foreground",
};

function scoreClass(s: number | null) {
  if (s === null) return "bg-muted text-muted-foreground";
  if (s >= 60) return "bg-red-500/15 text-red-600";
  if (s >= 30) return "bg-amber-500/15 text-amber-700";
  return "bg-emerald-500/15 text-emerald-600";
}

function AdminClicksPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [source, setSource] = useState<string>("all");
  const [passed, setPassed] = useState<"all" | "yes" | "no">("all");
  const [uaQuery, setUaQuery] = useState("");
  const [sinceHours, setSinceHours] = useState(24);
  const [limit, setLimit] = useState(100);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listRecentClicks({
        data: {
          limit,
          sinceHours,
          passed,
          source: source === "all" ? undefined : source,
          uaQuery: uaQuery.trim() || undefined,
        },
      });
      setRows(res.rows as Row[]);
      setSummary(res.summary as Summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load clicks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Recent Clicks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last {summary?.windowHours ?? sinceHours}h-এর ক্লিক — source, UA, ও bot_score অনুযায়ী filter করুন। Row-এ ক্লিক করলে reasons + raw signals দেখাবে।
            </p>
          </div>
          <Button onClick={load} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Window Summary</CardTitle>
              <CardDescription>
                {summary.totalInWindow} clicks · avg bot_score {summary.avgScore ?? "—"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(summary.bySource).map(([src, s]) => {
                  const passPct = s.total ? Math.round((s.passed / s.total) * 100) : 0;
                  return (
                    <button
                      key={src}
                      onClick={() => { setSource(src); }}
                      className="text-left rounded-md border p-3 hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={`${SOURCE_COLORS[src] ?? SOURCE_COLORS.unknown} border-0`}>{src}</Badge>
                        <span className="text-xs text-muted-foreground">avg {s.avgScore}</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">{s.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.passed} pass · {s.blocked} block · {passPct}%
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="direct">direct</SelectItem>
                  <SelectItem value="silent">silent</SelectItem>
                  <SelectItem value="blocked">blocked</SelectItem>
                  <SelectItem value="verify-silent">verify-silent</SelectItem>
                  <SelectItem value="backfill">backfill</SelectItem>
                </SelectContent>
              </Select>

              <Select value={passed} onValueChange={(v) => setPassed(v as "all" | "yes" | "no")}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="yes">Passed only</SelectItem>
                  <SelectItem value="no">Blocked only</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="UA contains… (e.g. FB_IAB)"
                value={uaQuery}
                onChange={(e) => setUaQuery(e.target.value)}
              />

              <Select value={String(sinceHours)} onValueChange={(v) => setSinceHours(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1h</SelectItem>
                  <SelectItem value="6">Last 6h</SelectItem>
                  <SelectItem value="24">Last 24h</SelectItem>
                  <SelectItem value="72">Last 3d</SelectItem>
                  <SelectItem value="168">Last 7d</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                    <SelectItem value="250">250 rows</SelectItem>
                    <SelectItem value="500">500 rows</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={load} disabled={loading}>Apply</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো click পাওয়া যায়নি।</p>
            ) : (
              <div className="divide-y">
                {rows.map((r) => {
                  const src = (r.signals?.source as string | undefined) ?? "unknown";
                  const reasons = (r.signals?.reasons as string[] | undefined) ?? [];
                  const isOpen = expanded === r.id;
                  return (
                    <div key={r.id} className="py-3 text-sm">
                      <button
                        className="w-full flex items-center gap-3 text-left"
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                      >
                        <span className={`px-2 py-1 rounded text-xs font-bold w-12 text-center ${scoreClass(r.bot_score)}`}>
                          {r.bot_score ?? "—"}
                        </span>
                        <Badge className={`${SOURCE_COLORS[src] ?? SOURCE_COLORS.unknown} border-0`}>{src}</Badge>
                        <Badge variant={r.challenge_passed ? "default" : "destructive"}>
                          {r.challenge_passed ? "pass" : "block"}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-mono text-xs">
                            {r.user_agent ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.country ?? "—"} · {r.device ?? "?"} · {r.browser ?? "?"} · {r.os ?? "?"}
                            {r.referer_host ? ` · ref:${r.referer_host}` : ""}
                            {r.fingerprint_hash ? ` · fp:${r.fingerprint_hash.slice(0, 10)}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleTimeString()}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isOpen && (
                        <div className="mt-3 ml-16 space-y-2 text-xs">
                          <div>
                            <p className="font-semibold mb-1">Reasons</p>
                            {reasons.length === 0 ? (
                              <p className="text-muted-foreground">—</p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {reasons.map((reason, i) => (
                                  <Badge key={i} variant="outline" className="font-mono">{reason}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Raw signals</p>
                            <pre className="bg-muted/50 rounded p-2 overflow-auto max-h-64 text-[11px]">
                              {JSON.stringify(r.signals ?? {}, null, 2)}
                            </pre>
                          </div>
                          <p className="text-muted-foreground">
                            IP: <span className="font-mono">{r.ip_address ?? "—"}</span> · link_id: <span className="font-mono">{r.link_id}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
