/* Verify REAL audio playback (real clock, real user gesture) through the
 * Chrome DevTools Protocol. Run: node tools/verify-audio.js
 * Requires chrome started with --remote-debugging-port=9222 on the game page. */
'use strict';

const PORT = process.env.CDP_PORT || 9222;

async function main() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'));
  if (!page) throw new Error('game page not found; targets: ' + list.map((t) => t.url).join(', '));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  async function evalJs(expression) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return 'EXCEPTION: ' + JSON.stringify(r.result.exceptionDetails.text || r.result.exceptionDetails);
    return r.result && r.result.result ? r.result.result.value : undefined;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // wait for the game to be ready
  for (let i = 0; i < 40; i++) {
    const ready = await evalJs("document.readyState === 'complete' && !!document.getElementById('audioStatus')");
    if (ready === true) break;
    await sleep(250);
  }

  console.log('--- 1) direct clip decode + playback probe (audio/noor.mp3) ---');
  console.log(await evalJs(`(async () => {
    const a = new Audio('audio/noor.mp3');
    const state = await new Promise(res => {
      a.oncanplay = () => res('canplay');
      a.onerror = () => res('error');
      setTimeout(() => res('timeout'), 8000);
      a.load();
    });
    if (state !== 'canplay') return 'load=' + state;
    const r = await new Promise(async res => {
      try { await a.play(); } catch (e) { return res('play-rejected:' + e.name); }
      setTimeout(() => res('playing=' + !a.paused + ' currentTime=' + a.currentTime.toFixed(2) + ' duration=' + (isFinite(a.duration) ? a.duration.toFixed(2) : '?')), 900);
    });
    return 'load=canplay ' + r;
  })()`));

  console.log('--- 2) click the real Listen button (user gesture) then read the UI status ---');
  const rect = await evalJs(`(() => { const b = document.getElementById('btnListen'); const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: Math.round(rect.x), y: Math.round(rect.y), button: 'left', clickCount: 1 });
  }
  await sleep(1500);
  console.log('audioStatus class :', await evalJs("document.getElementById('audioStatus').className"));
  console.log('audioStatus text  :', await evalJs("document.getElementById('audioStatus').textContent"));
  console.log('word audio url    :', await evalJs('(window.QMazeData && QMazeData.WORDS[0].audio.url) || "-"'));

  console.log('--- 3) count how many bundled clips are playable ---');
  console.log(await evalJs(`(async () => {
    const ids = ['noor','qamar','shams','maa','bahr','jabal','amal','layl','kitab','samaa','shifaa','rahma'];
    const out = [];
    for (const id of ids) {
      const ok = await new Promise(res => {
        const a = new Audio('audio/' + id + '.mp3');
        a.oncanplay = () => res('ok');
        a.onerror = () => res('fail');
        setTimeout(() => res('timeout'), 6000);
        a.load();
      });
      out.push(id + ':' + ok);
    }
    return out.join(' ');
  })()`));

  ws.close();
}
main().catch((e) => { console.error('probe failed:', e.message); process.exit(1); });
