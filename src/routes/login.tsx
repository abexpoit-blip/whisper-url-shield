import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Sleepox" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative">
          <Link to="/" className="text-2xl font-bold tracking-tight">Sleepox</Link>
          <p className="mt-2 text-sm text-muted-foreground">Smart cloaking. Real earnings.</p>
        </div>
        <div className="relative space-y-6">
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Bot protection" desc="Block bad traffic before it burns your CPM." />
          <Feature icon={<Zap className="h-5 w-5" />} title="Lightning routing" desc="Sub-50ms redirects worldwide." />
          <Feature icon={<TrendingUp className="h-5 w-5" />} title="Real-time analytics" desc="Track every click, country & device." />
        </div>
        <p className="relative text-xs text-muted-foreground">© {new Date().getFullYear()} Sleepox</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <Link to="/" className="text-2xl font-bold">Sleepox</Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-8 shadow-2xl backdrop-blur">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Login to manage your cloaked links.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />}>
                <Input id="email" type="email" required placeholder="you@example.com" className="pl-10 h-11"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />}>
                <Input id="password" type="password" required placeholder="••••••••" className="pl-10 h-11"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to Sleepox?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
