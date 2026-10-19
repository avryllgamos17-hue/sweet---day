/* ============================================================
   SWEET DAY — all the words and times live in this one file.
   Edit anything between the quotes, save, and re-upload.
   (The app and the notification worker both read this file.)
   ============================================================ */

const APP_CONFIG = {
  // His name, if you want the greeting to use it. Leave "" to say "my love".
  hisName: "",
  // Your name, shown under the daily love note. Leave "" for "With love".
  fromName: "",
};

/* days: 0 = Sunday, 1 = Monday ... 6 = Saturday */
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

const REMINDERS = [
  {
    id: "wake",
    time: "08:30",
    icon: "🍵",
    title: "Wake up and warm tea",
    message:
      "Good morning, my love! Time to wake up and start a wonderful day. Go drink some warm tea to wake up! Remember that I love you endlessly, I'm always believing in you, and you mean everything to me. You're going to do great today! ❤️",
    days: EVERY_DAY,
  },
  {
    id: "water-am",
    time: "09:30",
    icon: "💧",
    title: "Water time",
    message: "Time to drink water and stay hydrated! 💧",
    days: EVERY_DAY,
  },
  {
    id: "love",
    time: "11:30",
    icon: "💕",
    title: "A little love",
    message:
      "Just a gentle reminder that I always love you, no matter how busy the day gets! 💕",
    days: EVERY_DAY,
  },
  {
    id: "lunch",
    time: "12:00",
    icon: "🍽️",
    title: "Lunch time",
    message:
      "Time for lunch! Please eat a full, delicious meal and take a nice break. 🍽️",
    days: EVERY_DAY,
  },
  {
    id: "water-pm",
    time: "14:00",
    icon: "🥤",
    title: "Afternoon water",
    message: "Afternoon check-in: time to drink water again! 🥤",
    days: EVERY_DAY,
  },
  {
    id: "school",
    time: "16:00",
    icon: "🏫",
    title: "Heading home from school",
    message: "Hey baby! Just letting you know I'm going home from school now! 🏫✨",
    days: WEEKDAYS, // Monday to Friday only
  },
  {
    id: "food",
    time: "19:00",
    icon: "🍲",
    title: "Food check-in",
    message:
      "Quick check-in! Did you eat today? If you haven't eaten breakfast yet or skipped a meal earlier, please go eat something nourishing right now! 🍲",
    days: EVERY_DAY,
  },
  {
    id: "bed",
    time: "23:00",
    icon: "🌙",
    title: "Bedtime",
    message:
      "Time to sleep, my love! Put your phone away, rest well, and dream sweet dreams. Goodnight! 🌙✨",
    days: EVERY_DAY,
  },
];

/* One of these shows each day (it changes at midnight). Add as many as you like. */
const LOVE_NOTES = [
  "You make ordinary days feel like my favorite ones.",
  "Whatever today throws at you, you don't face it alone. I'm right here.",
  "I'm proud of you, even on the days you don't feel proud of yourself.",
  "Thinking of you is my favorite thing to do in between everything else.",
  "You're allowed to rest. You don't have to earn it.",
  "Out of everyone in the world, I'm so glad it's you.",
  "Take your time today. I'll be cheering for you the whole way.",
  "Your smile is my favorite kind of good news.",
  "Small reminder: you're doing better than you think.",
  "I love you today, tomorrow, and on all the boring Tuesdays in between.",
  "No matter how far the day pulls us apart, my heart stays with you.",
  "You deserve something soft and kind today. Go find a little moment of it.",
  "I believe in you. That was true yesterday and it will be true tomorrow.",
  "Every day with you is a gift I never get tired of opening.",
];

/* ============================================================
   Shared helpers (used by the page and by sw.js). No need to edit.
   ============================================================ */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function remindersFor(date) {
  return REMINDERS.filter(function (r) {
    return r.days.indexOf(date.getDay()) !== -1;
  }).sort(function (a, b) {
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });
}

function dueAt(reminder, date) {
  const parts = reminder.time.split(":");
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  return d;
}

function tagFor(reminder, date) {
  return reminder.id + "-" + dayKey(date);
}

function notificationTitle(reminder) {
  return reminder.icon + " " + reminder.title;
}

function notificationOptions(reminder, date) {
  return {
    body: reminder.message,
    tag: tagFor(reminder, date),
    icon: "icon-192.png",
    vibrate: [120, 60, 120],
    data: { id: reminder.id },
  };
}

/* "Did we already show this one?" Remembered in the browser's cache so the
   page and the background worker never send the same reminder twice. */
const SHOWN_CACHE = "sweet-day-shown";

async function wasShown(tag) {
  try {
    const cache = await caches.open(SHOWN_CACHE);
    return !!(await cache.match("/__shown/" + tag));
  } catch (e) {
    return false;
  }
}

async function markShown(tag) {
  try {
    const cache = await caches.open(SHOWN_CACHE);
    await cache.put("/__shown/" + tag, new Response("1"));
    const today = dayKey(new Date());
    const keys = await cache.keys();
    for (const k of keys) {
      if (k.url.indexOf(today) === -1) await cache.delete(k);
    }
  } catch (e) {
    /* storage unavailable: the page also keeps a short in-memory list */
  }
}
