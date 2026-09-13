/* tools-style standalone check for maze maps & word data.
   Run: node validate.js  */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'js', 'maze-data.js'));

let failed = false;
for (const key of Object.keys(M.MAZES)) {
  const maze = M.MAZES[key];
  M.prepareMaze(maze);
  const res = M.validateMaze(maze);
  console.log('=== maze:', key, '=== ');
  console.log(M.dumpMaze(maze));
  console.log('player:', maze.meta.player, ' sheikh:', maze.meta.sheikh, ' hazardRows:', maze.meta.hazardRows);
  if (res.ok) {
    console.log('OK — all walkable tiles reachable, borders fine.');
  } else {
    failed = true;
    console.log('PROBLEMS:');
    res.errors.forEach(e => console.log('  - ' + e));
  }
}

// words sanity: letters length > 0, every glyph non-empty & not a diacritic-only
const diacriticOnly = /^[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]+$/;
for (const w of M.WORDS) {
  const bad = w.letters.filter(g => !g || diacriticOnly.test(g));
  if (!w.id || !w.letters.length || !w.recite || bad.length) {
    failed = true;
    console.log('BAD WORD:', JSON.stringify(w));
  }
}
console.log('Words:', M.WORDS.map(w => w.id + ':' + w.letters.join('')).join('  '));
console.log(failed ? 'RESULT: FAILED' : 'RESULT: ALL OK');
process.exit(failed ? 1 : 0);
