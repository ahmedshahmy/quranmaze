/* Candidate words to ADD to the game (the first 12 are already in maze-data.js).
 * Each entry: id, the isolated letters the player must collect in order,
 * transliteration and a short English meaning.
 * tools/build-words.js finds a real Qur'anic occurrence for each one (preferring
 * a bare form without prefixes), verifies it against the words API, checks the
 * word-by-word recitation clip exists, downloads it, and emits the ready
 * WORDS entries. Words that cannot be verified are reported and skipped.
 * Run: node tools/build-words.js
 */
'use strict';

module.exports = [
  // --- 2 letters -------------------------------------------------------------
  { id: 'haqq',   letters: ['ح', 'ق'],             translit: 'ḥaqq',   meaning: 'truth' },
  { id: 'yad',    letters: ['ي', 'د'],             translit: 'yad',    meaning: 'hand' },
  { id: 'hajj',   letters: ['ح', 'ج'],             translit: 'ḥajj',   meaning: 'pilgrimage' },

  // --- 3 letters -------------------------------------------------------------
  { id: 'hamd',   letters: ['ح', 'م', 'د'],        translit: 'ḥamd',   meaning: 'praise' },
  { id: 'qalb',   letters: ['ق', 'ل', 'ب'],        translit: 'qalb',   meaning: 'heart' },
  { id: 'sabr',   letters: ['ص', 'ب', 'ر'],        translit: 'ṣabr',   meaning: 'patience' },
  { id: 'nafs',   letters: ['ن', 'ف', 'س'],        translit: 'nafs',   meaning: 'soul' },
  { id: 'ruh',    letters: ['ر', 'و', 'ح'],        translit: 'rūḥ',    meaning: 'spirit' },
  { id: 'yawm',   letters: ['ي', 'و', 'م'],        translit: 'yawm',   meaning: 'day' },
  { id: 'bayt',   letters: ['ب', 'ي', 'ت'],        translit: 'bayt',   meaning: 'house' },
  { id: 'ilm',    letters: ['ع', 'ل', 'م'],        translit: 'ʿilm',   meaning: 'knowledge' },
  { id: 'rizq',   letters: ['ر', 'ز', 'ق'],        translit: 'rizq',   meaning: 'provision' },
  { id: 'khayr',  letters: ['خ', 'ي', 'ر'],        translit: 'khayr',  meaning: 'good' },
  { id: 'nahr',   letters: ['ن', 'ه', 'ر'],        translit: 'nahr',   meaning: 'river' },
  { id: 'najm',   letters: ['ن', 'ج', 'م'],        translit: 'najm',   meaning: 'star' },
  { id: 'shahr',  letters: ['ش', 'ه', 'ر'],        translit: 'shahr',  meaning: 'month' },
  { id: 'sanah',  letters: ['س', 'ن', 'ة'],        translit: 'sanah',  meaning: 'year' },
  { id: 'matar',  letters: ['م', 'ط', 'ر'],        translit: 'maṭar',  meaning: 'rain' },
  { id: 'barq',   letters: ['ب', 'ر', 'ق'],        translit: 'barq',   meaning: 'lightning' },
  { id: 'rad',    letters: ['ر', 'ع', 'د'],        translit: 'raʿd',   meaning: 'thunder' },
  { id: 'sahab',  letters: ['س', 'ح', 'ا', 'ب'],   translit: 'saḥāb',  meaning: 'clouds' },
  { id: 'asal',   letters: ['ع', 'س', 'ل'],        translit: 'ʿasal',  meaning: 'honey' },
  { id: 'laban',  letters: ['ل', 'ب', 'ن'],        translit: 'laban',  meaning: 'milk' },
  { id: 'hut',    letters: ['ح', 'و', 'ت'],        translit: 'ḥūt',    meaning: 'fish' },
  { id: 'tayr',   letters: ['ط', 'ي', 'ر'],        translit: 'ṭayr',   meaning: 'bird' },
  { id: 'nahl',   letters: ['ن', 'ح', 'ل'],        translit: 'naḥl',   meaning: 'bees' },
  { id: 'naml',   letters: ['ن', 'م', 'ل'],        translit: 'naml',   meaning: 'ants' },
  { id: 'fil',    letters: ['ف', 'ي', 'ل'],        translit: 'fīl',    meaning: 'elephant' },
  { id: 'khayl',  letters: ['خ', 'ي', 'ل'],        translit: 'khayl',  meaning: 'horses' },
  { id: 'misk',   letters: ['م', 'س', 'ك'],        translit: 'misk',   meaning: 'musk' },
  { id: 'tin',    letters: ['ت', 'ي', 'ن'],        translit: 'tīn',    meaning: 'figs' },
  { id: 'mawt',   letters: ['م', 'و', 'ت'],        translit: 'mawt',   meaning: 'death' },
  { id: 'fajr',   letters: ['ف', 'ج', 'ر'],        translit: 'fajr',   meaning: 'dawn' },
  { id: 'din',    letters: ['د', 'ي', 'ن'],        translit: 'dīn',    meaning: 'religion' },
  { id: 'amr',    letters: ['ا', 'م', 'ر'],        translit: 'amr',    meaning: 'command' },
  { id: 'khalq',  letters: ['خ', 'ل', 'ق'],        translit: 'khalq',  meaning: 'creation' },
  { id: 'bashar', letters: ['ب', 'ش', 'ر'],        translit: 'bashar', meaning: 'human being' },
  { id: 'wad',    letters: ['و', 'ا', 'د'],        translit: 'wād',    meaning: 'valley' },
  { id: 'hajar',  letters: ['ح', 'ج', 'ر'],        translit: 'ḥajar',  meaning: 'stone' },
  { id: 'bab',    letters: ['ب', 'ا', 'ب'],        translit: 'bāb',    meaning: 'door' },
  { id: 'nar',    letters: ['ن', 'ا', 'ر'],        translit: 'nār',    meaning: 'fire' },
  { id: 'jannah', letters: ['ج', 'ن', 'ة'],        translit: 'jannah', meaning: 'garden' },
  { id: 'malik',  letters: ['م', 'ل', 'ك'],        translit: 'malik',  meaning: 'king' },
  { id: 'nabiy',  letters: ['ن', 'ب', 'ي'],        translit: 'nabiyy', meaning: 'prophet' },
  { id: 'sam',    letters: ['س', 'م', 'ع'],        translit: 'samʿ',   meaning: 'hearing' },
  { id: 'basar',  letters: ['ب', 'ص', 'ر'],        translit: 'baṣar',  meaning: 'sight' },
  { id: 'wajh',   letters: ['و', 'ج', 'ه'],        translit: 'wajh',   meaning: 'face' },
  { id: 'sadr',   letters: ['ص', 'د', 'ر'],        translit: 'ṣadr',   meaning: 'chest' },
  { id: 'sawm',   letters: ['ص', 'و', 'م'],        translit: 'ṣawm',   meaning: 'fasting' },
  { id: 'fiddah', letters: ['ف', 'ض', 'ة'],        translit: 'fiḍḍah', meaning: 'silver' },
  { id: 'adl',    letters: ['ع', 'د', 'ل'],        translit: 'ʿadl',   meaning: 'justice' },
  { id: 'zulm',   letters: ['ظ', 'ل', 'م'],        translit: 'ẓulm',   meaning: 'wrongdoing' },

  // --- 4 letters -------------------------------------------------------------
  { id: 'salat',  letters: ['ص', 'ل', 'ا', 'ة'],   translit: 'ṣalāh',  meaning: 'prayer' },
  { id: 'zakah',  letters: ['ز', 'ك', 'ا', 'ة'],   translit: 'zakāh',  meaning: 'charity' },
  { id: 'hikmah', letters: ['ح', 'ك', 'م', 'ة'],   translit: 'ḥikmah', meaning: 'wisdom' },
  { id: 'sirat',  letters: ['ص', 'ر', 'ا', 'ط'],   translit: 'ṣirāṭ',  meaning: 'path' },
  { id: 'hayat',  letters: ['ح', 'ي', 'ا', 'ة'],   translit: 'ḥayāh',  meaning: 'life' },
  { id: 'hisab',  letters: ['ح', 'س', 'ا', 'ب'],   translit: 'ḥisāb',  meaning: 'reckoning' },
  { id: 'sabil',  letters: ['س', 'ب', 'ي', 'ل'],   translit: 'sabīl',  meaning: 'way' },
  { id: 'hadid',  letters: ['ح', 'د', 'ي', 'د'],   translit: 'ḥadīd',  meaning: 'iron' },
  { id: 'dhahab', letters: ['ذ', 'ه', 'ب'],        translit: 'dhahab', meaning: 'gold' },
  { id: 'rasul',  letters: ['ر', 'س', 'و', 'ل'],   translit: 'rasūl',  meaning: 'messenger' },
  { id: 'shajar', letters: ['ش', 'ج', 'ر'],        translit: 'shajar', meaning: 'trees' },
  { id: 'thamar', letters: ['ث', 'م', 'ر'],        translit: 'thamar', meaning: 'fruit' },
  { id: 'zayt',   letters: ['ز', 'ي', 'ت'],        translit: 'zayt',   meaning: 'oil' },
  { id: 'kalimah', letters: ['ك', 'ل', 'م', 'ة'],  translit: 'kalimah', meaning: 'word' }
];
