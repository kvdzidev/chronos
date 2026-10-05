# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-10-05

### Added
- `python chronos.py --no-window` - serve the app without opening a browser window.
- Browser detection on macOS and Linux (Chrome, Chromium, Edge, Brave).
- `create-shortcut.cmd` - creates a desktop shortcut with the CHRONOS icon.
- Test suite for the classifier and the dictionary (`node --test`), GitHub Actions CI.
- User guides in English and Polish, technical documentation, screenshots.
- MIT license; OFL license files for the bundled fonts.

### Changed
- Emoji are gone from the interface and the docs. Category logos stored as emoji
  (old saves and imported files) are converted to the matching vector icon, and
  the docs use SVG icons from the app's own icon set.
- Interface texts and docs use plain hyphens instead of em and en dashes.
- Code comments rewritten: shorter, no decorative banners.
- README rewritten, with an animated demo and screenshots of the app in use.

### Fixed
- A meeting visible on a **second monitor** now raises the offline threshold,
  as documented. Previously only the foreground window was checked, so the timer
  paused while the status strip said idle time did not count.
- When the foreground window was neutral and a meeting ran on another monitor,
  AUTO moved the timer to the first work category instead of the one whose rule
  matches the meeting (e.g. `meet`).
- Clicks on categories, session rows or calendar days could be lost while a
  session was running, because the lists were rebuilt every second.
- Day navigation in statistics no longer drifts by an hour across daylight
  saving time changes.
- English interface: several texts were still shown in Polish
  ("% dnia", "Wczoraj", offline note, calendar tooltips, app names such as
  "Eksplorator plików" or "Zakupy").

## [1.0.0] - 2026-09-02

First public version.
