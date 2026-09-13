/* ============================================================
 * quran-pacman / game.js — main game engine
 *
 * Rules implemented:
 *  - Pac-Man style maze; collect the Arabic letters of a hidden
 *    Quran word (the word is RECITED, never displayed).
 *  - Water (~) and Fire (^) barriers: collect ⛵ boat tokens to
 *    cross water and 🧯 fire-extinguisher tokens to cross fire.
 *  - After collecting every letter, walk to the sheikh and check.
 *      * correct order  -> +1 mark, next word
 *      * wrong order    -> -1 mark, redo the word, letters move
 * ============================================================ */
(function () {
  'use strict';

  var D = window.QMazeData;
  var WORDS = D.WORDS;

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  /* seedable RNG: ?seed=N makes the whole game deterministic (used by tests) */
  var rngState = null; // null -> Math.random
  function rnd() {
    if (rngState === null) return Math.random();
    // mulberry32
    rngState |= 0;
    rngState = (rngState + 0x6D2B79F5) | 0;
    var t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rand(a, b) { return a + rnd() * (b - a); }
  function rint(a, b) { return Math.floor(rand(a, b + 1)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  /* bump on every release — shown in the UI and compared with version.json so
     a stale cached build can be spotted (and reloaded) at a glance */
  var BUILD = '2026-09-13.8';

  var AR_FONT = '"Amiri","Geeza Pro","Noto Naskh Arabic","Traditional Arabic","Scheherazade New","Segoe UI",Tahoma,sans-serif';
  var EN_FONT = '"Segoe UI",Tahoma,Arial,sans-serif';

  /* ---------------- dom ---------------- */
  var cv = $('cv');
  var ctx = cv.getContext('2d');
  var wrap = $('stageWrap');
  var banner = $('banner');
  var bannerAr = $('bannerAr');
  var bannerEn = $('bannerEn');
  var msgbar = $('msgbar');
  var msgAr = $('msgAr');
  var msgEn = $('msgEn');
  var chipWord = $('chipWord');
  var chipMarks = $('chipMarks');
  var trayEl = $('tray');
  var itemChipsEl = $('itemChips');


  /* ---------------- state ---------------- */
  var maze, R, C, TILE = 34, tileKinds;
  var time = 0;
  var wordIndex = 0;
  var marks = 0, correctN = 0, wrongN = 0;
  var totalWords = WORDS.length;
  var freezeT = 0;
  var phase = 'menu'; // menu | playing | ended

  var player = { r: 1, c: 1, facing: 1, moving: false, prog: 0, tr: 1, tc: 1, mouthT: 0 };
  var sheikh = { r: 1, c: 1 };
  var word = null;          // current WORDS item
  var letters = [];         // {glyph,r,c,taken}
  var tray = [];            // glyphs in the order they were picked up
  var tokens = [];          // physical items {type,r,c,alive}
  var pendingSpawns = [];   // {type, at}
  var held = { boat: 0, fire: 0 };
  var dirOrder = [];        // pressed direction stack
  var dirHeld = {};
  var lastFullHint = 0;     // time of last "all collected" nudge
  var lastBlockHint = 0;
  var sheikhMsgCooldown = 0;
  var checkLockT = 0;
  var soundOn = true;
  var BEST_KEY = 'quran-maze-best';
  function loadBest() { try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; } }
  function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {} }
  var bestScore = loadBest();
  var timers = [];          // active setTimeout handles (cleared on unload/word switch)
  var rafId = null, lastT = 0;

  var DIRS = [
    { dr: -1, dc: 0 },  // 0 up
    { dr: 0, dc: 1 },   // 1 right
    { dr: 1, dc: 0 },   // 2 down
    { dr: 0, dc: -1 }   // 3 left
  ];
  var DIR_KEYS = { up: 0, right: 1, down: 2, left: 3 };
  var KEYMAP = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left'
  };

  /* ================= sound (web audio sfx) ================= */
  var AC = null;
  function ensureAudio() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume().catch(function () {});
  }
  function tone(freq, dur, type, vol, when) {
    if (!soundOn || !AC) return;
    var t0 = AC.currentTime + (when || 0);
    var o = AC.createOscillator();
    var g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sfxCollect(step) { tone(520 + step * 60, 0.12, 'triangle', 0.2); }
  function sfxToken() { tone(880, 0.1, 'triangle', 0.2); tone(1320, 0.12, 'triangle', 0.12, 0.06); }
  function sfxBlocked() { tone(140, 0.15, 'square', 0.1); }
  function sfxCorrect() { tone(523, 0.16, 'triangle', 0.22); tone(659, 0.16, 'triangle', 0.2, 0.09); tone(784, 0.28, 'triangle', 0.2, 0.18); }
  function sfxWrong() { tone(330, 0.2, 'sawtooth', 0.12); tone(233, 0.3, 'sawtooth', 0.12, 0.16); }
  function sfxTick() { tone(600, 0.05, 'square', 0.05); }
  function sfxGo() { tone(880, 0.12, 'triangle', 0.16); tone(1175, 0.2, 'triangle', 0.14, 0.1); }

  /* ============ recitation: bundled clip -> online clip -> system voice ============
     Many Linux/Chrome installs have NO speech voices at all (getVoices() === []),
     which is why a pure speechSynthesis game can be silent. The game therefore
     ships real Qur'an word-by-word recitation clips in audio/ and can also
     stream them, using speech synthesis only as a last resort. */
  var LOCAL_EXTS = ['mp3', 'ogg', 'webm', 'm4a'];

  var Speech = {
    arabicVoice: null,
    anyVoice: false,
    supported: ('speechSynthesis' in window),
    refreshVoices: function () {
      if (!Speech.supported) return;
      var vs = [];
      try { vs = window.speechSynthesis.getVoices() || []; } catch (e) { vs = []; }
      Speech.anyVoice = vs.length > 0;
      var ar = vs.filter(function (v) { return /^ar\b|^ar[-_]/i.test(v.lang); });
      var best = null;
      for (var i = 0; i < ar.length; i++) {
        var v = ar[i];
        if (/sa|arab/i.test(v.lang + ' ' + v.name)) best = v;
        if (!best && v.localService) best = v;
      }
      Speech.arabicVoice = best || ar[0] || null;
      if (typeof Recite !== 'undefined' && Recite && typeof updateAudioStatus === 'function') updateAudioStatus();
    },
    speak: function (text, opts) {
      opts = opts || {};
      if (!Speech.supported) { if (opts.onerror) opts.onerror(); return; }
      var fire = function () {
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'ar-SA';
          u.rate = opts.rate != null ? opts.rate : 0.8;
          u.pitch = 1;
          if (Speech.arabicVoice) u.voice = Speech.arabicVoice;
          if (opts.onstart) u.onstart = opts.onstart;
          if (opts.onend) u.onend = opts.onend;
          if (opts.onerror) u.onerror = opts.onerror;
          window.speechSynthesis.speak(u);
        } catch (e) { if (opts.onerror) opts.onerror(); }
      };
      try {
        // Chrome quirk: cancel() immediately followed by speak() swallows the utterance
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          setTimeout(fire, 140);
        } else fire();
      } catch (e) { fire(); }
    },
    stop: function () { if (Speech.supported) { try { window.speechSynthesis.cancel(); } catch (e) {} } }
  };
  if (Speech.supported) {
    Speech.refreshVoices();
    window.speechSynthesis.onvoiceschanged = Speech.refreshVoices;
    setTimeout(Speech.refreshVoices, 500);
  }

  var Recite = {
    seq: 0, current: null, lastKind: 'idle', playing: false,
    stop: function () {
      this.seq++;
      this.playing = false;
      if (this.current) { try { this.current.pause(); } catch (e) {} this.current = null; }
      Speech.stop();
    },
    play: function (w, opts) {
      opts = opts || {};
      var self = this;
      this.stop();
      var mySeq = this.seq;
      var sources = [];
      var blocked = false; // browser refused programmatic playback
      LOCAL_EXTS.forEach(function (ext) { sources.push({ kind: 'clip', url: 'audio/' + w.id + '.' + ext, wait: 6000 }); });
      if (w.audio && w.audio.url) sources.push({ kind: 'online', url: w.audio.url, wait: 6000 });
      sources.push({ kind: 'voice' });

      function finish(kind) {
        if (mySeq !== self.seq) return;
        if (kind === 'none' && blocked) kind = 'blocked';
        self.lastKind = kind;
        self.playing = false;
        updateAudioStatus();
        if (opts.onend) opts.onend();
      }
      function attempt(i) {
        if (mySeq !== self.seq) return;
        if (i >= sources.length) { finish('none'); return; }
        var s = sources[i];
        if (s.kind === 'voice') {
          if (!Speech.supported) { finish('none'); return; }
          self.lastKind = 'voice';
          updateAudioStatus();
          var started = false;
          Speech.speak(w.recite, {
            onstart: function () { started = true; },
            onend: function () { finish('voice'); },
            onerror: function () { finish('none'); }
          });
          // if the platform has no voices the utterance stays silent: report honestly
          setTimeout(function () {
            if (mySeq !== self.seq) return;
            if (!started && !Speech.anyVoice) finish('none');
          }, 900);
          return;
        }
        var a = new Audio();
        self.current = a;
        var settled = false;
        var timer = setTimeout(function () {
          if (settled || mySeq !== self.seq) return;
          settled = true;
          try { a.pause(); } catch (e) {}
          attempt(i + 1);
        }, s.wait || 4000);
        a.preload = 'auto';
        a.oncanplay = function () {
          if (settled || mySeq !== self.seq) return;
          settled = true;
          clearTimeout(timer);
          a.play().then(function () {
            if (mySeq !== self.seq) { try { a.pause(); } catch (e) {} return; }
            self.lastKind = s.kind;
            self.playing = true;
            updateAudioStatus();
            var dur = (a.duration && isFinite(a.duration)) ? a.duration : 1.8;
            setTimeout(function () { if (mySeq === self.seq) finish(s.kind); }, dur * 1000 + 200);
          }).catch(function (err) {
            if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) blocked = true;
            attempt(i + 1);
          });
        };
        a.onerror = function () {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          attempt(i + 1);
        };
        a.src = s.url;
        try { a.load(); } catch (e) { a.onerror(); }
      }
      attempt(0);
    }
  };

  function reciteWord(w, opts) { if (w) Recite.play(w, opts); }

  function updateAudioStatus() {
    var el = document.getElementById('audioStatus');
    if (!el) return;
    var k = (typeof Recite !== 'undefined' && Recite && Recite.lastKind) ? Recite.lastKind : 'idle';
    var map = {
      idle: ['\u0627\u0636\u063a\u0637 \u00ab\u0627\u0633\u062a\u0645\u0639\u00bb \u0644\u0633\u0645\u0627\u0639 \u0627\u0644\u0643\u0644\u0645\u0629', 'Press Listen to hear the word'],
      clip: ['\u062a\u0644\u0627\u0648\u0629 \u0645\u0646 \u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0644\u0639\u0628\u0629', 'Bundled Qur\'an recitation'],
      online: ['\u062a\u0644\u0627\u0648\u0629 \u0645\u0646 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a', 'Online Qur\'an recitation'],
      voice: ['\u0635\u0648\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d', 'System voice'],
      blocked: ['\u0627\u0636\u063a\u0637 \u00ab\u0627\u0633\u062a\u0645\u0639\u00bb \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0635\u0648\u062a', 'Press Listen again to allow sound'],
      none: ['\u0644\u0627 \u064a\u0648\u062c\u062f \u0635\u0648\u062a \u2014 \u0623\u0636\u0641 \u0645\u0644\u0641\u0627\u062a \u0641\u064a \u0645\u062c\u0644\u062f audio', 'No audio available \u2014 add clips to the audio folder']
    };
    var icons = { blocked: '\uD83D\uDD07', idle: '\uD83D\uDD08', clip: '\uD83D\uDD0A', online: '\uD83C\uDF10', voice: '\uD83D\uDDE3\uFE0F', none: '\u26A0\uFE0F' };
    var m = map[k] || map.idle;
    el.innerHTML = '<b>' + (icons[k] || '') + ' ' + m[0] + '</b><span>' + m[1] + '</span>';
    el.className = 'audioStatus ' + k;
  }

  /* ================= overlays / ui ================= */
  var msgHideT = null, bannerHideT = null;
  function msg(ar, en, ms) {
    msgAr.textContent = ar;
    msgEn.textContent = en || '';
    msgbar.classList.add('show');
    if (msgHideT) clearTimeout(msgHideT);
    msgHideT = setTimeout(function () { msgbar.classList.remove('show'); }, ms || 3200);
  }
  function bannerShow(ar, en, cls, ms) {
    banner.classList.remove('ok', 'bad', 'info');
    if (cls) banner.classList.add(cls);
    bannerAr.textContent = ar;
    bannerEn.textContent = en || '';
    banner.classList.add('show');
    if (bannerHideT) clearTimeout(bannerHideT);
    bannerHideT = setTimeout(function () { banner.classList.remove('show'); }, ms || 2600);
  }
  function after(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  var DIACRITIC = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/;

  /* The word as it stands alone, without the Qur'anic prefix (وَ/فَ/بِ/لِ/ٱل…):
     finds where the target letters start inside the recited form and keeps the
     rest with its vowel marks, e.g. وَٱلشَّمْسِ -> شَّمْسِ */
  function bareRecite(w) {
    var t = (w.recite || w.letters.join('')).replace(/\u0671/g, '\u0627');
    for (var start = 0; start < t.length; start++) {
      var i = start, ok = true;
      for (var li = 0; li < w.letters.length; li++) {
        var want = w.letters[li];
        if (want === '\u0623' || want === '\u0622' || want === '\u0625') want = '\u0627';
        while (i < t.length && DIACRITIC.test(t.charAt(i))) i++;
        if (i >= t.length || t.charAt(i) !== want) { ok = false; break; }
        i++;
      }
      if (ok) return tidyShown(t.slice(start), w);
    }
    return w.letters.join('');
  }

  /* Turn the recited form into the plain dictionary form for display:
     drop trailing pause marks/spaces, the accusative tanween and its alif
     (صَبْرًا -> صَبْر) and a leading shadda left over from a prefix
     (وَمَّطَرًا -> مَطَر). */
  function skeletonOf(t) {
    return t.replace(/[\u0670\u0671\u0622]/g, '\u0627')
            .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, '')
            .replace(/[^\u0621-\u064A]/g, '');
  }

  /* Turn the recited form into the plain dictionary form for display:
     drop recitation marks (iqlab/waqf), the accusative tanween and its alif
     (صَبْرۭا -> صَبْر) and a leading shadda left over from a prefix. */
  function tidyShown(t, w) {
    var s = t
      .replace(/[\u06D6-\u06ED\u0610-\u061A\u0600-\u0605]/g, '')
      .replace(/[\u0671\u0622\u0623\u0625]/g, '\u0627') // alef wasla / madda / hamza forms
      .replace(/^\s+|\s+$/g, '');
    var letters = w.letters.join('');
    if (skeletonOf(s) === letters + '\u0627') {          // tanween alif is not part of the word
      // ... take the alif off, allowing vowels/marks written after it (e.g. ا + madda)
      s = s.replace(/[\u064E\u064F\u0650]?[\u0627\u0622][\u064B-\u0655\u0670]*$/, '');
    }
    s = s.replace(/[\u064B\u064C\u064D]/g, '');          // no tanween in a dictionary form
    s = s.replace(/^([\u0621-\u064A])\u0651/, '$1');     // leading shadda left from a prefix
    return s.replace(/\s+$/g, '');
  }

  /* the reward card shown after a word is accepted: the word + its meaning */
  function showWordCard(w) {
    var card = document.getElementById('wordCard');
    if (!card) return;
    var word = card.querySelector('.wcWord');
    var meta = card.querySelector('.wcMeta');
    var ref = card.querySelector('.wcRef');
    if (word) word.textContent = bareRecite(w);
    if (meta) meta.innerHTML = '<b>' + w.translit + '</b> <span class="m">— ' + w.meaning + '</span>';
    if (ref) ref.textContent = w.ref || '';
    card.classList.add('show');
    if (wordCardTimer) clearTimeout(wordCardTimer);
    wordCardTimer = setTimeout(hideWordCard, 4200);
  }
  function hideWordCard() {
    var card = document.getElementById('wordCard');
    if (card) card.classList.remove('show');
    if (wordCardTimer) { clearTimeout(wordCardTimer); wordCardTimer = null; }
  }
  var wordCardTimer = null;
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  /* the little +1 / -1 that floats up over the maze */
  function floatScore(delta) {
    var host = document.getElementById('scoreFloats');
    if (!host) return;
    var el = document.createElement('span');
    el.className = 'scoreFloat ' + (delta > 0 ? 'up' : 'down');
    el.textContent = (delta > 0 ? '+1' : '\u22121');
    host.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
  }

  function syncUI() {
    chipWord.textContent = 'Word ' + (wordIndex + 1) + ' / ' + totalWords;
    chipMarks.textContent = marks;
    itemChipsEl.innerHTML = '';
    function chip(icon, label, n) {
      var el = document.createElement('span');
      el.className = 'itemChip' + (n > 0 ? ' have' : '');
      el.innerHTML = '<b>' + icon + '</b> × ' + n + ' <i>' + label + '</i>';
      itemChipsEl.appendChild(el);
    }
    chip('⛵', 'boat', held.boat);
    chip('🧯', 'extinguisher', held.fire);
    renderTray();
    // check button availability
    // score in the header chips (never over the maze) + the panel scoreboard
    setText('chipCorrect', '\u2705 ' + correctN);
    setText('chipWrong', '\u274C ' + wrongN);
    setText('statScore', String(marks));
    setText('statCorrect', String(correctN));
    setText('statWrong', String(wrongN));
    setText('statBest', String(bestScore));
    var near = playerNearSheikh();
    var checks = document.querySelectorAll('.js-check');
    for (var ci = 0; ci < checks.length; ci++) checks[ci].classList.toggle('on', near);
    var listenBtns = document.querySelectorAll('.js-listen');
    for (var li = 0; li < listenBtns.length; li++) listenBtns[li].classList.toggle('playing', Recite.playing);
    updateAudioStatus();
  }
  function renderTray() {
    trayEl.innerHTML = '';
    for (var i = 0; i < tray.length; i++) {
      var d = document.createElement('button');
      d.className = 'trayTile';
      d.textContent = tray[i];
      d.title = 'Drop this letter back (order position ' + (i + 1) + ')';
      (function (idx) {
        d.addEventListener('click', function () { dropLetterAt(idx); });
      })(i);
      trayEl.appendChild(d);
    }
    var total = word ? word.letters.length : 0;
    $('trayCount').textContent = tray.length + ' / ' + total + ' letters collected';
  }

  /* ================= maze grid ================= */
  function kindAt(r, c) {
    if (r < 0 || c < 0 || r >= R || c >= C) return 'wall';
    return tileKinds[r][c];
  }
  function parseMaze() {
    R = maze.rows.length; C = maze.rows[0].length;
    tileKinds = [];
    for (var r = 0; r < R; r++) {
      tileKinds.push([]);
      for (var c = 0; c < C; c++) {
        tileKinds[r].push(D.tileTypeAt(maze, r, c)); // wall | corridor | water | fire
      }
    }
  }
  function zoneOf(r) {
    var hr = maze.meta.hazardRows, z = 0;
    for (var i = 0; i < hr.length; i++) if (r > hr[i]) z++;
    return z;
  }
  function playerZone() { return zoneOf(player.r); }

  /* corridor cells (no hazard) in a zone; excludes sheikh/player tiles.
     usedKeys: 'r,c' strings already occupied */
  function openCells(zone, usedKeys) {
    var out = [];
    for (var r = 0; r < R; r++) {
      if (zoneOf(r) !== zone) continue;
      for (var c = 0; c < C; c++) {
        if (tileKinds[r][c] !== 'corridor') continue;
        if (r === sheikh.r && c === sheikh.c) continue;
        if (r === player.r && c === player.c) continue;
        if (usedKeys && usedKeys.has(r + ',' + c)) continue;
        out.push({ r: r, c: c });
      }
    }
    return out;
  }

  /* ================= token management ================= */
  var TOKEN_META = {
    boat: { icon: '\u26F5', label: 'boat', hint: '\u062a\u062d\u062a\u0627\u062c \u0642\u0627\u0631\u0628 \u26F5 \u0644\u0639\u0628\u0648\u0631 \u0627\u0644\u0645\u0627\u0621', hintEn: 'You need a boat \u26F5 to cross the water' },
    fire: { icon: '\uD83E\uDDEF', label: 'fire extinguisher', hint: '\u062a\u062d\u062a\u0627\u062c \u0645\u0637\u0641\u0623\u0629 \uD83E\uDDEF \u0644\u0639\u0628\u0648\u0631 \u0627\u0644\u0646\u0627\u0631', hintEn: 'You need an extinguisher \uD83E\uDDEF to cross the fire' }
  };
  var MAX_ALIVE = 3;         // items of each type lying in the maze at once
  var CARRY_MAX = 4;         // items of each type the player may hold
  var RESPAWN_MIN = 3.5, RESPAWN_MAX = 5.5;

  function playerSafeSet() {
    var seen = new Set();
    var startKey = player.r + ',' + player.c;
    var startKind = kindAt(player.r, player.c);
    if (startKind === 'water' || startKind === 'fire') {
      for (var dr2 = -1; dr2 <= 1; dr2++) for (var dc2 = -1; dc2 <= 1; dc2++) {
        var rr = player.r + dr2, cc = player.c + dc2;
        if (kindAt(rr, cc) === 'corridor') seen.add(rr + ',' + cc);
      }
      return seen;
    }
    var stack = [startKey];
    seen.add(startKey);
    while (stack.length) {
      var key = stack.pop();
      var p = key.split(',');
      var r0 = +p[0], c0 = +p[1];
      for (var i = 0; i < 4; i++) {
        var nr = r0 + DIRS[i].dr, nc = c0 + DIRS[i].dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        if (tileKinds[nr][nc] !== 'corridor') continue;
        var nk = nr + ',' + nc;
        if (!seen.has(nk)) { seen.add(nk); stack.push(nk); }
      }
    }
    return seen;
  }

  function occupiedKeys() {
    var s = new Set();
    letters.forEach(function (l) { if (!l.taken) s.add(l.r + ',' + l.c); });
    tokens.forEach(function (t) { if (t.alive) s.add(t.r + ',' + t.c); });
    s.add(player.r + ',' + player.c);
    s.add(sheikh.r + ',' + sheikh.c);
    return s;
  }

  function spawnTokenSpot() {
    var safe = playerSafeSet();
    var occ = occupiedKeys();
    var near = [], far = [];
    safe.forEach(function (key) {
      if (occ.has(key)) return;
      var p = key.split(','); var r = +p[0], c = +p[1];
      var dist = Math.max(Math.abs(r - player.r), Math.abs(c - player.c));
      (dist >= 5 ? far : near).push({ r: r, c: c });
    });
    var pool = far.length ? far : near;
    if (!pool.length) return null;
    return pick(pool);
  }

  function spawnToken(type, spot) {
    spot = spot || spawnTokenSpot();
    if (!spot) return;
    tokens.push({ type: type, r: spot.r, c: spot.c, alive: true });
  }
  function aliveCount(type) {
    return tokens.filter(function (t) { return t.alive && t.type === type; }).length;
  }

  function resetTokens() {
    tokens = [];
    pendingSpawns = [];
    held.boat = 0; held.fire = 0;
    for (var i = 0; i < MAX_ALIVE; i++) spawnToken('boat');
    for (var j = 0; j < MAX_ALIVE; j++) spawnToken('fire');
  }

  function pickToken(t) {
    if (held[t.type] >= CARRY_MAX) return; // pockets full
    held[t.type]++;
    t.alive = false;
    sfxToken();
    var m = TOKEN_META[t.type];
    msg('\u0623\u062e\u0630\u062a ' + m.icon + ' ' + m.label + '!', 'Picked up a ' + m.label + '!', 1500);
    pendingSpawns.push({ type: t.type, at: time + rand(RESPAWN_MIN, RESPAWN_MAX) });
    syncUI();
  }
  function consume(type) {
    if (held[type] > 0) held[type]--;
    syncUI();
  }

  /* ================= letters ================= */
  /* Zones are the areas separated by the full-width hazard bands. Letters are
     spread over ALL zones, so the player must cross the water and the fire
     (using collected items) every round. Cells also keep a minimum distance
     from each other so letters do not clump together. */
  function zonePlanFor(n) {
    var startZone = playerZone();
    var zc = maze.meta.hazardRows.length + 1;
    var others = [];
    for (var z = 0; z < zc; z++) if (z !== startZone) others.push(z);
    var plan = [];
    var reserveStart = (n <= 2) ? 1 : 0; // 2-letter words keep one letter at home
    // first guarantee one letter in every other zone (forces each barrier to be crossed)
    for (var i = 0; i < others.length && plan.length < n - reserveStart; i++) plan.push(others[i]);
    while (plan.length < n) {
      plan.push(wordIndex < 2 ? startZone : pick([startZone].concat(others)));
    }
    return shuffle(plan).slice(0, n);
  }

  function chooseLetterSpot(zone, used) {
    var startZone = playerZone();
    var tries = [zone, startZone];
    for (var t = 0; t < tries.length; t++) {
      var cells = openCells(tries[t], used);
      if (!cells.length) continue;
      var spread = cells.filter(function (p) {
        for (var i = 0; i < letters.length; i++) {
          if (Math.abs(letters[i].r - p.r) + Math.abs(letters[i].c - p.c) < 6) return false;
        }
        return true;
      });
      return pick(spread.length ? spread : cells);
    }
    var all = [];
    for (var z = 0; z <= maze.meta.hazardRows.length; z++) all = all.concat(openCells(z, used));
    return all.length ? pick(all) : { r: player.r, c: player.c };
  }

  function placeLetters(wordObj) {
    letters = [];
    var used = occupiedKeys(); // tokens + player + sheikh
    var plan = zonePlanFor(wordObj.letters.length);
    for (var i = 0; i < wordObj.letters.length; i++) {
      var spot = chooseLetterSpot(plan[i], used);
      used.add(spot.r + ',' + spot.c);
      letters.push({ glyph: wordObj.letters[i], r: spot.r, c: spot.c, taken: false });
    }
  }

  function pickUpLettersAt(r, c) {
    var found = -1;
    for (var i = 0; i < letters.length; i++) {
      if (!letters[i].taken && letters[i].r === r && letters[i].c === c) { found = i; break; }
    }
    if (found === -1) return false;
    var l = letters[found];
    l.taken = true;
    tray.push(l.glyph);
    sfxCollect(tray.length);
    syncUI();
    var total = word.letters.length;
    if (tray.length < total) {
      msg('\u0623\u062e\u0630\u062a \u062d\u0631\u0641 \u00ab' + l.glyph + '\u00bb \u2014 \u0628\u0642\u064a ' + (total - tray.length),
          'Collected \u00ab' + l.glyph + '\u00bb \u2014 ' + (total - tray.length) + ' left', 1500);
    } else {
      bannerShow('\u062c\u0645\u0639\u062a \u0643\u0644 \u0627\u0644\u062d\u0631\u0648\u0641! \u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u0634\u064a\u062e',
                 'All letters collected \u2014 go to the sheikh!', 'info', 3000);
    }
    return true;
  }

  function dropLetterAt(idx) {
    if (idx < 0 || idx >= tray.length) return;
    var glyph = tray.splice(idx, 1)[0];
    for (var i = 0; i < letters.length; i++) {
      if (letters[i].taken && letters[i].glyph === glyph) {
        var spot = randomFreeLetterSpot();
        letters[i].taken = false; letters[i].r = spot.r; letters[i].c = spot.c;
        break;
      }
    }
    sfxTick();
    msg('\u0623\u0631\u062c\u0639\u062a \u062d\u0631\u0641\u064b\u0627 \u0625\u0644\u0649 \u0627\u0644\u0645\u062a\u0627\u0647\u0629', 'Returned a letter to the maze', 1500);
    syncUI();
  }
  function randomFreeLetterSpot() {
    var occ = occupiedKeys();
    var cells = openCells(playerZone(), occ);
    if (!cells.length) {
      for (var z = 0; z <= maze.meta.hazardRows.length; z++) {
        cells = openCells(z, occ);
        if (cells.length) break;
      }
    }
    return pick(cells) || { r: player.r, c: player.c + 1 };
  }

  /* ================= sheikh ================= */
  function playerNearSheikh() {
    return Math.abs(player.r - sheikh.r) + Math.abs(player.c - sheikh.c) === 1 ||
           (Math.abs(player.r - sheikh.r) <= 1 && Math.abs(player.c - sheikh.c) <= 1);
  }
  function checkWithSheikh() {
    if (phase !== 'playing') return;
    if (time < checkLockT) return; // result already being processed
    if (!playerNearSheikh()) {
      msg('اذهب إلى الشيخ أولًا 🤲', 'Walk next to the sheikh first', 2200);
      return;
    }
    if (freezeT > 0) return;
    if (time < sheikhMsgCooldown) return;
    var total = word.letters.length;
    if (tray.length < total) {
      sheikhMsgCooldown = time + 1.5;
      bannerShow('الشيخ: لم تجمع كل الحروف بعد', 'Sheikh: you have not collected all the letters yet', 'bad', 2200);
      Speech.speak('لم تجمع كل الحروف بعد، أكمل الجمع');
      return;
    }
    var ok = true;
    for (var i = 0; i < total; i++) if (tray[i] !== word.letters[i]) { ok = false; break; }
    if (ok) {
      correctN++; marks++;
      if (marks > bestScore) { bestScore = marks; saveBest(bestScore); }
      floatScore(1);
      if (wordsPlayed.indexOf(word) === -1) wordsPlayed.push(word);
      checkLockT = time + 4.2; // block re-check until the next word arrives
      syncUI();
      sfxCorrect();
      freezePlayer(0.6);
      showWordCard(word); // the word + what it means
      bannerShow('أحسنت! +١ نقطة — أتقنت الكلمة', 'Well done! +1 mark — you spelled it perfectly', 'ok', 3000);
      Speech.speak('أحسنت! ما شاء الله، أتقنت الكلمة');
      after(900, function () { reciteWord(word, {}); });
      after(3000, nextWord);
    } else {
      wrongN++; marks--;
      floatScore(-1);
      checkLockT = time + 3.8; // block re-check while the sheikh re-scatters letters
      syncUI();
      sfxWrong();
      freezePlayer(0.6);
      bannerShow('خطأ! -١ نقطة — استمع جيدًا وأعد المحاولة', 'Wrong order! -1 mark — listen again and retry', 'bad', 3200);
      Speech.speak('خطأ، اسمع الكلمة جيدًا ثم أعد المحاولة');
      after(1400, function () { reciteWord(word, {}); });
      after(2600, reshuffleLetters);
    }
  }
  function reshuffleLetters() {
    // redo the same word: letters go back to the maze at NEW positions
    hideWordCard();
    tray = [];
    placeLetters(word);
    syncUI();
    msg('غيّر الشيخ مواقع الحروف — اجمعها من جديد بالترتيب الصحيح', 'The sheikh moved the letters — collect them again in the right order', 2800);
  }

  function freezePlayer(s) { freezeT = Math.max(freezeT, s); }

  /* Backspace / the ↺ button: send the pac-man back to the start of the maze.
     Collected letters are kept — it is a shortcut, not a penalty. */
  function returnToStart() {
    if (phase !== 'playing') return;
    dirOrder = []; dirHeld = {};
    if (typeof swipeDir !== 'undefined' && swipeDir) swipeDir = null;
    resetPlayer();
    player.moving = false; player.prog = 0;
    sfxTick();
    msg('↺ رجعت إلى بداية المتاهة', 'Back to the start of the maze', 1700);
    syncUI();
  }

  /* ================= word lifecycle ================= */
  function startWord() {
    phase = 'playing';
    hideWordCard();
    word = currentWord();
    tray = [];
    resetPlayer();
    placeLetters(word);
    resetTokens();
    syncUI();
    bannerShow('استمع للكلمة، ثم اجمع الحروف بالترتيب', 'Listen to the word, then collect its letters in order', 'info', 2600);
    reciteWord(word, {});
  }
  function nextWord() {
    wordIndex++;
    if (wordIndex >= totalWords) {
      phase = 'ended';
      showEndScreen();
      return;
    }
    startWord();
  }
  function resetPlayer() {
    var p = maze.meta.player;
    player.r = p.r; player.c = p.c; player.tr = p.r; player.tc = p.c;
    player.moving = false; player.prog = 0;
    player.facing = 1;
  }

  /* ================= movement ================= */
  function desiredDir() {
    if (!dirOrder.length) return null;
    var name = dirOrder[dirOrder.length - 1];
    var idx = DIR_KEYS[name];
    return (idx === undefined) ? null : idx; // index into DIRS, not the name
  }
  function stepKind(r, c, dirIdx) {
    // what kind of tile the player would land on moving one cell toward dirIdx
    var d = DIRS[dirIdx];
    if (!d) return 'wall';
    return kindAt(r + d.dr, c + d.dc);
  }
  function tryStartMove(dir) {
    if (freezeT > 0 || phase !== 'playing' || player.moving) return false;
    if (!DIRS[dir]) return false;
    var k = stepKind(player.r, player.c, dir);
    if (k === 'wall' || k === 'sheikh') return false;
    /* One item per barrier ENTRY: stepping into water/fire from normal ground
       costs an item, while moving around once you are on the same barrier is
       free. (Charging per tile made walking along a barrier impossible.) */
    var standingOn = kindAt(player.r, player.c);
    if (k === 'water') {
      if (standingOn !== 'water') {
        if (held.boat <= 0) { blockedHint('water'); return false; }
        consume('boat');
        splash(true);
      }
    } else if (k === 'fire') {
      if (standingOn !== 'fire') {
        if (held.fire <= 0) { blockedHint('fire'); return false; }
        consume('fire');
        splash(false);
      }
    }
    player.facing = dir;
    player.moving = true;
    player.prog = 0;
    player.tr = player.r + DIRS[dir].dr;
    player.tc = player.c + DIRS[dir].dc;
    return true;
  }
  function splash(water) {
    if (water) { tone(220, 0.2, 'sine', 0.12); tone(160, 0.25, 'sine', 0.1, 0.05); }
    else { tone(300, 0.12, 'sawtooth', 0.08); tone(240, 0.16, 'sawtooth', 0.08, 0.05); }
  }
  function blockedHint(kind) {
    if (time - lastBlockHint < 1.6) return;
    lastBlockHint = time;
    var m = TOKEN_META[kind === 'water' ? 'boat' : 'fire'];
    msg(m.hint, m.hintEn, 2000);
    sfxBlocked();
  }
  function updatePlayer(dt) {
    if (freezeT > 0 || phase !== 'playing') return;
    if (player.moving) {
      var speed = 7.0; // tiles / second
      player.prog += dt * speed;
      player.mouthT += dt * 9;
      if (player.prog >= 1) {
        player.r = player.tr; player.c = player.tc;
        player.moving = false; player.prog = 0;
        onArriveCell();
      }
    } else {
      var d = desiredDir();
      if (d !== null) {
        if (!tryStartMove(d)) {
          // wanted turn is blocked for now: keep gliding forward on plain
          // corridor only (never auto-step into water/fire)
          if (stepKind(player.r, player.c, player.facing) === 'corridor') {
            tryStartMove(player.facing);
          }
        }
      }
    }
  }
  function onArriveCell() {
    // letters
    pickUpLettersAt(player.r, player.c);
    // tokens lying on this tile
    for (var i = tokens.length - 1; i >= 0; i--) {
      var t = tokens[i];
      if (t.alive && t.r === player.r && t.c === player.c) pickToken(t);
    }
    syncUI();
    if (!playerNearSheikh() && tray.length === word.letters.length && time - lastFullHint > 9) {
      lastFullHint = time;
      msg('كل الحروف معك! اذهب إلى الشيخ 🤲 للتحقق', 'You have every letter! Walk to the sheikh to check', 2400);
    }
  }

  /* ================= input ================= */
  function pressDir(name) {
    var d = DIR_KEYS[name];
    if (dirHeld[name]) return;
    dirHeld[name] = true;
    dirOrder.push(name);
    if (!player.moving) tryStartMove(d);
  }
  function releaseDir(name) {
    if (!dirHeld[name]) return;
    dirHeld[name] = false;
    var i = dirOrder.indexOf(name);
    if (i !== -1) dirOrder.splice(i, 1);
  }
  window.addEventListener('keydown', function (e) {
    if (phase === 'menu' || phase === 'ended') return;
    var dir = KEYMAP[e.key];
    if (dir) { e.preventDefault(); if (!e.repeat) pressDir(dir); return; }
    if (e.key === ' ' || e.key === 'Space' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      checkWithSheikh();
    }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reciteWord(word, {}); }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); returnToStart(); }
  });
  window.addEventListener('keyup', function (e) {
    var dir = KEYMAP[e.key];
    if (dir) releaseDir(dir);
  });
  window.addEventListener('blur', function () {
    dirOrder = []; dirHeld = {};
  });

  // ---- pointer / swipe on the canvas ----
  /* Touch steering works like a little joystick: the pac-man follows the
     direction you drag while your finger is down and STOPS when you lift it
     (a sticky direction used to stay locked on one side). */
  var touchOrigin = null, swiping = false, swipeDir = null;
  function canvasPoint(e) {
    var rect = cv.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  cv.addEventListener('pointerdown', function (e) {
    if (swipeDir) { releaseDir(swipeDir); swipeDir = null; }
    touchOrigin = canvasPoint(e);
    swiping = false;
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!touchOrigin) return;
    var p = canvasPoint(e);
    var dx = p.x - touchOrigin.x, dy = p.y - touchOrigin.y;
    if (!swiping && Math.abs(dx) + Math.abs(dy) > 16) swiping = true;
    if (swiping) {
      if (Math.abs(dx) > 16 || Math.abs(dy) > 16) {
        var name = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        if (swipeDir !== name) {
          if (swipeDir) releaseDir(swipeDir);
          pressDir(name);
          swipeDir = name;
        }
        touchOrigin = { x: touchOrigin.x + dx, y: touchOrigin.y + dy };
      }
    }
  });
  function endSwipe(e) {
    if (touchOrigin && !swiping) {
      // a tap only interacts with the sheikh (avoids accidental checks)
      var tr = Math.floor(touchOrigin.y / TILE), tc = Math.floor(touchOrigin.x / TILE);
      if (Math.abs(tr - sheikh.r) <= 1 && Math.abs(tc - sheikh.c) <= 1) checkWithSheikh();
    }
    if (swipeDir) { releaseDir(swipeDir); swipeDir = null; } // finger up -> stop
    touchOrigin = null; swiping = false;
  }
  cv.addEventListener('pointerup', endSwipe);
  cv.addEventListener('pointercancel', function () {
    if (swipeDir) { releaseDir(swipeDir); swipeDir = null; }
    touchOrigin = null; swiping = false;
  });

  // on-screen d-pad
  var padBtns = document.querySelectorAll('.padBtn');
  padBtns.forEach(function (b) {
    var name = b.getAttribute('data-dir');
    function down(e) { e.preventDefault(); pressDir(name); }
    function up(e) { e.preventDefault(); releaseDir(name); }
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  });

  /* ================= main action handlers ================= */
  function startGame() {
    ensureAudio();
    Speech.refreshVoices();
    $('menu').classList.add('hidden');
    phase = 'playing';
    runOrder = pickRunOrder();          // fresh random word order every game
    wordsPlayed = [];
    if (typeof forcedStartIndex === 'number') { wordIndex = Math.min(forcedStartIndex, runOrder.length - 1); forcedStartIndex = undefined; }
    else wordIndex = 0;
    loadMaze(pickMazeId()); // the orientation may have changed since the menu
    marks = 0; correctN = 0; wrongN = 0;
    startWord();
    sfxGo();
    cv.focus && cv.focus();
  }
  var forcedStartIndex;
  var runOrder = [];        // play order for this game (randomised)
  var wordsPlayed = [];     // words completed correctly, in play order

  function shuffleList(arr) { return shuffle(arr.slice()); }

  /* Build the order of words for one game: fully random, but the first two
     rounds are drawn from the shortest words so a session still starts gently. */
  function makeRunOrder() {
    var short = [], rest = [];
    for (var i = 0; i < WORDS.length; i++) {
      (WORDS[i].letters.length <= 3 ? short : rest).push(i);
    }
    short = shuffle(short);   // shuffle() shuffles in place and returns the array
    rest = shuffle(rest);
    var warm = Math.min(2, short.length);
    var order = short.slice(0, warm);
    return order.concat(shuffle(short.slice(warm).concat(rest)));
  }

  function pickRunOrder() { return makeRunOrder(); }

  function wordAt(index) {
    if (index < 0 || index >= runOrder.length) return WORDS[0];
    return WORDS[runOrder[index]];
  }
  function currentWord() { return wordAt(wordIndex); }
  var autoTestCount = Infinity;
  $('btnStart').addEventListener('click', startGame);
  $('btnAgain').addEventListener('click', function () {
    ensureAudio();
    $('end').classList.add('hidden');
    runOrder = pickRunOrder();
    wordsPlayed = [];
    wordIndex = 0;
    marks = 0; correctN = 0; wrongN = 0;
    loadMaze(pickMazeId());
    startWord();
  });
  function onAll(selector, evt, fn) {
    var list = document.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) list[i].addEventListener(evt, fn);
  }
  onAll('.js-listen', 'click', function () {
    if (phase === 'playing') { ensureAudio(); reciteWord(word, {}); }
  });
  onAll('.js-check', 'click', function () { checkWithSheikh(); });
  onAll('.js-reset', 'click', function () { returnToStart(); });
  onAll('.js-fs', 'click', toggleFullscreen);
  $('btnSound').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = soundOn ? '🔊 Sound on' : '🔇 Sound off';
    if (!soundOn) Speech.stop();
  });

  /* ================= end screen ================= */
  function showEndScreen() {
    var st = $('endStats');
    st.textContent = '\u2B50 Score: ' + marks + '   \u2022   \u2705 Correct: ' + correctN +
                     '   \u2022   \u274C Wrong: ' + wrongN + '   \u2022   \uD83C\uDFC6 Best: ' + bestScore;
    var list = $('endList');
    list.innerHTML = '';
    (wordsPlayed.length ? wordsPlayed : WORDS).forEach(function (w) {
      var li = document.createElement('div');
      li.className = 'endWord';
      li.innerHTML = '<div class="ewL">' + bareRecite(w) + '</div>' +
                     '<div class="ewR"><b>' + w.translit + '</b> — <b>' + w.meaning + '</b>' +
                     '<br><span>' + w.letters.join(' ') + ' · ' + w.ref + '</span></div>';
      list.appendChild(li);
    });
    $('endTitle').textContent = '🎉 أحسنت! أتممت ' + totalWords + ' كلمات';
    $('end').classList.remove('hidden');
  }

  /* ================= rendering ================= */
  function tileCx(c) { return (c + 0.5) * TILE; }
  function tileCy(r) { return (r + 0.5) * TILE; }

  function drawWallsAndFloor() {
    for (var r = 0; r < R; r++) {
      for (var c = 0; c < C; c++) {
        var k = tileKinds[r][c];
        var x = c * TILE, y = r * TILE;
        if (k === 'wall') {
          ctx.fillStyle = '#1d2c6b';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#2a3f96';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          ctx.fillStyle = 'rgba(120,150,255,0.25)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x + 1, y + TILE - 3, TILE - 2, 2);
        } else if (k === 'corridor') {
          ctx.fillStyle = '#0a0f24';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          var cx2 = x + TILE / 2, cy2 = y + TILE / 2;
          ctx.beginPath();
          ctx.arc(cx2, cy2, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawHazards() {
    for (var r = 0; r < R; r++) {
      for (var c = 0; c < C; c++) {
        var k = tileKinds[r][c];
        if (k !== 'water' && k !== 'fire') continue;
        var x = c * TILE, y = r * TILE;
        if (k === 'water') {
          var g = ctx.createLinearGradient(x, y, x, y + TILE);
          var w1 = 0.55 + 0.2 * Math.sin(time * 2.2 + c * 0.9);
          g.addColorStop(0, '#123e8f');
          g.addColorStop(0.5, '#1d5fd0');
          g.addColorStop(1, '#0d2f6e');
          ctx.fillStyle = g;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          var yy = y + TILE * (0.35 + 0.22 * Math.sin(time * 3 + c));
          for (var sx = x - 4; sx <= x + TILE + 4; sx += 6) {
            var sy = yy + Math.sin(time * 4 + sx * 0.25) * 2.2;
            if (sx === x - 4) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        } else {
          var fl = 0.7 + 0.3 * Math.sin(time * 9 + c * 2.1 + r);
          ctx.fillStyle = '#3a0d0a';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(255,120,40,' + (0.55 + 0.45 * fl) + ')';
          ctx.fillRect(x, y + TILE * (1 - 0.5 * fl), TILE, TILE * 0.5 * fl);
          ctx.fillStyle = 'rgba(255,210,60,' + (0.7 + 0.3 * fl) + ')';
          ctx.fillRect(x + TILE * 0.2, y + TILE * (1 - 0.32 * fl), TILE * 0.6, TILE * 0.32 * fl);
          ctx.fillStyle = 'rgba(255,60,30,0.35)';
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, TILE * (0.3 + 0.12 * fl), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawLetters() {
    for (var i = 0; i < letters.length; i++) {
      var l = letters[i];
      if (l.taken) continue;
      var cx = tileCx(l.c), cy = tileCy(l.r);
      var bob = Math.sin(time * 3 + i) * 1.6;
      var pulse = 0.94 + 0.06 * Math.sin(time * 3.2 + i * 1.7);
      var s = TILE * 0.92 * pulse;
      ctx.save();
      ctx.shadowColor = 'rgba(255,220,150,0.6)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f4e4b2';
      roundRect(cx - s / 2, cy + bob - s / 2, s, s, Math.max(4, TILE * 0.2));
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#7a4a08';
      ctx.font = '700 ' + Math.round(s * 0.74) + 'px ' + AR_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.glyph, cx, cy + bob + 1);
      ctx.restore();
    }
  }

  function drawTokens() {
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (!t.alive) continue;
      var cx = tileCx(t.c), cy = tileCy(t.r);
      var bob = Math.sin(time * 2.4 + i * 2) * 1.8;
      var m = TOKEN_META[t.type];
      var s = TILE * 0.56;
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.55)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = t.type === 'boat' ? 'rgba(56,189,248,0.92)' : 'rgba(251,113,133,0.92)';
      ctx.beginPath();
      ctx.arc(cx, cy + bob, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = Math.round(s * 1.25) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.icon, cx, cy + bob + 1);
      ctx.restore();
    }
  }

  function drawSheikh() {
    var cx = tileCx(sheikh.c), cy = tileCy(sheikh.r);
    var s = TILE * 0.98;
    ctx.save();
    ctx.shadowColor = 'rgba(255,215,140,0.8)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#b9a26b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + TILE * 0.38, TILE * 0.42, TILE * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#4a6b2f';
    ctx.beginPath();
    ctx.arc(cx, cy + TILE * 0.08, s * 0.62, Math.PI * 0.9, Math.PI * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.font = Math.round(TILE * 1.0) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👳', cx, cy - TILE * 0.08);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '700 ' + Math.round(TILE * 0.3) + 'px ' + AR_FONT;
    ctx.fillText('الشيخ', cx, cy + TILE * 0.52);
    ctx.restore();

    if (playerNearSheikh() && phase === 'playing') {
      // interaction bubble
      var bw = TILE * 4.4;
      var by = cy - TILE * 1.15;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      roundRect(cx - bw / 2, by, bw, TILE * 0.62, 8);
      ctx.fill();
      ctx.fillStyle = '#123';
      ctx.textAlign = 'center';
      ctx.font = '700 ' + Math.round(TILE * 0.3) + 'px ' + AR_FONT;
      ctx.fillText('افحص الحروف عند الشيخ 🤲', cx, by + TILE * 0.36);
      ctx.font = '500 ' + Math.round(TILE * 0.2) + 'px ' + EN_FONT;
      ctx.fillText('Press Space / tap here to check', cx, by + TILE * 0.56);
      ctx.restore();
    }
  }

  function drawPlayer() {
    var cx, cy;
    if (player.moving) {
      var f = player.prog;
      cx = tileCx(player.c) * (1 - f) + tileCx(player.tc) * f;
      cy = tileCy(player.r) * (1 - f) + tileCy(player.tr) * f;
    } else {
      cx = tileCx(player.c); cy = tileCy(player.r);
    }
    var ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][player.facing];
    var open = player.moving ? 0.24 + 0.2 * Math.sin(player.mouthT) : 0.08;
    var rad = TILE * 0.42;
    ctx.save();
    ctx.shadowColor = 'rgba(255,230,120,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rad, ang + open, ang + Math.PI * 2 - open);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // eye looking opposite the mouth
    var ex = cx - Math.cos(ang) * rad * 0.34;
    var ey = cy - Math.sin(ang) * rad * 0.34;
    ctx.fillStyle = '#3d3200';
    ctx.beginPath();
    ctx.arc(ex, ey, rad * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawReadyArrow() {
    // small bouncing arrow above player when all letters collected
    if (phase !== 'playing' || tray.length < word.letters.length) return;
    var cx = tileCx(player.c), cy = tileCy(player.r);
    var bob = Math.sin(time * 5) * 2;
    ctx.save();
    ctx.fillStyle = '#7dffa0';
    ctx.font = Math.round(TILE * 0.4) + 'px ' + EN_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('→', cx + TILE * 0.55, cy - TILE * 0.5 + bob);
    ctx.font = '700 ' + Math.round(TILE * 0.24) + 'px ' + AR_FONT;
    ctx.fillStyle = '#ffe14d';
    ctx.fillText('اذهب للشيخ', cx, cy - TILE * 0.75 + bob);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // background
    ctx.fillStyle = '#070b1c';
    ctx.fillRect(0, 0, cv.width / dpr, cv.height / dpr);
    drawWallsAndFloor();
    drawHazards();
    drawTokens();
    drawLetters();
    drawSheikh();
    drawPlayer();
    drawReadyArrow();
    ctx.restore();
  }

  /* ================= layout / resize ================= */
  var dpr = 1;

  /* Size the maze canvas to fill as much of the screen as possible: the
     smaller of (available width) and (available height) decides the tile
     size, so the maze grows/shrinks with the window and in fullscreen. */
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var fs = document.body.classList.contains('fs');
    var topEl = document.querySelector('.top');
    var footEl = document.querySelector('.foot');
    var panelEl = document.querySelector('.panel');
    var actEl = document.querySelector('.actRow');
    var arrowEl = document.querySelector('.arrowRow');
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var vv = window.visualViewport;
    var vw = (vv && vv.width) ? vv.width : window.innerWidth;
    var vh = (vv && vv.height) ? vv.height : window.innerHeight;
    var headerH = (fs || !topEl) ? 0 : topEl.offsetHeight;
    var footH = (fs || !footEl) ? 0 : footEl.offsetHeight;
    // phone controls: a slim action row above the maze and an arrow row below it;
    // on a sideways phone both sit beside the maze (they cost width, not height)
    var actVisible = !!(actEl && actEl.offsetParent !== null);
    var arrowVisible = !!(arrowEl && arrowEl.offsetParent !== null);
    var phoneLandscape = coarse && !fs && vh < vw && vh <= 560;
    var barH = 0, barW = 0;
    if (phoneLandscape) {
      if (actVisible) barW += actEl.offsetWidth + 10;
      if (arrowVisible) barW += arrowEl.offsetWidth + 10;
    } else {
      if (actVisible) barH += actEl.offsetHeight + 6;
      if (arrowVisible) barH += arrowEl.offsetHeight + 6;
    }
    var panelBeside = fs ? true : (vw > 900 || phoneLandscape);
    var panelW = (panelBeside && panelEl) ? Math.max(panelEl.offsetWidth, 180) + 14 : 0;
    var availH = Math.max(140, vh - headerH - footH - barH - (fs ? 14 : 26));
    var availW = Math.max(140, vw - panelW - barW - (panelW ? 18 : 10));
    TILE = Math.floor(Math.min(availW / C, availH / R));
    TILE = Math.max(9, Math.min(TILE, 64));
    var cssW = TILE * C, cssH = TILE * R;
    cv.style.width = cssW + 'px';
    cv.style.height = cssH + 'px';
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    wrap.style.width = cssW + 'px';
    wrap.style.height = cssH + 'px';
  }

  function toggleFullscreen() {
    var el = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    } catch (e) { /* ignore */ }
  }

  /* ================= loop ================= */
  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    if (!lastT) lastT = ts;
    var dt = Math.min(0.035, (ts - lastT) / 1000);
    lastT = ts;
    if (phase === 'playing') {
      if (freezeT > 0) freezeT -= dt;
      // token respawns
      var due = [];
      pendingSpawns = pendingSpawns.filter(function (p) {
        if (p.at <= time) { due.push(p); return false; }
        return true;
      });
      due.forEach(function (p) {
        if (aliveCount(p.type) < MAX_ALIVE) spawnToken(p.type);
      });
      // safety net: if the player holds nothing and no item of a type exists
      // anywhere (nor is one on its way), put one within reach right away
      ['boat', 'fire'].forEach(function (type) {
        var coming = pendingSpawns.some(function (p) { return p.type === type; });
        if (held[type] === 0 && aliveCount(type) === 0 && !coming) spawnToken(type);
      });
      time += dt;
      updatePlayer(dt);
    } else {
      time += dt;
    }
    draw();
  }

  /* ================= dev autotest (?autotest=ok|wrong|all) =================
     Drives the real game logic in a headless browser and prints
     "AUTOTEST RESULT ..." to the console. The positions are derived from the
     maze itself (BFS path from player to sheikh), so the tests survive map
     changes. */
  function testAdvance(s) {
    // Headless chrome barely fires requestAnimationFrame under
    // --virtual-time-budget, so advance the in-game clock manually.
    var n = Math.ceil(s / 0.02);
    for (var i = 0; i < n; i++) {
      if (freezeT > 0) freezeT = Math.max(0, freezeT - 0.02);
      time += 0.02;
    }
  }
  function testPlaceLetters(glyphs, cells) {
    letters = [];
    for (var i = 0; i < glyphs.length; i++) {
      letters.push({ glyph: glyphs[i], r: cells[i].r, c: cells[i].c, taken: false });
    }
    tray = [];
    syncUI();
  }
  function testArrive(r, c) {
    player.r = r; player.c = c; player.moving = false; player.prog = 0;
    onArriveCell();
  }
  /* Walk one cell at a time through the REAL input + game-loop path
     (pressDir -> updatePlayer -> onArriveCell), so movement bugs are caught. */
  function testWalkChain(cells, done) {
    var i = 0;
    (function tick() {
      if (i >= cells.length) { done(); return; }
      var target = cells[i];
      if (player.r === target.r && player.c === target.c) { i++; after(6, tick); return; }
      var dr = target.r - player.r, dc = target.c - player.c;
      if (Math.abs(dr) + Math.abs(dc) !== 1) {
        testMovementFailure = 'path out of sync at ' + player.r + ',' + player.c + ' -> ' + target.r + ',' + target.c;
        done();
        return;
      }
      var name = dr < 0 ? 'up' : (dr > 0 ? 'down' : (dc > 0 ? 'right' : 'left'));
      // step exactly one cell, synchronously, through the real movement code
      var guard = 0;
      while (guard++ < 40) {
        if (freezeT > 0) freezeT = 0;
        if (!player.moving) pressDir(name);
        updatePlayer(0.05);
        if (!player.moving && player.r === target.r && player.c === target.c) break;
      }
      releaseDir(name);
      if (player.r !== target.r || player.c !== target.c) {
        testMovementFailure = 'stuck walking to ' + target.r + ',' + target.c + ' at ' + player.r + ',' + player.c;
        done();
        return;
      }
      i++;
      after(6, tick);
    })();
  }
  var testMovementFailure = null;
  /* corridor-only BFS from the player start to a tile next to the sheikh */
  function testSafePath() {
    var startKey = player.r + ',' + player.c;
    var goals = {};
    for (var i = 0; i < 4; i++) {
      var nr = sheikh.r + DIRS[i].dr, nc = sheikh.c + DIRS[i].dc;
      if (kindAt(nr, nc) === 'corridor') goals[nr + ',' + nc] = true;
    }
    var prev = {};
    prev[startKey] = null;
    var queue = [startKey], goal = null;
    while (queue.length) {
      var key = queue.shift();
      if (goals[key]) { goal = key; break; }
      var pp = key.split(','), r0 = +pp[0], c0 = +pp[1];
      for (var d = 0; d < 4; d++) {
        var r1 = r0 + DIRS[d].dr, c1 = c0 + DIRS[d].dc;
        if (kindAt(r1, c1) !== 'corridor') continue;
        var k1 = r1 + ',' + c1;
        if (Object.prototype.hasOwnProperty.call(prev, k1)) continue;
        prev[k1] = key;
        queue.push(k1);
      }
    }
    if (!goal) return null;
    var cells = [], cur = goal;
    while (cur && cur !== startKey) {
      var parts = cur.split(',');
      cells.push({ r: +parts[0], c: +parts[1] });
      cur = prev[cur];
    }
    cells.reverse();
    return cells;
  }
  function testLetterCells(path, n) {
    if (!path || path.length < n + 1) return null;
    var last = path.length - 2; // never on the tile right next to the sheikh
    var cells = [];
    for (var i = 0; i < n; i++) {
      var idx = Math.round((i + 1) * last / (n + 1));
      cells.push(path[Math.max(0, Math.min(last, idx))]);
    }
    return cells;
  }
  /* find a corridor tile with a hazard tile next to it */
  function testHazardProbe(kind) {
    for (var r = 1; r < R - 1; r++) {
      for (var c = 1; c < C - 1; c++) {
        if (tileKinds[r][c] !== kind) continue;
        if (kindAt(r - 1, c) === 'corridor') return { r: r - 1, c: c, dir: 2 };
        if (kindAt(r + 1, c) === 'corridor') return { r: r + 1, c: c, dir: 0 };
      }
    }
    return null;
  }

  function runAutoTest(mode) {
    var failures = [];

    function gridSanity() {
      var cw = 0, cf = 0, open = 0;
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        if (tileKinds[r][c] === 'water') cw++;
        else if (tileKinds[r][c] === 'fire') cf++;
        else if (tileKinds[r][c] === 'corridor') open++;
      }
      if (cw < C - 4 || cf < C - 4) failures.push('hazard bands missing (water=' + cw + ' fire=' + cf + ' of ' + C + ')');
      if (open < C * R * 0.25) failures.push('maze too small/sparse: ' + open + ' corridors of ' + (C * R));
    }
    function hazardLogic() {
      ['water', 'fire'].forEach(function (kind) {
        var probe = testHazardProbe(kind);
        if (!probe) { failures.push('no probe tile for ' + kind); return; }
        var key = (kind === 'water') ? 'boat' : 'fire';
        player.r = probe.r; player.c = probe.c; player.moving = false; player.prog = 0;
        held[key] = 0;
        var blocked = tryStartMove(probe.dir);
        if (blocked !== false) failures.push(kind + ' should block without the item');
        held[key] = 2;
        var ok = tryStartMove(probe.dir);
        if (ok !== true) failures.push(kind + ' should be passable with the item');
        else if (held[key] !== 1) failures.push(kind + ' crossing should consume exactly one item');
        player.moving = false; player.prog = 0;
        player.r = probe.r; player.c = probe.c;
      });
    }
    /* --- regression: barrier crossing must cost ONE item per entry, and
       walking along a barrier must be free (this was the "unreachable letter"
       bug: charging per tile made band-walking impossible) --- */
    function barrierCrossing() {
      for (var bi = 0; bi < maze.meta.hazardRows.length; bi++) {
        var row = maze.meta.hazardRows[bi];
        var type = tileKinds[row][1];
        if (type !== 'water' && type !== 'fire') continue;
        var key = (type === 'water') ? 'boat' : 'fire';
        for (var c = 1; c < C - 1; c++) {
          if (tileKinds[row][c] !== type) continue;
          if (kindAt(row - 1, c) !== 'corridor' || kindAt(row + 1, c) !== 'corridor') continue;
          // 1) enter the barrier with exactly one item
          player.r = row - 1; player.c = c; player.moving = false; player.prog = 0;
          held.boat = 0; held.fire = 0; held[key] = 1;
          if (!tryStartMove(2)) { failures.push('cannot enter ' + type + ' holding one item'); break; }
          if (held[key] !== 0) failures.push(type + ' entry should consume exactly one item');
          // 2) leave on the far side with no items left
          player.r = player.tr; player.c = player.tc; player.moving = false; player.prog = 0;
          onArriveCell();
          if (!tryStartMove(2)) failures.push('cannot step out of ' + type + ' (should be free)');
          // 3) walking ALONG the barrier must be free too
          player.r = row; player.c = c; player.moving = false; player.prog = 0;
          held.boat = 0; held.fire = 0;
          var along = (tileKinds[row][c + 1] === type) ? 1 : ((tileKinds[row][c - 1] === type) ? 3 : null);
          if (along !== null && !tryStartMove(along)) {
            failures.push('walking along ' + type + ' must be free (no item)');
          }
          player.moving = false; player.prog = 0;
          resetPlayer(); tray = []; held.boat = 0; held.fire = 0; syncUI();
          return;
        }
      }
    }

    /* --- regression: every letter the game actually placed must be reachable
       within one barrier entry (0-1 BFS over the live grid) --- */
    function lettersReachable() {
      var best = {}, dist = {};
      var startKey = player.r + ',' + player.c + ',0';
      dist[startKey] = 0;
      var queue = [[player.r, player.c, 0, 0]];
      var hazardId = function (kind) { return kind === 'water' ? 1 : (kind === 'fire' ? 2 : 0); };
      while (queue.length) {
        var cur = queue.shift();
        var r = cur[0], c = cur[1], on = cur[2], used = cur[3];
        if (dist[r + ',' + c + ',' + on] < used) continue;
        var k = r + ',' + c;
        if (best[k] === undefined || used < best[k]) best[k] = used;
        for (var i = 0; i < 4; i++) {
          var nr = r + DIRS[i].dr, nc = c + DIRS[i].dc;
          var kind = kindAt(nr, nc);
          if (kind === 'wall' || kind === 'sheikh') continue;
          var hid = hazardId(kind);
          var cost = (hid && on !== hid) ? 1 : 0;
          var nused = used + cost;
          if (nused > 1) continue;
          var nk = nr + ',' + nc + ',' + (hid || 0);
          if (dist[nk] === undefined || dist[nk] > nused) {
            dist[nk] = nused;
            queue.push([nr, nc, hid || 0, nused]);
          }
        }
      }
      letters.forEach(function (l) {
        var k = l.r + ',' + l.c;
        var cost = best[k];
        if (cost === undefined) failures.push('letter ' + l.glyph + ' at ' + k + ' is unreachable');
        else if (cost > 1) failures.push('letter ' + l.glyph + ' at ' + k + ' needs ' + cost + ' barrier entries');
      });
    }

    function zonesUsedByLetters() {
      var zs = {};
      letters.forEach(function (l) { zs[zoneOf(l.r)] = true; });
      return Object.keys(zs).length;
    }

    gridSanity();
    try { draw(); } catch (e) { failures.push('render threw: ' + e.message); }
    var idx0 = wordIndex;
    var target = currentWord().letters.slice();
    var walkGlyphs = (mode === 'wrong') ? target.slice(1).concat(target[0]) : target;
    var path = testSafePath();
    if (!path) failures.push('no hazard-free path from player to sheikh');
    else {
      var cells = testLetterCells(path, target.length);
      if (!cells) failures.push('path too short for letters');
      else {
        testPlaceLetters(walkGlyphs, cells);
        hazardLogic();
        resetPlayer();          // the hazard probe displaced the player
        tray = [];
        held.boat = 0; held.fire = 0;
        syncUI();
        // real placement must spread letters over every zone
        placeLetters(currentWord());
        var zc = maze.meta.hazardRows.length + 1;
        barrierCrossing();
        lettersReachable();
        // Backspace / the ↺ button must return the pac-man to the start tile
        player.r = 1; player.c = 1; player.moving = false; player.prog = 0;
        returnToStart();
        if (player.r !== maze.meta.player.r || player.c !== maze.meta.player.c) {
          failures.push('reset did not return to the start tile');
        }
        var zonesPlaced = zonesUsedByLetters();
        if (zonesPlaced < Math.min(zc, target.length)) {
          failures.push('letters only in ' + zonesPlaced + ' of ' + zc + ' zones');
        }
        var placedFar = true;
        for (var a = 0; a < letters.length; a++) {
          if (tileKinds[letters[a].r][letters[a].c] !== 'corridor') placedFar = false;
        }
        if (!placedFar) failures.push('a letter was placed off-corridor');
        testPlaceLetters(walkGlyphs, cells); // back to the deterministic test layout
        var marksBefore = marks;
        testAdvance(5);
        testWalkChain(path, function () {
          var trayOk = tray.length === target.length;
          for (var i = 0; i < target.length; i++) if (tray[i] !== walkGlyphs[i]) trayOk = false;
          if (!trayOk) failures.push('tray after walking: ' + tray.join('') + ' expected ' + walkGlyphs.join(''));
          if (!playerNearSheikh()) failures.push('player should end next to the sheikh');
          var checkedWord = currentWord();
          testAdvance(5);
          checkWithSheikh();
          if (mode !== 'wrong') {
            after(700, function () {
              var card = document.getElementById('wordCard');
              if (!card || !card.classList.contains('show')) {
                failures.push('meaning card did not appear after a correct answer');
              } else {
                if (card.textContent.indexOf(checkedWord.meaning) === -1) failures.push('meaning card missing the meaning');
                if (card.textContent.indexOf(checkedWord.translit) === -1) failures.push('meaning card missing the transliteration');
              }
              var hud = document.getElementById('chipMarks');
              if (!hud || hud.textContent !== String(marks)) {
                failures.push('score HUD out of sync: ' + (hud && hud.textContent) + ' vs ' + marks);
              }
              var stat = document.getElementById('statScore');
              if (!stat || stat.textContent !== String(marks)) failures.push('scoreboard out of sync');
              if (bestScore < marks) failures.push('best score not tracked: ' + bestScore + ' < ' + marks);
              try {
                if (parseInt(localStorage.getItem(BEST_KEY), 10) !== bestScore) failures.push('best score not persisted');
              } catch (e) { /* storage unavailable */ }
            });
          }
          after(3800, function () {
            if (mode === 'wrong') {
              if (marks !== marksBefore - 1) failures.push('wrong check should be -1 mark');
              if (wordIndex !== idx0) failures.push('wrong check should keep the same word');
              if (tray.length !== 0) failures.push('wrong check should clear the tray');
              var untaken = letters.filter(function (l) { return !l.taken; }).length;
              if (untaken !== target.length) failures.push('letters should be back in the maze: ' + untaken);
            } else {
              if (marks !== marksBefore + 1) failures.push('correct check should be +1 mark');
              if (wordIndex !== idx0 + 1) failures.push('correct check should advance the word');
            }
            if (testMovementFailure) failures.push(testMovementFailure);
            if (mode === 'wrong') {
              var hudW = document.getElementById('chipMarks');
              if (!hudW || hudW.textContent !== String(marks)) failures.push('score HUD wrong after a wrong answer');
            }
            console.log('AUTOTEST RESULT ' + (failures.length ? 'FAIL [' + failures.join(', ') + ']' : 'PASS') +
                        ' mode=' + mode + ' marks=' + marks + ' word=' + wordIndex +
                        ' zones=' + zonesPlaced + '/' + zc + ' tray=' + tray.join(''));
          });
        });
      }
    }
  }

  /* Play every word correctly in sequence and expect the end screen. */
  function runAutoTestAll() {
    var failures = [];
    var path = testSafePath();
    if (!path) { console.log('AUTOTEST RESULT FAIL [no path] mode=all'); return; }
    function doWord(idx, done) {
      after(80, function () {
        if (wordIndex !== idx) failures.push('expected word ' + idx + ' got ' + wordIndex);
        var target = wordAt(idx).letters;
        var cells = testLetterCells(path, target.length);
        if (!cells) { failures.push('path too short for word ' + idx); done(); return; }
        testPlaceLetters(target, cells);
        testAdvance(5);
        testWalkChain(path, function () {
          testAdvance(5);
          checkWithSheikh();
          after(3600, done);
        });
      });
    }
    var limit = Math.min(totalWords, autoTestCount);
    var cur = 0;
    (function next() {
      if (cur >= limit) {
        after(500, function () {
          if (limit === totalWords && $('end').classList.contains('hidden')) failures.push('end screen not shown');
          if (marks !== limit) failures.push('marks expected ' + limit + ' got ' + marks);
          if (correctN !== limit) failures.push('correctN expected ' + limit + ' got ' + correctN);
          console.log('AUTOTEST RESULT ' + (failures.length ? 'FAIL [' + failures.join(', ') + ']' : 'PASS') +
                      ' mode=all marks=' + marks + ' correct=' + correctN + ' wrong=' + wrongN);
        });
        return;
      }
      doWord(cur, function () { cur++; next(); });
    })();
  }

  /* ================= maze selection ================= */
  var mazeOverride = null; // ?maze=wide|tall|phone|phoneS
  function pickMazeId() {
    return D.pickMaze(window.innerWidth, window.innerHeight || 9999, mazeOverride).id;
  }
  function loadMaze(id) {
    if (maze && maze.id === id) return;
    maze = D.prepareMaze(D.MAZES[id] || D.MAZES.wide);
    sheikh.r = maze.meta.sheikh.r;
    sheikh.c = maze.meta.sheikh.c;
    parseMaze();
    if (typeof layout === 'function') layout();
  }

  /* ================= boot ================= */
  function previewMaze() {
    loadMaze(pickMazeId());
    word = currentWord();
    tray = [];
    resetPlayer();
    placeLetters(word);
    resetTokens();
    syncUI();
  }

  function buildMazeSummary() {
    var names = [];
    for (var id in D.MAZES) if (Object.prototype.hasOwnProperty.call(D.MAZES, id)) names.push(id);
    return names.length + ' mazes';
  }

  /* show the build + offer a reload when a newer one is deployed */
  function checkForUpdate() {
    var label = 'build ' + BUILD + ' · ' + WORDS.length + ' words · ' + buildMazeSummary();
    var stamp = document.getElementById('buildStamp');
    if (stamp) stamp.textContent = label;
    var stamp2 = document.getElementById('buildStampMenu');
    if (stamp2) stamp2.textContent = label;
    fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (!v || !v.build || v.build === BUILD) return;
      var bar = document.getElementById('updateBar');
      if (!bar) return;
      bar.classList.add('show');
      var btn = document.getElementById('btnReload');
      if (btn) btn.addEventListener('click', function () { location.reload(); });
    }).catch(function () { /* offline: ignore */ });
  }

  function init() {
    loadMaze(pickMazeId());
    layout();
    window.addEventListener('resize', function () {
      layout();
      if (phase === 'menu') previewMaze(); // phone rotated before starting
    });
    window.addEventListener('orientationchange', function () { setTimeout(layout, 150); });
    document.addEventListener('fullscreenchange', function () {
      var on = !!document.fullscreenElement;
      document.body.classList.toggle('fs', on);
      var b = $('btnFs');
      if (b) b.innerHTML = on ? '\u2715 \u062e\u0631\u0648\u062c \u0645\u0646 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629' : '\u26F6 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629';
      setTimeout(layout, 80);
      setTimeout(layout, 320);
    });
    if (window.ResizeObserver) new ResizeObserver(layout).observe(wrap);
    window.addEventListener('beforeunload', function () { clearTimers(); Speech.stop(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) Speech.stop();
    });
    // initial idle view behind menu: letters preview of first word so scene looks alive
    if (!runOrder.length) runOrder = makeRunOrder();
    word = currentWord();
    resetPlayer();
    placeLetters(word);
    resetTokens();
    syncUI();
    rafId = requestAnimationFrame(frame);
    checkForUpdate();

    // debug / preview helper: ?autostart starts the game immediately,
    // ?word=N jumps straight to that word index, ?autotest=ok|wrong runs
    // an end-to-end logic test and prints AUTOTEST RESULT to the console
    try {
      var qs = new URLSearchParams(location.search);
      var seed = qs.get('seed');
      if (seed !== null) rngState = (parseInt(seed, 10) || 1) | 0;
      var cnt = qs.get('count');
      if (cnt !== null) autoTestCount = Math.max(1, parseInt(cnt, 10) || 12);
      var mz = qs.get('maze');
      if (mz && D.MAZES[mz]) { mazeOverride = mz; loadMaze(mz); }
      var want = qs.get('word');
      if (want !== null) forcedStartIndex = clamp(parseInt(want, 10) || 0, 0, totalWords - 1);
      var at = qs.get('autotest');
      // ?debug exposes a tiny read-only state hook (used by tools/verify-touch.js)
      if (qs.get('debug') !== null) {
        window.__qp = {
          pos: function () { return { r: player.r, c: player.c, moving: player.moving, dir: dirOrder.slice() }; },
          sheikh: function () { return { r: sheikh.r, c: sheikh.c }; },
          /* dev helper: render the reward card for a word (by id) and report it */
          previewCard: function (idOrIndex) {
            var w = null;
            if (typeof idOrIndex === 'number') w = WORDS[idOrIndex];
            else for (var i = 0; i < WORDS.length; i++) if (WORDS[i].id === idOrIndex) w = WORDS[i];
            if (!w) w = currentWord();
            showWordCard(w);
            return { id: w.id, shown: bareRecite(w), letters: w.letters.join(''), translit: w.translit, meaning: w.meaning };
          },
          hideCard: function () { hideWordCard(); },
          open: function () {
            var k = function (r, c) { return kindAt(r, c); };
            return {
              up: k(player.r - 1, player.c), right: k(player.r, player.c + 1),
              down: k(player.r + 1, player.c), left: k(player.r, player.c - 1)
            };
          },
          state: function () {
            return {
              maze: maze.id, cols: C, rows: R, tile: TILE, phase: phase,
              word: wordIndex, total: runOrder.length,
              wordId: (word && word.id) || null,
              meaning: (word && word.meaning) || null,
              cardVisible: !!(document.getElementById('wordCard') && document.getElementById('wordCard').classList.contains('show')),
              order: runOrder.slice(0, 8).map(function (i) { return WORDS[i].id; }),
              marks: marks, correct: correctN, wrong: wrongN, best: bestScore,
              hud: (document.getElementById('chipMarks') || {}).textContent || null,
              tray: tray.slice(),
              held: { boat: held.boat, fire: held.fire },
              letters: letters.map(function (l) { return { g: l.glyph, r: l.r, c: l.c, taken: l.taken, zone: zoneOf(l.r) }; })
            };
          }
        };
      }
      if (qs.get('autostart') !== null || at !== null) startGame();
      if (at === 'ok' || at === 'wrong') after(350, function () { runAutoTest(at); });
      if (at === 'all') after(350, function () { runAutoTestAll(); });
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
