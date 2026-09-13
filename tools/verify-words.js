/* Check that every word the game shows matches the letters it teaches:
 * strips diacritics from the displayed form and compares it with the letters.
 * Needs a browser on --remote-debugging-port (default 9445) with the game open
 * using ?debug, e.g.
 *   google-chrome --headless=new --remote-debugging-port=9445 \
 *     --user-data-dir=/tmp/cdp "http://127.0.0.1:8137/index.html?autostart&debug" &
 *   node tools/verify-words.js
 */
'use strict';
const PORT = process.env.CDP_PORT || 9445;
(async () => {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'));
  if (!page) throw new Error('game page not found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (m, q) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: q })); });
  const ev = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return 'EXC';
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60; i++) { if (await ev('!!window.__qp')) break; await sleep(300); }
  const res = JSON.parse(await ev(`(() => {
    const strip = t => t.replace(/[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]/g, '').replace(/[\\u0671\\u0622\\u0623\\u0625]/g, '\\u0627');
    const out = window.QMazeData.WORDS.map(w => {
      const r = window.__qp.previewCard(w.id);
      return { id: r.id, shown: r.shown, letters: r.letters, ok: strip(r.shown) === r.letters };
    });
    window.__qp.hideCard();
    return JSON.stringify({ total: out.length, bad: out.filter(o => !o.ok) });
  })()`));
  console.log(`words checked: ${res.total}`);
  console.log(`displayed word matches the taught letters: ${res.total - res.bad.length}/${res.total}`);
  res.bad.forEach((b) => console.log(`   ✗ ${b.id}: shown "${b.shown}" vs letters "${b.letters}"`));
  ws.close();
  process.exit(res.bad.length ? 1 : 0);
})();
