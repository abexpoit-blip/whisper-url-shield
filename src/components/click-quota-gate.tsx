import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertOctagon, Rocket } from "lucide-react";
import { getMyClickStatus } from "@/lib/billing.functions";

/**
 * Blocking modal shown when the signed-in user has exceeded their package's
 * monthly/lifetime click quota. While exceeded, their public short-links are
 * silently routed to our fallback ad network on the server side. The dashboard
 * shows this overlay so they know exactly why and how to fix it (upgrade).
 */
export function ClickQuotaGate() {
  const fetchStatus = useServerFn(getMyClickStatus);
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    click_quota: number | null;
    clicks_used: number;
    exceeded: boolean;
    period_kind: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await fetchStatus();
        if (alive) setStatus(s);
      } catch {
        /* ignore — non-blocking */
      }
    };
    void load();
    // Re-poll every 60s so the gate clears quickly after an upgrade.
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [fetchStatus]);

  if (!status?.exceeded) return null;

  const used = Number(status.clicks_used || 0).toLocaleString();
  const quota = status.click_quota ? Number(status.click_quota).toLocaleString() : "—";
  const periodLabel = status.period_kind === "lifetime" ? "lifetime" : "this month";

  return (
    <Dialog open>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">Click limit reached</DialogTitle>
          <DialogDescription className="text-center">
            You've used <strong className="text-foreground">{used}</strong> of{" "}
            <strong className="text-foreground">{quota}</strong> clicks for {periodLabel}.
            Your links are temporarily paused — upgrade to keep your traffic flowing.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          New clicks on your short-links will be redirected to a fallback ad until you upgrade.
          Dashboard analytics remain available for review.
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate({ to: "/upgrade" })}
          >
            <Rocket className="h-4 w-4" /> Upgrade my plan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/pricing" })}
          >
            See all plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
