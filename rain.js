// CHRONOS - deszcz znaków w tle okna głównego i nakładki PiP.
// PiP ma własny document, więc każde okno dostaje osobne płótno przez mount().
(function (global) {
  'use strict';

  var GLYPHS = (
    '零壱弐参肆伍陸漆捌玖拾百千万億兆' +
    '時分秒日月火水木金土年' +
    '空風林山川海雲雨光影幻夢無限界' +
    '刃剣龍鬼神電子流円方京動森田刻'
  ).split('');

  // Kolory w JS, nie w CSS: PiP ładuje arkusz asynchronicznie i zmienne
  // CSS przy starcie bywają puste.
  var C = {
    back: '#040806',
    fade: 'rgba(4, 8, 6, 0.085)',    // mniej = dłuższe smugi
    head: '#e4fff0',
    body: '#2fbf6d'
  };

  var STEP = 55;          // ms między klatkami: ~18 fps z fokusem, ~7 fps bez (x2.5)
  var FONT = '"MS Gothic", "Yu Gothic", Meiryo, "Malgun Gothic", monospace';

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  // win: okno główne albo PiP; opts: { into, size, opacity, step }
  function mount(win, opts) {
    opts = opts || {};
    var doc = win.document;
    var host = opts.into || doc.body;
    if (!host) return null;

    var cv = doc.createElement('canvas');
    cv.className = 'rain';
    cv.setAttribute('aria-hidden', 'true');
    if (opts.opacity != null) cv.style.opacity = String(opts.opacity);
    host.insertBefore(cv, host.firstChild);

    var ctx = cv.getContext('2d', { alpha: false });
    if (!ctx) { if (cv.parentNode) cv.parentNode.removeChild(cv); return null; }

    var size = opts.size || 15;
    var step = opts.step || STEP;
    var w = 0, h = 0, cols = 0;
    var y = [], sp = [], glow = [], glyph = [], last = [];
    var raf = null, lastT = 0, dead = false, obs = null;
    var focused = doc.hasFocus ? doc.hasFocus() : true;

    var reduce = win.matchMedia
      ? win.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    function column(i) {
      y[i] = rand(-h / size - 6, 0);
      // max 1 wiersz na klatkę, szybciej struga przeskakuje wiersze i robi dziury
      sp[i] = rand(0.34, 1);
      glow[i] = Math.random() < 0.2 ? 1 : rand(0.3, 0.72);
      glyph[i] = pick();
      last[i] = null;
    }

    function resize() {
      var box = host.getBoundingClientRect();
      var nw = Math.round(box.width) || win.innerWidth;
      var nh = Math.round(box.height) || win.innerHeight;
      if (!nw || !nh || (nw === w && nh === h)) return false;

      w = nw; h = nh;
      var dpr = Math.min(win.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
      ctx.fillStyle = C.back;
      ctx.fillRect(0, 0, w, h);

      var next = Math.ceil(w / size) + 1;
      for (var i = cols; i < next; i++) column(i);
      cols = next;
      return true;
    }

    // przygaszenie całości robi smugę; stare czoło przemalowane na zielono
    function frame() {
      ctx.fillStyle = C.fade;
      ctx.fillRect(0, 0, w, h);
      ctx.font = size + 'px ' + FONT;

      for (var i = 0; i < cols; i++) {
        var row = Math.floor(y[i]);
        y[i] += sp[i];

        if (row !== last[i]) {
          if (last[i] !== null) {
            ctx.globalAlpha = 0.62 * glow[i];
            ctx.fillStyle = C.body;
            ctx.fillText(glyph[i], i * size, last[i] * size);
          }
          glyph[i] = pick();
          last[i] = row;
          if (row * size > -size && row * size < h) {
            ctx.globalAlpha = glow[i];
            ctx.fillStyle = C.head;
            ctx.fillText(glyph[i], i * size, row * size);
          }
        }

        // losowe opóźnienie powrotu na górę, inaczej deszcz pulsuje
        if (row * size > h && Math.random() > 0.972) column(i);
      }
      ctx.globalAlpha = 1;
    }

    // prefers-reduced-motion: jedna statyczna klatka
    function still() {
      ctx.font = size + 'px ' + FONT;
      ctx.fillStyle = C.body;
      for (var i = 0; i < cols; i++) {
        var n = Math.floor(rand(2, 9));
        var top = rand(0, h);
        for (var j = 0; j < n; j++) {
          ctx.globalAlpha = glow[i] * (1 - j / n) * 0.5;
          ctx.fillText(pick(), i * size, top + j * size);
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(ts) {
      if (dead) return;
      raf = win.requestAnimationFrame(loop);
      // bez fokusu rzadziej; zminimalizowane okno i tak zatrzymuje rAF
      if (ts - lastT < (focused ? step : step * 2.5)) return;
      lastT = ts;
      frame();
    }

    function onFocus() { focused = true; }
    function onBlur() { focused = false; }

    function onResize() {
      if (dead) return;
      if (resize() && reduce) still();
    }

    resize();
    if (reduce) {
      still();
    } else if (win.requestAnimationFrame) {
      raf = win.requestAnimationFrame(loop);
    }

    if (win.ResizeObserver) {
      obs = new win.ResizeObserver(onResize);
      obs.observe(host);
    } else {
      win.addEventListener('resize', onResize);
    }
    win.addEventListener('focus', onFocus);
    win.addEventListener('blur', onBlur);

    return {
      stop: function () {
        dead = true;
        if (raf && win.cancelAnimationFrame) win.cancelAnimationFrame(raf);
        if (obs) obs.disconnect(); else win.removeEventListener('resize', onResize);
        win.removeEventListener('focus', onFocus);
        win.removeEventListener('blur', onBlur);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      }
    };
  }

  global.CHRONOS_RAIN = { mount: mount, COLORS: C, GLYPHS: GLYPHS };
})(window);
