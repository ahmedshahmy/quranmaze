# 🕌 Quran Letter Maze — متاهة حروف القرآن

A Pac-Man style **listening & spelling** game for the web.
The player **hears** a word from the Qur'an (it is recited — **never displayed**),
then collects its Arabic letters through a maze **in the right order** and brings
them to the sheikh for checking.

## Game rules

1. The maze has a full-width **water** band and a full-width **fire** band, plus
   vertical water/fire accents in the middle hall.
2. Cross **water** with a collected **⛵ boat**, and **fire** with a collected
   **🧯 extinguisher**. One item is used per **crossing** (entering the barrier);
   once you are on a barrier, moving along it is free. New items keep appearing
   near you a few seconds later, and if the player ever has none while none
   exist anywhere, one is spawned within reach — so you can always get back.
3. The word is **recited aloud** at the start of the round. Press
   **🔊 استمع للكلمة · Listen** (or **R**) to hear it again at any time.
4. Letters are **scattered over the whole maze** — top area (behind the water),
   middle hall and bottom area (behind the fire) — so every round makes you
   travel and cross barriers. Walk over a letter to collect it, in the order you
   heard it.
5. With all letters collected, go to the **sheikh 🤲** (walk next to him, then
   **Space/E**, tap him, or press **🤲 تحقق**).
6. **Correct order → +1 mark**, a card appears with the word **and what it
   means** (`shams — sun`) plus the verse it comes from, and the next word starts.
   **Wrong order → −1 mark**, you redo the same word, and the sheikh
   **scatters the letters to new positions**.

**Score:** correct order **+1**, wrong order **−1**. The score is always visible
(a HUD over the maze plus a scoreboard in the panel with **Score, Correct, Wrong
and Best**); a `+1` / `−1` floats up over the maze on each check, and your best
result is remembered on the device.

Helpers: click any letter in the "Collected" tray to put it back in the maze and
re-arrange your order without a penalty, and press **Backspace** or the **↺ reset**
button to jump back to the start tile.

## Sound: real Qur'an recitation (bundled)

Browser text-to-speech is *not* used first, because many Linux/Chrome installs
have **no speech voices at all** (`speechSynthesis.getVoices()` returns `[]`),
which makes TTS-only games silent. Instead the game plays **real word-by-word
Qur'an recitation**:

1. **Bundled clips** — `audio/<word>.mp3` (shipped, **73 files, ~3.9 MB**); the
   first 12 are precached for offline play, the rest are cached as you play them
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

## Words (**73** — 228 letters, played in a **random order**)

Every game (Start / Play again) reshuffles the whole word list, so you get a
different word — and a different maze layout for it — each round. The first two
rounds are drawn from the shortest words so a session still starts gently; after
that it is fully random. `?seed=N` makes a session reproducible (used by the
tests), e.g. `index.html?seed=42`.

The first 12 are the starter set; **61 more were added and verified** with
`tools/build-words.js`, which scans the whole Qur'an for a real occurrence of
each word (preferring a bare form, i.e. without و/ف/ب/ل/ال prefixes), confirms
the position against the words API, checks the word-by-word recitation clip and
downloads it. Words whose Qur'anic spelling differs from the modern spelling
(e.g. ٱلصَّلَوٰة) are reported and skipped rather than shipped wrong.

The list below shows the starter words; run `node -e "console.log(require('./js/maze-data.js').WORDS.map(w=>w.id).join(' '))"`
for all 73 ids.

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

The word and its meaning are revealed **only after the child spells it
correctly** (and in the end-of-round recap) — never before, so the listening
task stays intact. The displayed form is the plain dictionary form: the
Qur'anic prefix and accusative tanween are trimmed
(`tools/verify-words.js` checks that the shown word matches the collected
letters for all 73 words).

## Run it

Open `index.html` (double-click works — no server, and the bundled clips play
offline), or serve the folder:

```bash
./tools/serve.sh            # serves on 0.0.0.0:8137 and prints the phone URL
# or manually:
python3 -m http.server 8137 --bind 0.0.0.0
```

## Host it

### On this network / on your phone (works right now)

```bash
./tools/serve.sh          # serves on 0.0.0.0:8137 and prints the phone URL
```
Open the printed `http://<your-ip>:8137` on the phone (same Wi-Fi), then
*Add to Home screen* for an offline-capable app icon.

### On GitHub Pages (public URL)

The repo ships `.github/workflows/pages.yml`, which validates the mazes and
deploys the whole folder on every push to `main`. Once, in the repo:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

`./tools/publish.sh` commits everything and pushes. It is safe to re-run: it
adds the remote only if it is missing, and updates it with
`set-url` otherwise — so you will never hit *"remote origin already exists"*
(if you do, just skip `git remote add` and run the push).

```bash
./tools/publish.sh                                     # commit + push
./tools/publish.sh "message" git@github.com:me/r.git   # set/replace origin first
```

**Authentication.** Pushing needs this machine to be authorized on GitHub. Two
options:

1. **Deploy key from this workspace** (used automatically by `publish.sh`, kept
   in the gitignored `.git-ssh/` folder because `~/.ssh` is not writable here):
   ```bash
   cat .git-ssh/id_ed25519.pub       # copy this line
   ```
   GitHub → your repo → **Settings → Deploy keys → Add deploy key** → paste →
   tick **Allow write access** → Add. Then run `./tools/publish.sh` again.
   (You can delete the deploy key again at any time.)
2. **HTTPS with a Personal Access Token**:
   ```bash
   git remote set-url origin https://github.com/<user>/<repo>.git
   # prompts: username = your GitHub user
   #          password = a token with "repo" scope
   #          (create at https://github.com/settings/tokens)
   ```

* **Other free static hosts** (Netlify Drop, Cloudflare Pages, Vercel) also work:
  just upload the folder — it is plain static files, no build step.

### Keeping an up-to-date build

The footer and the start screen show a **build stamp** (e.g.
`build 2026-09-13.5 · 73 words · 4 mazes`). The page also fetches
`version.json` (no-store); if a newer build has been deployed you get a
**"reload"** prompt, so a stale cached copy is easy to spot. The service worker
fetches HTML/JS with `cache: 'no-store'` when online, so a plain reload always
picks up the newest version.

### Screen & controls

The game ships **two dense mazes** (1-tile corridors, no empty halls) and picks
one automatically for the screen:

| Maze | Size | Used when |
|------|------|-----------|
| `wide` | 27 × 23 | desktop, tablet, phone in landscape |
| `tall` | 19 × 31 | tablet in portrait (≥ 520 px wide) |
| `phone` | 17 × 29 | phone in portrait (≥ 720 px tall) |
| `phoneS` | 17 × 23 | short phone in portrait (< 720 px tall) |

Fewer columns means bigger tiles, so phones get their own narrow mazes. Rebuild
them with `node tools/build-mazes.js` (it regenerates from `tools/gen-maze.js`,
validates every maze and only then writes `js/maze-data.js`).

`?maze=wide` or `?maze=tall` forces one. Each maze is regenerated/tuned with
`node tools/gen-maze.js` (seeded, so it is reproducible) and must pass
`tools/validate.js`.

The canvas is sized to the smaller of the available width/height, so the maze
fills ~87% of the screen height on a desktop and ~98% in fullscreen. Use
**⛶ ملء الشاشة / Full screen** to give the maze the whole display.

* Move: arrow keys / WASD, **swipe on the maze**, or the on-screen ▲▼◀▶ pad
* Check at the sheikh: **Space / E** when standing next to him (or tap him)
* Replay the word: **R** or **🔊 Listen**
* Put a letter back: click it in the tray
* **Backspace** (or the **↺ من البداية** button, also on the phone control row)
  jumps the pac-man back to the start of the maze — collected letters are kept,
  it is a shortcut, not a penalty

### On a phone

* The page is responsive: on a phone the **action row (Listen / Check / ⌫ / ↺)
  sits above the maze** and the **arrow row below it**, so almost no height is
  wasted — the maze fills **~76% of the screen height** on an iPhone 12 and
  ~68% on a small 360×640 phone, at 19–23 px tiles. In landscape both rows move
  beside the maze instead (77% of the height).
* The maze also steers like a **joystick**: drag on it and the pac-man follows
  your finger; **lift your finger and it stops** (it no longer stays locked in
  one direction).
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
| `tools/build-words.js` | builds new words from `tools/words-source.js`: finds the Qur'anic occurrence, verifies it, downloads the clip, emits WORDS entries |
| `tools/build-mazes.js` | regenerates + validates all four mazes into `js/maze-data.js` |
| `tools/verify-audio.js` | drives a real browser over CDP to prove audio plays |
| `tools/shot-canvas.js` | screenshots just the maze canvas via CDP |

Customising: edit `WORDS` (letters, `recite`, `audio`, `ref`) and the `MAZES`
rows in `js/maze-data.js`; map symbols are `#` wall, `.` corridor, `~` water,
`^` fire, `P` player start, `S` sheikh. Then run `node tools/validate.js`. It checks row widths, borders,
reachability, that the sheikh can always be reached **without spending items**,
that every area has room for letters, and two level-design guarantees that
prevent unreachable letters:

* every area (top / middle / bottom) is **one single safe region** — no pockets
  that can only be reached by walking along a hazard band
* every tile is reachable within **one barrier entry** (0-1 BFS using the real
  item-cost rule), and each band has at least two **aligned openings** for a
  straight one-item crossing

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
* `index.html?seed=N` — deterministic word order + letter placement
* `index.html?autotest=all&count=12` — marathon over just the first 12 words
  (the full run covers all 73)
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
