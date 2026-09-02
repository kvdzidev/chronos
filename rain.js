/* ══════════════════════════════════════════════════════════════
   CHRONOS — deszcz znaków (tło aplikacji i nakładki)

   Ściana kanji spadająca w ciemności: czoło każdej strugi prawie białe,
   ogon gaśnie w jadeicie. Jeden moduł obsługuje duże okno i mini-nakładkę,
   bo okno PiP ma własny `document` i musi dostać własne płótno.

   Trzy rzeczy, które trzymają to w ryzach na cały dzień pracy:
     • rysujemy ~18 klatek na sekundę, nie 60 — deszcz i tak jest powolny,
       a procesor zostaje wolny dla reszty aplikacji,
     • pętla stoi na requestAnimationFrame, więc przy zminimalizowanym
       oknie przeglądarka zatrzymuje ją sama, bez naszego kodu,
     • `prefers-reduced-motion` wyłącza ruch: zostaje jedna, statyczna klatka.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* Znaki dobrane tak, żeby gęstość kresek była w miarę równa — mieszanka
     liczebników, żywiołów i pojęć. Bez znaczenia semantycznego, to faktura. */
  var GLYPHS = (
    '零壱弐参肆伍陸漆捌玖拾百千万億兆' +
    '時分秒日月火水木金土年' +
    '空風林山川海雲雨光影幻夢無限界' +
    '刃剣龍鬼神電子流円方京動森田刻'
  ).split('');

  /* Paleta deszczu. Celowo tutaj, a nie w CSS: okno PiP dostaje arkusz
     asynchronicznie, więc odczyt zmiennych CSS w chwili startu bywa pusty. */
  var C = {
    back: '#040806',                 // musi być nieprzezroczysty — na nim gaśnie ogon
    fade: 'rgba(4, 8, 6, 0.085)',    // im mniej, tym dłuższe smugi
    head: '#e4fff0',
    body: '#2fbf6d'
  };

  var STEP = 55;          // ms między klatkami (~18 fps), gdy okno ma fokus;
                          // bez fokusu mnożnik 2.5 daje ~7 fps — deszcz dalej
                          // pada, ale nie bierze procesora spod pracy
  var FONT = '"MS Gothic", "Yu Gothic", Meiryo, "Malgun Gothic", monospace';

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  /**
   * @param {Window} win  okno, w którym ma padać (główne albo PiP)
   * @param {{into?:Element, size?:number, opacity?:number}} opts
   * @returns {{stop:function}|null}
   */
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
      /* Prędkość zawsze ≤ 1 wiersza na klatkę. Powyżej strugi zaczęłyby
         przeskakiwać wiersze i zostawiać dziury w smudze. */
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

    /* Jedna klatka: przygaszamy całość (to robi smugę), a potem dla każdej
       kolumny przemalowujemy poprzednie czoło na zielono i stawiamy nowe. */
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

        // koniec ekranu: struga wraca na górę, ale nie wszystkie naraz —
        // losowe opóźnienie rozbija rytm, inaczej deszcz zacząłby pulsować
        if (row * size > h && Math.random() > 0.972) column(i);
      }
      ctx.globalAlpha = 1;
    }

    // jedna statyczna klatka — dla `prefers-reduced-motion`
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
      // bez fokusu klatki lecą rzadziej — reszta ciągnie rAF, który przy
      // zminimalizowanym oknie i tak staje sam
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
