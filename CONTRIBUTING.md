# Contributing to CHRONOS

Thanks for taking the time to help. CHRONOS is deliberately small: vanilla
JavaScript, one Python file per process, no dependencies and no build step.
Please keep it that way.

## Getting started

```bash
git clone https://github.com/kvdzidev/chronos.git
cd chronos
python chronos.py --no-window      # serve on http://127.0.0.1:8899
node --test                        # run the tests (Node 18+)
```

Open `http://127.0.0.1:8899/index.html` in Chrome or Edge. Edit a file and
reload - there is nothing to compile.

> Your tracked data lives in the browser's `localStorage`. When testing in your
> everyday browser profile you get a separate database from the one used by
> `CHRONOS.vbs` (which runs in `.chronos-profile/`), so experiments do not touch
> your real history.

## Common changes

### Teach the classifier a new site or app

Open `classify.js` and add one line to the right list:

```js
// SITES - matched against the browser tab title
{ m: ['mycompany.com', 'intranet'], n: 'Intranet', k: 'work', w: 5 },

// APPS - matched against the process name
{ m: 'myeditor.exe', n: 'My Editor', k: 'work', w: 6 },
```

- `k` is `work`, `chill` or `neutral`; `w` is the weight (1 = weak hint,
  5-6 = strong signal that beats title keywords).
- Plain words match **whole words only**; `'tax*'` matches a word prefix.
  Patterns with punctuation (`'c++'`, `'wp.pl'`) match as substrings, and a
  `RegExp` can be used when the shape of the whole title matters.
- Order matters in `SITES`: the first match wins (that is why Messenger sits
  before Facebook).

Then add a case to `tests/classify.test.js` and run `node --test`.

### Add or change UI text

All strings live in `i18n.js` with a Polish and an English version. In HTML
use `data-i18n="key"` (text), `data-i18n-html="key"` (markup) or
`data-i18n-attr="title:key"` (attributes); in `app.js` call `tr('key', vars)`.
The test suite fails if a key is used but missing, or exists in only one
language.

### Add a category icon

Add an entry to `ICONS` in `icons.js` (24×24 grid, stroke only) and its name
to `ORDER`.

## Code style

- ES5-style JavaScript (`var`, function expressions) to match the existing code
  and run in any Chromium without transpiling.
- Python: standard library only, compatible with Python 3.8.
- Comments explain *why*, not *what*. Existing comments are in Polish; English
  is welcome in new code.
- Keep the agent read-only and loopback-only. Pull requests that send data
  anywhere, record keystrokes or capture the screen will not be accepted.

## Pull requests

1. Fork and create a branch from `main`.
2. Keep the change focused; describe what and why in the PR.
3. Make sure `node --test` passes and the app still starts with
   `python chronos.py`.
4. For visible changes, attach a screenshot.

## Reporting bugs

Open an issue with your OS, browser, Python version and steps to reproduce.
If the app fails to start, run `start.cmd` and include `chronos.log`.
**Do not attach your exported JSON** - it contains your window titles.
