**English** · [Polski](README.pl.md)

# CHRONOS — time tracker

A dark, instrument-panel time tracker. Categories with their own icon, one big
clickable dial, and a full report of the day. An optional local agent reads the
active window on every monitor, works out which browser tab you are on, files
the time under the right category, and closes the day with a productivity score
from 0 to 100.

No dependencies, no build step, no account. Plain HTML/CSS/JS plus one Python
script that uses nothing but the standard library.

---

## Your data is yours

This matters more than any feature, so it comes first.

- **Nothing is uploaded.** CHRONOS has no account, no server and no telemetry.
  The agent listens on the loopback interface only, so it is not reachable from
  another machine.
- **Your history lives in the browser**, in `localStorage`, inside the
  `.chronos-profile` folder that ships next to the app. It is never written into
  a project file.
- **`.chronos-profile/` is in `.gitignore`.** Clone this repository and you get
  an empty tracker with your own database. Push it and you push code, never
  hours. The same goes for `chronos-backup-*.json` exports and `chronos.log`.
- **Two installs never mix.** The app runs in its own browser profile, separate
  from your everyday browser, so its data is independent of anything else you
  do online.

If you want a copy of your history, take it yourself: **Export JSON** at the
bottom of the statistics window.

## Language

The first launch asks one question — **Polski or English** — before anything
else is built, so the starting categories and the date format come out in the
language you picked. You can switch at any time from the **PL / EN** control at
the bottom of the statistics window; it applies instantly and never touches your
recorded data.

The choice is stored under its own key (`chronos.lang`), so clearing your
tracking data does not reset it.

## Running it

**Double-click `CHRONOS.lnk` on the desktop** (or `CHRONOS.vbs` in this folder).
That is all. A window opens without browser chrome, and the server plus the
window-reading agent start behind it. **Closing the window ends everything** —
nothing is left running.

| File | When to use it |
|---|---|
| `CHRONOS.vbs` | normal start, no console |
| `start.cmd` | the same, but with a visible console — when something misbehaves |
| `agent.cmd` | the agent alone, if you would rather run it separately |
| `chronos.log` | startup log, useful for diagnosis |

Everything comes out of one `chronos.py` process: the app files, the
`/agent/now` endpoint with the active window, and opening the window itself.
Responses carry `Cache-Control: no-store`, so after editing a file you never get
a mix of old and new versions.

The app starts empty, with two categories: **Work** and **Chill**. No invented
sessions — everything in the statistics was actually measured.

## The timer

- Click the dial to start or pause; click again to resume.
- **Save session** ends the measurement, **×** discards it. Paused time is not
  counted.
- Session target: ∞ / 25 / 50 / 90 min. On ∞ the arc measures the current minute.
- Changing category mid-measurement saves the current session and starts a new one.

### The session saves itself

You do not have to click anything before closing the app. State goes to disk
every few seconds, and once more in full as the window closes. After a restart
everything is where you left it: categories, history, window log, and the
session that was running.

The rule that matters: **the clock does not run while the app is off.** Time is
counted up to the last save, never "until now" — otherwise closing the app in
the evening would add eight hours of night work. This holds both for a graceful
close and for a killed process.

On reopening:

| Gap | What happens |
|---|---|
| under 5 min | the session **resumes by itself** (app restart, refresh) |
| longer | the session waits **on hold**, with a notice — one click resumes it |

## Mini overlay

The **Mini** button (or the `M` key) opens a small window that **stays on top of
every application**. You can drag it anywhere and resize it freely, from a tile
down to a thin strip. The big browser window may be minimised while it is open.

The overlay shows the category, the time counting up, a start/pause button, the
day's total, and what you are in according to the agent (or an offline warning).
**Expand** closes it and returns to the full window. Space works here too.

This is not an ordinary browser popup but a **Document Picture-in-Picture**
window — a real OS window. Two consequences:

- It needs a Chromium browser (Chrome, Edge, Opera, Brave) and a start through
  `start.cmd`. Opening `index.html` straight from disk hides the button.
- A PiP window is visible by definition, so the browser **does not throttle its
  timers**. While the overlay is open, measurement and the agent run at the full
  1.5 s resolution even with the main window minimised. Without it, a minimised
  browser gets its timers cut to roughly once a minute after a few minutes and
  the activity log turns coarse.

## Categories

Three logo styles: **monogram**, **icon** (40 line icons) or **your own image**
(cropped square, scaled to 128 px). The accent colour is taken over by the whole
app — dial, arc, glow, buttons.

The icons are drawn with the same hairline stroke as the rest of the interface
and inherit the category's accent colour, so they are green by default and
change with the category. They are vectors, not emoji: identical on every
machine, with no borrowed typeface or foreign palette.

Every category has a **time type**: `Work`, `Chill` or `Neutral`. The type
decides how the category affects the productivity score.

The **Auto-assign rules** field takes fragments of a process name or window
title, comma separated (e.g. `code.exe, github, figma`). Your rule always beats
the classifier.

### What ends up in which category

The order is deliberate and unambiguous:

1. **Your rule** — always first.
2. **The classifier's verdict**, when it has one. A game, or gameplay on
   YouTube, goes to Chill **even inside a manually started "Work" session**.
   Declaring that you are working does not turn a game into work.
3. **The running session**, only when the classifier is neutral. File Explorer
   in the middle of work counts as work, because session context is the only
   information available.
4. None of the above → **Unassigned**, with its own tab in the statistics.

## The local agent (optional)

`agent.cmd` starts a small server on `127.0.0.1:8900` that returns the title of
the leading window on **every** monitor, the process name and the idle time. The
app polls it every 1.5 s and shows the result in the **Active window** strip.

**What the agent does not do:** it does not read keystrokes, take screenshots,
look inside page content, write anything to disk or send anything to the
network. It listens on loopback only and runs exactly as long as you keep its
console window open. Without the agent the rest of the app works normally — just
manually.

### Reading the browser tab

Windows does not expose the URL, but a browser window title **is** the title of
the active tab. `classify.js` reduces it to a clean name: it strips suffixes
(`- Google Chrome`, `— Mozilla Firefox`, `- Personal - Microsoft Edge`), the
`(3)` notification counter and `and 2 more pages`.

### What counts as recreation

| Thing | Verdict |
|---|---|
| YouTube, Twitch, Kick | **recreation** — unless the tab sounds like real research |
| games: Among Us, CS2, Aim Lab, League of Legends, VALORANT and the rest of the list | **recreation**, always |
| **Messenger, Facebook, Discord** | **work** — a contact channel, not browsing |
| reels, shorts, TikTok | recreation **only past 3 minutes total in a day** |

### Messengers count as work

Messenger, Facebook and Discord count as work, because that is how they are
actually used here: reaching clients, not wandering. The weight is deliberately
low (3), so it is a **weak** signal — a genuinely recreational title still beats
it, since the stronger side wins the sum.

The Messenger entry sits **before** Facebook in `SITES`, because "Facebook
Messenger" contains both words and the loop stops at the first hit.

> If Facebook is browsing rather than work for you, it is one word in
> `classify.js`: `k: 'work'` → `k: 'chill'`.

#### The three-minute grace for short formats

A reel is sometimes the result of looking something up for work rather than
wandering off. So Instagram, TikTok and tabs containing "shorts" or "reels" get
their own flag, and **under 3 minutes total per day they count as neutral**.
Once the sum crosses the threshold, **all** of that time becomes recreation,
including those first minutes — not just the excess.

The threshold is applied **on read**, not on write. Three consequences: the
result always matches the current daily sum, it works retroactively on history
already collected, and it corrects itself the moment another minute tips the
balance. The counter resets at midnight.

### How the work / chill decision is made

No single rule decides. Signals add up into two scores and the stronger one
wins — which is why YouTube can be either:

| Window title | Points | Verdict |
|---|---|---|
| `React useEffect explained — YouTube` | work 5 : chill 2 | **work** |
| `Minecraft speedrun 1.16 WR — YouTube` | work 0 : chill 10 | **chill** |
| `shroud playing VALORANT — Twitch` | work 0 : chill 8 | **chill** |
| `ThePrimeagen — Docker in 10 minutes — Twitch` | work 4 : chill 3 | **work** |
| `xQc — Kick` | work 0 : chill 3 | **chill** |
| `(3) Messenger` | work 3 : chill 0 | **work** |
| `New tab` | 0 : 0 | **neutral** |

A game name beats the word "tutorial", and a specific technology beats the mere
presence of YouTube. A tie is always "neutral" — with no signal, CHRONOS does
not guess.

The signal lists in `classify.js` are plain arrays. Adding your own site, game
or program is one line:

```js
{ m: ['mycompany.com'], n: 'Intranet', k: 'work', w: 5 },
```

Matching works on **whole words**, not fragments, so `dota` will not fire inside
another word. For inflected forms, add an asterisk: `'tax*'` catches *tax,
taxes, taxable* without reaching into the middle of a different word.

### Offline after 40 seconds

More than **40 s** without mouse or keyboard input switches CHRONOS to offline.
Not 15: reading a paragraph, glancing at notes or thinking a sentence through is
still work, not absence.
The idle stretch is **cut out of the running session** (subtracted from measured
time, not merely paused) and measurement resumes by itself when you come back.
Offline is counted separately and does not affect the score either way.

> Detection is based on mouse and keyboard activity and the lock screen, not on
> image analysis. A film watched without touching the mouse is treated as
> offline after 40 s.

#### Exception: meetings

In a meeting you listen. The mouse sits still for an hour while you are very
much there, so those 40 seconds would simply be a measurement error. When
**Google Meet, Zoom, Slack, Teams, Webex, Whereby or Jitsi** is visible on *any*
screen, the threshold rises from 40 seconds to **45 minutes**. The Active window
strip says so outright: *"Google Meet — listening, idle does not count"*.

The threshold rises rather than disappearing, and that is deliberate: walking
away from the computer with Meet still open has to reach offline eventually,
otherwise a forgotten call would add half a day of work. The lock screen skips
the exception — `lockapp.exe` is not a meeting, so the usual 40 seconds apply.

Detection goes by process name (`zoom.exe`, `slack.exe`, `teams.exe`) or by tab
title. A Meet tab is literally "Meet — meeting-code", which is why the pattern is
anchored to the start of the title: the bare word "meet" would also catch
"Meet the team".

### Two monitors

One foreground window is not enough when there are two screens: Meet can be
running on the second monitor while you work on the first. So the agent returns
a `screens` field — **one window per screen**, the one actually visible on it.
Windows has no single call for this, so the agent walks the windows in Z order,
top down, and takes the first sensible one for each monitor, skipping minimised
windows, windows cloaked by DWM, tool windows and desktop shells.

Time still has **one owner: the foreground window**. A day has 24 hours and
cannot be counted twice, so the second screen never takes time from the first.
It does decide two things:

- **a meeting on any screen** cancels offline (described above),
- when the foreground window **means nothing** — Explorer, the desktop,
  Messenger — and Twitch is running next to it, that is recreation after all.
  The log records the reason as *"second screen: Twitch"*, so nothing happens
  silently.

The Active window strip shows a chip with the screen number and what is on it,
coloured by verdict. An older agent without the `screens` field still works —
CHRONOS falls back to the single foreground window.

### The AUTO switch

Off by default. Switched on, the **running measurement** moves by itself to the
category matching the active window. A change requires 5 seconds in the new
window, so a quick alt-tab does not shred the session. AUTO never starts a
measurement on its own; the decision to begin is always yours.

## Statistics

**The right-hand panel**, live: day total, session count, longest session,
percentage split, a 00–24 activity strip and recent sessions.

The statistics window has two ranges, switched at the top (`D` — day, `W` —
month view; the `←` `→` arrows move by a day or by a month respectively).

### Month

A calendar of the whole month: each day is a tile with its **score** (colour and
number), work time and a work / recreation / neutral / offline proportion bar.
**Clicking a day opens its full report.** Above the calendar sit the monthly
totals: recorded time, work, average score and best day; below it, the month
split by type and category with percentages.

### Day

- **A productivity score from 0 to 100**, split into work / recreation / neutral
  / **offline** — percentages are taken from all recorded time, so they sum to
  100 and it is immediately visible how much of the day went idle.
- **Category detail** — click a category to break it apart: every app and
  service with its time **and percentage** (e.g. `Visual Studio Code 53%`,
  `Excel 16%`), and underneath the specific files, projects and browser tabs,
  also with percentages. Separate tabs for **Offline** and **Unassigned**, each
  with its own share of the day.
- a time-split ring, an hourly activity chart, a session log
- navigation back through days (arrows or `←` / `→`)

### The scoring algorithm

The result is the sum of three parts, each shown outright in the interface — no
magic, you can always see where the number came from:

| Part | Range | What it measures | Formula |
|---|---|---|---|
| **Focus** | 0–55 | what you fill the time with | `55 × work / (work + recreation)` |
| **Volume** | 0–25 | whether there was enough work | `25 × min(1, work / 6h)` |
| **Continuity** | 0–20 | whether it came in one piece | `20 × min(1, average block / 30 min)` |

Work blocks are glued together when the gap is under 2 minutes, so glancing at
documentation does not split an hour of work into twenty pieces. Neutral time
does not enter the "Focus" denominator: browsing files neither rewards nor
punishes. Offline is skipped entirely.

Thresholds: `85+` great day · `70+` very good · `50+` solid · `25+` scattered ·
below that — an easy day.

Without the agent the score is computed from manual sessions and category types,
so it works from day one — just less precisely, which the interface says openly.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | start / pause |
| `Enter` | save session |
| `1`–`9` | pick category |
| `N` | new category |
| `S` | statistics |
| `D` / `W` | range: day / month |
| `M` | mini overlay |
| `Esc` | close window |
| `←` `→` | previous / next day |

## Data, export, safety

Everything sits locally in `localStorage` (key `chronos.v1`). The activity log is
trimmed to 30 days. The statistics window has **Export JSON**, **Import** and
**Clear data**.

> Clearing site data in the browser wipes the history. Export before doing that.

### Save migrations

Changing the rules must not leave old history contradicting what the app says
today. So the save carries a migration number (`m`), and each rewrite runs
**exactly once**, on the first start after an update:

- emoji category logos are converted to the nearest vector icon,
- Messenger, Facebook and Discord segments previously marked as recreation move
  to work, together with their assignment to a "work" type category.

Only segments marked as recreation are touched. Anything already work or neutral
stays as it is, later manual corrections are not undone on the next start, and
manually saved sessions are not changed at all.

Two safeguards, added after I deleted my own data during testing:

- **A read error never wipes the history.** If a save turns out to be corrupt,
  the original is moved to the key `chronos.v1.uszkodzone` and the app starts
  empty with a notice — the data stays recoverable.
- **A save revision number (`rev`).** Every save bumps a counter. If a second
  open tab holds newer data, the first one will not overwrite it on close and
  says so instead.

## Files

```
CHRONOS.vbs  — one-click start
chronos.py   — server + agent + app window in one process
chronos.ico  — shortcut icon
index.html   — structure and dialogs
styles.css   — design system (tokens, typography, components)
app.js       — state, measurement, activity log, score, statistics
classify.js  — app and tab recognition + the work/chill decision
i18n.js      — Polish and English dictionary
icons.js     — the category icon set
rain.js      — the character rain background (main window and overlay)
agent.py     — active-window agent (standard library only)
start.cmd    — start with a console (diagnostics)
agent.cmd    — start the agent
```

## Design

A green-black base (`#040806`), the discipline of hairlines instead of outlined
cards, one jade accent (`#3ddc84`), 10 px uppercase micro-caps as labels and
figures in JetBrains Mono with tabular numerals (they do not jump while counting
down). Every piece of text has defined truncation — even a 200-character tab
title will not push the layout around. The interface respects
`prefers-reduced-motion`.

### The character rain

A wall of kanji falls in the background: the head of each streak is near-white,
the tail fades out in jade. It is drawn by `rain.js` on a plain `<canvas>`, one
per window — the mini overlay is a real OS window with its own `document`, so it
gets its own canvas.

Three decisions make it something you can look at all day:

- **The rain avoids what you read.** Two masks at once (`mask-composite:
  intersect`) cut a hole for the dial and fade the edges, while the category rail
  and the statistics panel are opaque. What remains is a ring of characters
  around the clock — a background, not wallpaper behind text.
- **It costs little.** ~18 frames per second instead of 60, on a
  `requestAnimationFrame` loop, so a minimised window stops it automatically.
- **The motion can be turned off.** `prefers-reduced-motion` leaves a single
  static frame instead of the animation.

Surfaces are green-black rather than neutral black, and that is not decoration:
a cool grey panel over a warm green rain would look stuck on top of it.
