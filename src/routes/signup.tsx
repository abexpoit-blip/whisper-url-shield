import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Sleepox" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tg = telegram.trim().replace(/^@/, "");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName.trim(),
          telegram: tg,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Try auto sign-in (works when email confirmation is disabled)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      toast.success("Account created. Please login.");
      navigate({ to: "/login" });
      return;
    }
    toast.success("Welcome to Sleepox!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <Link to="/" className="text-2xl font-bold">Sleepox</Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-8 shadow-2xl backdrop-blur">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Start cloaking smarter in under 60 seconds.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <Field id="fullName" label="Full name" icon={<User className="h-4 w-4" />}>
                <Input id="fullName" required placeholder="John Doe" className="pl-10 h-11"
                  value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />}>
                <Input id="email" type="email" required placeholder="you@example.com" className="pl-10 h-11"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="telegram" label="Telegram username" icon={<Send className="h-4 w-4" />}>
                <Input id="telegram" required placeholder="@yourhandle" className="pl-10 h-11"
                  value={telegram} onChange={(e) => setTelegram(e.target.value)} />
              </Field>
              <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />}>
                <Input id="password" type="password" minLength={8} required placeholder="At least 8 characters" className="pl-10 h-11"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By signing up you agree to our Terms & Privacy Policy.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-bl from-primary/20 via-background to-background lg:flex lg:flex-col lg:justify-between lg:p-12 order-1 lg:order-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative">
          <Link to="/" className="text-2xl font-bold tracking-tight">Sleepox</Link>
          <p className="mt-2 text-sm text-muted-foreground">The cloaker built for serious affiliates.</p>
        </div>
        <div className="relative space-y-4">
          {[
            "Free plan: 1,000 clicks/month",
            "Smart bot detection out of the box",
            "Crypto payments — no KYC",
            "Telegram support for every plan",
            "Built for Facebook, Google & TikTok ads",
          ].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm">{t}</span>
            </div>
          ))}
        </div>
        <p className="relative text-xs text-muted-foreground">© {new Date().getFullYear()} Sleepox</p>
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
