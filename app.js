// CHRONOS - time tracker. Bez zależności, dane w localStorage.
(function () {
  'use strict';

  var KEY = 'chronos.v1';

  // tr, a nie t, bo t bywa lokalną zmienną
  var I18N = window.CHRONOS_I18N;
  var ICO = window.CHRONOS_ICONS;
  function tr(key, vars) { return I18N ? I18N.t(key, vars) : key; }
  function loc() { return I18N ? I18N.locale() : 'pl-PL'; }
  function label(name) { return I18N && I18N.label ? I18N.label(name) : name; }
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };

  var PALETTE = [
    '#3ddc84', '#a6ffcd', '#2dd4bf', '#3ddc84',
    '#7c8cff', '#a78bfa', '#f472b6', '#ffb454',
    '#facc15', '#94a3b8'
  ];


  // Sekundy bezczynności, po których przechodzimy w offline. Nie mniej,
  // bo czytanie czy namysł to też praca.
  var OFFLINE_AFTER = 40;

  // Na spotkaniu mysz potrafi stać godzinę. Limit mimo to jest, żeby
  // zostawiony otwarty Meet też kiedyś przeszedł w offline.
  var MEETING_OFFLINE_AFTER = 45 * 60;

  // Dzienny limit rolek/shortów, poniżej którego są neutralne (applyShortGrace).
  var SHORT_GRACE = 3 * 60 * 1000;

  // Podbić przy nowej migracji danych - każda wykonuje się tylko raz.
  var MIGRATION = 2;

  // Starsze zapisy mają emoji zamiast ikon.
  var EMOJI_TO_ICON = {
    '\uD83C\uDFAF': 'target',   '\uD83D\uDCBB': 'code',     '\uD83D\uDCDA': 'book',     '\u270D\uFE0F': 'pen',
    '\uD83E\uDDE0': 'bulb',     '\uD83D\uDD2C': 'flask',    '\uD83C\uDFA8': 'palette',  '\uD83C\uDFA7': 'music',
    '\uD83D\uDCC8': 'trend',    '\uD83D\uDCA1': 'bulb',     '\uD83C\uDFCB\uFE0F': 'dumbbell', '\uD83C\uDFC3': 'dumbbell',
    '\uD83E\uDDD8': 'leaf',     '\u26BD': 'globe',    '\uD83C\uDFB8': 'music',    '\uD83C\uDF73': 'coffee',
    '\uD83E\uDDF9': 'sliders',  '\uD83D\uDED2': 'cart',     '\uD83D\uDCAC': 'chat',     '\uD83D\uDCDE': 'phone',
    '\uD83D\uDCDD': 'note',     '\uD83D\uDDC2\uFE0F': 'folder',   '\uD83E\uDDE9': 'cube',     '\u2699\uFE0F': 'sliders',
    '\uD83D\uDE80': 'rocket',   '\uD83D\uDD27': 'wrench',   '\uD83C\uDFAC': 'film',     '\uD83D\uDCF7': 'camera',
    '\uD83C\uDF31': 'leaf',     '\u2615': 'coffee',   '\uD83C\uDF19': 'moon',     '\u23F1\uFE0F': 'clock',
    '\uD83D\uDD25': 'bolt',     '\u2B50': 'star',     '\uD83E\uDDED': 'compass',  '\uD83D\uDDFA\uFE0F': 'globe',
    '\uD83D\uDCB0': 'coin',     '\uD83C\uDFDB\uFE0F': 'shield',   '\uD83D\uDC0D': 'code',     '\uD83E\uDDEA': 'flask',
    '\uD83C\uDFAE': 'gamepad'
  };

  // Dawniej liczone jako rozrywka, patrz migrate().
  var NOW_WORK = ['Messenger', 'Facebook', 'Discord'];

  var MIN_SEGMENT = 3000;      // krótsze przełączenia okien pomijamy
  var KEEP_DAYS = 30;
  var DAILY_GOAL_MS = 6 * 3600000;   // cel dzienny do rankingu

  var state = {
    categories: [],
    sessions: [],
    activity: [],          // { s, e, app, appName, group, tab, kind, catId, why }
    active: null,          // { categoryId, sessionStart, segmentStart|null, elapsed }
    selectedId: null,
    targetMin: 0,
    autoSwitch: false
  };

  var SEED = [
    { key: 'seed.work',  color: '#3ddc84', kind: 'work',  logo: { type: 'icon', value: 'target' },  rules: [] },
    { key: 'seed.chill', color: '#ffb454', kind: 'chill', logo: { type: 'icon', value: 'gamepad' }, rules: [] }
  ];

  var REV = 0;          // licznik zapisów, patrz save()

  var ui = {
    mode: 'day',
    statsMonth: startOfMonth(Date.now()),
    statsDay: startOfDay(Date.now()),
    editingId: null,
    draft: null,
    memoryOnly: false
  };

  // Zwraca liczbę zmienionych kategorii.
  function iconizeLogos(list) {
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var lg = list[i].logo;
      if (!lg || lg.type !== 'emoji') continue;
      list[i].logo = {
        type: 'icon',
        value: EMOJI_TO_ICON[lg.value] ||
               EMOJI_TO_ICON[String(lg.value).replace(/\uFE0F/g, '')] || 'target'
      };
      n++;
    }
    return n;
  }

  // Migracje zapisu, wg numeru m zapisanego w danych.
  function migrate(from) {
    if (from >= MIGRATION) return;
    var zmian = 0;

    zmian += iconizeLogos(state.categories);

    // NOW_WORK: przepisujemy tylko stare odcinki oznaczone jako rozrywka
    var work = categoryByKind('work');
    for (var j = 0; j < state.activity.length; j++) {
      var a = state.activity[j];
      if (a.kind !== 'chill') continue;
      if (NOW_WORK.indexOf(a.group) === -1) continue;
      a.kind = 'work';
      a.why = 'serwis: ' + a.group;
      var cat = byId(a.catId);
      if (work && (!cat || (cat.kind || 'work') === 'chill')) a.catId = work.id;
      zmian++;
    }

    if (zmian > 0) save();
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); }
    catch (e) { ui.memoryOnly = true; }

    if (!raw) { seed(); return; }
    try {
      var d = JSON.parse(raw);
      state.categories = Array.isArray(d.categories) ? d.categories : [];
      state.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      state.activity = Array.isArray(d.activity) ? d.activity : [];
      state.selectedId = d.selectedId || null;
      state.targetMin = typeof d.targetMin === 'number' ? d.targetMin : 0;
      state.autoSwitch = d.autoSwitch === true;
      state.active = d.active || null;
      if (state.active && !byId(state.active.categoryId)) state.active = null;
      if (!byId(state.selectedId)) state.selectedId = state.categories.length ? state.categories[0].id : null;
      REV = typeof d.rev === 'number' ? d.rev : 0;
      migrate(typeof d.m === 'number' ? d.m : 0);
      restoreRunning(d);
      prune();
    } catch (e) {
      // Uszkodzonego zapisu nie kasujemy, zostaje pod osobnym kluczem.
      try { localStorage.setItem(KEY + '.uszkodzone', raw); } catch (e2) {}
      if (window.console && console.error) console.error('CHRONOS: nie udało się wczytać zapisu', e);
      ui.loadFailed = true;
      state.categories = []; state.sessions = []; state.activity = []; state.active = null;
      seed();
    }
  }

  function seed() {
    state.categories = SEED.map(function (s, i) {
      return {
        id: uid(), name: tr(s.key), color: s.color, kind: s.kind,
        logo: s.logo, rules: s.rules, createdAt: Date.now() + i
      };
    });
    state.selectedId = state.categories[0].id;
    save();
  }

  // Czas sprzed zamknięcia liczymy tylko do savedAt, nie do teraz - inaczej
  // przerwa między uruchomieniami wliczyłaby się do sesji.
  function restoreRunning(d) {
    var savedAt = typeof d.savedAt === 'number' ? d.savedAt : Date.now();
    var przerwa = Math.max(0, Date.now() - savedAt);

    if (d.seg && d.seg.meta && d.seg.s) {
      seg = { key: d.seg.key, s: d.seg.s, e: Math.min(d.seg.e || savedAt, savedAt), meta: d.seg.meta };
      if (przerwa > 60000) flushSegment(seg.e);   // dłuższa przerwa: domykamy odcinek
    }

    if (!state.active) return;

    if (state.active.segmentStart) {
      var w_biegu = Math.max(0, savedAt - state.active.segmentStart);
      state.active.elapsed = (state.active.elapsed || 0) + w_biegu;
      state.active.segmentStart = null;
      ui.wznowPo = przerwa;
    } else if (state.active.closedRunning) {
      ui.wznowPo = przerwa;
    }
    delete state.active.closedRunning;
  }

  function prune() {
    var cutoff = startOfDay(Date.now()) - KEEP_DAYS * DAY;
    state.activity = state.activity.filter(function (a) { return a.e > cutoff; });
  }

  function reset(silent) {
    state.categories = [];
    state.sessions = [];
    state.activity = [];
    state.active = null;
    state.selectedId = null;
    seed();
    if (!silent) { applyAccent(); renderAll(); renderStats(); toast(tr('toast.cleared')); }
  }

  function save() {
    if (ui.memoryOnly) return;
    try {
      // wyższy rev w storage = zapisała inna karta, nie nadpisujemy
      var cur = localStorage.getItem(KEY);
      if (cur) {
        var curRev = 0;
        try { curRev = JSON.parse(cur).rev || 0; } catch (e0) { curRev = 0; }
        if (curRev > REV) {
          if (!ui.staleWarned) {
            ui.staleWarned = true;
            toast(tr('toast.staleTab'));
          }
          return;
        }
      }
      REV++;
      localStorage.setItem(KEY, JSON.stringify({
        v: 1,
        m: MIGRATION,
        rev: REV,
        savedAt: Date.now(),        // do kiedy aplikacja na pewno działała
        seg: seg ? { key: seg.key, s: seg.s, e: seg.e, meta: seg.meta } : null,
        categories: state.categories,
        sessions: state.sessions,
        activity: state.activity,
        active: state.active,
        selectedId: state.selectedId,
        targetMin: state.targetMin,
        autoSwitch: state.autoSwitch
      }));
    } catch (e) {
      ui.memoryOnly = true;
      toast(tr('toast.noStorage'));
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function byId(id) {
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === id) return state.categories[i];
    }
    return null;
  }

  // Daty i formatowanie

  function startOfDay(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

  // Po kalendarzu, nie + DAY - przy zmianie czasu doba ma 23 lub 25 h.
  function addDays(ts, n) {
    var d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime();
  }

  function startOfMonth(ts) {
    var d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(1); return d.getTime();
  }
  function addMonths(ts, n) {
    var d = new Date(ts); d.setDate(1); d.setMonth(d.getMonth() + n); return startOfDay(d.getTime());
  }
  function daysInMonth(ts) {
    var d = new Date(ts); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }
  // poniedziałek = 0, niedziela = 6
  function weekday(ts) { return (new Date(ts).getDay() + 6) % 7; }

  function fmtMonth(ts) {
    var s2 = new Date(ts).toLocaleDateString(loc(), { month: 'long', year: 'numeric' });
    return s2.charAt(0).toUpperCase() + s2.slice(1);
  }
  var DAY = 86400000;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmtHM(ms) {
    var total = Math.floor(ms / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    if (h > 0) return h + 'h ' + pad(m) + 'm';
    if (m > 0) return m + 'm';
    return Math.max(0, total) + 's';
  }

  function fmtHMRich(ms) {
    var total = Math.floor(ms / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    if (h > 0) return h + '<small>h</small> ' + pad(m) + '<small>m</small>';
    return m + '<small>m</small> ' + pad(total % 60) + '<small>s</small>';
  }

  function fmtTime(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function fmtDateLong(ts) {
    var d = new Date(ts);
    var s = d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function fmtDateShort(ts) {
    return new Date(ts).toLocaleDateString(loc(), { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function activeElapsed() {
    if (!state.active) return 0;
    var e = state.active.elapsed || 0;
    if (state.active.segmentStart) e += Date.now() - state.active.segmentStart;
    return e;
  }

  function isRunning() { return !!(state.active && state.active.segmentStart); }

  // łącznie z trwającą sesją
  function sessionsForDay(dayStart) {
    var dayEnd = addDays(dayStart, 1);
    var out = [];
    for (var i = 0; i < state.sessions.length; i++) {
      var s = state.sessions[i];
      if (s.end > dayStart && s.start < dayEnd) out.push(s);
    }
    if (state.active) {
      var a = {
        id: '__live', categoryId: state.active.categoryId,
        start: state.active.sessionStart, end: Date.now(),
        duration: activeElapsed(), live: true
      };
      if (a.end > dayStart && a.start < dayEnd) out.push(a);
    }
    out.sort(function (x, y) { return x.start - y.start; });
    return out;
  }

  // proporcjonalna część sesji w przedziale [from, to)
  function durationInRange(s, from, to) {
    var span = Math.max(1, s.end - s.start);
    var ov = Math.min(s.end, to) - Math.max(s.start, from);
    if (ov <= 0) return 0;
    return (s.duration || span) * (ov / span);
  }

  function totalsByCategory(list, dayStart) {
    var map = {}, total = 0;
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var d = dayStart == null ? (s.duration || 0) : durationInRange(s, dayStart, addDays(dayStart, 1));
      if (d <= 0) continue;
      map[s.categoryId] = (map[s.categoryId] || 0) + d;
      total += d;
    }
    var rows = [];
    for (var k in map) {
      if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
      var c = byId(k);
      rows.push({
        id: k,
        name: c ? c.name : tr('cat.deleted'),
        color: c ? c.color : '#4f6057',
        logo: c ? c.logo : null,
        ms: map[k]
      });
    }
    rows.sort(function (a, b) { return b.ms - a.ms; });
    return { rows: rows, total: total };
  }

  function paintLogo(node, cat, size) {
    node.innerHTML = '';
    var logo = cat && cat.logo;
    if (logo && logo.type === 'image' && logo.value) {
      var img = document.createElement('img');
      img.src = logo.value;
      img.alt = '';
      img.width = 128; img.height = 128;
      img.decoding = 'async';
      node.appendChild(img);
    } else if (logo && logo.type === 'icon' && ICO && ICO.has(logo.value)) {
      // kolor kategorii przez currentColor
      node.innerHTML = ICO.svg(logo.value, size ? Math.round(size * 1.1) : 18);
    } else {
      var name = (cat && cat.name) || '?';
      node.textContent = name.trim().slice(0, 2).toUpperCase();
    }
  }

  function renderRail() {
    var list = $('catList');
    list.innerHTML = '';
    var day = startOfDay(Date.now());
    var totals = totalsByCategory(sessionsForDay(day), day);
    var perCat = {};
    totals.rows.forEach(function (r) { perCat[r.id] = r.ms; });

    state.categories.forEach(function (c) {
      var btn = el('button', 'cat');
      btn.type = 'button';
      btn.style.setProperty('--cat-color', c.color);
      btn.setAttribute('aria-current', String(state.selectedId === c.id));

      var logo = el('span', 'cat__logo');
      paintLogo(logo, c);

      var body = el('div', 'cat__body');
      body.appendChild(el('span', 'cat__name', c.name));
      var ms = perCat[c.id] || 0;
      body.appendChild(el('span', 'cat__time', ms > 0 ? fmtHM(ms) : '-'));

      var right = el('div', 'cat__right');
      if (state.active && state.active.categoryId === c.id) {
        right.appendChild(el('span', 'cat__live'));
      }
      var edit = el('button', 'cat__edit');
      edit.type = 'button';
      edit.title = tr('cat.edit');
      edit.setAttribute('aria-label', tr('cat.editOne', { name: c.name }));
      edit.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M11.2 2.8a1.7 1.7 0 012.4 2.4L5.6 13.2 2.4 14l.8-3.2 8-8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
      edit.addEventListener('click', function (e) { e.stopPropagation(); openCat(c.id); });
      right.appendChild(edit);

      btn.appendChild(logo);
      btn.appendChild(body);
      btn.appendChild(right);
      btn.addEventListener('click', function () { selectCat(c.id); });
      list.appendChild(btn);
    });

    $('catCount').textContent = state.categories.length;
    $('catEmpty').hidden = state.categories.length > 0;
  }

  function selectCat(id) {
    if (state.active && state.active.categoryId !== id) {
      commit(true);
      state.selectedId = id;
      applyAccent();
      start();
      toast(tr('toast.switched', { name: byId(id).name }));
      return;
    }
    state.selectedId = id;
    save();
    applyAccent();
    renderRail();
    renderDial();
  }

  function applyAccent() {
    var c = byId(state.active ? state.active.categoryId : state.selectedId);
    var root = document.documentElement;
    var col = c ? c.color : '#3ddc84';
    root.style.setProperty('--dial-c1', col);
    root.style.setProperty('--dial-c2', lighten(col, 0.28));
  }

  function lighten(hex, amt) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    var ch = [1, 2, 3].map(function (i) {
      var v = parseInt(m[i], 16);
      return Math.round(v + (255 - v) * amt);
    });
    return '#' + ch.map(function (v) { return pad2hex(v); }).join('');
  }
  function pad2hex(v) { var s = v.toString(16); return s.length < 2 ? '0' + s : s; }

  var TICKS = 60, R = 140, CIRC = 2 * Math.PI * R;

  function buildTicks() {
    var g = $('ticks');
    var ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < TICKS; i++) {
      var major = i % 5 === 0;
      var a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
      var r1 = 152, r2 = major ? 160 : 157;
      var ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', (180 + Math.cos(a) * r1).toFixed(2));
      ln.setAttribute('y1', (180 + Math.sin(a) * r1).toFixed(2));
      ln.setAttribute('x2', (180 + Math.cos(a) * r2).toFixed(2));
      ln.setAttribute('y2', (180 + Math.sin(a) * r2).toFixed(2));
      if (major) ln.setAttribute('class', 'is-major');
      g.appendChild(ln);
    }
  }

  function renderDial() {
    var running = isRunning();
    var paused = !!(state.active && !state.active.segmentStart);
    var ms = activeElapsed();
    var cat = byId(state.active ? state.active.categoryId : state.selectedId);
    var dial = $('dial');

    dial.classList.toggle('is-running', running);
    dial.disabled = !cat;

    var total = Math.floor(ms / 1000);
    $('tH').textContent = pad(Math.floor(total / 3600));
    $('tM').textContent = pad(Math.floor((total % 3600) / 60));
    $('tS').textContent = pad(total % 60);
    $('timeDisplay').classList.toggle('is-zero', ms === 0);

    $('dialCatName').textContent = cat ? cat.name : tr('dial.pickCat');
    $('dialCatDot').style.background = cat ? cat.color : 'var(--ink-tertiary)';

    $('dialHint').textContent = !cat ? tr('dial.hintNoCat')
      : tr(running ? 'dial.hintPause'
         : state.active ? 'dial.hintResume' : 'dial.hintStart');

    var st = $('status');
    st.dataset.state = running ? 'running' : (paused ? 'paused' : 'idle');
    $('statusText').textContent = tr(running ? 'status.running' : (paused ? 'status.paused' : 'status.ready'));

    var target = state.targetMin * 60000;
    var progress = target > 0
      ? Math.min(1, ms / target)
      : (state.active ? (ms % 60000) / 60000 : 0);
    $('arc').style.strokeDashoffset = String(CIRC * (1 - progress));

    var head = $('arcHead');
    if (state.active && progress > 0.002) {
      var ang = progress * Math.PI * 2 - Math.PI / 2;
      head.setAttribute('cx', (180 + Math.cos(ang) * R).toFixed(2));
      head.setAttribute('cy', (180 + Math.sin(ang) * R).toFixed(2));
      head.setAttribute('opacity', '1');
    } else {
      head.setAttribute('opacity', '0');
    }

    var lit = Math.round(progress * TICKS);
    var lines = $('ticks').childNodes;
    for (var i = 0; i < lines.length; i++) {
      var on = state.active && i < lit;
      lines[i].classList.toggle('is-lit', !!on);
    }

    $('playBtn').disabled = !cat;
    $('playLabel').textContent = tr(running ? 'btn.pause' : (state.active ? 'btn.resume' : 'btn.start'));
    $('playIcon').innerHTML = running
      ? '<svg viewBox="0 0 16 16" width="11" height="11"><rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" width="11" height="11"><path d="M5 3.4v9.2a.7.7 0 001.07.6l7-4.6a.7.7 0 000-1.2l-7-4.6A.7.7 0 005 3.4z" fill="currentColor"/></svg>';
    $('stopBtn').disabled = !state.active;
    $('discardBtn').disabled = !state.active;

    var chips = $('targets').querySelectorAll('.chip');
    for (var j = 0; j < chips.length; j++) {
      chips[j].setAttribute('aria-pressed', String(Number(chips[j].dataset.target) === state.targetMin));
    }
  }

  function renderPanel() {
    var day = startOfDay(Date.now());
    var list = sessionsForDay(day);
    var t = totalsByCategory(list, day);

    $('dayTotal').innerHTML = fmtHMRich(t.total);
    $('daySessions').textContent = list.length;

    var longest = 0;
    list.forEach(function (s) { longest = Math.max(longest, s.duration || 0); });
    $('dayLongest').textContent = longest > 0 ? fmtHM(longest) : '-';

    var bar = $('dayBar');
    bar.innerHTML = '';
    t.rows.forEach(function (r) {
      var seg = el('span');
      seg.style.width = (t.total ? (r.ms / t.total) * 100 : 0) + '%';
      seg.style.background = r.color;
      bar.appendChild(seg);
    });
    if (!t.rows.length) { bar.innerHTML = '<span style="width:100%;background:var(--surface-3)"></span>'; }

    var split = $('splitList');
    split.innerHTML = '';
    $('splitEmpty').hidden = t.rows.length > 0;
    var max = t.rows.length ? t.rows[0].ms : 1;

    t.rows.forEach(function (r) {
      var row = el('div', 'srow');
      row.style.setProperty('--c', r.color);

      var name = el('div', 'srow__name');
      name.appendChild(el('i'));
      name.appendChild(el('span', null, r.name));

      var val = el('div', 'srow__val', fmtHM(r.ms));

      var track = el('div', 'srow__track');
      var fill = el('div', 'srow__fill');
      fill.style.width = ((r.ms / max) * 100).toFixed(1) + '%';
      track.appendChild(fill);

      var pct = el('div', 'srow__pct', tr('panel.dayShare', { pct: ((r.ms / t.total) * 100).toFixed(0) }));

      row.appendChild(name); row.appendChild(val);
      row.appendChild(track); row.appendChild(pct);
      split.appendChild(row);
    });

    var strip = $('dayStrip');
    strip.innerHTML = '';
    list.forEach(function (s) {
      var from = Math.max(s.start, day), to = Math.min(s.end, addDays(day, 1));
      if (to <= from) return;
      var c = byId(s.categoryId);
      var seg = el('div', 'strip__seg');
      seg.style.left = (((from - day) / DAY) * 100) + '%';
      seg.style.width = Math.max(0.4, ((to - from) / DAY) * 100) + '%';
      seg.style.background = c ? c.color : '#4f6057';
      strip.appendChild(seg);
    });
    var now = el('div', 'strip__now');
    now.style.left = (((Date.now() - day) / DAY) * 100) + '%';
    strip.appendChild(now);

    var recent = list.slice().sort(function (a, b) { return b.start - a.start; }).slice(0, 5);
    var rl = $('recentList');
    rl.innerHTML = '';
    $('recentLabel').hidden = recent.length === 0;
    recent.forEach(function (s) {
      var c = byId(s.categoryId);
      var row = el('div', 'rrow' + (s.live ? ' rrow--live' : ''));
      row.style.setProperty('--c', c ? c.color : '#4f6057');
      row.appendChild(el('i'));
      var n = el('div', 'rrow__n');
      n.appendChild(el('b', null, c ? c.name : tr('cat.deleted')));
      n.appendChild(el('span', null, fmtTime(s.start) + ' → ' + (s.live ? tr('log.now') : fmtTime(s.end))));
      row.appendChild(n);
      row.appendChild(el('div', 'rrow__d', fmtHM(s.duration || 0)));
      rl.appendChild(row);
    });
  }

  // Timer

  var reachedNotified = false;

  function start() {
    var cat = byId(state.selectedId);
    if (!cat) { toast(tr('toast.addCatFirst')); return; }
    var now = Date.now();
    if (!state.active) {
      state.active = { categoryId: cat.id, sessionStart: now, segmentStart: now, elapsed: 0 };
      reachedNotified = false;
    } else {
      state.active.segmentStart = now;
    }
    save(); applyAccent(); renderAll();
  }

  function pause() {
    if (!isRunning()) return;
    state.active.elapsed = activeElapsed();
    state.active.segmentStart = null;
    save(); renderAll();
  }

  function toggle() { isRunning() ? pause() : start(); }

  function commit(silent) {
    if (!state.active) return;
    var dur = activeElapsed();
    var a = state.active;
    state.active = null;
    if (dur >= 1000) {
      state.sessions.push({
        id: uid(), categoryId: a.categoryId,
        start: a.sessionStart, end: Date.now(), duration: dur
      });
      if (!silent) toast(tr('toast.saved', { time: fmtHM(dur), name: (byId(a.categoryId) || {}).name }));
    } else if (!silent) {
      toast(tr('toast.tooShort'));
    }
    state.selectedId = a.categoryId;
    save(); applyAccent(); renderAll();
  }

  function discard() {
    if (!state.active) return;
    state.selectedId = state.active.categoryId;
    state.active = null;
    save(); applyAccent(); renderAll();
    toast(tr('toast.discarded'));
  }

  // Co 250 ms dla płynnego łuku; reszta UI raz na sekundę. W ukrytej karcie
  // tylko pilnujemy celu.
  var lastPaintSec = -1;

  function tick() {
    if (state.active && state.targetMin > 0 && !reachedNotified &&
        activeElapsed() >= state.targetMin * 60000) {
      reachedNotified = true;
      toast(tr('toast.targetHit', { min: state.targetMin }));
      if (!document.hidden) flash();
    }

    if (document.hidden) return;

    if (state.active) renderDial();

    var sec = Math.floor(Date.now() / 1000);
    if (sec === lastPaintSec) return;
    lastPaintSec = sec;

    // przebudowa DOM przy wciśniętym przycisku myszy gubi kliknięcie
    if (state.active && !ui.holding) {
      renderPanel();
      renderRail();
      if (!$('statsOverlay').hidden) renderStats();
    }
    $('wallClock').textContent = new Date().toLocaleTimeString(loc());
  }

  function flash() {
    var d = $('dial');
    d.animate(
      [{ filter: 'brightness(1)' }, { filter: 'brightness(1.55)' }, { filter: 'brightness(1)' }],
      { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
  }

  // na wypadek zamknięcia karty bez pagehide
  setInterval(function () { if (state.active) save(); }, 5000);

  // Agent lokalny - aktywne okno

  var AGENT = {
    // agent wbudowany w chronos.py albo osobny agent.cmd na :8900
    urls: ['/agent/now', 'http://127.0.0.1:8900/now'],
    probe: 0,           // indeks w urls, dopóki żaden nie odpowie
    url: null,
    on: false,
    seen: false,        // odpowiedział choć raz w tej sesji
    data: null,         // { title, app, idle }
    matchId: null,
    matchSince: 0,      // do debounce, patrz SWITCH_DELAY
    misses: 0
  };

  var SWITCH_DELAY = 5000;   // tyle okno musi być na wierzchu, żeby przełączyć kategorię

  var CLS = window.CHRONOS_CLASSIFY || null;

  // Agent zwraca okno z każdego ekranu (screens). Czas należy do okna na
  // wierzchu, pozostałe ekrany liczą się przy spotkaniu albo gdy okno na
  // wierzchu jest neutralne. Starszy agent nie wysyła screens.

  function screensOf(d) {
    if (!d) return [];
    if (d.screens && d.screens.length) return d.screens;
    return [{ title: d.title, app: d.app, fg: true, screen: 0 }];
  }

  // pierwszy nieneutralny werdykt z ekranów w tle
  function sideVerdict(d) {
    if (!CLS) return null;
    var list = screensOf(d);
    for (var i = 0; i < list.length; i++) {
      if (list[i].fg) continue;
      var c = CLS.classify(list[i].app, list[i].title);
      if (c && c.kind !== 'neutral') { c.win = list[i]; return c; }
    }
    return null;
  }

  function classifyWindow(d) {
    if (!d || !CLS) return null;
    var cls = CLS.classify(d.app, d.title);
    if (!cls) return null;

    if (cls.kind === 'neutral') {
      var side = sideVerdict(d);
      if (side) {
        cls.kind = side.kind;
        cls.short = side.short;
        cls.side = side.site || side.appName;
        cls.sideWin = side.win;
        cls.why = 'drugi ekran: ' + cls.side;
      }
    }
    return cls;
  }

  // Spotkanie wydłuża próg, chyba że ekran jest zablokowany.
  function offlineLimit(d) {
    if (d && /lockapp\.exe/i.test(d.app || '')) return OFFLINE_AFTER;
    return meetingOf(d) ? MEETING_OFFLINE_AFTER : OFFLINE_AFTER;
  }

  function meetingOf(d) {
    if (!d || !CLS || typeof CLS.meeting !== 'function') return null;
    var list = screensOf(d);
    for (var i = 0; i < list.length; i++) {
      var m = CLS.meeting(list[i].app, list[i].title);
      if (m) return m;
    }
    return null;
  }

  function ruleMatch(d) {
    var hay = ((d.app || '') + '   ' + (d.title || '')).toLowerCase();
    for (var i = 0; i < state.categories.length; i++) {
      var c = state.categories[i];
      var rules = c.rules || [];
      for (var j = 0; j < rules.length; j++) {
        var r = String(rules[j]).trim().toLowerCase();
        if (r && hay.indexOf(r) !== -1) return c;
      }
    }
    return null;
  }

  function categoryByKind(kind) {
    for (var i = 0; i < state.categories.length; i++) {
      if ((state.categories[i].kind || 'work') === kind) return state.categories[i];
    }
    return null;
  }

  function matchCategory(d) {
    if (!d) return null;
    var byRule = ruleMatch(d);
    if (byRule) return byRule;
    var cls = classifyWindow(d);
    if (!cls || cls.kind === 'neutral') return null;
    // werdykt z drugiego ekranu: reguły sprawdzamy też na tamtym oknie
    var sideRule = cls.sideWin ? ruleMatch(cls.sideWin) : null;
    return sideRule || categoryByKind(cls.kind);
  }

  // Dziennik aktywności

  var seg = null;   // bieżący odcinek: { key, s, e, meta }

  function flushSegment(endAt) {
    if (!seg) return;
    var end = endAt || seg.e;
    if (end - seg.s >= MIN_SEGMENT) {
      var m = seg.meta;
      state.activity.push({
        s: seg.s, e: end,
        app: m.app, appName: m.appName, group: m.group,
        tab: m.tab, kind: m.kind, why: m.why, catId: m.catId,
        short: m.short ? 1 : 0
      });
    }
    seg = null;
  }

  function recordActivity(d) {
    var now = Date.now();
    var idle = Number(d.idle || 0);

    if (idle >= offlineLimit(d)) {
      // bezczynność zaczęła się idle sekund temu - tam tniemy odcinek
      var cut = now - idle * 1000;
      if (seg && seg.key !== '__offline') flushSegment(cut);
      if (!seg) {
        seg = {
          key: '__offline', s: cut, e: now,
          meta: { app: '', appName: 'Offline', group: 'Offline', tab: tr('kind.noActivity'),
                  kind: 'offline', why: tr('kind.offlineWhy'), catId: null }
        };
      }
      seg.e = now;
      return;
    }

    var cls = classifyWindow(d);
    if (!cls) return;

    // Kolejność: reguła lub klasyfikator, potem trwająca sesja (neutralne
    // okno w trakcie pracy to nadal praca), na końcu nieprzypisane.
    var matched = matchCategory(d);
    var catId = matched ? matched.id
      : (state.active ? state.active.categoryId : null);

    var key = cls.group + ' | ' + cls.tab;
    if (seg && seg.key === key) { seg.e = now; seg.meta.catId = catId; return; }

    flushSegment(now);
    seg = {
      key: key, s: now, e: now,
      meta: {
        app: cls.app, appName: cls.appName, group: cls.group, tab: cls.tab,
        kind: cls.kind, why: cls.why, catId: catId, short: cls.short ? 1 : 0
      }
    };
  }

  // offline pauzuje pomiar i odejmuje czas bezczynności
  function handleOffline(idle, limit) {
    var offline = idle >= (limit || OFFLINE_AFTER);

    if (offline && isRunning()) {
      var trimmed = Math.min(activeElapsed(), idle * 1000);
      state.active.elapsed = Math.max(0, activeElapsed() - trimmed);
      state.active.segmentStart = null;
      state.active.autoPaused = true;
      save(); renderAll();
      toast(tr('toast.offlineCut', { time: fmtHM(trimmed) }));
      return;
    }

    if (!offline && state.active && state.active.autoPaused && !state.active.segmentStart) {
      state.active.segmentStart = Date.now();
      state.active.autoPaused = false;
      save(); renderAll();
      toast(tr('toast.back'));
    }
  }

  // Bez agenta odpytujemy coraz rzadziej, żeby nie zaśmiecać konsoli.
  function scheduleAgent() {
    if (AGENT.host && AGENT.timer) {
      try { AGENT.host.clearTimeout(AGENT.timer); } catch (e) {}
    }
    var delay = AGENT.on ? 1500
      : (AGENT.misses <= 3 ? 4000 : (AGENT.misses <= 10 ? 15000 : 60000));
    // timery okna PiP nie są dławione, więc odliczamy w nim, gdy jest otwarte
    AGENT.host = (mini.win && !mini.win.closed) ? mini.win : window;
    AGENT.timer = AGENT.host.setTimeout(pollAgent, delay);
  }

  function pollAgent() {
    if (typeof fetch !== 'function') return;

    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 1500);

    var target = AGENT.url || AGENT.urls[AGENT.probe % AGENT.urls.length];

    fetch(target, ctrl ? { signal: ctrl.signal, cache: 'no-store' } : { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http')); })
      .then(function (d) {
        clearTimeout(killer);
        scheduleAgent();
        if (!d || d.ok === false) { throw new Error('agent nieaktywny'); }
        AGENT.url = target;
        AGENT.on = true; AGENT.misses = 0; AGENT.data = d;
        if (!AGENT.seen) { AGENT.seen = true; toast(tr('toast.agentOn')); }
        var limit = offlineLimit(d);
        recordActivity(d);
        handleOffline(Number(d.idle || 0), limit);
        if (Number(d.idle || 0) < limit) applyAutoSwitch(matchCategory(d));
        AGENT.dirty = (AGENT.dirty || 0) + 1;
        if (AGENT.dirty >= 4) { AGENT.dirty = 0; save(); }    // dziennik na dysk co ~6 s
        renderMonitor();
        if (!$('statsOverlay').hidden && !ui.holding) renderStats();
      })
      .catch(function () {
        clearTimeout(killer);
        scheduleAgent();
        AGENT.misses++;
        AGENT.url = null;
        AGENT.probe++;
        if (AGENT.misses >= 2 && AGENT.on) {
          AGENT.on = false; AGENT.data = null;
          AGENT.matchId = null; AGENT.matchSince = 0;
          flushSegment(Date.now());
          save();
          toast(tr('toast.agentOff'));
        }
        renderMonitor();
      });
  }

  function applyAutoSwitch(cat) {
    var id = cat ? cat.id : null;
    if (id !== AGENT.matchId) { AGENT.matchId = id; AGENT.matchSince = Date.now(); }

    if (!state.autoSwitch || !cat) return;
    if (!isRunning()) return;                                  // sami nie startujemy pomiaru
    if (state.active.categoryId === cat.id) return;
    if (Date.now() - AGENT.matchSince < SWITCH_DELAY) return;   // krótki alt-tab nie tnie sesji

    AGENT.matchSince = Date.now();
    var from = byId(state.active.categoryId);
    commit(true);
    state.selectedId = cat.id;
    applyAccent();
    start();
    toast(tr('toast.autoSwitch', { from: from ? from.name + ' → ' : '', name: cat.name }));
  }

  // Pokazujemy pozostałe ekrany, bo wpływają na klasyfikację.
  function renderScreens(d) {
    var box = $('monScreens');
    if (!box) return;
    var list = (d && d.screens) || [];
    box.innerHTML = '';
    if (list.length < 2) { box.hidden = true; return; }

    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (s.fg) continue;
      var cls = CLS ? CLS.classify(s.app, s.title) : null;
      var chip = el('span', 'mon__screen');
      chip.dataset.kind = cls ? cls.kind : 'neutral';
      chip.appendChild(el('i', 'mon__screen-n', String((s.screen || 0) + 1)));
      chip.appendChild(el('span', null,
        label((cls && (cls.site || cls.appName)) || s.app) || tr('mon.window')));
      chip.title = s.title || '';
      box.appendChild(chip);
    }
    box.hidden = !box.firstChild;
  }

  function renderMonitor() {
    var chip = $('monitorChip');
    var strip = $('monitorStrip');
    var toggle = $('autoToggle');

    chip.dataset.state = AGENT.on ? 'on' : (AGENT.seen ? 'lost' : 'off');
    $('monitorChipText').textContent = tr(AGENT.on ? 'monitor.on' : 'monitor.off');
    chip.hidden = !AGENT.seen && !AGENT.on;

    toggle.setAttribute('aria-pressed', String(state.autoSwitch));
    toggle.textContent = tr(state.autoSwitch ? 'auto.on' : 'auto.off');

    if (!AGENT.on || !AGENT.data) { strip.hidden = true; return; }
    strip.hidden = false;

    var d = AGENT.data;
    $('monApp').textContent = d.app || tr('mon.unknownApp');
    $('monTitle').textContent = d.title || tr('mon.noTitle');
    renderScreens(d);

    var cat = matchCategory(d);
    var tgt = $('monMatch');
    tgt.innerHTML = '';
    if (cat) {
      var dot = el('span', 'mon__dot');
      dot.style.background = cat.color;
      tgt.appendChild(dot);
      tgt.appendChild(el('span', null, cat.name));
      tgt.dataset.state = 'match';
    } else {
      tgt.dataset.state = 'none';
      tgt.appendChild(el('span', null, tr('mon.noRule')));
    }

    var idle = Number(d.idle || 0);
    var meet = offlineLimit(d) > OFFLINE_AFTER ? meetingOf(d) : null;
    var idleEl = $('monIdle');
    if (meet && idle >= OFFLINE_AFTER) {
      idleEl.textContent = tr('mon.meetingIdle', { name: label(meet) });
      idleEl.dataset.meet = '1';
    } else {
      idleEl.textContent = idle >= 60 ? tr('mon.idle', { min: Math.floor(idle / 60) }) : '';
      idleEl.dataset.meet = '0';
    }
  }

  // Mini-okno (Document Picture-in-Picture), wspólny stan z głównym oknem

  var mini = { win: null, els: {}, timer: null };

  function miniSupported() {
    return typeof window.documentPictureInPicture !== 'undefined';
  }

  function toggleMini() {
    if (mini.win && !mini.win.closed) { closeMini(); return; }
    openMini();
  }

  function openMini() {
    if (!miniSupported()) {
      toast(tr('toast.miniNeeds'));
      return;
    }
    window.documentPictureInPicture
      .requestWindow({ width: 340, height: 148, disallowReturnToOpener: false })
      .then(buildMini)
      .catch(function () { toast(tr('toast.miniFailed')); });
  }

  function closeMini() {
    if (mini.win && !mini.win.closed) mini.win.close();
    teardownMini();
  }

  function teardownMini() {
    if (rain.mini) { try { rain.mini.stop(); } catch (e) {} rain.mini = null; }
    if (mini.timer && mini.win) { try { mini.win.clearInterval(mini.timer); } catch (e) {} }
    mini.win = null; mini.els = {}; mini.timer = null;
    var b = $('miniBtn');
    if (b) b.setAttribute('aria-pressed', 'false');
    scheduleAgent();
    renderDial();
  }

  function buildMini(w) {
    mini.win = w;
    var d = w.document;
    d.documentElement.lang = I18N ? I18N.get() : 'pl';

    var title = d.createElement('title');
    title.textContent = 'CHRONOS';
    d.head.appendChild(title);

    // PiP to osobny dokument, style trzeba dołączyć
    var fonts = d.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = new URL('fonts/fonts.css', location.href).href;
    var css = d.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('styles.css', location.href).href;
    d.head.appendChild(fonts);
    d.head.appendChild(css);

    d.body.className = 'mini';
    d.body.innerHTML =
      '<div class="mini__row">' +
        '<span class="mini__cat"><i id="mCatDot"></i><span id="mCat">-</span></span>' +
        '<button class="mini__link" id="mExpand" type="button">' + tr('mini.expand') + '</button>' +
      '</div>' +
      '<div class="mini__row mini__row--main">' +
        '<span class="mini__time mono" id="mTime">00:00:00</span>' +
        '<button class="mini__btn" id="mToggle" type="button" aria-label="' + tr('dial.aria') + '"></button>' +
      '</div>' +
      '<div class="mini__foot">' +
        '<span class="mini__win" id="mWin"></span>' +
        '<span class="mini__day mono" id="mDay"></span>' +
      '</div>';

    mini.els = {
      cat: d.getElementById('mCat'),
      dot: d.getElementById('mCatDot'),
      time: d.getElementById('mTime'),
      toggle: d.getElementById('mToggle'),
      win: d.getElementById('mWin'),
      day: d.getElementById('mDay')
    };

    mini.els.toggle.addEventListener('click', function () { toggle(); renderMini(); });
    d.getElementById('mExpand').addEventListener('click', function () {
      try { window.focus(); } catch (e) {}
      closeMini();
    });
    d.addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); toggle(); renderMini(); }
    });

    if (window.CHRONOS_RAIN) {
      rain.mini = window.CHRONOS_RAIN.mount(w, { into: d.body, size: 11, step: 90 });
    }

    mini.timer = w.setInterval(renderMini, 500);
    w.addEventListener('pagehide', teardownMini);

    var b = $('miniBtn');
    if (b) b.setAttribute('aria-pressed', 'true');

    scheduleAgent();
    renderMini();
    renderDial();
  }

  var miniLast = '';

  function renderMini() {
    if (!mini.win || mini.win.closed || !mini.els.time) return;

    // Wołane co 500 ms przez cały dzień - bez zmian wychodzimy od razu.
    var stamp = Math.floor(activeElapsed() / 1000) + '|' + isRunning() + '|' +
      (state.active ? state.active.categoryId : state.selectedId) + '|' +
      (AGENT.on && AGENT.data ? AGENT.data.app + AGENT.data.title + AGENT.data.idle : '-');
    if (stamp === miniLast) return;
    miniLast = stamp;

    var running = isRunning();
    var cat = byId(state.active ? state.active.categoryId : state.selectedId);
    var ms = activeElapsed();
    var total = Math.floor(ms / 1000);

    var root = mini.win.document.documentElement;
    var col = cat ? cat.color : '#3ddc84';
    root.style.setProperty('--dial-c1', col);
    root.style.setProperty('--dial-c2', lighten(col, 0.28));

    mini.els.cat.textContent = cat ? cat.name : tr('dial.pickCat');
    mini.els.dot.style.background = col;
    mini.els.time.textContent =
      pad(Math.floor(total / 3600)) + ':' + pad(Math.floor((total % 3600) / 60)) + ':' + pad(total % 60);

    mini.win.document.body.dataset.state = running ? 'running' : (state.active ? 'paused' : 'idle');
    mini.els.toggle.innerHTML = running
      ? '<svg viewBox="0 0 16 16" width="12" height="12"><rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M5 3.4v9.2a.7.7 0 001.07.6l7-4.6a.7.7 0 000-1.2l-7-4.6A.7.7 0 005 3.4z" fill="currentColor"/></svg>';

    var day = startOfDay(Date.now());
    mini.els.day.textContent = fmtHM(totalsByCategory(sessionsForDay(day), day).total) + ' ' + tr('panel.today.short');

    if (AGENT.on && AGENT.data) {
      var idle = Number(AGENT.data.idle || 0);
      var meet = offlineLimit(AGENT.data) > OFFLINE_AFTER ? meetingOf(AGENT.data) : null;
      if (idle >= offlineLimit(AGENT.data)) {
        mini.els.win.textContent = tr('kind.offline') + ' - ' + tr('kind.noActivity');
        mini.els.win.dataset.off = '1';
      } else if (meet && idle >= OFFLINE_AFTER) {
        mini.els.win.textContent = tr('mon.listening', { name: label(meet) });
        mini.els.win.dataset.off = '0';
      } else {
        var cls = classifyWindow(AGENT.data);
        mini.els.win.textContent = cls ? label(cls.group) : '';
        mini.els.win.dataset.off = '0';
      }
    } else {
      mini.els.win.textContent = '';
      mini.els.win.dataset.off = '0';
    }
  }

  // Statystyki

  // odcinki przycięte do doby, łącznie z bieżącym
  function activityForDay(day) {
    var from = day, to = addDays(day, 1), out = [];
    function push(a) {
      var s0 = Math.max(a.s, from), e0 = Math.min(a.e, to);
      if (e0 - s0 <= 0) return;
      out.push({
        s: s0, e: e0, ms: e0 - s0,
        app: a.app, appName: a.appName, group: a.group, tab: a.tab,
        kind: a.kind, why: a.why, catId: a.catId, short: a.short ? 1 : 0
      });
    }
    for (var i = 0; i < state.activity.length; i++) push(state.activity[i]);
    if (seg && seg.e - seg.s >= 1000) {
      push({ s: seg.s, e: seg.e, app: seg.meta.app, appName: seg.meta.appName,
             group: seg.meta.group, tab: seg.meta.tab, kind: seg.meta.kind,
             why: seg.meta.why, catId: seg.meta.catId, short: seg.meta.short });
    }
    out.sort(function (a, b) { return a.s - b.s; });
    applyShortGrace(out);
    return out;
  }

  // Przy odczycie, nie przy zapisie - próg zawsze odpowiada bieżącej sumie
  // dnia i działa też na starej historii.
  function applyShortGrace(list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) if (list[i].short) total += list[i].ms;
    if (total === 0 || total > SHORT_GRACE) return;

    for (i = 0; i < list.length; i++) {
      if (!list[i].short) continue;
      list[i].kind = 'neutral';
      list[i].why = tr('grace.why', { time: fmtHM(SHORT_GRACE) });
    }
  }

  // Wynik 0-100: skupienie (55, praca vs rozrywka), wolumen (25, praca vs
  // cel dnia), ciągłość (20, średni blok pracy). Offline się nie liczy.

  function scoreForDay(day) {
    var list = activityForDay(day);
    var work = 0, chill = 0, neutral = 0, offline = 0;

    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a.kind === 'work') work += a.ms;
      else if (a.kind === 'chill') chill += a.ms;
      else if (a.kind === 'offline') offline += a.ms;
      else neutral += a.ms;
    }

    var hasAgent = list.length > 0;

    // bez agenta: z ręcznych sesji i typu kategorii
    if (!hasAgent) {
      var sess = sessionsForDay(day);
      for (var j = 0; j < sess.length; j++) {
        var c = byId(sess[j].categoryId);
        var ms = durationInRange(sess[j], day, addDays(day, 1));
        var k = c ? (c.kind || 'work') : 'neutral';
        if (k === 'work') work += ms;
        else if (k === 'chill') chill += ms;
        else neutral += ms;
      }
    }

    var active = work + chill + neutral;

    var focusBase = work + chill;
    var A = focusBase > 0 ? 55 * (work / focusBase) : 0;
    var B = 25 * Math.min(1, work / DAILY_GOAL_MS);

    // bloki pracy: sklejamy, gdy przerwa krótsza niż 2 minuty
    var blocks = 0, blockEnd = 0;
    for (var q = 0; q < list.length; q++) {
      if (list[q].kind !== 'work') continue;
      if (list[q].s - blockEnd > 120000) blocks++;
      blockEnd = Math.max(blockEnd, list[q].e);
    }
    if (!hasAgent && work > 0) blocks = Math.max(1, sessionsForDay(day).length);
    var avgBlock = blocks > 0 ? work / blocks : 0;
    var C = 20 * Math.min(1, avgBlock / (30 * 60000));

    var total = Math.round(A + B + C);
    var label = total >= 85 ? 'score.great'
      : total >= 70 ? 'score.veryGood'
      : total >= 50 ? 'score.solid'
      : total >= 25 ? 'score.scattered'
      : 'score.easy';

    return {
      score: total, label: label, hasAgent: hasAgent,
      work: work, chill: chill, neutral: neutral, offline: offline, active: active,
      A: A, B: B, C: C, avgBlock: avgBlock, blocks: blocks
    };
  }

  function renderScore(day) {
    var r = scoreForDay(day);
    // procenty łącznie z offline, żeby sumowały się do 100
    var zarejestrowany = r.active + r.offline;
    var pct = function (ms) { return zarejestrowany > 0 ? Math.round((ms / zarejestrowany) * 100) : 0; };

    $('scoreValue').textContent = r.score;
    $('scoreLabel').textContent = tr(r.label);
    $('scoreSource').textContent = tr(r.hasAgent ? 'score.fromWindows' : 'score.fromManual');

    var ring = $('scoreRing');
    var circ = 2 * Math.PI * 52;
    ring.style.strokeDasharray = circ.toFixed(2);
    ring.style.strokeDashoffset = (circ * (1 - r.score / 100)).toFixed(2);
    ring.setAttribute('stroke',
      r.score >= 70 ? '#a6ffcd' : (r.score >= 50 ? '#3ddc84' : (r.score >= 25 ? '#ffb454' : '#fb7185')));

    var mix = [
      { k: tr('kind.work'),    ms: r.work,    c: '#3ddc84' },
      { k: tr('kind.chill'),   ms: r.chill,   c: '#ffb454' },
      { k: tr('kind.neutral'), ms: r.neutral, c: '#7c8cff' },
      { k: tr('kind.offline'), ms: r.offline, c: '#4f6057' }
    ];
    var bar = $('scoreMix');
    var mixList = $('scoreMixList');
    bar.innerHTML = '';
    mixList.innerHTML = '';
    mix.forEach(function (m) {
      var piece = el('span');
      piece.style.width = pct(m.ms) + '%';
      piece.style.background = m.c;
      piece.title = m.k + ' - ' + fmtHM(m.ms);
      bar.appendChild(piece);

      var li = el('li');
      li.style.setProperty('--c', m.c);
      li.appendChild(el('i'));
      li.appendChild(el('span', 'l-name', m.k));
      li.appendChild(el('span', 'l-pct', pct(m.ms) + '%'));
      li.appendChild(el('span', 'l-val', fmtHM(m.ms)));
      mixList.appendChild(li);
    });
    if (zarejestrowany === 0) bar.innerHTML = '<span style="width:100%;background:var(--surface-3)"></span>';

    var comps = [
      { n: tr('score.focus'),  v: r.A, max: 55, d: tr('score.focusHint') },
      { n: tr('score.volume'), v: r.B, max: 25,
        d: tr('score.volumeHint', { done: fmtHM(r.work), goal: fmtHM(DAILY_GOAL_MS) }) },
      { n: tr('score.streak'), v: r.C, max: 20,
        d: r.blocks ? tr('score.streakHint', { time: fmtHM(r.avgBlock) }) : tr('score.noBlocks') }
    ];
    var host = $('scoreComps');
    host.innerHTML = '';
    comps.forEach(function (c) {
      var row = el('div', 'comp');
      var head = el('div', 'comp__head');
      head.appendChild(el('span', 'comp__n', c.n));
      head.appendChild(el('span', 'comp__v', Math.round(c.v) + '/' + c.max));
      var track = el('div', 'comp__track');
      var fill = el('div', 'comp__fill');
      fill.style.width = ((c.v / c.max) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      row.appendChild(head);
      row.appendChild(track);
      row.appendChild(el('div', 'comp__d', c.d));
      host.appendChild(row);
    });

    $('offlineNote').textContent = r.offline > 0
      ? tr('score.offline', { pct: pct(r.offline), time: fmtHM(r.offline) })
      : '';
  }

  // rozbicie kategorii na aplikacje i karty

  function drillBuckets(day) {
    var list = activityForDay(day);
    var buckets = [], index = {};

    function bucket(id, name, color) {
      if (!index[id]) {
        index[id] = { id: id, name: name, color: color, ms: 0, groups: {} };
        buckets.push(index[id]);
      }
      return index[id];
    }

    for (var i = 0; i < list.length; i++) {
      var a = list[i], b;
      if (a.kind === 'offline') b = bucket('__offline', tr('kind.offline'), '#4f6057');
      else if (a.catId && byId(a.catId)) {
        var c = byId(a.catId);
        b = bucket(c.id, c.name, c.color);
      } else b = bucket('__none', tr('kind.unassigned'), '#7c8cff');

      b.ms += a.ms;
      var g = b.groups[a.group] || (b.groups[a.group] = { name: a.group, ms: 0, tabs: {} });
      g.ms += a.ms;
      var t = g.tabs[a.tab] || (g.tabs[a.tab] = { name: a.tab, ms: 0 });
      t.ms += a.ms;
    }

    buckets.sort(function (x, y) { return y.ms - x.ms; });
    return buckets;
  }

  // "app.js - timer - Visual Studio Code" -> "app.js - timer"
  function shortTab(tab, group) {
    var t = String(tab || '').trim();
    var g = String(group || '').trim();
    if (!g) return t;
    var tail = t.slice(-(g.length + 3)).toLowerCase();
    if (tail.indexOf(g.toLowerCase()) !== -1) {
      var cut = t.toLowerCase().lastIndexOf(g.toLowerCase());
      if (cut > 0) t = t.slice(0, cut).replace(/[\s\-\u2014\u2013|·]+$/, '').trim();
    }
    return t || tab;
  }

  function renderDrill(day) {
    var buckets = drillBuckets(day);
    var tabs = $('drillTabs'), body = $('drillBody'), empty = $('drillEmpty');

    tabs.innerHTML = '';
    body.innerHTML = '';

    if (!buckets.length) {
      empty.hidden = false;
      tabs.hidden = true;
      return;
    }
    empty.hidden = true;
    tabs.hidden = false;

    var suma = 0;
    for (var q = 0; q < buckets.length; q++) suma += buckets[q].ms;

    var known = false;
    for (var b0 = 0; b0 < buckets.length; b0++) {
      if (buckets[b0].id === ui.drillId) known = true;
    }
    if (!known) ui.drillId = buckets[0].id;

    buckets.forEach(function (b) {
      var btn = el('button', 'dtab');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(b.id === ui.drillId));
      btn.style.setProperty('--c', b.color);
      btn.appendChild(el('i'));
      btn.appendChild(el('span', 'dtab__n', b.name));
      btn.appendChild(el('span', 'dtab__v', fmtHM(b.ms)));
      btn.appendChild(el('span', 'dtab__p', suma > 0 ? Math.round((b.ms / suma) * 100) + '%' : '0%'));
      btn.addEventListener('click', function () { ui.drillId = b.id; renderDrill(day); });
      tabs.appendChild(btn);
    });

    var cur = null;
    for (var i = 0; i < buckets.length; i++) {
      if (buckets[i].id === ui.drillId) cur = buckets[i];
    }
    if (!cur) return;

    var lead = el('div', 'drill__lead');
    lead.appendChild(el('span', 'drill__name', cur.name));
    lead.appendChild(el('span', 'drill__sum',
      fmtHM(cur.ms) + ' · ' + tr('drill.share', { pct: suma > 0 ? Math.round((cur.ms / suma) * 100) : 0 })));
    body.appendChild(lead);

    var groups = [];
    for (var k in cur.groups) {
      if (Object.prototype.hasOwnProperty.call(cur.groups, k)) groups.push(cur.groups[k]);
    }
    groups.sort(function (a, b) { return b.ms - a.ms; });
    var max = groups.length ? groups[0].ms : 1;

    groups.forEach(function (g) {
      var row = el('div', 'grow');
      row.style.setProperty('--c', cur.color);

      var head = el('div', 'grow__head');
      head.appendChild(el('span', 'grow__n', label(g.name)));
      var gp = cur.ms > 0 ? Math.round((g.ms / cur.ms) * 100) : 0;
      head.appendChild(el('span', 'grow__pct', gp + '%'));
      head.appendChild(el('span', 'grow__v', fmtHM(g.ms)));
      row.appendChild(head);

      var track = el('div', 'grow__track');
      var fill = el('div', 'grow__fill');
      fill.style.width = ((g.ms / max) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      row.appendChild(track);

      var arr = [];
      for (var t in g.tabs) {
        if (Object.prototype.hasOwnProperty.call(g.tabs, t)) arr.push(g.tabs[t]);
      }
      arr.sort(function (a, b) { return b.ms - a.ms; });

      var sub = el('div', 'grow__sub');
      arr.slice(0, 5).forEach(function (t) {
        var line = el('div', 'sline');
        line.appendChild(el('span', 'sline__n', label(shortTab(t.name, g.name)) || '-'));
        var tp = cur.ms > 0 ? Math.round((t.ms / cur.ms) * 100) : 0;
        line.appendChild(el('span', 'sline__pct', tp + '%'));
        line.appendChild(el('span', 'sline__v', fmtHM(t.ms)));
        sub.appendChild(line);
      });
      if (arr.length > 5) {
        sub.appendChild(el('div', 'sline sline--more', tr('drill.more', { n: arr.length - 5 })));
      }
      row.appendChild(sub);
      body.appendChild(row);
    });
  }

  // Widok miesięczny

  function monthSummary(monthStart) {
    var count = daysInMonth(monthStart);
    var dni = [], sum = { work: 0, chill: 0, neutral: 0, offline: 0 };
    var scored = 0, scoreSum = 0, best = null;
    var today = startOfDay(Date.now());

    for (var i = 0; i < count; i++) {
      var day = startOfDay(monthStart + i * DAY + 3 * 3600000);   // +3h chroni przed zmianą czasu
      var r = scoreForDay(day);
      var zarej = r.active + r.offline;

      sum.work += r.work; sum.chill += r.chill;
      sum.neutral += r.neutral; sum.offline += r.offline;

      if (zarej > 0) {
        scored++; scoreSum += r.score;
        if (!best || r.score > best.score) best = { day: day, score: r.score };
      }
      dni.push({
        day: day, nr: i + 1, wd: weekday(day),
        przyszly: day > today, dzis: day === today,
        zarej: zarej, work: r.work, chill: r.chill,
        neutral: r.neutral, offline: r.offline, score: r.score
      });
    }

    return {
      dni: dni, sum: sum, scored: scored,
      avg: scored ? Math.round(scoreSum / scored) : 0,
      best: best,
      total: sum.work + sum.chill + sum.neutral + sum.offline
    };
  }

  function scoreColor(v) {
    return v >= 70 ? '#a6ffcd' : (v >= 50 ? '#3ddc84' : (v >= 25 ? '#ffb454' : '#fb7185'));
  }

  function renderMonth() {
    var m = monthSummary(ui.statsMonth);

    $('mkTotal').textContent = fmtHM(m.total);
    $('mkWork').textContent = fmtHM(m.sum.work);
    $('mkScore').textContent = m.scored ? m.avg : '-';
    $('mkBest').textContent = m.best
      ? new Date(m.best.day).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) +
        ' · ' + m.best.score
      : '-';

    $('monthDays').textContent = m.scored ? tr('month.days', { n: m.scored }) : '';
    $('monthEmpty').hidden = m.total > 0;

    var cal = $('calendar');
    cal.innerHTML = '';
    var pad = m.dni.length ? m.dni[0].wd : 0;
    for (var p = 0; p < pad; p++) cal.appendChild(el('div', 'cell cell--pad'));

    m.dni.forEach(function (d) {
      var cell = el('button', 'cell');
      cell.type = 'button';
      cell.disabled = d.przyszly;
      if (d.dzis) cell.classList.add('is-today');
      if (d.zarej === 0) cell.classList.add('is-empty');

      var head = el('div', 'cell__head');
      head.appendChild(el('span', 'cell__nr', String(d.nr)));
      if (d.zarej > 0) {
        var badge = el('span', 'cell__score', String(d.score));
        badge.style.setProperty('--c', scoreColor(d.score));
        head.appendChild(badge);
      }
      cell.appendChild(head);

      if (d.zarej > 0) {
        cell.appendChild(el('div', 'cell__t', fmtHM(d.work)));
        var bar = el('div', 'cell__bar');
        [['#3ddc84', d.work], ['#ffb454', d.chill], ['#7c8cff', d.neutral], ['#4f6057', d.offline]]
          .forEach(function (pair) {
            if (pair[1] <= 0) return;
            var seg2 = el('i');
            seg2.style.width = ((pair[1] / d.zarej) * 100) + '%';
            seg2.style.background = pair[0];
            bar.appendChild(seg2);
          });
        cell.appendChild(bar);
        cell.title = tr('cal.cellTitle', { date: fmtDateLong(d.day), work: fmtHM(d.work), score: d.score });
      } else {
        cell.appendChild(el('div', 'cell__t cell__t--none', d.przyszly ? '' : '-'));
      }

      cell.addEventListener('click', function () {
        ui.statsDay = d.day;
        setStatsMode('day');
      });
      cal.appendChild(cell);
    });

    var mix = [
      { k: tr('kind.work'),    ms: m.sum.work,    c: '#3ddc84' },
      { k: tr('kind.chill'),   ms: m.sum.chill,   c: '#ffb454' },
      { k: tr('kind.neutral'), ms: m.sum.neutral, c: '#7c8cff' },
      { k: tr('kind.offline'), ms: m.sum.offline, c: '#4f6057' }
    ];
    var bar2 = $('monthMix'), list = $('monthMixList');
    bar2.innerHTML = ''; list.innerHTML = '';
    var pct = function (ms) { return m.total > 0 ? Math.round((ms / m.total) * 100) : 0; };
    mix.forEach(function (x) {
      var piece = el('span');
      piece.style.width = pct(x.ms) + '%';
      piece.style.background = x.c;
      piece.title = x.k + ' - ' + fmtHM(x.ms);
      bar2.appendChild(piece);

      var li = el('li');
      li.style.setProperty('--c', x.c);
      li.appendChild(el('i'));
      li.appendChild(el('span', 'l-name', x.k));
      li.appendChild(el('span', 'l-pct', pct(x.ms) + '%'));
      li.appendChild(el('span', 'l-val', fmtHM(x.ms)));
      list.appendChild(li);
    });
    if (m.total === 0) bar2.innerHTML = '<span style="width:100%;background:var(--surface-3)"></span>';

    var perCat = {}, catTotal = 0;
    m.dni.forEach(function (d) {
      activityForDay(d.day).forEach(function (a) {
        if (a.kind === 'offline') return;
        var key = a.catId && byId(a.catId) ? a.catId : '__none';
        perCat[key] = (perCat[key] || 0) + a.ms;
        catTotal += a.ms;
      });
    });
    var rows = [];
    for (var k in perCat) {
      if (!Object.prototype.hasOwnProperty.call(perCat, k)) continue;
      var c = byId(k);
      rows.push({ name: c ? c.name : tr('kind.unassigned'), color: c ? c.color : '#7c8cff', ms: perCat[k] });
    }
    rows.sort(function (a, b) { return b.ms - a.ms; });

    var host = $('monthSplit');
    host.innerHTML = '';
    var max = rows.length ? rows[0].ms : 1;
    rows.forEach(function (r) {
      var row = el('div', 'srow');
      row.style.setProperty('--c', r.color);
      var name = el('div', 'srow__name');
      name.appendChild(el('i'));
      name.appendChild(el('span', null, r.name));
      row.appendChild(name);
      row.appendChild(el('div', 'srow__val', fmtHM(r.ms)));
      var track = el('div', 'srow__track');
      var fill = el('div', 'srow__fill');
      fill.style.width = ((r.ms / max) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div', 'srow__pct',
        tr('month.share', { pct: catTotal > 0 ? Math.round((r.ms / catTotal) * 100) : 0 })));
      host.appendChild(row);
    });
  }

  function setStatsMode(mode) {
    ui.mode = mode;
    var btns = $('statsModes').querySelectorAll('.mode');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].dataset.mode === mode));
    }
    $('dayView').hidden = mode !== 'day';
    $('monthView').hidden = mode !== 'month';
    $('statsKicker').textContent = tr(mode === 'day' ? 'stats.kicker' : 'stats.kickerMonth');
    if (mode === 'month') ui.statsMonth = startOfMonth(ui.statsDay);
    renderStats();
  }

  function renderStats() {
    if (ui.mode === 'month') {
      var today = startOfDay(Date.now());
      $('statsDate').textContent = fmtMonth(ui.statsMonth);
      $('nextDay').disabled = addMonths(ui.statsMonth, 1) > today;
      renderMonth();
      return;
    }

    var day = ui.statsDay;
    var list = sessionsForDay(day);
    var t = totalsByCategory(list, day);
    var today = startOfDay(Date.now());

    $('statsDate').textContent = day === today ? tr('stats.todayIs') + ' · ' + fmtDateShort(day)
      : (day === addDays(today, -1) ? tr('stats.yesterday') + ' · ' + fmtDateShort(day) : fmtDateLong(day));
    $('nextDay').disabled = day >= today;

    $('kTotal').textContent = fmtHM(t.total);
    $('kSessions').textContent = list.length;
    $('kAvg').textContent = list.length ? fmtHM(t.total / list.length) : '0m';
    $('kTop').textContent = t.rows.length ? t.rows[0].name : '-';
    $('donutTotal').textContent = t.total ? fmtHM(t.total) : '0h';

    renderScore(day);
    renderDrill(day);
    renderDonut(t);
    renderLegend(t);
    renderHours(list, day);
    renderLog(list, day);
  }

  function renderDonut(t) {
    var svg = $('donut');
    svg.innerHTML = '';
    var ns = 'http://www.w3.org/2000/svg';
    var r = 78, c = 2 * Math.PI * r, cx = 100, cy = 100;

    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', cx); track.setAttribute('cy', cy); track.setAttribute('r', r);
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'var(--surface-3)');
    track.setAttribute('stroke-width', '16');
    svg.appendChild(track);

    if (!t.total) return;
    var offset = 0;
    t.rows.forEach(function (row) {
      var frac = row.ms / t.total;
      var len = Math.max(0, c * frac - 2.5);
      var arc = document.createElementNS(ns, 'circle');
      arc.setAttribute('cx', cx); arc.setAttribute('cy', cy); arc.setAttribute('r', r);
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', row.color);
      arc.setAttribute('stroke-width', '16');
      arc.setAttribute('stroke-linecap', 'round');
      arc.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + (c - len).toFixed(2));
      arc.setAttribute('stroke-dashoffset', (-offset).toFixed(2));
      arc.setAttribute('transform', 'rotate(-90 ' + cx + ' ' + cy + ')');
      svg.appendChild(arc);
      offset += c * frac;
    });
  }

  function renderLegend(t) {
    var ul = $('legend');
    ul.innerHTML = '';
    if (!t.rows.length) {
      var li0 = el('li');
      li0.style.color = 'var(--ink-tertiary)';
      li0.textContent = tr('split.noData');
      ul.appendChild(li0);
      return;
    }
    t.rows.forEach(function (r) {
      var li = el('li');
      li.style.setProperty('--c', r.color);
      li.appendChild(el('i'));
      li.appendChild(el('span', 'l-name', r.name));
      li.appendChild(el('span', 'l-pct', ((r.ms / t.total) * 100).toFixed(0) + '%'));
      li.appendChild(el('span', 'l-val', fmtHM(r.ms)));
      ul.appendChild(li);
    });
  }

  function renderHours(list, day) {
    var host = $('hours');
    host.innerHTML = '';
    var buckets = [], maxMs = 1;
    for (var h = 0; h < 24; h++) {
      var from = day + h * 3600000, to = from + 3600000;
      var b = { total: 0, parts: [] }, seen = {};
      list.forEach(function (s) {
        var d = durationInRange(s, from, to);
        if (d <= 0) return;
        if (seen[s.categoryId] == null) { seen[s.categoryId] = b.parts.length; b.parts.push({ id: s.categoryId, ms: 0 }); }
        b.parts[seen[s.categoryId]].ms += d;
        b.total += d;
      });
      maxMs = Math.max(maxMs, b.total);
      buckets.push(b);
    }
    var scale = Math.max(maxMs, 900000); // min. 15 min, żeby krótkie sesje nie dawały pełnych słupków

    buckets.forEach(function (b, h) {
      var col = el('div', 'hcol');
      col.dataset.empty = b.total > 0 ? '0' : '1';
      col.title = pad(h) + ':00 - ' + (b.total > 0 ? fmtHM(b.total) : tr('hours.none'));
      b.parts.forEach(function (p) {
        var c = byId(p.id);
        var seg = el('i');
        seg.style.height = ((p.ms / scale) * 100).toFixed(2) + '%';
        seg.style.background = c ? c.color : '#4f6057';
        col.appendChild(seg);
      });
      host.appendChild(col);
    });
  }

  function renderLog(list, day) {
    var host = $('log');
    host.innerHTML = '';
    var sorted = list.slice().sort(function (a, b) { return b.start - a.start; });
    $('logEmpty').hidden = sorted.length > 0;
    $('logCount').textContent = sorted.length ? tr('log.count', { n: sorted.length }) : '';

    sorted.forEach(function (s) {
      var c = byId(s.categoryId);
      var row = el('div', 'lrow');
      row.style.setProperty('--c', c ? c.color : '#4f6057');
      row.appendChild(el('i'));

      var nm = el('div', 'lrow__name', (c ? c.name : tr('cat.deleted')) + (s.live ? tr('log.inProgress') : ''));
      row.appendChild(nm);

      row.appendChild(el('div', 'lrow__span', fmtTime(s.start) + ' → ' + (s.live ? tr('log.now') : fmtTime(s.end))));
      row.appendChild(el('div', 'lrow__dur', fmtHM(durationInRange(s, day, addDays(day, 1)))));

      var del = el('button', 'iconbtn');
      del.type = 'button';
      del.setAttribute('aria-label', tr('log.delete'));
      del.innerHTML = '<svg viewBox="0 0 16 16" width="11" height="11"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      if (s.live) { del.disabled = true; del.title = tr('log.live'); }
      else del.addEventListener('click', function () { deleteSession(s.id); });
      row.appendChild(del);

      host.appendChild(row);
    });
  }

  function deleteSession(id) {
    var idx = -1;
    for (var i = 0; i < state.sessions.length; i++) {
      if (state.sessions[i].id === id) { idx = i; break; }
    }
    if (idx < 0) return;
    var removed = state.sessions[idx];
    state.sessions.splice(idx, 1);
    save(); renderAll(); renderStats();
    toast(tr('toast.sessionGone', { time: fmtHM(removed.duration || 0) }), {
      label: tr('toast.undo'),
      fn: function () {
        state.sessions.splice(Math.min(idx, state.sessions.length), 0, removed);
        save(); renderAll(); renderStats();
        toast(tr('toast.sessionBack'));
      }
    });
  }

  // Modal kategorii

  function openCat(id) {
    ui.editingId = id || null;
    var c = id ? byId(id) : null;
    ui.draft = c
      ? { name: c.name, color: c.color, kind: c.kind || 'work',
          logo: JSON.parse(JSON.stringify(c.logo || { type: 'mono' })) }
      : { name: '', color: PALETTE[state.categories.length % PALETTE.length],
          kind: 'work', logo: { type: 'mono' } };

    $('catTitle').textContent = tr(c ? 'cat.edit' : 'cat.new');
    $('fName').value = ui.draft.name;
    $('fRules').value = ((c && c.rules) || []).join(', ');
    $('deleteCat').hidden = !c;

    if (c) {
      var day = startOfDay(Date.now());
      var t = totalsByCategory(sessionsForDay(day).filter(function (s) { return s.categoryId === c.id; }), day);
      $('pvSub').textContent = tr('cat.recordedToday', { time: fmtHM(t.total) });
    } else {
      $('pvSub').textContent = tr('cat.new');
    }

    renderKinds();
    setTab(ui.draft.logo.type === 'image' ? 'image'
         : ui.draft.logo.type === 'mono' ? 'mono' : 'icon');
    renderSwatches();
    renderIcons();
    syncPreview();

    $('catOverlay').hidden = false;
    setTimeout(function () { $('fName').focus(); }, 40);
  }

  function closeCat() { $('catOverlay').hidden = true; ui.editingId = null; }

  function renderKinds() {
    var btns = $('fKind').querySelectorAll('.kind');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].dataset.kind === ui.draft.kind));
    }
  }

  function renderSwatches() {
    var host = $('swatches');
    host.innerHTML = '';
    PALETTE.forEach(function (col) {
      var b = el('button', 'sw');
      b.type = 'button';
      b.style.setProperty('--c', col);
      b.setAttribute('aria-label', tr('cat.colorAria', { color: col }));
      b.setAttribute('aria-pressed', String(ui.draft.color.toLowerCase() === col));
      b.addEventListener('click', function () {
        ui.draft.color = col;
        renderSwatches(); syncPreview();
      });
      host.appendChild(b);
    });
  }

  function renderIcons() {
    var host = $('iconGrid');
    if (!host || !ICO) return;
    host.innerHTML = '';
    ICO.ORDER.forEach(function (name) {
      var b = el('button', null);
      b.type = 'button';
      b.innerHTML = ICO.svg(name, 18);
      b.setAttribute('aria-label', name);
      b.setAttribute('aria-pressed',
        String(ui.draft.logo.type === 'icon' && ui.draft.logo.value === name));
      b.addEventListener('click', function () {
        ui.draft.logo = { type: 'icon', value: name };
        renderIcons(); syncPreview();
      });
      host.appendChild(b);
    });
  }

  function setTab(name) {
    var tabs = $('logoTabs').querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-selected', String(tabs[i].dataset.tab === name));
    }
    var panes = document.querySelectorAll('.tabpane');
    for (var j = 0; j < panes.length; j++) {
      panes[j].hidden = panes[j].dataset.pane !== name;
    }
    if (name === 'mono' && ui.draft.logo.type !== 'mono') ui.draft.logo = { type: 'mono' };
    if (name === 'icon' && ui.draft.logo.type !== 'icon') {
      ui.draft.logo = { type: 'icon', value: 'target' };
      renderIcons();
    }
    syncPreview();
  }

  function syncPreview() {
    var name = ($('fName').value || '').trim();
    document.documentElement.style.setProperty('--pv', ui.draft.color);
    $('catForm').style.setProperty('--pv', ui.draft.color);
    $('pvName').textContent = name || tr('cat.previewName');
    paintLogo($('pvLogo'), { name: name || '?', logo: ui.draft.logo }, 22);
  }

  // przycina do kwadratu 128 px, zwraca data URL
  function processImage(file, done) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { toast(tr('toast.fileTooBig')); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var src = String(fr.result);
      if (file.type === 'image/svg+xml') { done(src); return; }
      var img = new Image();
      img.onload = function () {
        var S = 128;
        var cv = document.createElement('canvas');
        cv.width = S; cv.height = S;
        var ctx = cv.getContext('2d');
        var side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
        done(cv.toDataURL('image/png'));
      };
      img.onerror = function () { toast(tr('toast.imageFailed')); };
      img.src = src;
    };
    fr.readAsDataURL(file);
  }

  function acceptFile(file) {
    processImage(file, function (dataUrl) {
      ui.draft.logo = { type: 'image', value: dataUrl };
      var drop = $('drop');
      drop.classList.add('has-file');
      drop.innerHTML = '';
      var input = el('input'); // innerHTML = '' usunął też input
      input.type = 'file'; input.id = 'fFile'; input.accept = 'image/*'; input.hidden = true;
      input.addEventListener('change', function (e) { if (e.target.files[0]) acceptFile(e.target.files[0]); });
      var im = document.createElement('img'); im.src = dataUrl; im.alt = '';
      im.width = 128; im.height = 128;
      var sp = el('span', null, tr('cat.changeImage'));
      drop.appendChild(input); drop.appendChild(im); drop.appendChild(sp);
      syncPreview();
    });
  }

  function saveCatForm(e) {
    e.preventDefault();
    var name = $('fName').value.trim();
    if (!name) { $('fName').focus(); return; }

    var logo = ui.draft.logo;
    if (logo.type === 'icon' && !(ICO && ICO.has(logo.value))) logo = { type: 'mono' };
    if (logo.type === 'emoji') logo = { type: 'mono' };

    var rules = $('fRules').value.split(',').map(function (r) { return r.trim(); })
      .filter(function (r) { return r.length > 0; });

    if (ui.editingId) {
      var c = byId(ui.editingId);
      c.name = name; c.color = ui.draft.color; c.logo = logo;
      c.rules = rules; c.kind = ui.draft.kind;
      toast(tr('toast.catUpdated', { name: name }));
    } else {
      var nc = {
        id: uid(), name: name, color: ui.draft.color, logo: logo,
        rules: rules, kind: ui.draft.kind, createdAt: Date.now()
      };
      state.categories.push(nc);
      if (!state.selectedId) state.selectedId = nc.id;
      toast(tr('toast.catAdded', { name: name }));
    }
    save(); applyAccent(); renderAll(); closeCat();
  }

  function deleteCategory() {
    var c = byId(ui.editingId);
    if (!c) return;
    var count = state.sessions.filter(function (s) { return s.categoryId === c.id; }).length;
    var msg = tr('confirm.deleteCat', { name: c.name }) +
      (count ? tr('confirm.keepsSessions', { n: count }) : '');
    if (!window.confirm(msg)) return;

    if (state.active && state.active.categoryId === c.id) { state.active = null; }
    state.categories = state.categories.filter(function (x) { return x.id !== c.id; });
    if (state.selectedId === c.id) state.selectedId = state.categories.length ? state.categories[0].id : null;
    save(); applyAccent(); renderAll(); closeCat();
    toast(tr('toast.catDeleted', { name: c.name }));
  }

  // Import / eksport

  function exportJSON() {
    var data = JSON.stringify({ v: 1, exportedAt: new Date().toISOString(),
      categories: state.categories, sessions: state.sessions,
      activity: state.activity }, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chronos-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast(tr('toast.exported'));
  }

  function importJSON(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(String(fr.result));
        if (!Array.isArray(d.categories) || !Array.isArray(d.sessions)) throw new Error('zły format');
        var act = Array.isArray(d.activity) ? d.activity : [];
        if (!window.confirm(tr('confirm.import', {
              cats: d.categories.length, sessions: d.sessions.length
            }))) return;
        iconizeLogos(d.categories);
        state.categories = d.categories;
        state.sessions = d.sessions;
        state.activity = act;
        state.active = null;
        state.selectedId = state.categories.length ? state.categories[0].id : null;
        save(); applyAccent(); renderAll(); renderStats();
        toast(tr('toast.imported'));
      } catch (err) { toast(tr('toast.badJson')); }
    };
    fr.readAsText(file);
  }

  var toastTimer = null;
  function toast(msg, action) {
    var t = $('toast');
    t.innerHTML = '';
    t.appendChild(el('i'));
    t.appendChild(el('span', null, msg));
    if (action) {
      var b = el('button', 'toast__act', action.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        t.classList.remove('is-on');
        clearTimeout(toastTimer);
        action.fn();
      });
      t.appendChild(b);
      t.style.pointerEvents = 'auto';
    } else {
      t.style.pointerEvents = 'none';
    }
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, action ? 6000 : 2600);
  }

  function renderAll() { renderRail(); renderDial(); renderPanel(); renderMonitor(); renderMini(); }

  function stepStats(dir) {
    var today = startOfDay(Date.now());
    if (ui.mode === 'month') {
      var next = addMonths(ui.statsMonth, dir);
      if (dir > 0 && next > today) return;
      ui.statsMonth = next;
    } else {
      if (dir > 0 && ui.statsDay >= today) return;
      ui.statsDay = addDays(ui.statsDay, dir);
    }
    renderStats();
  }

  function openStats() {
    ui.statsDay = startOfDay(Date.now());
    ui.statsMonth = startOfMonth(Date.now());
    $('statsOverlay').hidden = false;
    setStatsMode(ui.mode);
    renderStats();
    $('closeStats').focus();
  }

  var rain = { main: null, mini: null };

  // Osobne płótno na okno, bo mini-okno ma własny document.
  function startRain() {
    if (!window.CHRONOS_RAIN) return;
    var host = document.querySelector('.ambient');
    if (host && !rain.main) rain.main = window.CHRONOS_RAIN.mount(window, { into: host, size: 15 });
  }

  // Język: przy pierwszym uruchomieniu pytamy, przeglądarka tylko podpowiada.

  function applyLang() {
    if (!I18N) return;
    I18N.apply();
    markLangButtons();
    // I18N.apply() nie obejmuje tekstów budowanych w JS
    applyAccent(); renderAll();
    $('todayDate').textContent = fmtDateLong(Date.now());
    if (!$('statsOverlay').hidden) renderStats();
    renderMonitor();
    miniLast = '';                 // wymusza przerysowanie mini-okna
    if (mini.win && !mini.win.closed) renderMini();
  }

  function markLangButtons() {
    if (!I18N) return;
    var now = I18N.get();
    var all = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < all.length; i++) {
      all[i].setAttribute('aria-pressed', String(all[i].dataset.lang === now));
    }
  }

  function setLang(code) {
    if (!I18N) return;
    I18N.set(code);
    applyLang();
  }

  function askLanguage(after) {
    var box = $('langOverlay');
    if (!box || !I18N) { if (after) after(); return; }
    // podświetlamy propozycję przeglądarki, bez zapisu
    I18N.set(I18N.guess(), false);
    I18N.apply();
    markLangButtons();
    box.hidden = false;

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (!b) return;
      box.hidden = true;
      if (after) {
        // boot dopiero po wyborze, żeby kategorie startowe i daty były
        // od razu w wybranym języku
        I18N.set(b.dataset.lang);
        var go = after; after = null; go();
      } else {
        setLang(b.dataset.lang);
      }
    });
  }

  function init() {
    if (I18N) I18N.apply();
    if (I18N && !I18N.stored()) askLanguage(boot);
    else boot();
  }

  function boot() {
    load();
    startRain();
    buildTicks();
    applyAccent();
    renderAll();
    tick();

    $('todayDate').textContent = fmtDateLong(Date.now());

    if (state.active && typeof ui.wznowPo === 'number') {
      var minione = fmtHM(activeElapsed());
      var nazwaKat = (byId(state.active.categoryId) || {}).name || tr('common.session');
      if (ui.wznowPo < 5 * 60000) {
        // krótka przerwa (restart, odświeżenie) - wznawiamy
        state.active.segmentStart = Date.now();
        save(); renderAll();
        setTimeout(function () {
          toast(tr('toast.resumed', { name: nazwaKat, time: minione }));
        }, 500);
      } else {
        setTimeout(function () {
          toast(tr('toast.waiting', { name: nazwaKat, time: minione }));
        }, 500);
      }
    }

    if (ui.loadFailed) {
      setTimeout(function () {
        toast(tr('toast.loadFailed'));
      }, 600);
    }

    // wciśnięty przycisk myszy wstrzymuje cykliczne przerysowanie (patrz tick)
    document.addEventListener('pointerdown', function () { ui.holding = true; }, true);
    ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) {
      window.addEventListener(ev, function () { ui.holding = false; }, true);
    });

    $('dial').addEventListener('click', toggle);
    $('playBtn').addEventListener('click', toggle);
    $('stopBtn').addEventListener('click', function () { commit(false); });
    $('discardBtn').addEventListener('click', discard);

    $('targets').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.targetMin = Number(b.dataset.target);
      reachedNotified = false;
      save(); renderDial();
    });

    $('addCatBtn').addEventListener('click', function () { openCat(null); });
    $('closeCat').addEventListener('click', closeCat);
    $('cancelCat').addEventListener('click', closeCat);
    $('catForm').addEventListener('submit', saveCatForm);
    $('deleteCat').addEventListener('click', deleteCategory);
    $('fName').addEventListener('input', syncPreview);
    $('fKind').addEventListener('click', function (e) {
      var b = e.target.closest('.kind');
      if (!b) return;
      ui.draft.kind = b.dataset.kind;
      renderKinds();
    });
    $('logoTabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (b) setTab(b.dataset.tab);
    });
    $('fFile').addEventListener('change', function (e) {
      if (e.target.files[0]) acceptFile(e.target.files[0]);
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      $('drop').addEventListener(ev, function (e) { e.preventDefault(); $('drop').classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      $('drop').addEventListener(ev, function (e) { e.preventDefault(); $('drop').classList.remove('is-over'); });
    });
    $('drop').addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) acceptFile(f);
    });

    $('miniBtn').addEventListener('click', toggleMini);
    if (!miniSupported()) $('miniBtn').hidden = true;
    $('openStats').addEventListener('click', openStats);
    $('closeStats').addEventListener('click', function () { $('statsOverlay').hidden = true; });
    $('prevDay').addEventListener('click', function () { stepStats(-1); });
    $('nextDay').addEventListener('click', function () { stepStats(1); });
    $('statsModes').addEventListener('click', function (e) {
      var b = e.target.closest('.mode');
      if (b) setStatsMode(b.dataset.mode);
    });
    $('exportBtn').addEventListener('click', exportJSON);
    $('resetBtn').addEventListener('click', function () {
      var msg = tr('confirm.reset', { cats: state.categories.length, sessions: state.sessions.length });
      if (window.confirm(msg)) reset(false);
    });

    $('autoToggle').addEventListener('click', function () {
      state.autoSwitch = !state.autoSwitch;
      save(); renderMonitor();
      toast(tr(state.autoSwitch ? 'toast.autoOn' : 'toast.autoOff'));
    });
    pollAgent();
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      if (e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = '';
    });

    [['statsOverlay', null], ['catOverlay', null]].forEach(function (p) {
      $(p[0]).addEventListener('mousedown', function (e) {
        if (e.target === $(p[0])) $(p[0]).hidden = true;
      });
    });

    document.addEventListener('keydown', function (e) {
      var inField = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      var catOpen = !$('catOverlay').hidden;
      var statsOpen = !$('statsOverlay').hidden;

      if (e.key === 'Escape') {
        if (catOpen) closeCat();
        else if (statsOpen) $('statsOverlay').hidden = true;
        return;
      }
      if (inField || catOpen) return;

      if (e.code === 'Space') { e.preventDefault(); toggle(); return; }
      var k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); openCat(null); return; }
      if (k === 's') { e.preventDefault(); statsOpen ? ($('statsOverlay').hidden = true) : openStats(); return; }
      if (k === 'm') { e.preventDefault(); toggleMini(); return; }
      if (k === 'enter' && state.active) { e.preventDefault(); commit(false); return; }
      if (/^[1-9]$/.test(e.key)) {
        var c = state.categories[Number(e.key) - 1];
        if (c) { selectCat(c.id); }
        return;
      }
      if (statsOpen && e.key === 'ArrowLeft') { stepStats(-1); }
      if (statsOpen && e.key === 'ArrowRight') { stepStats(1); }
      if (statsOpen && (k === 'd' || k === 'w')) {
        e.preventDefault();
        setStatsMode(k === 'd' ? 'day' : 'month');
      }
    });

    // bez tego spacja na przycisku przełączałaby dwa razy
    $('dial').addEventListener('keydown', function (e) { if (e.code === 'Space') e.preventDefault(); });
    $('playBtn').addEventListener('keydown', function (e) { if (e.code === 'Space') e.preventDefault(); });

    // Przy zamknięciu zatrzymujemy zegar i zapisujemy. Bez aktywnego stanu
    // nie zapisujemy, żeby nie nadpisać świeższych danych innej karty.
    var zapisanoPrzyWyjsciu = false;
    function zapiszNaWyjscie() {
      if (zapisanoPrzyWyjsciu) return;
      if (!state.active && !seg) return;
      zapisanoPrzyWyjsciu = true;
      if (isRunning()) {
        state.active.elapsed = activeElapsed();
        state.active.segmentStart = null;
        state.active.closedRunning = true;
      }
      flushSegment(Date.now());
      save();
    }
    window.addEventListener('pagehide', zapiszNaWyjscie);
    window.addEventListener('beforeunload', zapiszNaWyjscie);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && (state.active || seg)) save();
    });

    var langPick = $('langPick');
    if (langPick) {
      langPick.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lang]');
        if (b) setLang(b.dataset.lang);
      });
    }
    markLangButtons();

    setInterval(tick, 250);
    // odświeżenie daty po północy
    setInterval(function () { $('todayDate').textContent = fmtDateLong(Date.now()); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
