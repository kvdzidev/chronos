/* ══════════════════════════════════════════════════════════════
   CHRONOS — zestaw ikon kategorii

   Kreska zamiast emoji. Emoji ciągnie za sobą cudzy krój, cudze kolory
   i inny rysunek na każdym systemie — w interfejsie zbudowanym z włosowych
   linii wygląda jak naklejka. Te ikony są rysowane tą samą kreską co reszta
   aplikacji i dziedziczą kolor akcentu kategorii przez `currentColor`,
   więc domyślnie są zielone, a po zmianie koloru kategorii — w jej kolorze.

   Siatka 24×24, wyłącznie obrys, grubość 1.6, zaokrąglone końce.
   Dopisanie własnej ikony to jedna linia: nazwa → wnętrze <svg>.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var ICONS = {
    target:   '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.3"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
    code:     '<path d="M8.6 7.4L4 12l4.6 4.6M15.4 7.4L20 12l-4.6 4.6M13.6 4.8l-3.2 14.4"/>',
    terminal: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.4"/><path d="M7.4 10.2l2.6 2.4-2.6 2.4M13.2 15.4h3.8"/>',
    book:     '<path d="M12 6.6C10.7 5.3 8.9 4.6 7 4.6H3.8v12.8H7c1.9 0 3.7.7 5 2 1.3-1.3 3.1-2 5-2h3.2V4.6H17c-1.9 0-3.7.7-5 2z"/><path d="M12 6.6v12.8"/>',
    pen:      '<path d="M4.6 19.4l1-3.9L16.2 4.9a1.8 1.8 0 012.5 0l.9.9a1.8 1.8 0 010 2.5L8.5 18.4z"/><path d="M15.1 6l3.3 3.3"/>',
    note:     '<path d="M6.4 3.6h7.2L19 9v11.4H6.4z"/><path d="M13.6 3.6V9H19"/><path d="M9.4 13h6.2M9.4 16.4h4.4"/>',
    folder:   '<path d="M3.6 6.6A1.6 1.6 0 015.2 5h4l1.9 2.3h7.7A1.6 1.6 0 0120.4 9v8.9a1.6 1.6 0 01-1.6 1.6H5.2a1.6 1.6 0 01-1.6-1.6z"/>',
    chart:    '<path d="M6 19.4V12.6M12 19.4V5.2M18 19.4V9.6" stroke-width="2.1"/>',
    trend:    '<path d="M4 16.4l4.8-4.8 3.4 3.4L20 7.4"/><path d="M15 7.4h5v5"/>',
    bulb:     '<path d="M12 3.6a6 6 0 00-3.6 10.8c.7.5 1.1 1.2 1.1 2h5c0-.8.4-1.5 1.1-2A6 6 0 0012 3.6z"/><path d="M9.5 19.4h5M10.5 21.4h3"/>',
    flask:    '<path d="M9.4 3.6h5.2"/><path d="M10.6 3.6v6.2L5.7 18a2 2 0 001.7 3h9.2a2 2 0 001.7-3l-4.9-8.2V3.6"/><path d="M7.9 15.2h8.2"/>',
    palette:  '<path d="M12 3.6a8.4 8.4 0 000 16.8c1 0 1.7-.9 1.5-1.8-.2-1 .5-1.9 1.6-1.9h1.4a4.2 4.2 0 004.2-4.3C20.4 7.3 16.6 3.6 12 3.6z"/><circle cx="8.2" cy="10.2" r="1.05" fill="currentColor" stroke="none"/><circle cx="12" cy="7.8" r="1.05" fill="currentColor" stroke="none"/><circle cx="15.8" cy="10.2" r="1.05" fill="currentColor" stroke="none"/>',
    layers:   '<path d="M12 3.4L3.6 7.8 12 12.2l8.4-4.4z"/><path d="M3.6 12.2L12 16.6l8.4-4.4"/><path d="M3.6 16.2L12 20.6l8.4-4.4"/>',
    cube:     '<path d="M12 3.3l8 4.3v8.8L12 20.7 4 16.4V7.6z"/><path d="M4 7.6l8 4.3 8-4.3M12 11.9v8.8"/>',
    sliders:  '<path d="M4.6 7.4h7.6M18.4 7.4h1M4.6 12h1.8M12.4 12h7M4.6 16.6h7.6M18.4 16.6h1"/><circle cx="14.6" cy="7.4" r="2.1"/><circle cx="8.8" cy="12" r="2.1"/><circle cx="14.6" cy="16.6" r="2.1"/>',
    wrench:   '<path d="M17.7 3.9a5 5 0 00-6.6 6.4L4.2 17.2a2.1 2.1 0 103 3l6.9-6.9a5 5 0 006.4-6.6l-3.1 3.1-2.5-.6-.6-2.5z"/>',
    rocket:   '<path d="M12 3.2c2.8 2.2 4.5 5.5 4.5 9.1v3.1h-9v-3.1c0-3.6 1.7-6.9 4.5-9.1z"/><circle cx="12" cy="9.8" r="1.8"/><path d="M7.5 13.6L5 16.2v3.1l2.9-1.5M16.5 13.6l2.5 2.6v3.1l-2.9-1.5"/><path d="M10.4 19.4h3.2"/>',
    bolt:     '<path d="M13.3 3L5.6 13.3h5.4L10.5 21l7.7-10.3h-5.4z"/>',
    globe:    '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.2 2.4 3.4 5.3 3.4 8.4S14.2 18 12 20.4C9.8 18 8.6 15.1 8.6 12S9.8 6 12 3.6z"/>',
    mail:     '<rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2"/><path d="M4.2 7.2l7.8 5.4 7.8-5.4"/>',
    chat:     '<path d="M20.4 12.4c0 3.6-3.8 6.5-8.4 6.5-.9 0-1.8-.1-2.6-.3L4.2 20.8l1.2-3.6c-1.2-1.3-1.8-2.9-1.8-4.8C3.6 8.8 7.4 6 12 6s8.4 2.8 8.4 6.4z"/>',
    phone:    '<path d="M8.5 4.6H6.1a2 2 0 00-2 2.1c.3 6.9 5.7 12.3 12.6 12.6a2 2 0 002.1-2v-2.4l-3.9-1.4-1.7 1.7a12.3 12.3 0 01-5-5l1.7-1.7z"/>',
    calendar: '<rect x="3.6" y="5.6" width="16.8" height="14.8" rx="2"/><path d="M3.6 10.2h16.8M8 3.6v4M16 3.6v4"/>',
    clock:    '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.1v5.3l3.4 2"/>',
    coin:     '<circle cx="12" cy="12" r="8.4"/><path d="M14.6 9.4A3 3 0 0012 8.2c-1.5 0-2.7.8-2.7 2s1.1 1.8 2.7 2.1c1.6.3 2.7 1 2.7 2.1s-1.2 2-2.7 2a3 3 0 01-2.6-1.2"/><path d="M12 6.4v11.2"/>',
    cart:     '<path d="M3.6 4.6h2.2l2.5 10.2h8.9l2.2-7.4H7.2"/><circle cx="9.6" cy="18.8" r="1.6"/><circle cx="16.8" cy="18.8" r="1.6"/>',
    heart:    '<path d="M12 20.2l-7-6.8a4.4 4.4 0 016.2-6.2l.8.8.8-.8a4.4 4.4 0 016.2 6.2z"/>',
    dumbbell: '<rect x="4.8" y="8.4" width="3.1" height="7.2" rx="1.1"/><rect x="16.1" y="8.4" width="3.1" height="7.2" rx="1.1"/><path d="M7.9 12h8.2M3.2 10.4v3.2M20.8 10.4v3.2"/>',
    leaf:     '<path d="M20.2 3.9c0 9.1-5.5 13.6-11.1 13.6-2 0-3.6-.6-4.6-1.6-.6-4.1 3.5-11.7 15.7-12z"/><path d="M4 20.1c2-5.1 5.1-8.2 9.2-10.3"/>',
    coffee:   '<path d="M4.6 8.6h11.8v5.8a4.2 4.2 0 01-4.2 4.2H8.8a4.2 4.2 0 01-4.2-4.2z"/><path d="M16.4 10.2h1.8a2.5 2.5 0 010 5h-1.8"/><path d="M7.6 3.2v2.6M11.2 3.2v2.6"/>',
    music:    '<path d="M9.2 17.8V6.2l9.6-2v11.4"/><circle cx="6.7" cy="17.8" r="2.5"/><circle cx="16.3" cy="15.6" r="2.5"/>',
    film:     '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2"/><path d="M8.2 4.6v14.8M15.8 4.6v14.8M3.6 12h16.8M3.6 8.3h4.6M3.6 15.7h4.6M15.8 8.3h4.6M15.8 15.7h4.6"/>',
    gamepad:  '<path d="M8.2 9.4h7.6a5 5 0 014.9 4l.6 3.4a2.2 2.2 0 01-4.1 1.5L15.5 16h-7l-1.7 2.3a2.2 2.2 0 01-4.1-1.5l.6-3.4a5 5 0 014.9-4z"/><path d="M7 11.9v2.4M5.8 13.1h2.4"/><circle cx="15.7" cy="12.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.6" cy="14.2" r="1" fill="currentColor" stroke="none"/>',
    camera:   '<path d="M3.6 8.8a2 2 0 012-2h1.9l1.5-2.2h6l1.5 2.2h1.9a2 2 0 012 2v8.6a2 2 0 01-2 2H5.6a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.4"/>',
    moon:     '<path d="M20.1 14.6A8.4 8.4 0 019.4 3.9a8.4 8.4 0 1010.7 10.7z"/>',
    star:     '<path d="M12 3.8l2.6 5.3 5.8.9-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.9z"/>',
    compass:  '<circle cx="12" cy="12" r="8.4"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
    shield:   '<path d="M12 3.5l7 2.5v5.6c0 4.2-2.8 7.6-7 8.9-4.2-1.3-7-4.7-7-8.9V6z"/><path d="M9 12l2.2 2.2 4-4.2"/>',
    database: '<ellipse cx="12" cy="6.4" rx="7.4" ry="2.9"/><path d="M4.6 6.4v11.2c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9V6.4"/><path d="M4.6 12c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9"/>',
    mic:      '<rect x="9" y="3.2" width="6" height="11" rx="3"/><path d="M5.6 11.6a6.4 6.4 0 0012.8 0"/><path d="M12 18v2.8M9.2 20.8h5.6"/>'
  };

  var ORDER = [
    'target', 'code', 'terminal', 'chart', 'trend', 'sliders', 'database', 'cube',
    'note', 'folder', 'book', 'pen', 'mail', 'chat', 'phone', 'calendar',
    'bulb', 'flask', 'palette', 'layers', 'wrench', 'rocket', 'bolt', 'globe',
    'clock', 'coin', 'cart', 'shield', 'compass', 'star', 'heart', 'leaf',
    'dumbbell', 'coffee', 'music', 'film', 'gamepad', 'camera', 'mic', 'moon'
  ];

  /**
   * Gotowy <svg> jako tekst.
   * @param {string} name  nazwa z ORDER
   * @param {number} size  bok w px
   */
  function svg(name, size) {
    var body = ICONS[name];
    if (!body) return '';
    var s = size || 18;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" ' +
           'fill="none" stroke="currentColor" stroke-width="1.6" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           body + '</svg>';
  }

  function has(name) { return Object.prototype.hasOwnProperty.call(ICONS, name); }

  global.CHRONOS_ICONS = { svg: svg, has: has, ORDER: ORDER, ICONS: ICONS };
})(window);
