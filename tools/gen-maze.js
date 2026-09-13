/* Dense maze generator for Quran Letter Maze.
 *
 * Produces two braided mazes (1-tile corridors, no big empty rooms):
 *   wide : 27 x 23  (landscape / desktop)
 *   tall : 19 x 31  (portrait / phones — fewer columns => bigger tiles)
 *
 * Each maze keeps the game's contract:
 *   - two full-width hazard BANDS (water ~ , fire ^) that split the maze into
 *     a top area, the middle "home" area (player + sheikh) and a bottom area
 *   - every walkable tile reachable (hazards are passable with an item)
 *   - the sheikh is always reachable from the player WITHOUT spending items
 *   - every area is big enough for letters
 *
 * Deterministic (seeded), so re-running reproduces the same maps.
 *
 * Run: node tools/gen-maze.js            # prints JS code for maze-data.js
 *      node tools/gen-maze.js --check    # only validate
 */
'use strict';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const CONFIGS = {
  wide:  { cols: 27, rows: 23, bands: [[7, '~'], [15, '^']],  seed: 20250913, braid: 0.55 },
  tall:  { cols: 19, rows: 31, bands: [[11, '~'], [21, '^']], seed: 771117, braid: 0.55 },
  /* phones: fewer columns -> bigger tiles on a narrow screen */
  phone:  { cols: 17, rows: 29, bands: [[9, '~'], [19, '^']],  seed: 515023, braid: 0.55 },
  phoneS: { cols: 17, rows: 23, bands: [[7, '~'], [15, '^']],  seed: 880417, braid: 0.55 }
};

function makeGrid(R, C, ch) {
  return Array.from({ length: R }, () => new Array(C).fill(ch));
}
function inBounds(r, c, R, C) { return r > 0 && c > 0 && r < R - 1 && c < C - 1; }

function generate(cfg) {
  const R = cfg.rows, C = cfg.cols;
  const g = makeGrid(R, C, '#');
  const rnd = mulberry32(cfg.seed);

  // 1) carve the cell lattice (odd,odd)
  for (let r = 1; r < R - 1; r += 2) for (let c = 1; c < C - 1; c += 2) g[r][c] = '.';

  // 2) recursive backtracker -> perfect maze
  const visited = new Set(['1,1']);
  const stack = [[1, 1]];
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const options = [];
    for (const [dr, dc] of [[0, 2], [0, -2], [2, 0], [-2, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc, R, C) && !visited.has(nr + ',' + nc)) options.push([nr, nc, dr / 2, dc / 2]);
    }
    if (!options.length) { stack.pop(); continue; }
    const [nr, nc, wr, wc] = options[Math.floor(rnd() * options.length)];
    g[r + wr][c + wc] = '.';
    g[nr][nc] = '.';
    visited.add(nr + ',' + nc);
    stack.push([nr, nc]);
  }

  // 3) braid: open most dead ends so there are loops (friendlier for kids)
  for (let r = 1; r < R - 1; r += 2) {
    for (let c = 1; c < C - 1; c += 2) {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const open = dirs.filter(([dr, dc]) => inBounds(r + dr, c + dc, R, C) && g[r + dr][c + dc] === '.');
      if (open.length > 1) continue;
      if (rnd() > cfg.braid) continue;
      const walls = dirs.filter(([dr, dc]) => inBounds(r + dr, c + dc, R, C) && g[r + dr][c + dc] === '#');
      if (!walls.length) continue;
      const [dr, dc] = walls[Math.floor(rnd() * walls.length)];
      g[r + dr][c + dc] = '.';
    }
  }

  // 4) hazard bands across the full width
  for (const [row, ch] of cfg.bands) for (let c = 1; c < C - 1; c++) g[row][c] = ch;

  // 5) openings between every band and the areas above/below it, including at
  //    least two ALIGNED columns so a straight (1 item) crossing always exists
  for (const [row] of cfg.bands) {
    ensureOpenings(g, row - 1, 3, rnd, R, C);
    ensureOpenings(g, row + 1, 3, rnd, R, C);
    alignOpenings(g, row, R, C);
  }

  // 6) EVERY area must be internally connected using safe tiles only. Without
  //    this a letter could sit in a pocket that can only be reached by walking
  //    along a hazard band (extra items / seemingly unreachable).
  const zones = [
    [1, cfg.bands[0][0] - 1],
    [cfg.bands[0][0] + 1, cfg.bands[1][0] - 1],
    [cfg.bands[1][0] + 1, R - 2]
  ];
  for (const [zr0, zr1] of zones) connectZone(g, zr0, zr1, R, C);

  // 7) player + sheikh: the two cells farthest apart inside the middle area
  const ends = placeEndpoints(g, zones[1][0], zones[1][1], R, C);
  g[ends.P.r][ends.P.c] = 'P';
  g[ends.S.r][ends.S.c] = 'S';

  return g.map((row) => row.join(''));
}

/* make sure at least two columns are open on BOTH sides of a hazard band */
function alignOpenings(g, bandRow, R, C) {
  const above = [], below = [];
  for (let c = 1; c < C - 1; c += 2) {
    if (g[bandRow - 1][c] === '.') above.push(c);
    if (g[bandRow + 1][c] === '.') below.push(c);
  }
  let need = 2 - above.filter((c) => below.indexOf(c) !== -1).length;
  for (const c of above) {
    if (need <= 0) break;
    if (g[bandRow + 1][c] === '#') { g[bandRow + 1][c] = '.'; need--; }
  }
  for (const c of below) {
    if (need <= 0) break;
    if (g[bandRow - 1][c] === '#') { g[bandRow - 1][c] = '.'; need--; }
  }
}

function ensureOpenings(g, wallRow, want, rnd, R, C) {
  if (wallRow < 1 || wallRow > R - 2) return;
  const cols = [];
  for (let c = 1; c < C - 1; c += 2) if (g[wallRow][c] === '.') cols.push(c);
  const candidates = [];
  for (let c = 1; c < C - 1; c += 2) if (g[wallRow][c] === '#') candidates.push(c);
  while (cols.length < want && candidates.length) {
    const i = Math.floor(rnd() * candidates.length);
    const c = candidates.splice(i, 1)[0];
    g[wallRow][c] = '.';
    cols.push(c);
  }
}

/* connect all safe tiles inside rows r0..r1 by carving walls between components */
function connectZone(g, r0, r1, R, C) {
  for (let pass = 0; pass < 400; pass++) {
    const comp = labelComponents(g, r0, r1, R, C);
    let ids = new Set();
    for (let r = r0; r <= r1; r++) for (let c = 1; c < C - 1; c++) if (comp[r][c] > 0) ids.add(comp[r][c]);
    if (ids.size <= 1) return true;
    let carved = false;
    for (let r = r0; r <= r1 && !carved; r++) {
      for (let c = 1; c < C - 1 && !carved; c++) {
        if (g[r][c] !== '#') continue;
        const around = new Set();
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < r0 || nr > r1 || nc < 1 || nc > C - 2) continue;
          if (comp[nr][nc] > 0) around.add(comp[nr][nc]);
        }
        if (around.size >= 2) { g[r][c] = '.'; carved = true; }
      }
    }
    if (!carved) return false;
  }
  return false;
}

function labelComponents(g, r0, r1, R, C) {
  const comp = Array.from({ length: R }, () => new Array(C).fill(0));
  let id = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = 1; c < C - 1; c++) {
      if (g[r][c] !== '.' || comp[r][c]) continue;
      id++;
      const stack = [[r, c]];
      comp[r][c] = id;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < r0 || nr > r1 || nc < 1 || nc > C - 2) continue;
          if (g[nr][nc] !== '.' || comp[nr][nc]) continue;
          comp[nr][nc] = id;
          stack.push([nr, nc]);
        }
      }
    }
  }
  return comp;
}

/* BFS over the cell graph (odd,odd cells joined when the tile between is open) */
function placeEndpoints(g, r0, r1, R, C) {
  const cells = [];
  for (let r = r0; r <= r1; r++) for (let c = 1; c < C - 1; c++) if (r % 2 === 1 && c % 2 === 1 && g[r][c] === '.') cells.push([r, c]);
  const key = (r, c) => r + ',' + c;
  const neighbors = (r, c) => {
    const out = [];
    for (const [dr, dc] of [[0, 2], [0, -2], [2, 0], [-2, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (!g[nr] || g[nr][nc] !== '.') continue;
      if (nr < r0 || nr > r1) continue;
      if (g[r + dr / 2][c + dc / 2] !== '.') continue;
      out.push([nr, nc]);
    }
    return out;
  };
  function bfs(start) {
    const dist = new Map([[key(start[0], start[1]), 0]]);
    const queue = [start];
    let far = start, farD = 0;
    while (queue.length) {
      const [r, c] = queue.shift();
      const d = dist.get(key(r, c));
      if (d > farD) { farD = d; far = [r, c]; }
      for (const n of neighbors(r, c)) {
        if (dist.has(key(n[0], n[1]))) continue;
        dist.set(key(n[0], n[1]), d + 1);
        queue.push(n);
      }
    }
    return { far, farD, reached: dist.size };
  }
  if (!cells.length) throw new Error('no cells in middle zone');
  let mid = cells[0];
  if (g[mid[0]][mid[1]] !== '.') mid = cells[Math.floor(cells.length / 2)];
  const a = bfs(mid).far;
  const b = bfs(a).far;
  return { P: { r: a[0], c: a[1] }, S: { r: b[0], c: b[1] } };
}

function jsRows(rows) {
  return rows.map((r) => "        '" + r + "'").join(',\n');
}

module.exports = { CONFIGS: CONFIGS, generate: generate };

function main() {
  const checkOnly = process.argv.includes('--check');
  const D = require('../js/maze-data.js');
  const out = {};
  for (const name of Object.keys(CONFIGS)) {
    const rows = generate(CONFIGS[name]);
    out[name] = rows;
    // validate with the game's own rules
    const maze = D.prepareMaze({ id: name, rows: rows.slice() });
    const res = D.validateMaze(maze);
    const open = rows.join('').split('').filter((c) => c === '.').length;
    const bands = maze.meta.hazardRows;
    console.log(`${res.ok ? 'PASS' : 'FAIL'} ${name}: ${rows[0].length}x${rows.length} corridors=${open} bands=[${bands}]` +
                ` player=${JSON.stringify(maze.meta.player)} sheikh=${JSON.stringify(maze.meta.sheikh)}` +
                ` zones=${JSON.stringify(res.zones)}`);
    if (!res.ok) res.errors.forEach((e) => console.log('   ! ' + e));
    if (!checkOnly) {
      console.log(rows.join('\n'));
      console.log('');
    }
  }
  if (!checkOnly) {
    console.log('--- JS for maze-data.js ---');
    for (const name of Object.keys(out)) {
      console.log("    " + name + ": {");
      console.log("      id: '" + name + "',");
      console.log('      rows: [');
      console.log(jsRows(out[name]));
      console.log('      ]');
      console.log('    },');
    }
  }
}
if (require.main === module) main();
