// scripts/build-root.mjs
import fs from 'node:fs';

console.log('[build-root] Generating static redirect to production deployment...');
fs.mkdirSync('public', { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=https://pilot-patch-yauu.vercel.app/" />
    <title>PatchPilot — Redirecting</title>
  </head>
  <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #fafafa;">
    <div style="text-align: center;">
      <h2>PatchPilot Production</h2>
      <p>Redirecting to <a href="https://pilot-patch-yauu.vercel.app/" style="color: #6366f1;">https://pilot-patch-yauu.vercel.app/</a>...</p>
    </div>
  </body>
</html>`;

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('[build-root] Successfully generated public/index.html');
