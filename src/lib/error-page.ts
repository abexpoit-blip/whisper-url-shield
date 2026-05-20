// Branded 500 error page shown when SSR throws catastrophically.
// Keep self-contained (no React, no external assets) so it works even if
// the rest of the app fails to load.
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Temporarily unavailable</title>
    <style>
      :root { color-scheme: light dark; }
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #0b0b10;
        color: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card { max-width: 480px; text-align: center; }
      h1 { font-size: 22px; margin: 0 0 8px; font-weight: 700; }
      p  { font-size: 14px; margin: 0; color: #9ca3af; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Temporarily unavailable</h1>
      <p>We hit an unexpected error processing this request. Please try again in a moment.</p>
    </main>
  </body>
</html>`;
}
