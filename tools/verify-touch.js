/* Phone / touch verification over the DevTools protocol.
 *
 * For each phone viewport it reloads the page (so the game picks its maze for
 * that orientation) and checks:
 *   1. the right maze is chosen automatically (portrait -> tall, landscape -> wide)
 *   2. maze size / tile size on the phone screen
 *   3. the on-screen touch bar and its touch-target sizes
 *   4. a SWIPE on the maze moves the pac-man
 *   5. a TAP on the d-pad moves the pac-man
 *   6. letters are spread over all three maze areas
 *
 * Run: node tools/verify-touch.js   (chrome on --remote-debugging-port=9222,
 *      page opened with ?autostart&debug)
 */
'use strict';
const PORT = process.env.CDP_PORT || 9222;

async function main() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'));
  if (!page) throw new Error('game page not found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return 'EXCEPTION ' + (r.result.exceptionDetails.text || '');
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const results = [];
  const check = (ok, label, detail) => { results.push({ ok, label }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); };

  const PHONES = [
    { name: 'iPhone 12 portrait', w: 390, h: 844, wantMaze: 'tall' },
    { name: 'small Android portrait', w: 360, h: 640, wantMaze: 'tall' },
    { name: 'phone landscape', w: 844, h: 390, wantMaze: 'wide' }
  ];
  const DIR_KEYS = { up: 0, right: 1, down: 2, left: 3 };
  const DELTA = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };

  for (const phone of PHONES) {
    console.log(`\n=== ${phone.name} (${phone.w}x${phone.h}) ===`);
    await send('Emulation.setDeviceMetricsOverride', { width: phone.w, height: phone.h, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload', { ignoreCache: false });
    await sleep(2200);
    await evalJs("window.dispatchEvent(new Event('resize'))");
    await sleep(400);

    const info = await evalJs(`(() => {
      const cv = document.getElementById('cv').getBoundingClientRect();
      const bar = document.querySelector('.touchBar');
      const st = window.__qp.state();
      return {
        maze: st.maze, cols: st.cols, rows: st.rows, tile: st.tile,
        canvas: Math.round(cv.width) + 'x' + Math.round(cv.height),
        wPct: Math.round(cv.width / innerWidth * 100), hPct: Math.round(cv.height / innerHeight * 100),
        barVisible: !!(bar && bar.offsetParent !== null), barH: bar ? Math.round(bar.offsetHeight) : 0,
        barW: bar ? Math.round(bar.offsetWidth) : 0,
        zones: [...new Set(st.letters.filter(l => !l.taken).map(l => l.zone))].sort().join(',')
      };
    })()`);
    console.log(`   maze=${info.maze} ${info.cols}x${info.rows} tile=${info.tile}px canvas=${info.canvas} (${info.wPct}% w, ${info.hPct}% h)`);
    console.log(`   touchBar ${info.barVisible ? 'visible' : 'hidden'} (${info.barW}x${info.barH}), letter zones=${info.zones}`);
    check(info.maze === phone.wantMaze, 'maze auto-selected for orientation', info.maze);
    check(info.barVisible, 'touch controls visible');
    check(info.zones.split(',').length === 3, 'letters spread over 3 areas', 'zones ' + info.zones);
    check(info.hPct >= 45, 'maze uses a good share of the phone screen', info.hPct + '% height');

    // ---------- swipe ----------
    const cRect = await evalJs("(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()");
    const openDirs = await evalJs('window.__qp.open()');
    const swipeDir = ['right', 'left', 'down', 'up'].find((d) => openDirs[d] === 'corridor')
                  || ['right', 'left', 'down', 'up'].find((d) => openDirs[d] !== 'wall' && openDirs[d] !== 'sheikh');
    const [dr, dc] = DELTA[swipeDir];
    const cx = Math.round(cRect.x + cRect.w * 0.5), cy = Math.round(cRect.y + cRect.h * 0.5);
    const before = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 6; i++) {
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + dc * i * 14, y: cy + dr * i * 14 }] });
      await sleep(60);
    }
    await sleep(500);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const after = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    check(after.r !== before.r || after.c !== before.c,
          `swipe (${swipeDir}) moves the player`, `${before.r},${before.c} -> ${after.r},${after.c}`);

    // the joystick must stop when the finger is lifted (no locked direction)
    const afterRelease = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    await sleep(1400);
    const later = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    const drift = Math.abs(later.r - afterRelease.r) + Math.abs(later.c - afterRelease.c);
    check(drift <= 1, 'movement stops when the finger is lifted', `drift ${drift} tile(s)`);

    // ---------- d-pad ----------
    const openNow = await evalJs('window.__qp.open()');
    const padDir = ['up', 'down', 'left', 'right'].find((d) => openNow[d] === 'corridor')
                || ['up', 'down', 'left', 'right'].find((d) => openNow[d] !== 'wall' && openNow[d] !== 'sheikh');
    const padSel = '.pad' + padDir.charAt(0).toUpperCase() + padDir.slice(1);
    const padRect = await evalJs(`(() => { const b = document.querySelector('${padSel}'); const r = b.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width), h: Math.round(r.height) }; })()`);
    const beforePad = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: padRect.x, y: padRect.y }] });
    await sleep(450);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(250);
    const afterPad = JSON.parse(await evalJs('JSON.stringify(window.__qp.pos())'));
    check(afterPad.r !== beforePad.r || afterPad.c !== beforePad.c,
          `d-pad tap (${padDir}) moves the player`, `${beforePad.r},${beforePad.c} -> ${afterPad.r},${afterPad.c}`);
    check(padRect.w >= 44 && padRect.h >= 44, 'd-pad touch target is big enough', `${padRect.w}x${padRect.h}px`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nTOUCH VERIFY: ${failed ? failed + ' FAILED' : 'ALL PASSED'} (${results.length} checks)`);
  ws.close();
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error('touch verify failed:', e.message); process.exit(1); });
