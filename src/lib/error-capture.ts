// Captures the last unhandled error in the SSR runtime so server.ts can
// surface it when h3 swallows an in-handler throw into a generic 500.
let lastCapturedError: unknown = null;

function capture(err: unknown) {
  lastCapturedError = err;
}

// Side-effect: install global listeners on the Worker runtime.
try {
  const g = globalThis as unknown as {
    addEventListener?: (type: string, listener: (e: unknown) => void) => void;
  };
  g.addEventListener?.("error", (e) => {
    const ev = e as { error?: unknown; message?: unknown };
    capture(ev.error ?? ev.message);
  });
  g.addEventListener?.("unhandledrejection", (e) => {
    const ev = e as { reason?: unknown };
    capture(ev.reason);
  });
} catch {
  /* ignore – not all runtimes expose these APIs */
}

export function consumeLastCapturedError(): unknown {
  const e = lastCapturedError;
  lastCapturedError = null;
  return e;
}
