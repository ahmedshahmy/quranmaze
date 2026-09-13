/* Build verified game words from tools/words-source.js
 *
 * For every candidate word it:
 *   1. scans the whole Qur'an (bulk uthmani text) for an occurrence whose
 *      consonantal skeleton matches the target letters — preferring a BARE form
 *      (no و/ف/ب/ل/ال prefix) and then short verses,
 *   2. asks the words API for that verse to get the exact word position
 *      (which is what the word-by-word recitation clip is keyed by),
 *   3. checks the recitation clip exists and downloads it to audio/<id>.mp3,
 *   4. emits a ready-to-paste WORDS entry (letters, recite, translit, meaning,
 *      audio reference and the verse for the end-of-round recap).
 *
 * Run: node tools/build-words.js            (writes .cache/new-words.js + report)
 *      node tools/build-words.js --no-download
 */
'use strict';

const fs = require('fs');
const path = require('path');
const TARGETS = require('./words-source.js');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, '.cache');
const AUDIO = path.join(ROOT, 'audio');
const DOWNLOAD = !process.argv.includes('--no-download');

/* prefixes that may sit in front of a word in the Qur'anic text */
const PREFIXES = ['', 'و', 'ف', 'ب', 'ك', 'ل', 'ال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ولل'];

function skel(text) {
  return text
    .replace(/[\u0670\u0671]/g, '\u0627')                       // dagger alef / alef wasla -> alef
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, '')
    .replace(/[^\u0621-\u064A]/g, '');
}
function forTts(text) { return text.replace(/\u0671/g, '\u0627'); }
function pad3(n) { return String(n).padStart(3, '0'); }
function arabicNum(n) { return String(n).split('').map((d) => '٠١٢٣٤٥٦٧٨٩'[+d]).join(''); }

async function fetchJson(url, cacheFile) {
  if (cacheFile && fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const json = await res.json();
  if (cacheFile) {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(json));
  }
  return json;
}

/* returns candidate occurrences, best first */
function findOccurrences(verses, target) {
  const found = [];
  for (const v of verses) {
    const tokens = v.text_uthmani.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const sk = skel(tokens[i]);
      if (!sk) continue;
      for (const pre of PREFIXES) {
        if (pre && !sk.startsWith(pre)) continue;
        const body = sk.slice(pre.length);
        if (body !== target && body !== target + '\u0627') continue;
        found.push({
          key: v.verse_key,
          text: v.text_uthmani,
          bare: pre === '',
          prefix: pre,
          token: tokens[i],
          score: (pre === '' ? 0 : 1000) + v.text_uthmani.length
        });
        break;
      }
    }
  }
  found.sort((a, b) => a.score - b.score);
  return found;
}

async function wordPosition(surah, ayah, target) {
  const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani`;
  const data = await fetchJson(url, null);
  const verse = data.verse || (data.verses && data.verses[0]);
  if (!verse || !verse.words) return null;
  const words = verse.words.filter((w) => !w.char_type_name || w.char_type_name === 'word');
  let fallback = null;
  for (const w of words) {
    const sk = skel(w.text_uthmani || '');
    for (const pre of PREFIXES) {
      if (pre && !sk.startsWith(pre)) continue;
      const body = sk.slice(pre.length);
      if (body !== target && body !== target + '\u0627') continue;
      if (pre === '') return { pos: w.position, text: w.text_uthmani, prefix: pre, verse };
      if (!fallback) fallback = { pos: w.position, text: w.text_uthmani, prefix: pre, verse };
      break;
    }
  }
  return fallback;
}

async function audioOk(surah, ayah, pos) {
  const url = `https://audio.qurancdn.com/wbw/${pad3(surah)}_${pad3(ayah)}_${pad3(pos)}.mp3`;
  const res = await fetch(url, { headers: { range: 'bytes=0-1023' } });
  return { ok: res.ok || res.status === 206, url };
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('download failed ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return buf.length;
}

function verseRef(chapterName, ayah, verseText) {
  const short = verseText.length > 70 ? verseText.slice(0, 70) + '…' : verseText;
  return `سورة ${chapterName} ${arabicNum(ayah)} ﴿${short}﴾`;
}

function jsEntry(w) {
  return `    {
      id: '${w.id}', letters: [${w.letters.map((l) => `'${l}'`).join(', ')}], recite: '${w.recite}',
      translit: '${w.translit}', meaning: '${w.meaning}',
      audio: { s: ${w.s}, a: ${w.a}, w: ${w.w}, text: '${w.text}', url: '${w.url}' },
      ref: '${w.ref}'
    }`;
}

(async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  console.log('loading Qur\'an text…');
  const verses = (await fetchJson('https://api.quran.com/api/v4/quran/verses/uthmani', path.join(CACHE, 'quran-uthmani.json'))).verses;
  const chapters = (await fetchJson('https://api.quran.com/api/v4/chapters?language=ar', path.join(CACHE, 'chapters-ar.json'))).chapters;
  const chapterName = {};
  chapters.forEach((c) => { chapterName[c.id] = c.name_arabic; });
  console.log(`verses: ${verses.length}, chapters: ${chapters.length}\n`);

  const built = [], failed = [];
  for (const t of TARGETS) {
    const target = t.letters.join('');
    const occ = findOccurrences(verses, target);
    if (!occ.length) { failed.push(`${t.id} (${target}): no occurrence`); console.log(`✗ ${t.id.padEnd(8)} ${target.padEnd(5)} not found`); continue; }
    let done = false;
    for (const cand of occ.slice(0, 6)) {
      const [s, a] = cand.key.split(':').map(Number);
      let pos;
      try { pos = await wordPosition(s, a, target); } catch (e) { continue; }
      if (!pos) continue;
      const clip = await audioOk(s, a, pos.pos);
      if (!clip.ok) continue;
      if (DOWNLOAD) {
        try { await download(clip.url, path.join(AUDIO, t.id + '.mp3')); }
        catch (e) { failed.push(`${t.id}: download error ${e.message}`); break; }
      }
      built.push({
        id: t.id, letters: t.letters, translit: t.translit, meaning: t.meaning,
        recite: forTts(pos.text), s, a, w: pos.pos, text: pos.text, url: clip.url,
        ref: verseRef(chapterName[s], a, pos.verse.text_uthmani || cand.text)
      });
      console.log(`✓ ${t.id.padEnd(8)} ${target.padEnd(5)} -> ${s}:${a} word ${pos.pos} "${pos.text}"${pos.prefix ? ' (prefix ' + pos.prefix + ')' : ''}`);
      done = true;
      break;
    }
    if (!done && !failed.some((f) => f.startsWith(t.id))) {
      failed.push(`${t.id} (${target}): occurrences found but no verifiable recitation clip`);
      console.log(`✗ ${t.id.padEnd(8)} ${target.padEnd(5)} no usable clip`);
    }
  }

  const out = `/* generated by tools/build-words.js — verified Qur'anic words */\n` +
              `  var NEW_WORDS = [\n${built.map(jsEntry).join(',\n')}\n  ];\n`;
  fs.writeFileSync(path.join(CACHE, 'new-words.js'), out);

  const letters = built.reduce((n, w) => n + w.letters.length, 0);
  console.log(`\nbuilt ${built.length} words / ${letters} letters`);
  if (failed.length) {
    console.log('problems:');
    failed.forEach((f) => console.log('   - ' + f));
  }
  console.log('written to .cache/new-words.js');
})();
