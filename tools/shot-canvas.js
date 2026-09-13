/* Capture just the maze canvas (precise element clip) through the DevTools
 * protocol, for visual verification.
 * Run: node tools/shot-canvas.js <outfile> [url]
 * Requires chrome with --remote-debugging-port=9222 (or CDP_PORT). */
'use strict';
const fs = require('fs');
const PORT = process.env.CDP_PORT || 9222;
const out = process.argv[2] || '.debug/canvas.png';

async function main() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'));
  if (!page) throw new Error('game page not found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 40; i++) {
    if (await evalJs("document.readyState === 'complete' && !!document.getElementById('cv')")) break;
    await sleep(250);
  }
  await sleep(600);
  const rect = await evalJs(`(() => { const r = document.getElementById('cv').getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })()`);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 } });
  const data = shot.result && shot.result.data;
  if (!data) throw new Error('screenshot failed: ' + JSON.stringify(shot).slice(0, 200));
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('canvas rect', JSON.stringify(rect), '->', out);
  ws.close();
}
main().catch((e) => { console.error('shot failed:', e.message); process.exit(1); });
