import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";
import {
  getPaymentSettings,
  updatePaymentSettings,
  listAllUpgradeRequests,
  reviewUpgradeRequest,
} from "@/lib/billing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/payments")({ component: AdminPaymentsPage });

function AdminPaymentsPage() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getPaymentSettings);
  const saveSettings = useServerFn(updatePaymentSettings);
  const listReqs = useServerFn(listAllUpgradeRequests);
  const review = useServerFn(reviewUpgradeRequest);

  const { data: settings } = useQuery({ queryKey: ["admin", "payment-settings"], queryFn: () => getSettings() });
  const { data: reqs = [] } = useQuery({ queryKey: ["admin", "upgrade-requests"], queryFn: () => listReqs() });

  const [form, setForm] = useState({
    plisio_enabled: false,
    plisio_api_key: "",
    plisio_webhook_secret: "",
    payment_instructions: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        plisio_enabled: settings.plisio_enabled ?? false,
        plisio_api_key: settings.plisio_api_key ?? "",
        plisio_webhook_secret: settings.plisio_webhook_secret ?? "",
        payment_instructions: settings.payment_instructions ?? "",
      });
    }
  }, [settings]);

  const saveM = useMutation({
    mutationFn: () => saveSettings({ data: form }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "payment-settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const reviewM = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) => review({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Approved & plan assigned" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin", "upgrade-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><CreditCard className="h-6 w-6" /> Payments</h1>
        <p className="text-sm text-muted-foreground">Configure Plisio (crypto) and approve user upgrade requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plisio (crypto gateway)</CardTitle>
          <CardDescription>Add Plisio API key now; we'll wire up the checkout flow next.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch checked={form.plisio_enabled} onCheckedChange={(v) => setForm({ ...form, plisio_enabled: v })} />
            <Label>Enable Plisio</Label>
          </div>
          <div><Label>Plisio API key</Label><Input value={form.plisio_api_key} onChange={(e) => setForm({ ...form, plisio_api_key: e.target.value })} placeholder="paste API key" /></div>
          <div><Label>Webhook secret</Label><Input value={form.plisio_webhook_secret} onChange={(e) => setForm({ ...form, plisio_webhook_secret: e.target.value })} /></div>
          <div><Label>Payment instructions (shown to users)</Label><Textarea rows={3} value={form.payment_instructions} onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })} /></div>
          <Button disabled={saveM.isPending} onClick={() => saveM.mutate()}>Save settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upgrade requests</CardTitle>
          <CardDescription>Approve to instantly assign the plan & update link quota.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Tx ref</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reqs.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{r.user_email ?? r.user_id.slice(0, 8)}</TableCell>
                  <TableCell><Badge>{r.package_slug}</Badge></TableCell>
                  <TableCell>{r.payment_method}</TableCell>
                  <TableCell className="text-xs">{r.transaction_ref ?? "—"}</TableCell>
                  <TableCell>${Number(r.amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "outline"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => reviewM.mutate({ id: r.id, approve: true })}><CheckCircle2 className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => reviewM.mutate({ id: r.id, approve: false })}><XCircle className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {reqs.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground">No requests yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
