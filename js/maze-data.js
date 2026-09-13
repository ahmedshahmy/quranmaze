/* ============================================================
 * maze-data.js — maze template + Quran word list (pure data)
 * Symbols used in a maze map:
 *   '#'  wall            '.'  corridor
 *   '~'  water hazard    '^'  fire hazard
 *   'P'  player start    'S'  sheikh spot
 *
 * The map is built from segments so every row is exactly the
 * right width (validated by tools/validate.js).
 * ============================================================ */
(function (global) {
  'use strict';

  /* Two generated mazes (see tools/gen-maze.js) — dense 1-tile corridors,
     a full-width WATER band and a full-width FIRE band that split each maze
     into a top area, the middle home area (player + sheikh) and a bottom area:
       wide : 27 x 23  — desktop / landscape
       tall : 19 x 31  — portrait phones (fewer columns => bigger tiles)  */
  var MAZES = {
    wide: {
    id: 'wide',
    rows: [
        '###########################',
        '#.#...........#...........#',
        '#.#.###.#.#####.#.###.#####',
        '#.#...#...#.....#...#.....#',
        '#.#####.###.#######.#####.#',
        '#.....#...........#...#...#',
        '#####.###########.###.#.#.#',
        '#~~~~~~~~~~~~~~~~~~~~~~~~~#',
        '#.#############.#####.#.#.#',
        '#.........#...........#.#P#',
        '###.#.###.#.#.#.###.###.#.#',
        '#...#...#...#.#...#.......#',
        '#.###.#.#####.#.#.###.#####',
        '#.#...#....S#.#.#...#.....#',
        '#.#.#######.#.#.###.#.###.#',
        '#^^^^^^^^^^^^^^^^^^^^^^^^^#',
        '#.#.#.#.#.#######.#.#####.#',
        '#...#.#.#...#.....#.....#.#',
        '#.###.#.#.#.#.###.#####.#.#',
        '#...#...#.#.#...#.#...#.#.#',
        '#.#.#####.#.###.#.#.#.#.#.#',
        '#...............#...#.....#',
        '###########################'
    ]
    },
    tall: {
    id: 'tall',
    rows: [
        '###################',
        '#.#.....#.....#...#',
        '#.#.#.#.#.###.#.#.#',
        '#...#.#.....#...#.#',
        '#.###.#####.#####.#',
        '#.#...#...........#',
        '#.#.#.#.#########.#',
        '#...#.#.......#...#',
        '#####.#.#.###.#.###',
        '#.....#.#.#...#.#.#',
        '#.#.#.#.#.#.###.#.#',
        '#~~~~~~~~~~~~~~~~~#',
        '#.#######.###.###.#',
        '#...#...........#P#',
        '#.#.#.#.###.###.#.#',
        '#.#...#.#...#...#.#',
        '#.#####.#.#.#.###.#',
        '#...#...#.#.#.#...#',
        '#.#.#.###.#.#.###.#',
        '#..S#...#.#.#.....#',
        '#.#.###.#.#.#####.#',
        '#^^^^^^^^^^^^^^^^^#',
        '#.#######.#.#.#####',
        '#.........#.#.....#',
        '###.#.#.#########.#',
        '#...#...#...#...#.#',
        '#.#.#####.#.#.#.#.#',
        '#.#.#...#.#.#.#...#',
        '#.###.#.#.#.#.###.#',
        '#.....#...#.......#',
        '###################'
    ]
    },
  };

  /* Pick a maze for the current viewport (portrait -> the tall maze).
     An explicit ?maze=wide|tall always wins. */
  function pickMaze(vw, vh, prefer) {
    if (prefer && MAZES[prefer]) return MAZES[prefer];
    return (vh > vw * 1.02) ? MAZES.tall : MAZES.wide;
  }

  /* ------------------------------------------------------------
   * Quran words. The word itself is NEVER displayed during play —
   * it is only recited (bundled clip / online clip / TTS).
   *  letters : isolated glyphs the player must collect IN ORDER
   *  recite  : vocalised text for speech synthesis
   *  audio   : verified Qur'an word-by-word recitation
   *            audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3
   *            (see tools/resolve-audio.js — resolved via api.quran.com)
   *  ref     : shown only in the end-of-round recap
   * ------------------------------------------------------------ */
  var WORDS = [
    {
      id: 'noor', letters: ['ن', 'و', 'ر'], recite: 'نُور', translit: 'nūr', meaning: 'light',
      audio: { s: 24, a: 35, w: 2, text: 'نُورُ', url: 'https://audio.qurancdn.com/wbw/024_035_002.mp3' },
      ref: 'سورة النور ٣٥ ﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ﴾'
    },
    {
      id: 'qamar', letters: ['ق', 'م', 'ر'], recite: 'قَمَر', translit: 'qamar', meaning: 'moon',
      audio: { s: 54, a: 1, w: 4, text: 'ٱلْقَمَرُ', url: 'https://audio.qurancdn.com/wbw/054_001_004.mp3' },
      ref: 'سورة القمر ١ ﴿ٱقْتَرَبَتِ ٱلسَّاعَةُ وَٱنشَقَّ ٱلْقَمَرُ﴾'
    },
    {
      id: 'shams', letters: ['ش', 'م', 'س'], recite: 'شَمْس', translit: 'shams', meaning: 'sun',
      audio: { s: 91, a: 1, w: 1, text: 'وَٱلشَّمْسِ', url: 'https://audio.qurancdn.com/wbw/091_001_001.mp3' },
      ref: 'سورة الشمس ١ ﴿وَٱلشَّمْسِ وَضُحَىٰهَا﴾'
    },
    {
      id: 'maa', letters: ['م', 'ا', 'ء'], recite: 'مَاء', translit: 'māʼ', meaning: 'water',
      audio: { s: 23, a: 18, w: 4, text: 'مَاءً', url: 'https://audio.qurancdn.com/wbw/023_018_004.mp3' },
      ref: 'سورة المؤمنون ١٨ ﴿وَأَنزَلْنَا مِنَ ٱلسَّمَاءِ مَاءً بِقَدَرٍ﴾'
    },
    {
      id: 'bahr', letters: ['ب', 'ح', 'ر'], recite: 'بَحْر', translit: 'baḥr', meaning: 'sea',
      audio: { s: 24, a: 40, w: 4, text: 'بَحْرٍ', url: 'https://audio.qurancdn.com/wbw/024_040_004.mp3' },
      ref: 'سورة النور ٤٠ ﴿أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ﴾'
    },
    {
      id: 'jabal', letters: ['ج', 'ب', 'ل'], recite: 'جَبَل', translit: 'jabal', meaning: 'mountain',
      audio: { s: 59, a: 21, w: 6, text: 'جَبَلٍ', url: 'https://audio.qurancdn.com/wbw/059_021_006.mp3' },
      ref: 'سورة الحشر ٢١ ﴿لَوْ أَنزَلْنَا هَذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا﴾'
    },
    {
      id: 'amal', letters: ['ع', 'م', 'ل'], recite: 'عَمَل', translit: 'ʿamal', meaning: 'good deed',
      audio: { s: 18, a: 30, w: 12, text: 'عَمَلًا', url: 'https://audio.qurancdn.com/wbw/018_030_012.mp3' },
      ref: 'سورة الكهف ٣٠ ﴿إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا﴾'
    },
    {
      id: 'layl', letters: ['ل', 'ي', 'ل'], recite: 'لَيْل', translit: 'layl', meaning: 'night',
      audio: { s: 17, a: 1, w: 5, text: 'لَيْلًا', url: 'https://audio.qurancdn.com/wbw/017_001_005.mp3' },
      ref: 'سورة الإسراء ١ ﴿سُبْحَانَ ٱلَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا﴾'
    },
    {
      id: 'kitab', letters: ['ك', 'ت', 'ا', 'ب'], recite: 'كِتَاب', translit: 'kitāb', meaning: 'book',
      audio: { s: 2, a: 2, w: 2, text: 'ٱلْكِتَابُ', url: 'https://audio.qurancdn.com/wbw/002_002_002.mp3' },
      ref: 'سورة البقرة ٢ ﴿ذَٰلِكَ ٱلْكِتَابُ لَا رَيْبَ فِيهِ﴾'
    },
    {
      id: 'samaa', letters: ['س', 'م', 'ا', 'ء'], recite: 'سَمَاء', translit: 'samāʼ', meaning: 'sky',
      audio: { s: 2, a: 22, w: 6, text: 'وَٱلسَّمَاءَ', url: 'https://audio.qurancdn.com/wbw/002_022_006.mp3' },
      ref: 'سورة البقرة ٢٢ ﴿ٱلَّذِي جَعَلَ لَكُمُ ٱلْأَرْضَ فِرَاشًا وَٱلسَّمَاءَ بِنَاءً﴾'
    },
    {
      id: 'shifaa', letters: ['ش', 'ف', 'ا', 'ء'], recite: 'شِفَاء', translit: 'shifāʼ', meaning: 'healing',
      audio: { s: 16, a: 69, w: 17, text: 'شِفَاءٌ', url: 'https://audio.qurancdn.com/wbw/016_069_017.mp3' },
      ref: 'سورة النحل ٦٩ ﴿فِيهِ شِفَاءٌ لِلنَّاسِ﴾'
    },
    {
      id: 'rahma', letters: ['ر', 'ح', 'م', 'ة'], recite: 'رَحْمَة', translit: 'raḥmah', meaning: 'mercy',
      audio: { s: 10, a: 57, w: 13, text: 'وَرَحْمَةٌ', url: 'https://audio.qurancdn.com/wbw/010_057_013.mp3' },
      ref: 'سورة يونس ٥٧ ﴿... وَهُدًى وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾'
    }
  ];

  /* ---------- generic maze helpers (game + validator) ---------- */

  function tileTypeAt(maze, r, c) {
    var rowStr = maze.rows[r];
    if (!rowStr) return 'wall';
    var ch = rowStr[c];
    if (ch === undefined || ch === '') return 'wall';
    if (ch === '~') return 'water';
    if (ch === '^') return 'fire';
    if (ch === 'P' || ch === 'S' || ch === '.' || ch === ' ') return 'corridor';
    return 'wall';
  }
  function isHazardType(ch) { return ch === '~' || ch === '^'; }
  function isWalkableChar(ch) { return ch === '.' || ch === ' ' || ch === 'P' || ch === 'S' || isHazardType(ch); }

  function neighborKeys(key, R, C, maze, allowHazards) {
    var parts = key.split(',');
    var rr = +parts[0], cc = +parts[1];
    var out = [];
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < 4; i++) {
      var nr = rr + dirs[i][0], nc = cc + dirs[i][1];
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      var ch = maze.rows[nr][nc];
      if (!isWalkableChar(ch)) continue;
      if (!allowHazards && isHazardType(ch)) continue;
      out.push(nr + ',' + nc);
    }
    return out;
  }

  /* Flood over every walkable tile (hazards treated as passable). */
  function floodAll(maze) {
    var R = maze.rows.length, C = maze.rows[0].length;
    var start = null;
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (maze.rows[r][c] === 'P') start = r + ',' + c;
    if (!start) return null;
    var seen = new Set([start]), stack = [start];
    while (stack.length) {
      var key = stack.pop();
      var nk = neighborKeys(key, R, C, maze, true);
      for (var i = 0; i < nk.length; i++) if (!seen.has(nk[i])) { seen.add(nk[i]); stack.push(nk[i]); }
    }
    return { reachable: seen, R: R, C: C };
  }

  /* Flood over safe (non hazard) tiles only. */
  function safeFlood(maze, fromR, fromC) {
    var R = maze.rows.length, C = maze.rows[0].length;
    var seen = new Set();
    var ch0 = maze.rows[fromR] && maze.rows[fromR][fromC];
    if (!isWalkableChar(ch0) || isHazardType(ch0)) return seen;
    var start = fromR + ',' + fromC;
    seen.add(start);
    var stack = [start];
    while (stack.length) {
      var key = stack.pop();
      var nk = neighborKeys(key, R, C, maze, false);
      for (var i = 0; i < nk.length; i++) if (!seen.has(nk[i])) { seen.add(nk[i]); stack.push(nk[i]); }
    }
    return seen;
  }
  function safeComponentFrom(maze, fromR, fromC) { return safeFlood(maze, fromR, fromC); }

  function hazardRowsOf(maze, ch) {
    var out = [];
    for (var r = 0; r < maze.rows.length; r++) if (maze.rows[r].indexOf(ch) !== -1) out.push(r);
    return out;
  }

  /* Rows that form a full-width hazard BAND (the barriers that separate the
     maze areas). Partial accents (a few hazard tiles in a row) are ignored,
     so they do not create extra zones. */
  function bandRowsOf(maze) {
    var C = maze.rows[0].length;
    var out = [];
    for (var r = 0; r < maze.rows.length; r++) {
      var n = 0;
      for (var c = 0; c < C; c++) if (isHazardType(maze.rows[r][c])) n++;
      if (n >= C - 2) out.push(r);
    }
    return out;
  }
  function zoneOfRow(maze, r) {
    var hr = (maze.meta && maze.meta.hazardRows) || [];
    var z = 0;
    for (var i = 0; i < hr.length; i++) if (r > hr[i]) z++;
    return z;
  }
  function mazePlayerPos(maze) {
    for (var r = 0; r < maze.rows.length; r++) {
      var c = maze.rows[r].indexOf('P');
      if (c !== -1) return { r: r, c: c };
    }
    return { r: 1, c: 1 };
  }
  function mazeSheikhPos(maze) {
    for (var r = 0; r < maze.rows.length; r++) {
      var c = maze.rows[r].indexOf('S');
      if (c !== -1) return { r: r, c: c };
    }
    return null;
  }

  function prepareMaze(maze) {
    maze.meta = {
      cols: maze.rows[0].length,
      rows: maze.rows.length,
      hazardRows: bandRowsOf(maze),
      player: mazePlayerPos(maze),
      sheikh: mazeSheikhPos(maze)
    };
    return maze;
  }

  /* ---------- validation ---------- */
  function validateMaze(maze) {
    var errors = [];
    var R = maze.rows.length, C = maze.rows[0] ? maze.rows[0].length : 0;
    for (var r = 0; r < R; r++) {
      if (maze.rows[r].length !== C) errors.push('row ' + r + ' width ' + maze.rows[r].length + ' != ' + C);
    }
    for (var c0 = 0; c0 < C; c0++) {
      if (maze.rows[0][c0] !== '#') errors.push('top border broken at ' + c0);
      if (maze.rows[R - 1][c0] !== '#') errors.push('bottom border broken at ' + c0);
    }
    for (var rr = 0; rr < R; rr++) {
      if (maze.rows[rr][0] !== '#' || maze.rows[rr][C - 1] !== '#') errors.push('side border broken row ' + rr);
    }
    var p = mazePlayerPos(maze), s = mazeSheikhPos(maze);
    if (maze.rows[p.r][p.c] !== 'P') errors.push('no player start');
    if (!s || maze.rows[s.r][s.c] !== 'S') errors.push('no sheikh');

    var flood = floodAll(maze);
    if (!flood) { errors.push('no flood'); return { ok: false, errors: errors }; }
    var unreachable = [];
    for (var r2 = 0; r2 < R; r2++) for (var c2 = 0; c2 < C; c2++) {
      if (isWalkableChar(maze.rows[r2][c2]) && !flood.reachable.has(r2 + ',' + c2)) unreachable.push(r2 + ',' + c2);
    }
    if (unreachable.length) errors.push('unreachable walkable tiles: ' + unreachable.join(' '));

    /* the sheikh must always be reachable WITHOUT spending items,
       otherwise a player who used all items could be stuck */
    var safe = safeFlood(maze, p.r, p.c);
    if (s && !safe.has(s.r + ',' + s.c)) errors.push('sheikh not reachable without crossing a hazard');

    /* every zone must hold enough safe tiles to host letters */
    var zoneCounts = {};
    for (var r3 = 0; r3 < R; r3++) for (var c3 = 0; c3 < C; c3++) {
      if (maze.rows[r3][c3] === '.' || maze.rows[r3][c3] === 'P') {
        var z = zoneOfRow(maze, r3);
        zoneCounts[z] = (zoneCounts[z] || 0) + 1;
      }
    }
    Object.keys(zoneCounts).forEach(function (z) {
      if (zoneCounts[z] < 8) errors.push('zone ' + z + ' has only ' + zoneCounts[z] + ' safe tiles');
    });
    return { ok: errors.length === 0, errors: errors, unreachable: unreachable, zones: zoneCounts, R: R, C: C };
  }

  function dumpMaze(maze) { return maze.rows.join('\n'); }

  var api = {
    MAZES: MAZES, WORDS: WORDS, pickMaze: pickMaze,
    prepareMaze: prepareMaze, validateMaze: validateMaze,
    floodAll: floodAll, safeComponentFrom: safeComponentFrom, safeFlood: safeFlood,
    zoneOfRow: zoneOfRow, tileTypeAt: tileTypeAt, dumpMaze: dumpMaze,
    isHazardType: isHazardType, isWalkableChar: isWalkableChar
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.QMazeData = api;
})(typeof window !== 'undefined' ? window : globalThis);
