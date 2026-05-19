import { createFileRoute, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Shield, LayoutGrid } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — LinkShield" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLayout,
});

// Friendly labels for breadcrumb
const SEG_LABELS: Record<string, string> = {
  admin: "Admin",
  "": "Overview",
  packages: "Packages",
  payments: "Payments",
  rotation: "Rotation",
  protection: "Protection",
  variants: "Variants",
  domains: "Domain Pool",
  "domain-health": "Domain Health",
  users: "Members",
  audit: "Audit Logs",
  scores: "Scores",
  "referer-rules": "Referer Rules",
  "asn-blocklist": "ASN Blocklist",
};

function pretty(seg: string) {
  return SEG_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? undefined));
  }, []);

  const segments = pathname.split("/").filter(Boolean); // e.g. ["admin","users"]
  const crumbs = segments.map((seg, i) => ({
    label: pretty(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));
  const currentTitle = crumbs[crumbs.length - 1]?.label ?? "Admin";
  const isRootAdmin = pathname === "/admin" || pathname === "/admin/";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar email={email} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Sky-blue ambient wash */}
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-sky-500/10 via-primary/5 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 -z-10 h-72 w-1/2 bg-gradient-to-bl from-cyan-400/10 to-transparent blur-2xl" />

          {/* Sticky topbar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-5">
            <SidebarTrigger className="shrink-0" />

            {!isRootAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.history.back()}
                className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}

            {/* Breadcrumb */}
            <nav className="hidden min-w-0 flex-1 items-center gap-1 text-sm sm:flex">
              <Link to="/admin" className="flex shrink-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="font-medium">Admin Console</span>
              </Link>
              {crumbs.slice(1).map((c) => (
                <span key={c.href} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {c.last ? (
                    <span className="truncate font-semibold text-foreground">{c.label}</span>
                  ) : (
                    <Link to={c.href as never} className="truncate text-muted-foreground hover:text-foreground">
                      {c.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Mobile current title */}
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold sm:hidden">{currentTitle}</h2>

            <Badge
              variant="outline"
              className="ml-auto hidden shrink-0 items-center gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 sm:flex"
            >
              <Shield className="h-3 w-3" /> Admin
            </Badge>
          </header>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
