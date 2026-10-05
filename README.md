**English** · [Polski](README.pl.md)

# CHRONOS

[![CI](https://github.com/kvdzidev/chronos/actions/workflows/ci.yml/badge.svg)](https://github.com/kvdzidev/chronos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-3ddc84.svg)](LICENSE)

A time tracker that runs on your own computer. You pick a category, click the
dial and work. On Windows it can also watch which window you are in and sort the
time into work and recreation by itself, then give the day a score out of 100.

No account, no cloud, nothing to install from npm or pip. It is plain
HTML/CSS/JS plus one Python script that only uses the standard library.

![CHRONOS in use](docs/screenshots/demo.gif)

## What it does

- <img src="docs/assets/icons/clock.svg" width="18" height="18" align="top" alt=""> Timer with session targets (25 / 50 / 90 min), pause, save and discard.
- <img src="docs/assets/icons/layers.svg" width="18" height="18" align="top" alt=""> Categories with a colour and an icon, monogram or your own image.
- <img src="docs/assets/icons/monitor.svg" width="18" height="18" align="top" alt=""> Reads the active window on every monitor (Windows) and knows 100+ apps and sites.
- <img src="docs/assets/icons/sliders.svg" width="18" height="18" align="top" alt=""> Tells a React tutorial on YouTube from a Minecraft speedrun.
- <img src="docs/assets/icons/moon.svg" width="18" height="18" align="top" alt=""> Cuts idle time out after 40 s, but not while you sit in a Meet or Zoom call.
- <img src="docs/assets/icons/target.svg" width="18" height="18" align="top" alt=""> Scores the day from focus, volume and continuity, and shows how.
- <img src="docs/assets/icons/chart.svg" width="18" height="18" align="top" alt=""> Daily report down to single files and browser tabs, plus a month calendar.
- <img src="docs/assets/icons/overlay.svg" width="18" height="18" align="top" alt=""> Small always-on-top overlay for when the main window is minimised.
- <img src="docs/assets/icons/globe.svg" width="18" height="18" align="top" alt=""> English and Polish.
- <img src="docs/assets/icons/shield.svg" width="18" height="18" align="top" alt=""> Data stays in a local browser profile. The agent only listens on `127.0.0.1`.

## In use

**The category follows the window.** With AUTO on, opening a Meet call moves the
running timer from *Deep Work* to *Meetings* (the rule `meet` on that category
decides). A window has to stay in front for 5 seconds, so a quick Alt+Tab does
nothing.

![AUTO switching to Meetings](docs/screenshots/in-use-auto.png)

**Meetings do not count as idle.** The call runs on the second monitor, you are
taking notes and have not touched the mouse for 6 minutes. The strip says why
the timer keeps going.

![Meeting on the second monitor](docs/screenshots/in-use-meeting.png)

**Walking away does.** Without a call, after 40 seconds of no input the timer
pauses and the idle stretch is subtracted. It resumes when you are back.

![Offline detection](docs/screenshots/in-use-offline.png)

| Daily report | What the time went into |
|---|---|
| ![Daily report](docs/screenshots/stats-day.png) | ![Category detail](docs/screenshots/stats-detail.png) |

| Month | Category editor |
|---|---|
| ![Monthly report](docs/screenshots/stats-month.png) | ![Category editor](docs/screenshots/category.png) |

| Mini overlay | First start |
|---|---|
| ![Mini overlay](docs/screenshots/mini.png) | ![Language picker](docs/screenshots/language.png) |

The screenshots use made-up demo data.

## Getting started

You need [Python 3.8+](https://www.python.org/downloads/) and Chrome, Edge,
Brave, Opera or Vivaldi. Window tracking works on Windows; on macOS and Linux
the app runs in manual mode.

```bash
git clone https://github.com/kvdzidev/chronos.git
cd chronos
python chronos.py
```

On Windows you can double-click `CHRONOS.vbs` instead (no console window).
Run `create-shortcut.cmd` once if you want an icon on the desktop.

The app opens in its own window and asks for a language on the first start.
Closing the window shuts everything down.

<img src="docs/assets/icons/arrow.svg" width="18" height="18" align="top" alt=""> Step-by-step guide: [docs/USER_GUIDE.md](docs/USER_GUIDE.md) (po polsku: [docs/INSTRUKCJA.md](docs/INSTRUKCJA.md))

## Keyboard

| Key | Action |
|---|---|
| `Space` | start / pause |
| `Enter` | save session |
| `1`-`9` | pick category |
| `N` | new category |
| `S` | statistics |
| `D` / `W` | day / month report |
| `←` `→` | previous / next day or month |
| `M` | mini overlay |
| `Esc` | close dialog |

## Privacy

There is no server and no telemetry; even the fonts are bundled. History is kept
in `localStorage` of a separate browser profile in `.chronos-profile/`, which is
git-ignored. The agent reports the title of the front window, the process name
and the idle time. It does not log keys, take screenshots or read page content.
For backups use *Export JSON* in the statistics window.

## How it works

`chronos.py` starts a local server on port 8899, exposes the window agent
(`agent.py`, Win32 API through `ctypes`) at `/agent/now` and opens the app in
browser app mode. The front end polls the agent every 1.5 s, `classify.js` decides
what the window is, and `app.js` keeps the log and computes the score.

Details on the classifier, the score, offline handling and the data format:
[docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md).

## Development

No build step. Edit a file and reload the window with `Ctrl+R`.

```bash
python chronos.py --no-window   # server only, open http://127.0.0.1:8899 yourself
node --test                     # tests, Node 18+
```

Adding a site or app to the classifier is usually one line, see
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). The bundled Inter and JetBrains Mono fonts are under the SIL Open Font License.
