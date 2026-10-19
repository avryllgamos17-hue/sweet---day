/* Sweet Day service worker: offline support, notification taps,
   and a best-effort background check on phones/browsers that allow it. */

importScripts("reminders.js");

const CACHE = "sweet-day-v1";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "reminders.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (n) {
              return n !== CACHE && n !== SHOWN_CACHE;
            })
            .map(function (n) {
              return caches.delete(n);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* Show the saved copy right away, refresh it in the background.
   So a changed message appears the second time the app is opened. */
self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET" || req.url.indexOf("http") !== 0) return;
  event.respondWith(
    (async function () {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then(function (res) {
          if (res && (res.ok || res.type === "opaque")) {
            cache.put(req, res.clone()).catch(function () {});
          }
          return res;
        })
        .catch(function () {
          return null;
        });
      return cached || (await network) || Response.error();
    })()
  );
});

/* Tapping a notification opens (or focuses) the app. */
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (list) {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow("./");
      })
  );
});

/* Best effort: some Android browsers wake the installed app now and then.
   When that happens, show anything that came due in the last 30 minutes. */
async function checkDue() {
  const now = new Date();
  for (const r of remindersFor(now)) {
    const age = now - dueAt(r, now);
    if (age >= 0 && age <= 30 * 60 * 1000) {
      const tag = tagFor(r, now);
      if (!(await wasShown(tag))) {
        await markShown(tag);
        await self.registration.showNotification(notificationTitle(r), notificationOptions(r, now));
      }
    }
  }
}

self.addEventListener("periodicsync", function (event) {
  if (event.tag === "sweet-day-check") event.waitUntil(checkDue());
});
