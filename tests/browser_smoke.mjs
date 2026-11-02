// Real-browser smoke test: loads dist/anti-custheme.bundle.js into a page that mimics the
// Antigravity 2.x DOM, in headless Chrome/Edge, and checks behaviour over the DevTools protocol.
// Usage: node browser_smoke.mjs <browser.exe> <bundle.js> <tmp dir>
// Prints one JSON object {ok, checks:[{name, pass, detail}]}; exit code 0 only if all pass.

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [browserPath, bundlePath, tmpDir] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 500);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; }
  .text-sm { font-size: .875rem; line-height: 1.25rem; }
  .text-xs { font-size: .75rem; line-height: 1rem; }
  .agy-shell { display: flex; height: 100%; }
  [role="navigation"] { width: 240px; }
  .agy-sheet { position: relative; flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
  .surface-composer-card { margin: 24px; height: 80px; }
</style></head>
<body><div id="root"><div class="agy-shell">
  <div role="navigation" class="bg-sidebar"><span id="nav-item" class="text-sm">New Conversation</span></div>
  <div class="agy-sheet">
    <div data-testid="conversation-view"><div data-markdown-root class="text-sm"><p id="chat-p">Hello world</p><code id="chat-code">x = 1</code></div></div>
    <div data-testid="agent-input-box"><div class="surface-composer"><div class="surface-composer-card"></div></div></div>
  </div>
</div></div>
<script src="${pathToFileURL(bundlePath).href}"></script>
</body></html>`;
const pagePath = join(tmpDir, 'smoke.html');
writeFileSync(pagePath, html);

const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpDir, 'profile')}`,
  '--window-size=1280,800', pathToFileURL(pagePath).href
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((p) => p.type === 'page' && p.url.startsWith('file:'));
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(200);
  }
  throw new Error('browser did not expose a page');
}

let ws;
let msgId = 0;
const pending = {};
function evaluate(expression, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const timer = setTimeout(() => reject(new Error('evaluate timed out (renderer hung?)')), timeoutMs);
    pending[id] = (m) => {
      clearTimeout(timer);
      if (m.result && m.result.exceptionDetails) reject(new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 400)));
      else resolve(m.result && m.result.result ? m.result.result.value : undefined);
    };
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
  });
}

const countFrames = (ms) => `new Promise((r) => {
  const orig = window.requestAnimationFrame; let n = 0;
  window.requestAnimationFrame = (cb) => { n++; return orig.call(window, cb); };
  setTimeout(() => { window.requestAnimationFrame = orig; r(n); }, ${ms});
})`;

try {
  ws = new WebSocket(await connect());
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  await sleep(1500);

  check('initialized', await evaluate('!!window.__ANTI_CUSTHEME_INITIALIZED__'));

  // The original startup bug: the observer re-triggered itself forever and froze the page.
  const idleMutations = await evaluate(`new Promise((r) => {
    let n = 0; const o = new MutationObserver((ms) => { n += ms.length; });
    o.observe(document.documentElement, { attributes: true, subtree: false });
    o.observe(document.body, { attributes: true, subtree: false });
    setTimeout(() => { o.disconnect(); r(n); }, 800);
  })`);
  check('no self-triggering mutation loop', idleMutations === 0, `${idleMutations} mutations while idle`);

  check('wallpaper mounted in .agy-sheet',
    await evaluate(`document.getElementById('act-wallpaper').parentElement.classList.contains('agy-sheet')`));
  check('no floating pill button', await evaluate(`!document.querySelector('[id$="-pill"]')`));

  await evaluate(`AntiCusTheme.setMotion(true)`);
  const framesOn = await evaluate(countFrames(1000));
  await evaluate(`AntiCusTheme.setMotion(false)`);
  await sleep(200);
  const framesOff = await evaluate(countFrames(1000));
  check('motion on renders frames', framesOn > 5, `${framesOn} rAF/s`);
  check('motion off renders nothing', framesOff === 0, `${framesOff} rAF/s`);
  check('motion setting persisted', (await evaluate(`localStorage.getItem('act_motion_v1')`)) === 'false');
  await evaluate(`AntiCusTheme.setMotion(true)`);

  await evaluate(`AntiCusTheme.setTheme('moonlit')`);
  check('theme switch', (await evaluate(`document.documentElement.dataset.actTheme`)) === 'moonlit');

  const picker = await evaluate(`(() => {
    AntiCusTheme.openPicker();
    const p = document.getElementById('act-panel');
    const cards = p.querySelectorAll('.act-tp-card').length;
    p.querySelectorAll('.act-tp-tab')[1].click();
    const fontsVisible = !p.querySelector('.act-tp-fonts').hidden && getComputedStyle(p.querySelector('.act-tp-fonts')).display !== 'none';
    const themesHidden = getComputedStyle(p.querySelector('.act-tp-cards')).display === 'none';
    const rows = p.querySelectorAll('.act-tp-font-row').length;
    AntiCusTheme.closePicker();
    return { cards, fontsVisible, themesHidden, rows, bg: getComputedStyle(p).backgroundColor };
  })()`);
  check('panel has 9 theme cards', picker.cards === 9, JSON.stringify(picker));
  check('fonts tab switches panels', picker.fontsVisible && picker.themesHidden && picker.rows === 3, JSON.stringify(picker));
  check('panel has an opaque-ish background', picker.bg !== 'rgba(0, 0, 0, 0)', picker.bg);

  const fonts = await evaluate(`(() => {
    const F = AntiCusTheme.Fonts;
    F.reset();
    F.setFamily('system', 'Georgia');
    F.setFamily('chat', 'Courier New');
    F.setSize('chat', 18);
    const cs = (id) => getComputedStyle(document.getElementById(id));
    const out = {
      navFamily: cs('nav-item').fontFamily, navSize: cs('nav-item').fontSize,
      chatFamily: cs('chat-p').fontFamily, chatSize: cs('chat-p').fontSize,
      codeFamily: cs('chat-code').fontFamily,
      stored: JSON.parse(localStorage.getItem('act_fonts_v1')).chat
    };
    F.reset();
    out.afterReset = cs('chat-p').fontSize;
    return out;
  })()`);
  check('system font reaches sidebar', /Georgia/.test(fonts.navFamily), fonts.navFamily);
  check('sidebar size untouched by chat size', fonts.navSize === '14px', fonts.navSize);
  check('chat font overrides system', /Courier New/.test(fonts.chatFamily), fonts.chatFamily);
  check('chat size 18px applied to text-sm', fonts.chatSize === '18px', fonts.chatSize);
  check('code keeps monospace', !/Georgia|Courier New/.test(fonts.codeFamily), fonts.codeFamily);
  check('font settings persisted', fonts.stored && fonts.stored.size === 18, JSON.stringify(fonts.stored));
  check('reset restores size', fonts.afterReset === '14px', fonts.afterReset);

  const fontCount = await evaluate(`AntiCusTheme.Fonts.listSystemFonts().then((l) => l.length)`, 15000);
  check('system font list available', fontCount > 0, `${fontCount} families`);
} catch (e) {
  check('smoke run', false, String(e && e.message || e));
} finally {
  browser.kill();
}

const ok = checks.length > 0 && checks.every((c) => c.pass);
console.log(JSON.stringify({ ok, checks }, null, 1));
process.exit(ok ? 0 : 1);
