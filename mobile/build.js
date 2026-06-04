/**
 * build.js — Combine all screen fragments + CSS + JS into a single
 *             self-contained HTML file that works without a server.
 *
 * Usage:  node build.js
 * Output: WeQuote_Figma_v1_mobile_dist.html  (commit this to GitHub)
 */

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const SCREENS = [
  'screens/s-login.html',
  'screens/s-forgot-password.html',
  'screens/s-dash.html',
  'screens/s-detail.html',
  'screens/s-quotes.html',
  'screens/s-invoices.html',
  'screens/s-variations.html',
  'screens/s-purchase-order.html',
  'screens/s-progress.html',
  'screens/s-documents.html',
  'screens/s-warranty.html',
  'screens/s-global-overlays.html',
];

// ── Read all parts ────────────────────────────────────────────────────
const screensHtml   = SCREENS.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const cssContent    = fs.readFileSync(path.join(ROOT, 'wq-styles.css'),   'utf8');
const appJs         = fs.readFileSync(path.join(ROOT, 'wq-app.js'),       'utf8');
const componentsJs  = fs.readFileSync(path.join(ROOT, 'wq-components.js'),'utf8');

let html = fs.readFileSync(path.join(ROOT, 'WeQuote_Figma_v1_mobile.html'), 'utf8');

// ── 1. Inline CSS (replace <link> tag) ───────────────────────────────
html = html.replace(
  '<link rel="stylesheet" href="wq-styles.css">',
  `<style>\n${cssContent}\n</style>`
);

// ── 2. Replace the dynamic loader block with inlined screens + scripts ──
// Everything from <div id="app-content"> … </html>
const loaderStart = html.indexOf('<div id="app-content">');
if (loaderStart === -1) { console.error('Could not find #app-content'); process.exit(1); }

const head = html.slice(0, loaderStart);

const inlined = [
  '<div id="app-content">',
  screensHtml,
  '</div>',
  '',
  '<script>',
  appJs,
  '</script>',
  '<script>',
  componentsJs,
  '</script>',
  '</body>',
  '</html>',
].join('\n');

html = head + inlined;

// ── 3. Write output ───────────────────────────────────────────────────
const outFile = path.join(ROOT, 'WeQuote_Figma_v1_mobile_dist.html');
fs.writeFileSync(outFile, html, 'utf8');

const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log(`✓  Built: WeQuote_Figma_v1_mobile_dist.html  (${kb} KB)`);
console.log('   Open this file directly in any browser — no server needed.');
