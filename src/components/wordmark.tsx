type WordmarkProps = {
  className?: string;
  /** Visual size scale */
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE_CLASS: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl sm:text-5xl",
};

/**
 * Premium text logo / wordmark.
 *
 * Letter-spaced, gradient SLEEPOX with a subtle glow dot. Pure text — no
 * iconography that hints at the underlying product so the brand stays
 * neutral and unguessable.
 */
export function Wordmark({ className = "", size = "md" }: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 font-bold tracking-[0.18em] uppercase ${SIZE_CLASS[size]} ${className}`}
    >
      <span className="text-gradient-sky drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]">
        sleep
      </span>
      <span className="text-foreground">ox</span>
      <span
        aria-hidden
        className="ml-0.5 inline-block h-1.5 w-1.5 translate-y-[-0.35em] rounded-full bg-sky-gradient sky-glow"
      />
    </span>
  );
}
