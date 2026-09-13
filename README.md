# 🕌 Quran Letter Maze — متاهة حروف القرآن

A Pac-Man style **listening & spelling** game for the web.
The player **hears** a word from the Qur'an (it is recited — **never displayed**),
then collects its Arabic letters through a maze **in the right order** and brings
them to the sheikh for checking.

## Game rules

1. The maze has a full-width **water** band and a full-width **fire** band, plus
   vertical water/fire accents in the middle hall.
2. Cross **water** with a collected **⛵ boat**, and **fire** with a collected
   **🧯 extinguisher**. Each crossing uses one item; new items keep appearing
   near you a few seconds later, so you can always get back.
3. The word is **recited aloud** at the start of the round. Press
   **🔊 استمع للكلمة · Listen** (or **R**) to hear it again at any time.
4. Letters are **scattered over the whole maze** — top area (behind the water),
   middle hall and bottom area (behind the fire) — so every round makes you
   travel and cross barriers. Walk over a letter to collect it, in the order you
   heard it.
5. With all letters collected, go to the **sheikh 🤲** (walk next to him, then
   **Space/E**, tap him, or press **🤲 تحقق**).
6. **Correct order → +1 mark** and the next word starts.
   **Wrong order → −1 mark**, you redo the same word, and the sheikh
   **scatters the letters to new positions**.

Helpers: click any letter in the "Collected" tray (or **⌫ أعد حرفًا**) to put it
back in the maze and re-arrange your order without a penalty.

## Sound: real Qur'an recitation (bundled)

Browser text-to-speech is *not* used first, because many Linux/Chrome installs
have **no speech voices at all** (`speechSynthesis.getVoices()` returns `[]`),
which makes TTS-only games silent. Instead the game plays **real word-by-word
Qur'an recitation**:

1. **Bundled clips** — `audio/<word>.mp3` (shipped, 12 files, ~840 KB total)
2. **Online clips** — `audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3` (per-word recitation)
3. **System voice** — speech synthesis, only as a last resort

The panel shows which source is playing (`تلاوة من ملفات اللعبة`, `تلاوة من
الإنترنت`, `صوت المتصفح`, or a red warning if nothing is available).

Browsers require one click before audio may play — press **Start**, and if a
clip ever stays silent press **🔊 Listen** once.

To use your own recordings, just drop them in `audio/` using the word id as the
file name (`.mp3`, `.ogg`, `.webm`, `.m4a` are tried in that order):
`noor qamar shams maa bahr jabal amal layl kitab samaa shifaa rahma`.

Recitation attribution: the bundled clips are the Qur'an **word-by-word**
recordings served by `audio.qurancdn.com` (Quran.com). Each clip's ayah/word
position was resolved and verified with `tools/resolve-audio.js` against
`api.quran.com`.

## Words (12, increasing difficulty)

| # | Letters | Word | Meaning | Recited from |
|---|---------|------|---------|--------------|
| 1 | ن و ر | نُور | light | 24:35 |
| 2 | ق م ر | قَمَر | moon | 54:1 |
| 3 | ش م س | شَمْس | sun | 91:1 |
| 4 | م ا ء | مَاء | water | 23:18 |
| 5 | ب ح ر | بَحْر | sea | 24:40 |
| 6 | ج ب ل | جَبَل | mountain | 59:21 |
| 7 | ع م ل | عَمَل | good deed | 18:30 |
| 8 | ل ي ل | لَيْل | night | 17:1 |
| 9 | ك ت ا ب | كِتَاب | book | 2:2 |
| 10 | س م ا ء | سَمَاء | sky | 2:22 |
| 11 | ش ف ا ء | شِفَاء | healing | 16:69 |
| 12 | ر ح م ة | رَحْمَة | mercy | 10:57 |

Words and verse text appear only on the **end-of-round recap**, after the child
has already spelled each word.

## Run it

Open `index.html` (double-click works — no server, and the bundled clips play
offline), or serve the folder:

```bash
./tools/serve.sh            # serves on 0.0.0.0:8137 and prints the phone URL
# or manually:
python3 -m http.server 8137 --bind 0.0.0.0
```

## Host it

* **On this network / on your phone:** `./tools/serve.sh` — open the printed
  `http://<your-ip>:8137` on the phone (same Wi-Fi).
* **On GitHub Pages (public URL):** the repo ships
  `.github/workflows/pages.yml`, which validates the mazes and deploys the whole
  folder on every push to `main`.
  1. create an empty GitHub repo, then
     `git remote add origin git@github.com:<you>/quran-letter-maze.git`
     and `git push -u origin main`
  2. in the repo: **Settings → Pages → Source: GitHub Actions**
  3. the game appears at `https://<you>.github.io/quran-letter-maze/`
* **Other free static hosts** (Netlify Drop, Cloudflare Pages, Vercel) also work:
  just upload the folder — it is plain static files.
* `./tools/publish.sh "message"` commits everything and pushes if a remote is
  configured.

### Screen & controls

The game ships **two dense mazes** (1-tile corridors, no empty halls) and picks
one automatically for the screen:

| Maze | Size | Used when |
|------|------|-----------|
| `wide` | 27 × 23 | desktop, tablet, phone in landscape |
| `tall` | 19 × 31 | phone/tablet in portrait (fewer columns → bigger tiles) |

`?maze=wide` or `?maze=tall` forces one. Each maze is regenerated/tuned with
`node tools/gen-maze.js` (seeded, so it is reproducible) and must pass
`tools/validate.js`.

The canvas is sized to the smaller of the available width/height, so the maze
fills ~87% of the screen height on a desktop and ~98% in fullscreen. Use
**⛶ ملء الشاشة / Full screen** to give the maze the whole display.

* Move: arrow keys / WASD, **swipe on the maze**, or the on-screen ▲▼◀▶ pad
* Check at the sheikh: **Space / E** when standing next to him (or tap him)
* Replay the word: **R** or **🔊 Listen**
* Put a letter back: click it in the tray, or **⌫ أعد حرفًا**

### On a phone

* The page is responsive: on touch devices a **D-pad sits directly under the
  maze** (58 px buttons, 46 px in phone landscape) with big **Listen / Check**
  buttons, and in landscape the pad and panel move beside the maze so it stays
  tall (77% of the screen height).
* Everything works by **swipe** as well — swipe on the maze to steer.
* It is a **PWA**: open it in the phone browser and choose *Add to Home screen*
  to get a full-screen app icon; the app shell and all recitation clips are
  cached by the service worker, so it keeps working offline.
* Phone + computer must be on the same Wi-Fi: run `./tools/serve.sh` — it prints
  the LAN URL to open on the phone (e.g. `http://192.168.1.20:8137`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | UI, styles, overlays, layout |
| `js/maze-data.js` | 27×23 maze, the 12 words (with verified recitation refs), grid helpers + validator |
| `js/game.js` | engine: movement, hazards, items, letters, sheikh logic, audio pipeline, tests |
| `audio/*.mp3` | bundled word-by-word Qur'an recitation (12 clips) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA: install on a phone, offline play |
| `tools/gen-maze.js` | generates the dense mazes (seeded, validated) |
| `tools/validate.js` | offline maze/word checker |
| `tools/serve.sh` | serve the game for computer + phone (LAN URL) |
| `tools/publish.sh` | commit and push (GitHub Pages workflow included) |
| `tools/verify-touch.js` | phone/touch verification (d-pad, swipe, layout) |
| `tools/resolve-audio.js` | resolves + verifies each word's Qur'an recitation (api/audio.quran.com) |
| `tools/verify-audio.js` | drives a real browser over CDP to prove audio plays |
| `tools/shot-canvas.js` | screenshots just the maze canvas via CDP |

Customising: edit `WORDS` (letters, `recite`, `audio`, `ref`) and the `MAZES`
rows in `js/maze-data.js`; map symbols are `#` wall, `.` corridor, `~` water,
`^` fire, `P` player start, `S` sheikh. Then run `node tools/validate.js` — it
checks row widths, borders, reachability, that the sheikh can always be reached
**without spending items**, and that every area has room for letters.

## Developer checks

Built-in browser tests (print `AUTOTEST RESULT ...` to the console):

* `index.html?autostart` — skip the start screen
* `index.html?word=N` — jump to word N (0–11)
* `index.html?autotest=ok` — verify hazard blocking/consumption, that letters are
  placed in all 3 areas and on walkable tiles, that a frame renders, then play one
  word correctly **through the real input/movement code** (press direction → game
  loop → pickups): expect **+1** and the next word
* `index.html?autotest=wrong` — collect in the wrong order: expect **−1**, the
  same word, an empty tray and the letters re-scattered
* `index.html?autotest=all` — auto-play all 12 words: expect the end screen and
  marks 12
* `index.html?maze=wide|tall` — force a maze
* `index.html?debug` — expose a read-only state hook (`window.__qp.state()`,
  `__qp.pos()`, `__qp.open()`) used by the automated checks

Phone/touch verification (chrome on `--remote-debugging-port=9222`, page opened
with `?autostart&debug`): `node tools/verify-touch.js` — emulates three phone
viewports and checks maze auto-selection, tile size, the touch bar, swipe
movement, d-pad movement and touch-target sizes.

Note about the service worker: `sw.js` serves HTML/JS **network-first** so a
deployed update is picked up immediately; bump `CACHE` in `sw.js` if you ever
need to force-refresh cached audio/icons.

Example headless run:

```bash
python3 -m http.server 8137 &
google-chrome --headless=new --no-sandbox --virtual-time-budget=25000 \
  --enable-logging=stderr --dump-dom \
  "http://127.0.0.1:8137/index.html?autotest=ok" 2>&1 | grep AUTOTEST
```

Proving sound really plays (needs a browser on `--remote-debugging-port=9222`):

```bash
google-chrome --headless=new --no-sandbox --remote-debugging-port=9222 \
  --user-data-dir=/tmp/cdp "http://127.0.0.1:8137/index.html?autostart" &
node tools/verify-audio.js     # clicks Listen and reports the audio source used
```
