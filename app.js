/* Sweet Day: page logic.
   Reads the schedule from reminders.js, draws the screen, remembers what's
   checked off today, and sends notifications at the right times. */

(function () {
  "use strict";

  const STORE_KEY = "sweet-day-done";
  const NOW_WINDOW = 10 * 60 * 1000; // a reminder counts as "right now" for 10 minutes
  const NOTIFY_WINDOW = 10 * 60 * 1000; // late by up to 10 minutes still gets sent
  const HEART =
    '<svg class="heart" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  const BIG_HEART =
    '<svg class="hero-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  const STATUS_LABEL = { done: "Done", now: "Just now", next: "Up next", missed: "Earlier", upcoming: "" };

  const $ = (id) => document.getElementById(id);
  const firedThisSession = {};
  let swReg = null;
  let installEvent = null;
  let lastSig = "";
  let doneState = readStore();

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function fmtCountdown(ms) {
    const mins = Math.ceil(ms / 60000);
    if (mins <= 0) return "now";
    if (mins < 60) return "in " + mins + " min";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return "in " + h + "h" + (m ? " " + m + "m" : "");
  }

  function greetingText(now) {
    const h = now.getHours();
    const base = h < 5 ? "Sweet dreams" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return base + ", " + (APP_CONFIG.hisName ? APP_CONFIG.hisName : "my love");
  }

  function loveNoteFor(now) {
    const start = new Date(now.getFullYear(), 0, 0);
    const dayNumber = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000);
    return LOVE_NOTES[dayNumber % LOVE_NOTES.length];
  }

  /* ---------- what's checked off today ---------- */

  function readStore() {
    try {
      const o = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (o && o.day === dayKey() && Array.isArray(o.ids)) return o;
    } catch (e) {}
    return { day: dayKey(), ids: [] };
  }

  function writeStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(doneState));
    } catch (e) {}
  }

  function ensureToday() {
    if (doneState.day !== dayKey()) {
      doneState = { day: dayKey(), ids: [] };
      writeStore();
    }
  }

  function isDone(id) {
    return doneState.ids.indexOf(id) !== -1;
  }

  function toggleDone(id) {
    ensureToday();
    const i = doneState.ids.indexOf(id);
    if (i === -1) doneState.ids.push(id);
    else doneState.ids.splice(i, 1);
    writeStore();
  }

  /* ---------- today's state ---------- */

  function computeState(now) {
    const list = remindersFor(now).map((r) => ({ r: r, due: dueAt(r, now), done: isDone(r.id) }));
    let current = null;
    let next = null;
    list.forEach((it) => {
      if (!it.done && it.due <= now && now - it.due < NOW_WINDOW) current = it;
    });
    for (let i = 0; i < list.length; i++) {
      if (!list[i].done && list[i].due > now) {
        next = list[i];
        break;
      }
    }
    list.forEach((it) => {
      it.status = it.done ? "done" : it === current ? "now" : it === next ? "next" : it.due <= now ? "missed" : "upcoming";
    });
    return { list: list, current: current, next: next };
  }

  function signature(state, now) {
    return (
      dayKey(now) + "|" + greetingText(now) + "|" +
      state.list.map((it) => it.r.id + ":" + it.status).join(",")
    );
  }

  /* ---------- drawing ---------- */

  function renderHeader(state, now) {
    $("date").textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    $("greeting").textContent = greetingText(now);
    const total = state.list.length;
    const done = state.list.filter((it) => it.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $("progressText").textContent = done + " of " + total + " done today";
    $("barFill").style.width = pct + "%";
    $("bar").setAttribute("aria-valuenow", String(pct));
  }

  function renderHero(state, now) {
    const el = $("hero");
    const item = state.current || state.next;
    if (item) {
      const isNow = item === state.current;
      let html = '<div class="hero-top">';
      html += isNow
        ? '<span class="chip chip-accent">Right now</span>'
        : '<span class="chip">Coming up next</span><span class="count" id="countdown" data-due="' + item.due.getTime() + '">' + fmtCountdown(item.due - now) + "</span>";
      html += "</div>";
      html += '<p class="hero-time">' + esc(fmtTime(item.due)) + "</p>";
      html += '<h2 class="hero-title"><span aria-hidden="true">' + esc(item.r.icon) + "</span> " + esc(item.r.title) + "</h2>";
      html += '<p class="hero-msg">' + esc(item.r.message) + "</p>";
      if (isNow) {
        html += '<button type="button" class="btn" data-toggle="' + esc(item.r.id) + '" aria-pressed="false">' + HEART + "<span>Mark done</span></button>";
      }
      el.innerHTML = BIG_HEART + html;
      return;
    }
    const allDone = state.list.length > 0 && state.list.every((it) => it.done);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const first = remindersFor(tomorrow)[0];
    const tomorrowLine = first ? "Tomorrow starts at " + fmtTime(dueAt(first, tomorrow)) + "." : "";
    el.innerHTML =
      BIG_HEART +
      '<div class="hero-top"><span class="chip">That is everything for today</span></div>' +
      '<h2 class="hero-title">' + (allDone ? "You did it all today" : "That's all for today") + "</h2>" +
      '<p class="hero-msg">' +
      (allDone
        ? "I'm so proud of you, my love. Rest well."
        : "Whatever didn't get done is okay. Tomorrow is a fresh start, and I'm with you either way.") +
      " " + esc(tomorrowLine) + "</p>";
  }

  function renderNote(now) {
    $("note").innerHTML =
      '<p class="label">Today\'s love note</p>' +
      '<p class="text">' + esc(loveNoteFor(now)) + "</p>" +
      '<p class="sign">' + esc(APP_CONFIG.fromName ? "with love, " + APP_CONFIG.fromName : "with love") + "</p>";
  }

  function renderTimeline(state) {
    $("timeline").innerHTML = state.list
      .map((it) => {
        const r = it.r;
        const label = STATUS_LABEL[it.status];
        return (
          '<li class="item ' + it.status + '" data-id="' + esc(r.id) + '"><div class="item-card">' +
          '<div class="item-top"><span class="time">' + esc(fmtTime(it.due)) + "</span>" +
          (label ? '<span class="tag">' + label + "</span>" : "") + "</div>" +
          '<h3 class="item-title"><span aria-hidden="true">' + esc(r.icon) + "</span><span>" + esc(r.title) + "</span></h3>" +
          '<p class="item-msg">' + esc(r.message) + "</p>" +
          '<button type="button" class="check" data-toggle="' + esc(r.id) + '" aria-pressed="' + it.done + '">' +
          HEART + "<span>" + (it.done ? "Done" : "Mark done") + "</span></button>" +
          "</div></li>"
        );
      })
      .join("");
  }

  function renderAll(state, now) {
    renderHeader(state, now);
    renderHero(state, now);
    renderNote(now);
    renderTimeline(state);
    renderNotif();
  }

  function updateCountdown(now) {
    const el = $("countdown");
    if (el) el.textContent = fmtCountdown(Number(el.getAttribute("data-due")) - now);
  }

  /* ---------- notifications ---------- */

  function isStandalone() {
    return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function notifState() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
    }
    return Notification.permission; // "default", "granted" or "denied"
  }

  function canNotify() {
    return "Notification" in window && Notification.permission === "granted";
  }

  function renderNotif() {
    const s = notifState();
    const installBtn = installEvent && !isStandalone()
      ? '<button type="button" class="btn btn-ghost" data-action="install">Add to home screen</button>'
      : "";
    let html;
    if (s === "granted") {
      html =
        "<h2>Reminders are on</h2>" +
        "<p>They pop up at the times below while Sweet Day is open or running in the background. Opening the app now and then keeps them coming on time.</p>" +
        '<div class="row"><button type="button" class="btn btn-ghost" data-action="test">Send a test</button>' + installBtn + "</div>";
    } else if (s === "default") {
      html =
        "<h2>Get gentle nudges</h2>" +
        "<p>Turn on notifications and each reminder will pop up at its time, even when you're in another app.</p>" +
        '<div class="row"><button type="button" class="btn" data-action="enable">Turn on reminders</button>' + installBtn + "</div>";
    } else if (s === "denied") {
      html =
        "<h2>Notifications are blocked</h2>" +
        "<p>Allow notifications for this site in your browser settings, then reload this page.</p>";
    } else if (s === "ios-install") {
      html =
        "<h2>Add it to your Home Screen first</h2>" +
        "<p>Tap the Share button, choose Add to Home Screen, then open Sweet Day from your home screen to turn on reminders. This needs iOS 16.4 or newer.</p>";
    } else {
      html =
        "<h2>Notifications aren't available here</h2>" +
        "<p>The checklist still works. For pop-up reminders, open this page from its web link in Chrome, Edge or Safari.</p>";
    }
    $("notif").innerHTML = html;
  }

  async function getRegistration() {
    if (swReg) return swReg;
    try {
      swReg = await navigator.serviceWorker.ready;
    } catch (e) {}
    return swReg;
  }

  async function registerPeriodic(reg) {
    try {
      if (!reg || !("periodicSync" in reg)) return;
      const status = await navigator.permissions.query({ name: "periodic-background-sync" });
      if (status.state === "granted") {
        await reg.periodicSync.register("sweet-day-check", { minInterval: 15 * 60 * 1000 });
      }
    } catch (e) {}
  }

  async function showNotice(title, options) {
    const reg = await getRegistration();
    if (reg && reg.showNotification) {
      try {
        await reg.showNotification(title, options);
        return;
      } catch (e) {}
    }
    try {
      new Notification(title, options);
    } catch (e) {}
  }

  async function sendTest() {
    await showNotice("Sweet Day", {
      body: "Test reminder. This is how your reminders will look. ❤️",
      tag: "sweet-day-test",
      icon: "icon-192.png",
    });
  }

  async function enableNotifications() {
    try {
      await Notification.requestPermission();
    } catch (e) {}
    if (canNotify()) {
      const reg = await getRegistration();
      registerPeriodic(reg);
      await sendTest();
    }
    renderNotif();
  }

  function fireDue(state, now) {
    if (!canNotify()) return;
    state.list.forEach((it) => {
      if (it.done) return;
      const age = now - it.due;
      if (age < 0 || age >= NOTIFY_WINDOW) return;
      const tag = tagFor(it.r, now);
      if (firedThisSession[tag]) return;
      firedThisSession[tag] = true;
      wasShown(tag).then((shown) => {
        if (shown) return;
        markShown(tag).then(() => showNotice(notificationTitle(it.r), notificationOptions(it.r, now)));
      });
    });
  }

  /* ---------- the loop ---------- */

  function tick() {
    ensureToday();
    const now = new Date();
    const state = computeState(now);
    const sig = signature(state, now);
    if (sig !== lastSig) {
      lastSig = sig;
      renderAll(state, now);
    }
    updateCountdown(now);
    fireDue(state, now);
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const id = toggle.getAttribute("data-toggle");
      toggleDone(id);
      lastSig = "";
      tick();
      const btn = document.querySelector('.item[data-id="' + id + '"] .check');
      if (btn) {
        btn.classList.add("pop");
        btn.focus({ preventScroll: true });
      }
      return;
    }
    const action = e.target.closest("[data-action]");
    if (action) {
      const a = action.getAttribute("data-action");
      if (a === "enable") enableNotifications();
      if (a === "test") sendTest();
      if (a === "install" && installEvent) {
        installEvent.prompt();
        installEvent = null;
        renderNotif();
      }
      return;
    }
    const msg = e.target.closest(".item.done .item-msg");
    if (msg) msg.classList.toggle("open");
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e;
    renderNotif();
  });

  window.addEventListener("appinstalled", () => {
    installEvent = null;
    renderNotif();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  window.addEventListener("focus", tick);
  window.addEventListener("pageshow", tick);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        swReg = reg;
        if (canNotify()) registerPeriodic(reg);
      })
      .catch(() => {});
  }

  tick();
  setInterval(tick, 15000);
})();
