// Prelanding HTML templates served to suspected humans.
// Each template embeds the same JS challenge — only the visible UI differs.
// Templates self-contained: no external CSS/JS to avoid load issues.

export type PrelandingTemplate = "verify" | "reward" | "countdown" | "article";

const CHALLENGE_JS = `
(function(){
  var token = window.__SX_TOKEN__;
  var startedAt = Date.now();
  var moved = false, scrolled = false, touched = false;
  document.addEventListener('mousemove', function(){ moved = true; }, { passive: true, once: true });
  document.addEventListener('scroll', function(){ scrolled = true; }, { passive: true, once: true });
  document.addEventListener('touchstart', function(){ touched = true; }, { passive: true, once: true });

  function collectSignals(){
    var nav = window.navigator || {};
    var screen = window.screen || {};
    var fp = '';
    try {
      var c = document.createElement('canvas');
      c.width = 100; c.height = 30;
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#069';
      ctx.fillText('sleepox', 2, 2);
      fp = c.toDataURL().slice(-32);
    } catch(e) {}
    document.cookie = 'sx_c=1; path=/; max-age=300; SameSite=Lax';
    var cookieOk = document.cookie.indexOf('sx_c=1') !== -1;
    return {
      webdriver: !!nav.webdriver,
      lang: nav.language || '',
      platform: nav.platform || '',
      hw: nav.hardwareConcurrency || 0,
      tz: (new Date()).getTimezoneOffset(),
      screen: (screen.width||0) + 'x' + (screen.height||0),
      cookie: cookieOk,
      moved: moved, scrolled: scrolled, touched: touched,
      fp: fp,
      elapsed: Date.now() - startedAt
    };
  }

  function submit(){
    var signals = collectSignals();
    fetch('/r/' + window.__SX_CODE__ + '/verify', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, signals: signals })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d && d.url) {
        window.location.replace(d.url);
      } else {
        window.location.replace('https://sleepox.com/');
      }
    }).catch(function(){
      window.location.replace('https://sleepox.com/');
    });
  }

  // Minimum wait of 1500ms before submitting (bots usually fire instantly).
  var WAIT = 1600;
  setTimeout(submit, WAIT);
})();
`;

function shell(title: string, bodyHtml: string, code: string, token: string): string {
  const escapedCode = code.replace(/[^a-zA-Z0-9_-]/g, "");
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px}
  .card{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);
    border-radius:16px;padding:40px 30px;text-align:center;max-width:420px;width:100%;
    box-shadow:0 10px 40px rgba(0,0,0,.2)}
  h1{font-size:1.5rem;margin-bottom:12px;font-weight:600}
  p{opacity:.85;line-height:1.5;font-size:.95rem}
  .spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);
    border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn{display:inline-block;margin-top:20px;padding:12px 28px;background:#fff;color:#667eea;
    border:0;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;text-decoration:none}
  .timer{font-size:2.5rem;font-weight:700;margin:16px 0;color:#ffd700}
</style>
</head><body>
<div class="card">${bodyHtml}</div>
<script>window.__SX_CODE__=${JSON.stringify(escapedCode)};window.__SX_TOKEN__=${JSON.stringify(token)};</script>
<script>${CHALLENGE_JS}</script>
</body></html>`;
}

export function renderPrelanding(
  template: PrelandingTemplate,
  code: string,
  token: string,
): string {
  switch (template) {
    case "reward":
      return shell(
        "Claim Your Reward",
        `<div style="font-size:3rem;margin-bottom:12px">🎁</div>
         <h1>You've Won!</h1>
         <p>Verifying your reward eligibility...</p>
         <div class="spinner" style="margin-top:20px"></div>`,
        code,
        token,
      );
    case "countdown":
      return shell(
        "Special Offer",
        `<h1>⏳ Exclusive Offer Loading</h1>
         <div class="timer" id="t">3</div>
         <p>Hold on, your offer is being prepared...</p>
         <script>var n=3,el=document.getElementById('t');var i=setInterval(function(){n--;if(n<=0){clearInterval(i);el.textContent='Go!';}else{el.textContent=n;}},500);</script>`,
        code,
        token,
      );
    case "article":
      return shell(
        "Continue Reading",
        `<h1>📰 Article Loading</h1>
         <p style="margin:16px 0">Preparing the full article for you...</p>
         <div class="spinner"></div>
         <p style="margin-top:20px;font-size:.85rem;opacity:.7">Please wait while we verify your access</p>`,
        code,
        token,
      );
    case "verify":
    default:
      return shell(
        "Verifying...",
        `<div class="spinner"></div>
         <h1>Verifying you're human</h1>
         <p>This will only take a moment...</p>`,
        code,
        token,
      );
  }
}
