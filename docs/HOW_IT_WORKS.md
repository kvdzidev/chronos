# How CHRONOS works

[← README](../README.md)

Technical notes for contributors and curious users: architecture, the window
agent, the classifier, the score, the data format and the performance budget.

## Architecture

```
CHRONOS.vbs / start.cmd
          ↓
chronos.py (one process)
          ├ HTTP server 127.0.0.1:8899 → app files
          ├ GET /agent/now → active window (via agent.py)
          ├ GET /agent/health
          └ browser in app mode, own profile (.chronos-profile)
                    ↓
index.html + i18n.js, icons.js, rain.js, classify.js, app.js
                    ↓
localStorage (chronos.v1, chronos.lang)
```

- `chronos.py` serves the files, exposes the agent endpoint and opens the app
  window in a **dedicated browser profile**. Because the window is its own browser
  instance, the script can wait for it to close and then shut everything down.
- Every response carries `Cache-Control: no-store`, so editing a file and
  reloading never mixes old and new versions.
- Without a Chromium browser the script falls back to the default browser;
  with `--no-window` it only serves.

## The window agent

`agent.py` uses the Win32 API through `ctypes` (no third-party packages). It can
run inside `chronos.py` (endpoint `/agent/now`) or on its own via `agent.cmd`
(`http://127.0.0.1:8900/now`, with CORS for the app). The app tries both.

Response:

```json
{
  "ok": true,
  "title": "app.js - chronos - Visual Studio Code",
  "app": "Code.exe",
  "idle": 3.2,
  "screens": [
    { "screen": 0, "primary": true,  "fg": true,  "title": "app.js - …", "app": "Code.exe" },
    { "screen": 1, "primary": false, "fg": false, "title": "Meet - abc-defg-hij - Google Chrome", "app": "chrome.exe" }
  ]
}
```

- `title`, `app` - the foreground window.
- `idle` - seconds since the last mouse or keyboard input (`GetLastInputInfo`).
- `screens` - the leading visible window on **each monitor**. Windows has no
  single call for this, so the agent walks windows in Z order (`EnumWindows`,
  top-down) and takes the first sensible one per monitor, skipping minimised
  windows, windows cloaked by DWM, tool windows, desktop shells and anything
  smaller than 260×180 px. Monitors are numbered left to right.

The app polls every 1.5 s while the agent answers, and backs off to 4 s → 15 s →
60 s when it does not.

## The classifier (`classify.js`)

`classify(exe, title)` turns a raw process name and window title into:

```js
{ app, appName, isBrowser, tab, site, group, kind, work, chill, why, meeting, short }
```

1. **Browser tab cleanup.** For browsers, the suffix (`- Google Chrome`,
   `- Mozilla Firefox`, `- Personal - Microsoft Edge`), the `(3)` notification
   counter and `and 2 more pages` are stripped, leaving the tab title.
2. **App signal** from the `APPS` list (matched on the process name).
3. **Site signal** from the `SITES` list (matched on the tab title only; the first
   hit wins, which is why Messenger is listed before Facebook).
4. **Keyword signals** from `WORK_WORDS` and `CHILL_WORDS`, each list group
   scoring once, capped at 6 (work) and 8 (recreation).
5. **Verdict:** the higher sum wins; a tie or no signal is `neutral`.

| Window title | Points | Verdict |
|---|---|---|
| `React useEffect explained - YouTube` | work 5 : chill 2 | work |
| `Minecraft speedrun 1.16 WR - YouTube` | work 0 : chill 10 | chill |
| `shroud playing VALORANT - Twitch` | work 0 : chill 8 | chill |
| `ThePrimeagen - Docker in 10 minutes - Twitch` | work 4 : chill 3 | work |
| `(3) Messenger` | work 3 : chill 0 | work |
| `New tab` | 0 : 0 | neutral |

**Matching rules:** plain words match whole words only (`dota` does not fire
inside *dotacja*); a trailing `*` matches a word prefix (`'tax*'` → *tax, taxes,
taxable*); patterns with punctuation match as substrings; `RegExp` entries match
the shape of the whole title (a Google Meet tab is literally `Meet - code`, so the
pattern is anchored to avoid catching *Meet the team*).

### Short formats

Instagram, TikTok and titles with *shorts* / *reels* are flagged `short`. The
threshold is applied **on read**, not on write: while the day's total of short
content stays under **3 minutes** it counts as neutral; once it crosses the
threshold, all of it - including the first minutes - counts as recreation. This
works retroactively and resets at midnight.

## Which category gets the time

Each stretch of activity in the log is assigned:

1. **Your rule** (category *Auto-assign rules*, substring of `app + title`).
2. **The classifier's verdict** → the first category of that time type. A game
   goes to *Chill* even inside a manually started *Work* session.
3. **The running session**, when the classifier is neutral.
4. Otherwise **Unassigned**.

The **AUTO** switch additionally moves the *running timer* to the matching
category once the new window has held for 5 seconds. AUTO never starts a timer.

### Two monitors

Time has a single owner - the foreground window - so a day can never add up to
more than 24 hours. The other screens decide two things:

- a **meeting on any screen** raises the offline threshold (below),
- when the foreground window is neutral (File Explorer, the desktop) and another
  screen shows something with a verdict (e.g. Twitch), that verdict is used and the
  log records the reason (`drugi ekran: Twitch`).
  Category rules are checked against that window as well, so a Meet call on
  the second screen lands in the category with the `meet` rule.

## Offline and meetings

- More than **40 s** without input → offline. The idle stretch is **cut out** of
  the running session (subtracted, not just paused) and tracking resumes by itself
  on return. Offline time is reported separately and does not affect the score.
- When Google Meet, Zoom, Slack, Teams, Webex, Whereby or Jitsi is visible on any
  screen, the threshold becomes **45 minutes** - long enough for a call, short
  enough that a forgotten call does not count as half a day of work.
- When the screen is locked (`lockapp.exe` in front) the usual 40 s apply.

## The productivity score

| Part | Range | Formula |
|---|---|---|
| **Focus** | 0-55 | `55 × work / (work + recreation)` |
| **Volume** | 0-25 | `25 × min(1, work / 6 h)` |
| **Continuity** | 0-20 | `20 × min(1, average work block / 30 min)` |

Work blocks are merged when the gap between them is under 2 minutes. Neutral time
is excluded from the Focus denominator; offline time is ignored entirely.
Labels: `85+` great · `70+` very good · `50+` solid · `25+` scattered · below - easy.

Without agent data for a day, the score is computed from manual sessions and the
category time types (one block per session).

## Data format

Everything lives in the `localStorage` of the app's browser profile.

| Key | Contents |
|---|---|
| `chronos.v1` | the whole state (below) |
| `chronos.lang` | `pl` or `en` - kept separately so clearing data keeps the language |
| `chronos.v1.uszkodzone` | a corrupt save set aside instead of being overwritten |

```js
{
  v: 1,                 // format version
  m: 2,                 // last migration applied
  rev: 128,             // save revision, see "Safeguards"
  savedAt: 1759670400000,
  categories: [{ id, name, color, kind: 'work'|'chill'|'neutral',
                 logo: { type: 'mono'|'icon'|'image', value }, rules: [], createdAt }],
  sessions:   [{ id, categoryId, start, end, duration }],          // ms timestamps
  activity:   [{ s, e, app, appName, group, tab, kind, catId, why, short }],
  active:     { categoryId, sessionStart, segmentStart|null, elapsed } | null,
  seg:        { key, s, e, meta } | null,                         // open activity segment
  selectedId, targetMin, autoSwitch
}
```

*Export JSON* writes `{ v, exportedAt, categories, sessions, activity }`; *Import*
accepts the same shape. The activity log is trimmed to the last 30 days; sessions
are kept indefinitely. Segments shorter than 3 s are not stored.

### Migrations

The save carries a migration number `m`; each rewrite of existing data runs
exactly once, on the first start after an update:

1. emoji category logos → the nearest vector icon,
2. Messenger, Facebook and Discord segments previously marked as recreation → work.

Only segments marked as recreation are touched, and manual sessions are never
rewritten.

### Safeguards

- **A read error never wipes history.** A corrupt save is moved to
  `chronos.v1.uszkodzone` and the app starts empty with a notice.
- **Save revision (`rev`).** Every save increments it. If another open window
  holds a newer revision, this one refuses to overwrite it and says so.
- **Closing mid-session** stops the clock at the moment of closing; on reopening,
  time is counted only up to the last save. A gap under 5 minutes resumes
  automatically, a longer one leaves the session paused.

## Performance budget

The app stays on screen all day, so:

- the dial updates every 250 ms, but the side panels and open statistics are
  rebuilt at most once per second, and not while a mouse button is held down
  (so clicks are never lost to a re-render),
- a hidden window paints nothing; only the session-target check keeps running,
- the mini overlay (a Document Picture-in-Picture window, which browsers never
  throttle) compares a state stamp each frame and returns early when nothing changed,
- the character rain renders at ~18 fps with focus and ~7 fps without, on
  `requestAnimationFrame` (stopped automatically when minimised), at no more than
  1.5× pixel density, and shows a single static frame under `prefers-reduced-motion`.

## Design notes

A green-black base (`#040806`), hairlines instead of outlined cards, one jade
accent (`#3ddc84`) that each category can override, 10 px uppercase micro-labels,
and figures in JetBrains Mono with tabular numerals so they do not jump while
counting. Every text has defined truncation, so a 200-character tab title cannot
break the layout.
