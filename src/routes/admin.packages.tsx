import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";
import {
  createPackage,
  deletePackage,
  listPackages,
  updatePackage,
} from "@/lib/billing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/packages")({ component: AdminPackagesPage });

function AdminPackagesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPackages);
  const create = useServerFn(createPackage);
  const update = useServerFn(updatePackage);
  const remove = useServerFn(deletePackage);

  const { data: pkgs = [], isLoading } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => list(),
  });

  const [form, setForm] = useState({
    slug: "",
    name: "",
    price_monthly: 0,
    link_limit: 50,
    features: "",
    sort_order: 100,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "packages"] });

  const addM = useMutation({
    mutationFn: () =>
      create({
        data: {
          slug: form.slug,
          name: form.name,
          price_monthly: Number(form.price_monthly),
          link_limit: Number(form.link_limit),
          features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
          sort_order: Number(form.sort_order),
          is_active: true,
        },
      }),
    onSuccess: () => {
      toast.success("Package created");
      setForm({ slug: "", name: "", price_monthly: 0, link_limit: 50, features: "", sort_order: 100 });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) =>
      update({ data: { id: vars.id, is_active: vars.is_active } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  const limitM = useMutation({
    mutationFn: (vars: { id: string; link_limit: number }) =>
      update({ data: { id: vars.id, link_limit: vars.link_limit } }),
    onSuccess: () => { toast.success("Updated"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Package className="h-6 w-6" /> Packages</h1>
        <p className="text-sm text-muted-foreground">Manage plans available to users. Changing a user's plan auto-updates their link quota.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add new package</CardTitle>
          <CardDescription>Slug must be lowercase letters/digits/dashes only (e.g. <code>pro-500</code>).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="pro-500" /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro 500" /></div>
            <div><Label>Price /mo (USD)</Label><Input type="number" min={0} step="0.01" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} /></div>
            <div><Label>Link limit</Label><Input type="number" min={0} value={form.link_limit} onChange={(e) => setForm({ ...form, link_limit: Number(e.target.value) })} /></div>
            <div><Label>Sort order</Label><Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            <div className="md:col-span-3"><Label>Features (one per line)</Label><Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"500 short links\nCustom domains\nPriority support"} /></div>
          </div>
          <Button className="mt-3" disabled={!form.slug || !form.name || addM.isPending} onClick={() => addM.mutate()}>Add package</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing packages</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Link limit</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pkgs.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline">{p.slug}</Badge></TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>${Number(p.price_monthly).toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={p.link_limit}
                        className="h-8 w-24"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== p.link_limit) limitM.mutate({ id: p.id, link_limit: v });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleM.mutate({ id: p.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${p.slug}?`)) deleteM.mutate(p.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pkgs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No packages yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
