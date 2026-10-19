# Sweet Day

A little daily reminder app, made with love. It shows a timeline of the day,
a "next up" card, a daily love note, and lets him check things off. It can
send phone or computer notifications at each reminder time.

It is plain HTML, CSS and JavaScript set up as an installable web app.
Nothing to build. You upload the files to a free host, and he opens the link
on his phone or computer and adds it to his home screen.

## The files (all in one flat folder)

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Colors, fonts, layout (light and dark mode) |
| `app.js` | The logic: timeline, check-offs, notifications |
| `reminders.js` | **All the times and messages. Edit this one.** |
| `sw.js` | Lets the app work offline and show notifications |
| `manifest.webmanifest` | Makes it installable on a phone |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | The heart app icons |

Upload **every file in the folder** (11 files, including this README). If one is missing, part of the app will break.

## Put it online from your phone (GitHub Pages, free)

Do this in your phone's browser (Chrome or Safari). It takes about 10 minutes.

**Step 1: Unzip the files**
- iPhone: open the **Files** app, tap the zip once. A `sweet-day` folder appears.
- Android: open **Files by Google**, tap the zip, then **Extract**.

**Step 2: Make a GitHub account**
1. Go to **github.com** and tap **Sign up**. Use your email and pick a username.
2. Confirm your email when GitHub asks.

**Step 3: Make a place for the app**
1. On github.com, tap the **+** (top right) and choose **New repository**.
   If you don't see it, tap the menu and switch the browser to
   **Desktop site** (in Chrome: ⋮ menu, "Desktop site"; in Safari: the
   **aA** button, "Request Desktop Website").
2. Name it `sweet-day`.
3. Choose **Public**.
4. Tap **Create repository**.

**Step 4: Upload the files**
1. On the new empty repository, tap **uploading an existing file**
   (or **Add file**, then **Upload files**).
2. Tap **choose your files**, open the unzipped `sweet-day` folder, and select
   **all 11 files**. If your phone only lets you pick a few at a time, repeat
   this step until all 11 are added.
3. Wait until all 11 files are listed, then tap **Commit changes**.

**Step 5: Turn the website on**
1. Tap **Settings** (on the repository page), then **Pages** in the left menu.
2. Under "Build and deployment", set **Source** to **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**, then tap **Save**.
4. Wait 1 to 2 minutes and refresh. The link appears at the top:
   `https://YOUR-USERNAME.github.io/sweet-day/`

Send that link to him. That's the app.

## Set it up on his phone

**Android (Chrome)**
1. Open the link.
2. Tap **Add to home screen** in the pink card, or the Chrome menu, then
   **Install app**.
3. Open Sweet Day from the home screen, tap **Turn on reminders**, and allow notifications.

**iPhone (Safari, iOS 16.4 or newer)**
1. Open the link in Safari.
2. Tap the Share button, then **Add to Home Screen**.
3. Open Sweet Day **from the home screen** (not from Safari), tap
   **Turn on reminders**, and allow notifications.

## Change the messages, times or names later

Open `reminders.js` on GitHub, tap the pencil (Edit) icon, change the words
between the quotes, and tap **Commit changes**. The change is live in a minute
or two.

- `hisName` and `fromName` at the top add his name to the greeting and yours
  under the daily love note.
- Each reminder has a `time` in 24-hour format (`"16:00"` is 4:00 PM).
- The school reminder has `days: WEEKDAYS`, so it only shows Monday to Friday.
- `LOVE_NOTES` is the list the daily love note picks from. Add your own.

Times follow the clock on his phone. After you save a change, the app shows the
new version the second time he opens it.

## About notifications (please read)

A free website can't wake up a phone by itself the way a built-in alarm app can.
Sweet Day sends each reminder from the page or from its background worker, so:

- Reminders arrive on time while the app is open, or still running in the
  background after he has used it recently.
- If the phone has put the app fully to sleep (battery saver, the app swiped
  away, or the phone restarted), a reminder can be late or missed until he opens
  the app again. On Android, installed apps also try to catch up in the
  background, but the browser decides how often.
- Anything that comes due while the app is closed still shows on the timeline
  as "Earlier", so nothing is lost.

For the best results, install it to the home screen, allow notifications, and
turn off battery saver for the app. A normal phone alarm for the 8:30 AM
wake-up is a good backup.

Fully guaranteed delivery needs a small server that sends push messages. That
can be added later.

## Good to know

- What he checks off is saved on his device only, and resets each day.
- Notifications only work from the hosted https link, not from a file opened
  straight from the phone.
