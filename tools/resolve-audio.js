/* Resolve + verify real Quranic word-by-word recitation for every game word.
 *
 * For each target word we fetch the candidate ayah from api.quran.com, find the
 * word whose consonantal skeleton matches the target letters (allowing the
 * common prefixes و/ف/ب/ل/ك and the definite article ال), then verify that
 * https://audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3 really exists.
 *
 * Run: node tools/resolve-audio.js
 */
'use strict';

const TARGETS = [
  { id: 'noor',   letters: ['ن', 'و', 'ر'],       candidates: [[24, 35]] },
  { id: 'qamar',  letters: ['ق', 'م', 'ر'],       candidates: [[54, 1], [91, 2]] },
  { id: 'shams',  letters: ['ش', 'م', 'س'],       candidates: [[91, 1]] },
  { id: 'maa',    letters: ['م', 'ا', 'ء'],       candidates: [[23, 18], [21, 30]] },
  { id: 'bahr',   letters: ['ب', 'ح', 'ر'],       candidates: [[24, 40], [16, 14]] },
  { id: 'jabal',  letters: ['ج', 'ب', 'ل'],       candidates: [[59, 21], [78, 7], [7, 74]] },
  { id: 'amal',   letters: ['ع', 'م', 'ل'],       candidates: [[18, 30], [16, 97]] },
  { id: 'layl',   letters: ['ل', 'ي', 'ل'],       candidates: [[17, 1], [3, 190]] },
  { id: 'kitab',  letters: ['ك', 'ت', 'ا', 'ب'],  candidates: [[2, 2], [6, 38]] },
  { id: 'samaa',  letters: ['س', 'م', 'ا', 'ء'],  candidates: [[2, 22], [21, 32], [23, 18]] },
  { id: 'shifaa', letters: ['ش', 'ف', 'ا', 'ء'],  candidates: [[16, 69], [10, 57]] },
  { id: 'rahma',  letters: ['ر', 'ح', 'م', 'ة'],  candidates: [[2, 218], [10, 57], [39, 53]] }
];

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u064B]/g;
const PREFIXES = ['', 'و', 'ف', 'ب', 'ك', 'ل', 'ال', 'وال', 'فال', 'بال', 'كال', 'لل'];

function skeleton(text) {
  return text
    .replace(/[\u0670\u0671]/g, '\u0627') // dagger alef + alef wasla -> alef
    .replace(DIACRITICS, '')
    .replace(/[^\u0621-\u064A]/g, '');
}
function pad3(n) { return String(n).padStart(3, '0'); }

async function getAyahWords(surah, ayah) {
  const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('api ' + res.status);
  const json = await res.json();
  const verse = json.verse || (json.verses && json.verses[0]);
  if (!verse || !verse.words) throw new Error('no words in response');
  return verse.words
    .filter((w) => w.char_type_name === 'word' || w.char_type_name === undefined)
    .map((w) => ({ pos: w.position, text: w.text_uthmani || '' }));
}

async function audioExists(surah, ayah, word) {
  const url = `https://audio.qurancdn.com/wbw/${pad3(surah)}_${pad3(ayah)}_${pad3(word)}.mp3`;
  const res = await fetch(url, { method: 'GET', headers: { range: 'bytes=0-2047' } });
  return { ok: res.ok || res.status === 206, status: res.status, url };
}

(async function main() {
  const out = [];
  for (const t of TARGETS) {
    const target = t.letters.join('');
    let found = null;
    for (const [surah, ayah] of t.candidates) {
      let words;
      try { words = await getAyahWords(surah, ayah); }
      catch (e) { console.log(`  ! ${t.id}: api failed for ${surah}:${ayah} (${e.message})`); continue; }
      for (const w of words) {
        const sk = skeleton(w.text);
        for (const p of PREFIXES) {
          if (p && !sk.startsWith(p)) continue;
          var body = sk.slice(p.length);
          // allow a trailing tanween alef (e.g. عَمَلًا -> عملا)
          if (body === target || body === target + '\u0627') { found = { surah, ayah, word: w.pos, text: w.text, prefix: p }; break; }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (!found) { console.log(`✗ ${t.id} (${target}) NOT FOUND`); out.push({ id: t.id, error: 'not found' }); continue; }
    const chk = await audioExists(found.surah, found.ayah, found.word);
    console.log(`${chk.ok ? '✓' : '✗'} ${t.id.padEnd(7)} ${target.padEnd(5)} -> ${found.surah}:${found.ayah} word ${found.word}` +
                ` "${found.text}" prefix="${found.prefix}" audio=${chk.status} ${chk.url}`);
    out.push({ id: t.id, surah: found.surah, ayah: found.ayah, word: found.word, text: found.text, prefix: found.prefix, url: chk.url, audioOk: chk.ok });
  }
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(out.map((o) => ({ id: o.id, s: o.surah, a: o.ayah, w: o.word, text: o.text, url: o.url })), null, 0));
})();
