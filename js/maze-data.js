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
        '#.............#...........#',
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
        '#.#...#.#.#######.#.#####.#',
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
        '#####.#.#.###.#.#.#',
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
        '#.#######...#.#####',
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
    },
{
      id: 'haqq', letters: ['ح', 'ق'], recite: 'حَقُّ',
      translit: 'ḥaqq', meaning: 'truth',
      audio: { s: 56, a: 95, w: 4, text: 'حَقُّ', url: 'https://audio.qurancdn.com/wbw/056_095_004.mp3' },
      ref: 'سورة الواقعة ٩٥ ﴿إِنَّ هَـٰذَا لَهُوَ حَقُّ ٱلْيَقِينِ﴾'
    },
    {
      id: 'yad', letters: ['ي', 'د'], recite: 'يَدَآ',
      translit: 'yad', meaning: 'hand',
      audio: { s: 111, a: 1, w: 2, text: 'يَدَآ', url: 'https://audio.qurancdn.com/wbw/111_001_002.mp3' },
      ref: 'سورة المسد ١ ﴿ تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ﴾'
    },
    {
      id: 'hajj', letters: ['ح', 'ج'], recite: 'حَجَّ',
      translit: 'ḥajj', meaning: 'pilgrimage',
      audio: { s: 2, a: 158, w: 8, text: 'حَجَّ', url: 'https://audio.qurancdn.com/wbw/002_158_008.mp3' },
      ref: 'سورة البقرة ١٥٨ ﴿۞ إِنَّ ٱلصَّفَا وَٱلْمَرْوَةَ مِن شَعَآئِرِ ٱللَّهِ ۖ فَمَنْ حَجَّ ٱ…﴾'
    },
    {
      id: 'hamd', letters: ['ح', 'م', 'د'], recite: 'الْحَمْدُ',
      translit: 'ḥamd', meaning: 'praise',
      audio: { s: 1, a: 2, w: 1, text: 'ٱلْحَمْدُ', url: 'https://audio.qurancdn.com/wbw/001_002_001.mp3' },
      ref: 'سورة الفاتحة ٢ ﴿ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ﴾'
    },
    {
      id: 'qalb', letters: ['ق', 'ل', 'ب'], recite: 'قَلْبٌ',
      translit: 'qalb', meaning: 'heart',
      audio: { s: 50, a: 37, w: 8, text: 'قَلْبٌ', url: 'https://audio.qurancdn.com/wbw/050_037_008.mp3' },
      ref: 'سورة ق ٣٧ ﴿إِنَّ فِى ذَٰلِكَ لَذِكْرَىٰ لِمَن كَانَ لَهُۥ قَلْبٌ أَوْ أَلْقَى ٱلس…﴾'
    },
    {
      id: 'sabr', letters: ['ص', 'ب', 'ر'], recite: 'صَبْرًۭا',
      translit: 'ṣabr', meaning: 'patience',
      audio: { s: 70, a: 5, w: 2, text: 'صَبْرًۭا', url: 'https://audio.qurancdn.com/wbw/070_005_002.mp3' },
      ref: 'سورة المعارج ٥ ﴿فَٱصْبِرْ صَبْرًا جَمِيلًا﴾'
    },
    {
      id: 'nafs', letters: ['ن', 'ف', 'س'], recite: 'نَفْسٌۭ',
      translit: 'nafs', meaning: 'soul',
      audio: { s: 81, a: 14, w: 2, text: 'نَفْسٌۭ', url: 'https://audio.qurancdn.com/wbw/081_014_002.mp3' },
      ref: 'سورة التكوير ١٤ ﴿عَلِمَتْ نَفْسٌ مَّآ أَحْضَرَتْ﴾'
    },
    {
      id: 'ruh', letters: ['ر', 'و', 'ح'], recite: 'رُوحُ',
      translit: 'rūḥ', meaning: 'spirit',
      audio: { s: 16, a: 102, w: 3, text: 'رُوحُ', url: 'https://audio.qurancdn.com/wbw/016_102_003.mp3' },
      ref: 'سورة النحل ١٠٢ ﴿قُلْ نَزَّلَهُۥ رُوحُ ٱلْقُدُسِ مِن رَّبِّكَ بِٱلْحَقِّ لِيُثَبِّتَ ٱل…﴾'
    },
    {
      id: 'yawm', letters: ['ي', 'و', 'م'], recite: 'يَوْمِ',
      translit: 'yawm', meaning: 'day',
      audio: { s: 1, a: 4, w: 2, text: 'يَوْمِ', url: 'https://audio.qurancdn.com/wbw/001_004_002.mp3' },
      ref: 'سورة الفاتحة ٤ ﴿مَـٰلِكِ يَوْمِ ٱلدِّينِ﴾'
    },
    {
      id: 'bayt', letters: ['ب', 'ي', 'ت'], recite: 'بَيْتٍۢ',
      translit: 'bayt', meaning: 'house',
      audio: { s: 51, a: 36, w: 5, text: 'بَيْتٍۢ', url: 'https://audio.qurancdn.com/wbw/051_036_005.mp3' },
      ref: 'سورة الذاريات ٣٦ ﴿فَمَا وَجَدْنَا فِيهَا غَيْرَ بَيْتٍ مِّنَ ٱلْمُسْلِمِينَ﴾'
    },
    {
      id: 'ilm', letters: ['ع', 'ل', 'م'], recite: 'عَلَّمَ',
      translit: 'ʿilm', meaning: 'knowledge',
      audio: { s: 55, a: 2, w: 1, text: 'عَلَّمَ', url: 'https://audio.qurancdn.com/wbw/055_002_001.mp3' },
      ref: 'سورة الرحمن ٢ ﴿عَلَّمَ ٱلْقُرْءَانَ﴾'
    },
    {
      id: 'rizq', letters: ['ر', 'ز', 'ق'], recite: 'رِزْقٌۭ',
      translit: 'rizq', meaning: 'provision',
      audio: { s: 37, a: 41, w: 3, text: 'رِزْقٌۭ', url: 'https://audio.qurancdn.com/wbw/037_041_003.mp3' },
      ref: 'سورة الصافات ٤١ ﴿أُو۟لَـٰٓئِكَ لَهُمْ رِزْقٌ مَّعْلُومٌ﴾'
    },
    {
      id: 'khayr', letters: ['خ', 'ي', 'ر'], recite: 'خَيْرٌۭ',
      translit: 'khayr', meaning: 'good',
      audio: { s: 87, a: 17, w: 2, text: 'خَيْرٌۭ', url: 'https://audio.qurancdn.com/wbw/087_017_002.mp3' },
      ref: 'سورة الأعلى ١٧ ﴿وَٱلْـَٔاخِرَةُ خَيْرٌ وَأَبْقَىٰٓ﴾'
    },
    {
      id: 'nahr', letters: ['ن', 'ه', 'ر'], recite: 'نَهَرًۭا',
      translit: 'nahr', meaning: 'river',
      audio: { s: 18, a: 33, w: 11, text: 'نَهَرًۭا', url: 'https://audio.qurancdn.com/wbw/018_033_011.mp3' },
      ref: 'سورة الكهف ٣٣ ﴿كِلْتَا ٱلْجَنَّتَيْنِ ءَاتَتْ أُكُلَهَا وَلَمْ تَظْلِم مِّنْهُ شَيْـٔ…﴾'
    },
    {
      id: 'najm', letters: ['ن', 'ج', 'م'], recite: 'النَّجْمُ',
      translit: 'najm', meaning: 'star',
      audio: { s: 86, a: 3, w: 1, text: 'ٱلنَّجْمُ', url: 'https://audio.qurancdn.com/wbw/086_003_001.mp3' },
      ref: 'سورة الطارق ٣ ﴿ٱلنَّجْمُ ٱلثَّاقِبُ﴾'
    },
    {
      id: 'shahr', letters: ['ش', 'ه', 'ر'], recite: 'شَهْرٍۢ',
      translit: 'shahr', meaning: 'month',
      audio: { s: 97, a: 3, w: 6, text: 'شَهْرٍۢ', url: 'https://audio.qurancdn.com/wbw/097_003_006.mp3' },
      ref: 'سورة القدر ٣ ﴿لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ﴾'
    },
    {
      id: 'sanah', letters: ['س', 'ن', 'ة'], recite: 'سُنَّةُ',
      translit: 'sanah', meaning: 'year',
      audio: { s: 15, a: 13, w: 6, text: 'سُنَّةُ', url: 'https://audio.qurancdn.com/wbw/015_013_006.mp3' },
      ref: 'سورة الحجر ١٣ ﴿لَا يُؤْمِنُونَ بِهِۦ ۖ وَقَدْ خَلَتْ سُنَّةُ ٱلْأَوَّلِينَ﴾'
    },
    {
      id: 'matar', letters: ['م', 'ط', 'ر'], recite: 'مَّطَرًۭا ۖ',
      translit: 'maṭar', meaning: 'rain',
      audio: { s: 26, a: 173, w: 3, text: 'مَّطَرًۭا ۖ', url: 'https://audio.qurancdn.com/wbw/026_173_003.mp3' },
      ref: 'سورة الشعراء ١٧٣ ﴿وَأَمْطَرْنَا عَلَيْهِم مَّطَرًا ۖ فَسَآءَ مَطَرُ ٱلْمُنذَرِينَ﴾'
    },
    {
      id: 'barq', letters: ['ب', 'ر', 'ق'], recite: 'بَرِقَ',
      translit: 'barq', meaning: 'lightning',
      audio: { s: 75, a: 7, w: 2, text: 'بَرِقَ', url: 'https://audio.qurancdn.com/wbw/075_007_002.mp3' },
      ref: 'سورة القيامة ٧ ﴿فَإِذَا بَرِقَ ٱلْبَصَرُ﴾'
    },
    {
      id: 'rad', letters: ['ر', 'ع', 'د'], recite: 'الرَّعْدُ',
      translit: 'raʿd', meaning: 'thunder',
      audio: { s: 13, a: 13, w: 2, text: 'ٱلرَّعْدُ', url: 'https://audio.qurancdn.com/wbw/013_013_002.mp3' },
      ref: 'سورة الرعد ١٣ ﴿وَيُسَبِّحُ ٱلرَّعْدُ بِحَمْدِهِۦ وَٱلْمَلَـٰٓئِكَةُ مِنْ خِيفَتِهِۦ و…﴾'
    },
    {
      id: 'sahab', letters: ['س', 'ح', 'ا', 'ب'], recite: 'سَحَابٌۭ',
      translit: 'saḥāb', meaning: 'clouds',
      audio: { s: 52, a: 44, w: 8, text: 'سَحَابٌۭ', url: 'https://audio.qurancdn.com/wbw/052_044_008.mp3' },
      ref: 'سورة الطور ٤٤ ﴿وَإِن يَرَوْا۟ كِسْفًا مِّنَ ٱلسَّمَآءِ سَاقِطًا يَقُولُوا۟ سَحَابٌ م…﴾'
    },
    {
      id: 'asal', letters: ['ع', 'س', 'ل'], recite: 'عَسَلٍۢ',
      translit: 'ʿasal', meaning: 'honey',
      audio: { s: 47, a: 15, w: 25, text: 'عَسَلٍۢ', url: 'https://audio.qurancdn.com/wbw/047_015_025.mp3' },
      ref: 'سورة محمد ١٥ ﴿مَّثَلُ ٱلْجَنَّةِ ٱلَّتِى وُعِدَ ٱلْمُتَّقُونَ ۖ فِيهَآ أَنْهَـٰرٌ م…﴾'
    },
    {
      id: 'laban', letters: ['ل', 'ب', 'ن'], recite: 'لَّبَنًا',
      translit: 'laban', meaning: 'milk',
      audio: { s: 16, a: 66, w: 14, text: 'لَّبَنًا', url: 'https://audio.qurancdn.com/wbw/016_066_014.mp3' },
      ref: 'سورة النحل ٦٦ ﴿وَإِنَّ لَكُمْ فِى ٱلْأَنْعَـٰمِ لَعِبْرَةً ۖ نُّسْقِيكُم مِّمَّا فِى …﴾'
    },
    {
      id: 'hut', letters: ['ح', 'و', 'ت'], recite: 'الْحُوتُ',
      translit: 'ḥūt', meaning: 'fish',
      audio: { s: 37, a: 142, w: 2, text: 'ٱلْحُوتُ', url: 'https://audio.qurancdn.com/wbw/037_142_002.mp3' },
      ref: 'سورة الصافات ١٤٢ ﴿فَٱلْتَقَمَهُ ٱلْحُوتُ وَهُوَ مُلِيمٌ﴾'
    },
    {
      id: 'tayr', letters: ['ط', 'ي', 'ر'], recite: 'طَيْرٍۢ',
      translit: 'ṭayr', meaning: 'bird',
      audio: { s: 56, a: 21, w: 2, text: 'طَيْرٍۢ', url: 'https://audio.qurancdn.com/wbw/056_021_002.mp3' },
      ref: 'سورة الواقعة ٢١ ﴿وَلَحْمِ طَيْرٍ مِّمَّا يَشْتَهُونَ﴾'
    },
    {
      id: 'nahl', letters: ['ن', 'ح', 'ل'], recite: 'النَّحْلِ',
      translit: 'naḥl', meaning: 'bees',
      audio: { s: 16, a: 68, w: 4, text: 'ٱلنَّحْلِ', url: 'https://audio.qurancdn.com/wbw/016_068_004.mp3' },
      ref: 'سورة النحل ٦٨ ﴿وَأَوْحَىٰ رَبُّكَ إِلَى ٱلنَّحْلِ أَنِ ٱتَّخِذِى مِنَ ٱلْجِبَالِ بُيُ…﴾'
    },
    {
      id: 'naml', letters: ['ن', 'م', 'ل'], recite: 'النَّمْلِ',
      translit: 'naml', meaning: 'ants',
      audio: { s: 27, a: 18, w: 6, text: 'ٱلنَّمْلِ', url: 'https://audio.qurancdn.com/wbw/027_018_006.mp3' },
      ref: 'سورة النمل ١٨ ﴿حَتَّىٰٓ إِذَآ أَتَوْا۟ عَلَىٰ وَادِ ٱلنَّمْلِ قَالَتْ نَمْلَةٌ يَـٰٓ…﴾'
    },
    {
      id: 'fil', letters: ['ف', 'ي', 'ل'], recite: 'الْفِيلِ',
      translit: 'fīl', meaning: 'elephant',
      audio: { s: 105, a: 1, w: 7, text: 'ٱلْفِيلِ', url: 'https://audio.qurancdn.com/wbw/105_001_007.mp3' },
      ref: 'سورة الفيل ١ ﴿ أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَـٰبِ ٱلْفِيلِ﴾'
    },
    {
      id: 'khayl', letters: ['خ', 'ي', 'ل'], recite: 'خَيْلٍۢ',
      translit: 'khayl', meaning: 'horses',
      audio: { s: 59, a: 6, w: 11, text: 'خَيْلٍۢ', url: 'https://audio.qurancdn.com/wbw/059_006_011.mp3' },
      ref: 'سورة الحشر ٦ ﴿وَمَآ أَفَآءَ ٱللَّهُ عَلَىٰ رَسُولِهِۦ مِنْهُمْ فَمَآ أَوْجَفْتُمْ…﴾'
    },
    {
      id: 'misk', letters: ['م', 'س', 'ك'], recite: 'مِسْكٌۭ ۚ',
      translit: 'misk', meaning: 'musk',
      audio: { s: 83, a: 26, w: 2, text: 'مِسْكٌۭ ۚ', url: 'https://audio.qurancdn.com/wbw/083_026_002.mp3' },
      ref: 'سورة المطففين ٢٦ ﴿خِتَـٰمُهُۥ مِسْكٌ ۚ وَفِى ذَٰلِكَ فَلْيَتَنَافَسِ ٱلْمُتَنَـٰفِسُونَ﴾'
    },
    {
      id: 'tin', letters: ['ت', 'ي', 'ن'], recite: 'وَالتِّينِ',
      translit: 'tīn', meaning: 'figs',
      audio: { s: 95, a: 1, w: 1, text: 'وَٱلتِّينِ', url: 'https://audio.qurancdn.com/wbw/095_001_001.mp3' },
      ref: 'سورة التين ١ ﴿وَٱلتِّينِ وَٱلزَّيْتُونِ﴾'
    },
    {
      id: 'mawt', letters: ['م', 'و', 'ت'], recite: 'مَوْتًۭا',
      translit: 'mawt', meaning: 'death',
      audio: { s: 25, a: 3, w: 18, text: 'مَوْتًۭا', url: 'https://audio.qurancdn.com/wbw/025_003_018.mp3' },
      ref: 'سورة الفرقان ٣ ﴿وَٱتَّخَذُوا۟ مِن دُونِهِۦٓ ءَالِهَةً لَّا يَخْلُقُونَ شَيْـًٔا وَهُمْ…﴾'
    },
    {
      id: 'fajr', letters: ['ف', 'ج', 'ر'], recite: 'وَالْفَجْرِ',
      translit: 'fajr', meaning: 'dawn',
      audio: { s: 89, a: 1, w: 1, text: 'وَٱلْفَجْرِ', url: 'https://audio.qurancdn.com/wbw/089_001_001.mp3' },
      ref: 'سورة الفجر ١ ﴿ وَٱلْفَجْرِ﴾'
    },
    {
      id: 'din', letters: ['د', 'ي', 'ن'], recite: 'دِينِ',
      translit: 'dīn', meaning: 'religion',
      audio: { s: 109, a: 6, w: 4, text: 'دِينِ', url: 'https://audio.qurancdn.com/wbw/109_006_004.mp3' },
      ref: 'سورة الكافرون ٦ ﴿لَكُمْ دِينُكُمْ وَلِىَ دِينِ﴾'
    },
    {
      id: 'khalq', letters: ['خ', 'ل', 'ق'], recite: 'خَلَقَ',
      translit: 'khalq', meaning: 'creation',
      audio: { s: 55, a: 3, w: 1, text: 'خَلَقَ', url: 'https://audio.qurancdn.com/wbw/055_003_001.mp3' },
      ref: 'سورة الرحمن ٣ ﴿خَلَقَ ٱلْإِنسَـٰنَ﴾'
    },
    {
      id: 'bashar', letters: ['ب', 'ش', 'ر'], recite: 'بَشِّرِ',
      translit: 'bashar', meaning: 'human being',
      audio: { s: 4, a: 138, w: 1, text: 'بَشِّرِ', url: 'https://audio.qurancdn.com/wbw/004_138_001.mp3' },
      ref: 'سورة النساء ١٣٨ ﴿بَشِّرِ ٱلْمُنَـٰفِقِينَ بِأَنَّ لَهُمْ عَذَابًا أَلِيمًا﴾'
    },
    {
      id: 'wad', letters: ['و', 'ا', 'د'], recite: 'وَادٍۢ',
      translit: 'wād', meaning: 'valley',
      audio: { s: 26, a: 225, w: 6, text: 'وَادٍۢ', url: 'https://audio.qurancdn.com/wbw/026_225_006.mp3' },
      ref: 'سورة الشعراء ٢٢٥ ﴿أَلَمْ تَرَ أَنَّهُمْ فِى كُلِّ وَادٍ يَهِيمُونَ﴾'
    },
    {
      id: 'hajar', letters: ['ح', 'ج', 'ر'], recite: 'حِجْرٍ',
      translit: 'ḥajar', meaning: 'stone',
      audio: { s: 89, a: 5, w: 6, text: 'حِجْرٍ', url: 'https://audio.qurancdn.com/wbw/089_005_006.mp3' },
      ref: 'سورة الفجر ٥ ﴿هَلْ فِى ذَٰلِكَ قَسَمٌ لِّذِى حِجْرٍ﴾'
    },
    {
      id: 'bab', letters: ['ب', 'ا', 'ب'], recite: 'بَابٍۢ',
      translit: 'bāb', meaning: 'door',
      audio: { s: 15, a: 44, w: 5, text: 'بَابٍۢ', url: 'https://audio.qurancdn.com/wbw/015_044_005.mp3' },
      ref: 'سورة الحجر ٤٤ ﴿لَهَا سَبْعَةُ أَبْوَٰبٍ لِّكُلِّ بَابٍ مِّنْهُمْ جُزْءٌ مَّقْسُومٌ﴾'
    },
    {
      id: 'nar', letters: ['ن', 'ا', 'ر'], recite: 'نَارٌ',
      translit: 'nār', meaning: 'fire',
      audio: { s: 101, a: 11, w: 1, text: 'نَارٌ', url: 'https://audio.qurancdn.com/wbw/101_011_001.mp3' },
      ref: 'سورة القارعة ١١ ﴿نَارٌ حَامِيَةٌۢ﴾'
    },
    {
      id: 'jannah', letters: ['ج', 'ن', 'ة'], recite: 'جَنَّةٍ',
      translit: 'jannah', meaning: 'garden',
      audio: { s: 69, a: 22, w: 2, text: 'جَنَّةٍ', url: 'https://audio.qurancdn.com/wbw/069_022_002.mp3' },
      ref: 'سورة الحاقة ٢٢ ﴿فِى جَنَّةٍ عَالِيَةٍ﴾'
    },
    {
      id: 'malik', letters: ['م', 'ل', 'ك'], recite: 'مَلِكِ',
      translit: 'malik', meaning: 'king',
      audio: { s: 114, a: 2, w: 1, text: 'مَلِكِ', url: 'https://audio.qurancdn.com/wbw/114_002_001.mp3' },
      ref: 'سورة الناس ٢ ﴿مَلِكِ ٱلنَّاسِ﴾'
    },
    {
      id: 'nabiy', letters: ['ن', 'ب', 'ي'], recite: 'نَبِيًّۭا',
      translit: 'nabiyy', meaning: 'prophet',
      audio: { s: 37, a: 112, w: 3, text: 'نَبِيًّۭا', url: 'https://audio.qurancdn.com/wbw/037_112_003.mp3' },
      ref: 'سورة الصافات ١١٢ ﴿وَبَشَّرْنَـٰهُ بِإِسْحَـٰقَ نَبِيًّا مِّنَ ٱلصَّـٰلِحِينَ﴾'
    },
    {
      id: 'sam', letters: ['س', 'م', 'ع'], recite: 'سَمْعًا',
      translit: 'samʿ', meaning: 'hearing',
      audio: { s: 18, a: 101, w: 11, text: 'سَمْعًا', url: 'https://audio.qurancdn.com/wbw/018_101_011.mp3' },
      ref: 'سورة الكهف ١٠١ ﴿ٱلَّذِينَ كَانَتْ أَعْيُنُهُمْ فِى غِطَآءٍ عَن ذِكْرِى وَكَانُوا۟ لَا…﴾'
    },
    {
      id: 'basar', letters: ['ب', 'ص', 'ر'], recite: 'الْبَصَرُ',
      translit: 'baṣar', meaning: 'sight',
      audio: { s: 75, a: 7, w: 3, text: 'ٱلْبَصَرُ', url: 'https://audio.qurancdn.com/wbw/075_007_003.mp3' },
      ref: 'سورة القيامة ٧ ﴿فَإِذَا بَرِقَ ٱلْبَصَرُ﴾'
    },
    {
      id: 'wajh', letters: ['و', 'ج', 'ه'], recite: 'وَجْهِ',
      translit: 'wajh', meaning: 'face',
      audio: { s: 92, a: 20, w: 3, text: 'وَجْهِ', url: 'https://audio.qurancdn.com/wbw/092_020_003.mp3' },
      ref: 'سورة الليل ٢٠ ﴿إِلَّا ٱبْتِغَآءَ وَجْهِ رَبِّهِ ٱلْأَعْلَىٰ﴾'
    },
    {
      id: 'sadr', letters: ['ص', 'د', 'ر'], recite: 'صَدْرًۭا',
      translit: 'ṣadr', meaning: 'chest',
      audio: { s: 16, a: 106, w: 17, text: 'صَدْرًۭا', url: 'https://audio.qurancdn.com/wbw/016_106_017.mp3' },
      ref: 'سورة النحل ١٠٦ ﴿مَن كَفَرَ بِٱللَّهِ مِنۢ بَعْدِ إِيمَـٰنِهِۦٓ إِلَّا مَنْ أُكْرِهَ وَ…﴾'
    },
    {
      id: 'sawm', letters: ['ص', 'و', 'م'], recite: 'صَوْمًۭا',
      translit: 'ṣawm', meaning: 'fasting',
      audio: { s: 19, a: 26, w: 14, text: 'صَوْمًۭا', url: 'https://audio.qurancdn.com/wbw/019_026_014.mp3' },
      ref: 'سورة مريم ٢٦ ﴿فَكُلِى وَٱشْرَبِى وَقَرِّى عَيْنًا ۖ فَإِمَّا تَرَيِنَّ مِنَ ٱلْبَشَر…﴾'
    },
    {
      id: 'fiddah', letters: ['ف', 'ض', 'ة'], recite: 'فِضَّةٍۢ',
      translit: 'fiḍḍah', meaning: 'silver',
      audio: { s: 76, a: 16, w: 3, text: 'فِضَّةٍۢ', url: 'https://audio.qurancdn.com/wbw/076_016_003.mp3' },
      ref: 'سورة الانسان ١٦ ﴿قَوَارِيرَا۟ مِن فِضَّةٍ قَدَّرُوهَا تَقْدِيرًا﴾'
    },
    {
      id: 'adl', letters: ['ع', 'د', 'ل'], recite: 'عَدْلٌۭ',
      translit: 'ʿadl', meaning: 'justice',
      audio: { s: 2, a: 123, w: 12, text: 'عَدْلٌۭ', url: 'https://audio.qurancdn.com/wbw/002_123_012.mp3' },
      ref: 'سورة البقرة ١٢٣ ﴿وَٱتَّقُوا۟ يَوْمًا لَّا تَجْزِى نَفْسٌ عَن نَّفْسٍ شَيْـًٔا وَلَا يُق…﴾'
    },
    {
      id: 'zulm', letters: ['ظ', 'ل', 'م'], recite: 'ظُلْمًۭا',
      translit: 'ẓulm', meaning: 'wrongdoing',
      audio: { s: 20, a: 111, w: 9, text: 'ظُلْمًۭا', url: 'https://audio.qurancdn.com/wbw/020_111_009.mp3' },
      ref: 'سورة طه ١١١ ﴿۞ وَعَنَتِ ٱلْوُجُوهُ لِلْحَىِّ ٱلْقَيُّومِ ۖ وَقَدْ خَابَ مَنْ حَمَلَ…﴾'
    },
    {
      id: 'hikmah', letters: ['ح', 'ك', 'م', 'ة'], recite: 'حِكْمَةٌۢ',
      translit: 'ḥikmah', meaning: 'wisdom',
      audio: { s: 54, a: 5, w: 1, text: 'حِكْمَةٌۢ', url: 'https://audio.qurancdn.com/wbw/054_005_001.mp3' },
      ref: 'سورة القمر ٥ ﴿حِكْمَةٌۢ بَـٰلِغَةٌ ۖ فَمَا تُغْنِ ٱلنُّذُرُ﴾'
    },
    {
      id: 'sirat', letters: ['ص', 'ر', 'ا', 'ط'], recite: 'صِرَٰطٍۢ',
      translit: 'ṣirāṭ', meaning: 'path',
      audio: { s: 36, a: 4, w: 2, text: 'صِرَٰطٍۢ', url: 'https://audio.qurancdn.com/wbw/036_004_002.mp3' },
      ref: 'سورة يس ٤ ﴿عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ﴾'
    },
    {
      id: 'hisab', letters: ['ح', 'س', 'ا', 'ب'], recite: 'حِسَابًۭا',
      translit: 'ḥisāb', meaning: 'reckoning',
      audio: { s: 84, a: 8, w: 3, text: 'حِسَابًۭا', url: 'https://audio.qurancdn.com/wbw/084_008_003.mp3' },
      ref: 'سورة الإنشقاق ٨ ﴿فَسَوْفَ يُحَاسَبُ حِسَابًا يَسِيرًا﴾'
    },
    {
      id: 'sabil', letters: ['س', 'ب', 'ي', 'ل'], recite: 'سَبِيلُ',
      translit: 'sabīl', meaning: 'way',
      audio: { s: 6, a: 55, w: 5, text: 'سَبِيلُ', url: 'https://audio.qurancdn.com/wbw/006_055_005.mp3' },
      ref: 'سورة الأنعام ٥٥ ﴿وَكَذَٰلِكَ نُفَصِّلُ ٱلْـَٔايَـٰتِ وَلِتَسْتَبِينَ سَبِيلُ ٱلْمُجْرِم…﴾'
    },
    {
      id: 'hadid', letters: ['ح', 'د', 'ي', 'د'], recite: 'حَدِيدٍۢ',
      translit: 'ḥadīd', meaning: 'iron',
      audio: { s: 22, a: 21, w: 4, text: 'حَدِيدٍۢ', url: 'https://audio.qurancdn.com/wbw/022_021_004.mp3' },
      ref: 'سورة الحج ٢١ ﴿وَلَهُم مَّقَـٰمِعُ مِنْ حَدِيدٍ﴾'
    },
    {
      id: 'dhahab', letters: ['ذ', 'ه', 'ب'], recite: 'ذَهَبَ',
      translit: 'dhahab', meaning: 'gold',
      audio: { s: 75, a: 33, w: 2, text: 'ذَهَبَ', url: 'https://audio.qurancdn.com/wbw/075_033_002.mp3' },
      ref: 'سورة القيامة ٣٣ ﴿ثُمَّ ذَهَبَ إِلَىٰٓ أَهْلِهِۦ يَتَمَطَّىٰٓ﴾'
    },
    {
      id: 'rasul', letters: ['ر', 'س', 'و', 'ل'], recite: 'رَسُولٌ',
      translit: 'rasūl', meaning: 'messenger',
      audio: { s: 26, a: 107, w: 3, text: 'رَسُولٌ', url: 'https://audio.qurancdn.com/wbw/026_107_003.mp3' },
      ref: 'سورة الشعراء ١٠٧ ﴿إِنِّى لَكُمْ رَسُولٌ أَمِينٌ﴾'
    },
    {
      id: 'shajar', letters: ['ش', 'ج', 'ر'], recite: 'شَجَرٍۢ',
      translit: 'shajar', meaning: 'trees',
      audio: { s: 56, a: 52, w: 3, text: 'شَجَرٍۢ', url: 'https://audio.qurancdn.com/wbw/056_052_003.mp3' },
      ref: 'سورة الواقعة ٥٢ ﴿لَـَٔاكِلُونَ مِن شَجَرٍ مِّن زَقُّومٍ﴾'
    },
    {
      id: 'thamar', letters: ['ث', 'م', 'ر'], recite: 'ثَمَرٌۭ',
      translit: 'thamar', meaning: 'fruit',
      audio: { s: 18, a: 34, w: 3, text: 'ثَمَرٌۭ', url: 'https://audio.qurancdn.com/wbw/018_034_003.mp3' },
      ref: 'سورة الكهف ٣٤ ﴿وَكَانَ لَهُۥ ثَمَرٌ فَقَالَ لِصَـٰحِبِهِۦ وَهُوَ يُحَاوِرُهُۥٓ أَنَا۠…﴾'
    },
    {
      id: 'kalimah', letters: ['ك', 'ل', 'م', 'ة'], recite: 'كَلِمَةًۢ',
      translit: 'kalimah', meaning: 'word',
      audio: { s: 43, a: 28, w: 2, text: 'كَلِمَةًۢ', url: 'https://audio.qurancdn.com/wbw/043_028_002.mp3' },
      ref: 'سورة الزخرف ٢٨ ﴿وَجَعَلَهَا كَلِمَةًۢ بَاقِيَةً فِى عَقِبِهِۦ لَعَلَّهُمْ يَرْجِعُونَ﴾'
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

  /* ---------- level-design analysis (validation) ---------- */

  /* Safe (non-hazard) regions inside one area of the maze. A healthy maze has
     exactly ONE; two or more means a letter could sit in a pocket that can only
     be reached by walking along a hazard band (i.e. "unreachable" in practice). */
  function safeRegionsInRows(maze, r0, r1) {
    var C = maze.rows[0].length;
    var seen = new Set(), sizes = [];
    for (var r = r0; r <= r1; r++) {
      for (var c = 1; c < C - 1; c++) {
        if (tileTypeAt(maze, r, c) !== 'corridor') continue;
        var key = r + ',' + c;
        if (seen.has(key)) continue;
        var stack = [key];
        seen.add(key);
        var n = 0;
        while (stack.length) {
          var parts = stack.pop().split(',');
          var rr = +parts[0], cc = +parts[1];
          n++;
          var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (var i = 0; i < 4; i++) {
            var nr = rr + dirs[i][0], nc = cc + dirs[i][1];
            if (nr < r0 || nr > r1 || nc < 1 || nc > C - 2) continue;
            if (tileTypeAt(maze, nr, nc) !== 'corridor') continue;
            var nk = nr + ',' + nc;
            if (!seen.has(nk)) { seen.add(nk); stack.push(nk); }
          }
        }
        sizes.push(n);
      }
    }
    return sizes.sort(function (a, b) { return b - a; });
  }

  /* Minimum number of barrier ENTRIES needed to reach each corridor tile,
     using the real game rule: entering water/fire from a normal tile costs one
     item, while moving around on the same barrier is free. */
  function reachCosts(maze, maxEntries) {
    var R = maze.rows.length, C = maze.rows[0].length;
    var p = mazePlayerPos(maze);
    var bestUsed = {}, dist = {};
    var startKey = p.r + ',' + p.c + ',0';
    dist[startKey] = 0;
    var queue = [[p.r, p.c, 0, 0]];
    var hazardId = function (ch) { return ch === '~' ? 1 : (ch === '^' ? 2 : 0); };
    while (queue.length) {
      var cur = queue.shift();
      var r = cur[0], c = cur[1], on = cur[2], used = cur[3];
      if (dist[r + ',' + c + ',' + on] < used) continue;
      var tileKey = r + ',' + c;
      if (bestUsed[tileKey] === undefined || used < bestUsed[tileKey]) bestUsed[tileKey] = used;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var nr = r + dirs[i][0], nc = c + dirs[i][1];
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        var ch = maze.rows[nr][nc];
        if (!isWalkableChar(ch)) continue;
        var hid = hazardId(ch);
        var cost = 0, newOn = 0;
        if (hid) {
          if (on === hid) { cost = 0; newOn = hid; }
          else { cost = 1; newOn = hid; }
        }
        var nused = used + cost;
        if (nused > maxEntries) continue;
        var nk = nr + ',' + nc + ',' + newOn;
        if (dist[nk] === undefined || dist[nk] > nused) {
          dist[nk] = nused;
          queue.push([nr, nc, newOn, nused]);
        }
      }
    }
    var max = 0, worst = null;
    for (var r2 = 1; r2 < R - 1; r2++) {
      for (var c2 = 1; c2 < C - 1; c2++) {
        if (tileTypeAt(maze, r2, c2) !== 'corridor') continue;
        var k2 = r2 + ',' + c2;
        if (bestUsed[k2] === undefined) return { unreachable: k2, max: Infinity };
        if (bestUsed[k2] > max) { max = bestUsed[k2]; worst = k2; }
      }
    }
    return { max: max, worst: worst, costs: bestUsed };
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

    /* every area must be ONE safe region (no pockets that need extra crossings) */
    var bands = maze.meta.hazardRows;
    var zoneRanges = [[1, bands[0] - 1]];
    for (var bi = 0; bi < bands.length - 1; bi++) zoneRanges.push([bands[bi] + 1, bands[bi + 1] - 1]);
    zoneRanges.push([bands[bands.length - 1] + 1, R - 2]);
    var regionInfo = [];
    zoneRanges.forEach(function (zr, idx) {
      var parts = safeRegionsInRows(maze, zr[0], zr[1]);
      regionInfo.push(parts.length);
      if (parts.length !== 1) {
        errors.push('zone ' + idx + ' is split into ' + parts.length + ' regions ' + JSON.stringify(parts));
      }
    });

    /* every tile must be reachable within a small item budget (1 in + 1 out) */
    var reach = reachCosts(maze, 3);
    if (reach.unreachable) errors.push('tile not reachable at all: ' + reach.unreachable);
    else if (reach.max > 3) errors.push('tile needs ' + reach.max + ' barrier entries: ' + reach.worst);

    return {
      ok: errors.length === 0, errors: errors, unreachable: unreachable,
      zones: zoneCounts, regions: regionInfo, maxEntries: reach.max,
      R: R, C: C
    };
  }

  function dumpMaze(maze) { return maze.rows.join('\n'); }

  var api = {
    MAZES: MAZES, WORDS: WORDS, pickMaze: pickMaze,
    prepareMaze: prepareMaze, validateMaze: validateMaze,
    floodAll: floodAll, safeComponentFrom: safeComponentFrom, safeFlood: safeFlood,
    zoneOfRow: zoneOfRow, tileTypeAt: tileTypeAt, dumpMaze: dumpMaze,
    safeRegionsInRows: safeRegionsInRows, reachCosts: reachCosts,
    isHazardType: isHazardType, isWalkableChar: isWalkableChar
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.QMazeData = api;
})(typeof window !== 'undefined' ? window : globalThis);
