import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Trash2, Save, Star, StarOff } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/packages")({ component: AdminPackagesPage });

type Pkg = {
  id: string;
  slug: string;
  name: string;
  price_monthly: number | string;
  price_onetime: number | string;
  billing_period: "free" | "monthly" | "lifetime";
  link_limit: number | null;
  click_limit: number | null;
  features: string[];
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
};

function PackageEditor({
  pkg,
  onSave,
  onDelete,
  saving,
}: {
  pkg: Pkg;
  onSave: (patch: Partial<Pkg>) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: pkg.name,
    price_monthly: Number(pkg.price_monthly) || 0,
    price_onetime: Number(pkg.price_onetime) || 0,
    billing_period: pkg.billing_period ?? "monthly",
    link_limit: pkg.link_limit ?? ("" as number | ""),
    click_limit: pkg.click_limit ?? ("" as number | ""),
    features: (pkg.features ?? []).join("\n"),
    sort_order: pkg.sort_order ?? 0,
    is_active: !!pkg.is_active,
    is_featured: !!pkg.is_featured,
  });

  useEffect(() => {
    setForm({
      name: pkg.name,
      price_monthly: Number(pkg.price_monthly) || 0,
      price_onetime: Number(pkg.price_onetime) || 0,
      billing_period: pkg.billing_period ?? "monthly",
      link_limit: pkg.link_limit ?? "",
      click_limit: pkg.click_limit ?? "",
      features: (pkg.features ?? []).join("\n"),
      sort_order: pkg.sort_order ?? 0,
      is_active: !!pkg.is_active,
      is_featured: !!pkg.is_featured,
    });
  }, [pkg.id, pkg.name, pkg.price_monthly, pkg.price_onetime, pkg.billing_period, pkg.link_limit, pkg.click_limit, pkg.features, pkg.sort_order, pkg.is_active, pkg.is_featured]);

  const submit = () => {
    onSave({
      name: form.name.trim(),
      price_monthly: Number(form.price_monthly) || 0,
      price_onetime: Number(form.price_onetime) || 0,
      billing_period: form.billing_period as Pkg["billing_period"],
      link_limit: form.link_limit === "" ? null : Number(form.link_limit),
      click_limit: form.click_limit === "" ? null : Number(form.click_limit),
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      is_featured: form.is_featured,
    });
  };

  return (
    <Card className={form.is_featured ? "border-primary/60 shadow-glow shadow-primary/10" : ""}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pkg.slug}</Badge>
            {form.is_featured && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Star className="mr-1 h-3 w-3" /> Promoted
              </Badge>
            )}
            {!form.is_active && <Badge variant="secondary">Hidden</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active</span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <span className="ml-3 text-muted-foreground">Promote</span>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
            />
          </div>
        </div>
        <CardTitle className="mt-2 text-lg">{form.name || pkg.slug}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Billing period</Label>
            <Select
              value={form.billing_period}
              onValueChange={(v) => setForm({ ...form, billing_period: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="lifetime">Lifetime (one-time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sort order</Label>
            <Input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Monthly price (USD)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price_monthly}
              onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>One-time price (USD)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price_onetime}
              onChange={(e) => setForm({ ...form, price_onetime: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Link limit (blank = unlimited)</Label>
            <Input
              type="number"
              min={0}
              value={form.link_limit}
              placeholder="Unlimited"
              onChange={(e) =>
                setForm({ ...form, link_limit: e.target.value === "" ? "" : Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Click limit (blank = unlimited)</Label>
            <Input
              type="number"
              min={0}
              value={form.click_limit}
              placeholder="Unlimited"
              onChange={(e) =>
                setForm({ ...form, click_limit: e.target.value === "" ? "" : Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div>
          <Label>Features (one per line)</Label>
          <Textarea
            rows={6}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button onClick={submit} disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    qc.invalidateQueries({ queryKey: ["pricing-packages-public"] });
    qc.invalidateQueries({ queryKey: ["upgrade", "packages"] });
    qc.invalidateQueries({ queryKey: ["home", "packages"] });
  };

  const [form, setForm] = useState({
    slug: "",
    name: "",
    price_monthly: 0,
    price_onetime: 0,
    billing_period: "monthly" as "free" | "monthly" | "lifetime",
    link_limit: "" as number | "",
    click_limit: "" as number | "",
    features: "",
    sort_order: 100,
  });

  const addM = useMutation({
    mutationFn: () =>
      create({
        data: {
          slug: form.slug,
          name: form.name,
          price_monthly: Number(form.price_monthly) || 0,
          price_onetime: Number(form.price_onetime) || 0,
          billing_period: form.billing_period,
          link_limit: form.link_limit === "" ? null : Number(form.link_limit),
          click_limit: form.click_limit === "" ? null : Number(form.click_limit),
          features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
          sort_order: Number(form.sort_order),
          is_active: true,
          is_featured: false,
        },
      }),
    onSuccess: () => {
      toast.success("Package created");
      setForm({
        slug: "",
        name: "",
        price_monthly: 0,
        price_onetime: 0,
        billing_period: "monthly",
        link_limit: "",
        click_limit: "",
        features: "",
        sort_order: 100,
      });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; patch: Partial<Pkg> }) =>
      update({ data: { id: vars.id, ...vars.patch } as any }),
    onSuccess: () => {
      toast.success("Package updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Package className="h-6 w-6" /> Packages
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit prices, limits, features, and promote a plan as "Best value". Changes appear instantly on
          the homepage, pricing page, and upgrade page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add new package
          </CardTitle>
          <CardDescription>
            Slug must be lowercase letters/digits/dashes only (e.g. <code>pro-500</code>). Leave a limit
            blank for unlimited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="pro-500" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro 500" />
            </div>
            <div>
              <Label>Billing period</Label>
              <Select value={form.billing_period} onValueChange={(v) => setForm({ ...form, billing_period: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="lifetime">Lifetime (one-time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price /mo (USD)</Label>
              <Input type="number" min={0} step="0.01" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} />
            </div>
            <div>
              <Label>One-time price (USD)</Label>
              <Input type="number" min={0} step="0.01" value={form.price_onetime} onChange={(e) => setForm({ ...form, price_onetime: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Link limit (blank = unlimited)</Label>
              <Input type="number" min={0} value={form.link_limit} placeholder="Unlimited" onChange={(e) => setForm({ ...form, link_limit: e.target.value === "" ? "" : Number(e.target.value) })} />
            </div>
            <div>
              <Label>Click limit (blank = unlimited)</Label>
              <Input type="number" min={0} value={form.click_limit} placeholder="Unlimited" onChange={(e) => setForm({ ...form, click_limit: e.target.value === "" ? "" : Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3">
              <Label>Features (one per line)</Label>
              <Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"500 short links\nCustom domains\nPriority support"} />
            </div>
          </div>
          <Button className="mt-3" disabled={!form.slug || !form.name || addM.isPending} onClick={() => addM.mutate()}>
            Add package
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {pkgs.map((p: any) => (
            <PackageEditor
              key={p.id}
              pkg={p as Pkg}
              saving={updateM.isPending && (updateM.variables as any)?.id === p.id}
              onSave={(patch) => updateM.mutate({ id: p.id, patch })}
              onDelete={() => {
                if (confirm(`Delete ${p.slug}?`)) deleteM.mutate(p.id);
              }}
            />
          ))}
          {pkgs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No packages yet</p>
          )}
        </div>
      )}
    </div>
  );
}
