import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";

interface SmartBackButtonProps {
  /** Fallback route if there is no in-app history (e.g. user opened the page directly). */
  fallbackTo: string;
  /** Optional search params for the fallback navigation. */
  fallbackSearch?: Record<string, unknown>;
  /** Optional params for the fallback navigation. */
  fallbackParams?: Record<string, unknown>;
  children?: ReactNode;
  variant?: "ghost" | "outline" | "secondary" | "default" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Back button that prefers browser history (so users return exactly where they came from)
 * and falls back to a known route when there is no previous entry (direct visits, refresh, etc).
 */
export function SmartBackButton({
  fallbackTo,
  fallbackSearch,
  fallbackParams,
  children,
  variant = "ghost",
  size = "sm",
  className,
}: SmartBackButtonProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const handleClick = () => {
    // Only treat as "has history" if there are previous entries we can return to.
    const canGoBack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer !== "" &&
      // Avoid escaping the app: stay if referrer was external
      (() => {
        try {
          return new URL(document.referrer).origin === window.location.origin;
        } catch {
          return false;
        }
      })();

    if (canGoBack) {
      router.history.back();
    } else {
      navigate({
        to: fallbackTo,
        search: fallbackSearch as never,
        params: fallbackParams as never,
      });
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} className={className}>
      <ArrowLeft className="h-4 w-4 mr-1" /> {children ?? "Back"}
    </Button>
  );
}
