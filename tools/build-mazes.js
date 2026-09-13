/* Regenerate the mazes in js/maze-data.js from tools/gen-maze.js.
 *
 *   node tools/build-mazes.js            # regenerate + validate + write
 *   node tools/build-mazes.js --check    # validate only, never write
 *
 * It only writes when EVERY maze passes the validator rules (row widths,
 * borders, reachability, one safe region per area, <= 1 barrier entry).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'js', 'maze-data.js');
const checkOnly = process.argv.includes('--check');
const gen = require('./gen-maze.js');

const generated = {};
const lines = [];
for (const id of Object.keys(gen.CONFIGS)) {
  const rows = gen.generate(gen.CONFIGS[id]);
  generated[id] = { id: id, rows: rows };
  lines.push(`    ${id}: {`);
  lines.push(`      id: '${id}',`);
  lines.push('      rows: [');
  rows.forEach((r, i) => lines.push(`        '${r}'${i < rows.length - 1 ? ',' : ''}`));
  lines.push('      ]');
  lines.push('    },');
}
const mapsBlock = lines.join('\n').replace(/,$/, '');

/* ---- validate every generated maze before touching the file ---- */
const D = require(DATA);
const MAZE_IDS = Object.keys(gen.CONFIGS);
{
  let bad = 0;
  for (const id of MAZE_IDS) {
    const entry = generated[id];
    const maze = D.prepareMaze({ id: id, rows: entry.rows.slice() });
    const res = D.validateMaze(maze);
    const open = entry.rows.join('').split('').filter((c) => c === '.').length;
    console.log(`${res.ok ? '✓' : '✗'} ${id.padEnd(6)} ${entry.rows[0].length}x${entry.rows.length} corridors=${open}` +
                ` bands=[${maze.meta.hazardRows}] regions=${JSON.stringify(res.regions)} maxEntries=${res.maxEntries}` +
                ` player=${JSON.stringify(maze.meta.player)} sheikh=${JSON.stringify(maze.meta.sheikh)}`);
    if (!res.ok) { bad++; res.errors.forEach((e) => console.log('    ! ' + e)); }
  }
  if (bad) { console.error(`\n${bad} maze(s) failed validation — nothing written`); process.exit(1); }
}

if (checkOnly) { console.log('\nall mazes valid (--check: not written)'); process.exit(0); }

/* ---- splice into js/maze-data.js ---- */
let s = fs.readFileSync(DATA, 'utf8');
const i0 = s.indexOf('  var MAZES = {');
const i1 = s.indexOf('  /* Pick a maze for the current viewport');
if (i0 === -1 || i1 === -1) throw new Error('cannot find the MAZES block in maze-data.js');
const header =
`  /* Three generated mazes (see tools/gen-maze.js, rebuild with
     tools/build-mazes.js) — dense 1-tile corridors, a full-width WATER band and
     a full-width FIRE band that split each maze into a top area, the middle home
     area (player + sheikh) and a bottom area:
       wide  : 27 x 23  — desktop / landscape
       tall  : 19 x 31  — tablets and larger phones in portrait
       phone : 17 x 25  — phones in portrait (fewest columns => biggest tiles)  */
  var MAZES = {
`;
s = s.slice(0, i0) + header + mapsBlock + '\n  };\n\n' + s.slice(i1);
fs.writeFileSync(DATA, s);
console.log('\njs/maze-data.js updated with ' + MAZE_IDS.length + ' mazes');
