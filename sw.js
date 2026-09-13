/* Service worker: lets the game be installed on a phone home screen and played
   offline (app shell + the bundled recitation clips).

   Strategy:
     - HTML / JS / manifest : network first, cache fallback when offline, so a
       new version is picked up as soon as it is online (no stale code).
     - audio, icons         : cache first (they never change).
     - cross-origin         : left to the network (online recitation, fonts).
   Bump CACHE when you want to force a full refresh of cached media. */
'use strict';

var CACHE = 'quran-maze-v6';
var MEDIA = [
  './audio/noor.mp3',
  './audio/qamar.mp3',
  './audio/shams.mp3',
  './audio/maa.mp3',
  './audio/bahr.mp3',
  './audio/jabal.mp3',
  './audio/amal.mp3',
  './audio/layl.mp3',
  './audio/kitab.mp3',
  './audio/samaa.mp3',
  './audio/shifaa.mp3',
  './audio/rahma.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];
var SHELL = ['./', './index.html', './manifest.webmanifest', './js/maze-data.js', './js/game.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.concat(MEDIA).map(function (url) {
        return c.add(url).catch(function () { /* ignore a missing optional asset */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isMedia(url) {
  return /\.(mp3|ogg|webm|m4a|png|jpg|jpeg|svg|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (isMedia(url)) {
    // cache first: media never changes
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          // Only full responses (200) may be cached: GitHub Pages answers media
          // range requests with 206, and Cache.put() rejects those.
          if (res && res.status === 200 && !res.headers.get('content-range')) {
            try {
              var copy = res.clone();
              caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
            } catch (e) { /* ignore */ }
          }
          return res;
        });
      })
    );
    return;
  }

  // network first for code/HTML, offline fallback to the cache
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
        } catch (e) { /* ignore */ }
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});

