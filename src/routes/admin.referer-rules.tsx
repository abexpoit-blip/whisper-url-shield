import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listRefererRules,
  addRefererRule,
  toggleRefererRule,
  deleteRefererRule,
} from "@/lib/admin-defense.functions";

export const Route = createFileRoute("/admin/referer-rules")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AdminRefererRulesPage,
});

type Action = "safe" | "cloak" | "pass";
type Row = {
  id: string;
  host_pattern: string;
  action: Action;
  priority: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<Action, { label: string; tone: string; desc: string }> = {
  safe: { label: "Safe page", tone: "bg-emerald-500/15 text-emerald-600", desc: "Real article, কোনো redirect না" },
  cloak: { label: "Cloak (silent)", tone: "bg-amber-500/15 text-amber-600", desc: "Article দেখাবে, Adsterra hit হবে না" },
  pass: { label: "Pass through", tone: "bg-blue-500/15 text-blue-600", desc: "স্বাভাবিকভাবে redirect হবে" },
};

function AdminRefererRulesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  const [host, setHost] = useState("");
  const [action, setAction] = useState<Action>("safe");
  const [priority, setPriority] = useState("100");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listRefererRules();
      const sorted = [...(res.rows as Row[])].sort(
        (a, b) => a.priority - b.priority || a.host_pattern.localeCompare(b.host_pattern),
      );
      setRows(sorted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    const h = host.trim().toLowerCase();
    if (!h) return toast.error("Host pattern দিন (যেমন developers.facebook.com)");
    if (!/^[a-zA-Z0-9.\-_*]+$/.test(h)) return toast.error("Pattern-এ শুধু letters, digits, dot, dash, underscore, * ব্যবহার করুন");
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 0 || p > 10000) return toast.error("Priority 0-10000 হতে হবে");

    setAdding(true);
    try {
      await addRefererRule({
        data: {
          host_pattern: h,
          action,
          priority: p,
          note: note.trim() || null,
        },
      });
      toast.success("Rule added");
      setHost("");
      setNote("");
      setPriority("100");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string, next: boolean) => {
    try {
      await toggleRefererRule({ data: { id, is_active: next } });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: next } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rule delete করবেন?")) return;
    try {
      await deleteRefererRule({ data: { id } });
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Filter className="w-6 h-6 text-primary" /> Referer-based Smart Cloaking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Referer host অনুযায়ী decide হবে visitor কী দেখবে। কম priority আগে match হয়। Wildcard `*` allowed (যেমন `*.facebook.com`)।
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add new rule</CardTitle>
            <CardDescription>
              উদাহরণ: <code className="font-mono">developers.facebook.com</code> → Safe; <code className="font-mono">l.facebook.com</code> → Cloak; <code className="font-mono">google.com</code> → Pass.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <Label className="text-xs">Host pattern</Label>
                <Input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="developers.facebook.com"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Action</Label>
                <Select value={action} onValueChange={(v) => setAction(v as Action)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe page</SelectItem>
                    <SelectItem value="cloak">Cloak (silent)</SelectItem>
                    <SelectItem value="pass">Pass through</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Priority</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Note (optional)</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="FB ad review tool"
                />
              </div>
              <div className="md:col-span-1">
                <Button onClick={handleAdd} disabled={adding} className="w-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {ACTION_LABEL[action].label}: {ACTION_LABEL[action].desc}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules ({rows.length})</CardTitle>
            <CardDescription>Priority ascending — উপরের rule আগে evaluate হয়।</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো rule নেই।</p>
            ) : (
              <div className="divide-y">
                {rows.map((r) => {
                  const meta = ACTION_LABEL[r.action];
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-3 text-sm">
                      <span className="font-mono text-xs w-12 text-muted-foreground">p{r.priority}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium truncate">{r.host_pattern}</p>
                        {r.note && <p className="text-xs text-muted-foreground truncate">{r.note}</p>}
                      </div>
                      <Badge variant="outline" className={meta.tone + " border-0"}>
                        {meta.label}
                      </Badge>
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={(v) => handleToggle(r.id, v)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(r.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
