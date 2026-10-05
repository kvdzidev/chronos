// CHRONOS - tłumaczenia PL/EN. Brak tekstu w danym języku = polski.
// Wybór języka leży pod osobnym kluczem, więc czyszczenie danych go nie rusza.
(function (global) {
  'use strict';

  var KEY = 'chronos.lang';
  var FALLBACK = 'pl';

  var LOCALES = { pl: 'pl-PL', en: 'en-GB' };

  var DICT = {
    'app.title':        { pl: 'CHRONOS - tracker czasu',        en: 'CHRONOS - time tracker' },
    'app.h1':           { pl: 'CHRONOS - tracker czasu i statystyk dziennych',
                          en: 'CHRONOS - time tracker and daily statistics' },
    'mark.sub':         { pl: 'time tracker',                   en: 'time tracker' },

    'rail.categories':  { pl: 'Kategorie',                      en: 'Categories' },
    'rail.list':        { pl: 'Lista kategorii',                en: 'Category list' },
    'rail.empty':       { pl: 'Brak kategorii.<br />Dodaj pierwszą, aby zacząć mierzyć czas.',
                          en: 'No categories yet.<br />Add the first one to start tracking.' },
    'rail.new':         { pl: 'Nowa kategoria',                 en: 'New category' },

    'status.ready':     { pl: 'Gotowy',                         en: 'Ready' },
    'status.running':   { pl: 'Pomiar',                         en: 'Tracking' },
    'status.paused':    { pl: 'Wstrzymane',                     en: 'Paused' },
    'monitor.on':       { pl: 'Monitor',                        en: 'Monitor' },
    'monitor.off':      { pl: 'Monitor offline',                en: 'Monitor offline' },
    'mon.label':        { pl: 'Aktywne okno',                   en: 'Active window' },
    'mon.noRule':       { pl: 'brak reguły',                    en: 'no rule' },
    'mon.unknownApp':   { pl: 'nieznany proces',                en: 'unknown process' },
    'mon.noTitle':      { pl: 'okno bez tytułu',                en: 'untitled window' },
    'mon.window':       { pl: 'okno',                           en: 'window' },
    'mon.idle':         { pl: 'bezczynność {min} min',          en: 'idle {min} min' },
    'mon.meetingIdle':  { pl: '{name} - słucham, offline nie liczy',
                          en: '{name} - listening, idle does not count' },
    'mon.listening':    { pl: '{name} - słucham',               en: '{name} - listening' },
    'auto.on':          { pl: 'AUTO',                           en: 'AUTO' },
    'auto.off':         { pl: 'AUTO OFF',                       en: 'AUTO OFF' },
    'auto.title':       { pl: 'Automatyczne przypisanie czasu do kategorii wg reguł okna',
                          en: 'Assign time to categories automatically, following the active window' },

    'dial.aria':        { pl: 'Start lub pauza pomiaru czasu',  en: 'Start or pause the timer' },
    'dial.pickCat':     { pl: 'Wybierz kategorię',              en: 'Pick a category' },
    'dial.hintStart':   { pl: 'Kliknij, aby wystartować',       en: 'Click to start' },
    'dial.hintPause':   { pl: 'Kliknij, aby wstrzymać',         en: 'Click to pause' },
    'dial.hintResume':  { pl: 'Kliknij, aby wznowić',           en: 'Click to resume' },
    'dial.hintPickCat': { pl: 'Wybierz kategorię, aby zacząć',  en: 'Pick a category to begin' },
    'target.label':     { pl: 'Cel',                            en: 'Target' },
    'target.aria':      { pl: 'Cel sesji',                      en: 'Session target' },
    'btn.start':        { pl: 'Start',                          en: 'Start' },
    'btn.pause':        { pl: 'Pauza',                          en: 'Pause' },
    'btn.resume':       { pl: 'Wznów',                          en: 'Resume' },
    'btn.saveSession':  { pl: 'Zapisz sesję',                   en: 'Save session' },
    'btn.discard':      { pl: 'Odrzuć bieżącą sesję',           en: 'Discard current session' },

    'panel.aria':       { pl: 'Podsumowanie dnia',              en: 'Today at a glance' },
    'panel.today':      { pl: 'Dzisiaj',                        en: 'Today' },
    'panel.fullStats':  { pl: 'Pełne statystyki',               en: 'Full statistics' },
    'panel.sessions':   { pl: 'sesji',                          en: 'sessions' },
    'panel.longest':    { pl: 'najdłuższa',                     en: 'longest' },
    'panel.breakdown':  { pl: 'Podział',                        en: 'Breakdown' },
    'panel.empty':      { pl: 'Brak zarejestrowanego czasu.<br />Wystartuj timer, aby zobaczyć rozkład dnia.',
                          en: 'Nothing recorded yet.<br />Start the timer to see how the day splits.' },
    'panel.activity':   { pl: 'Aktywność 00-24',                en: 'Activity 00-24' },
    'panel.recent':     { pl: 'Ostatnie sesje',                 en: 'Recent sessions' },
    'panel.today.short':{ pl: 'dziś',                           en: 'today' },
    'panel.dayShare':   { pl: '{pct}% dnia',                    en: '{pct}% of the day' },
    'mini.title':       { pl: 'Mała nakładka zawsze na wierzchu', en: 'Small always-on-top overlay' },

    'stats.kicker':     { pl: 'Raport dzienny',                 en: 'Daily report' },
    'stats.kickerMonth':{ pl: 'Raport miesięczny',              en: 'Monthly report' },
    'stats.title':      { pl: 'Statystyki',                     en: 'Statistics' },
    'stats.range':      { pl: 'Zakres raportu',                 en: 'Report range' },
    'stats.day':        { pl: 'Dzień',                          en: 'Day' },
    'stats.month':      { pl: 'Miesiąc',                        en: 'Month' },
    'stats.prevDay':    { pl: 'Poprzedni dzień',                en: 'Previous day' },
    'stats.nextDay':    { pl: 'Następny dzień',                 en: 'Next day' },
    'common.close':     { pl: 'Zamknij',                        en: 'Close' },
    'stats.todayIs':    { pl: 'Dzisiaj',                        en: 'Today' },
    'stats.yesterday':  { pl: 'Wczoraj',                        en: 'Yesterday' },
    'cal.cellTitle':    { pl: '{date} - praca {work}, ranking {score}/100',
                          en: '{date} - work {work}, score {score}/100' },
    'cat.colorAria':    { pl: 'Kolor {color}',                  en: 'Colour {color}' },
    'common.session':   { pl: 'sesja',                          en: 'session' },

    'kpi.recorded':     { pl: 'Zarejestrowany czas',            en: 'Recorded time' },
    'kpi.work':         { pl: 'Praca',                          en: 'Work' },
    'kpi.avgScore':     { pl: 'Średni ranking',                 en: 'Average score' },
    'kpi.bestDay':      { pl: 'Najlepszy dzień',                en: 'Best day' },
    'kpi.total':        { pl: 'Łączny czas',                    en: 'Total time' },
    'kpi.sessions':     { pl: 'Sesje',                          en: 'Sessions' },
    'kpi.avgSession':   { pl: 'Średnia sesja',                  en: 'Average session' },
    'kpi.topCat':       { pl: 'Top kategoria',                  en: 'Top category' },

    'cal.title':        { pl: 'Kalendarz miesiąca',             en: 'Month calendar' },
    'cal.hint':         { pl: 'kliknij dzień, aby wejść w szczegóły',
                          en: 'click a day to open its full report' },
    'cal.legendNote':   { pl: 'kolor = ranking produktywności dnia',
                          en: 'colour = productivity score for that day' },
    'cal.mon':          { pl: 'pon',   en: 'Mon' },
    'cal.tue':          { pl: 'wt',    en: 'Tue' },
    'cal.wed':          { pl: 'śr',    en: 'Wed' },
    'cal.thu':          { pl: 'czw',   en: 'Thu' },
    'cal.fri':          { pl: 'pt',    en: 'Fri' },
    'cal.sat':          { pl: 'sob',   en: 'Sat' },
    'cal.sun':          { pl: 'ndz',   en: 'Sun' },

    'month.split':      { pl: 'Podział miesiąca',               en: 'Month breakdown' },
    'month.empty':      { pl: 'Brak zarejestrowanego czasu w tym miesiącu.',
                          en: 'No time recorded this month.' },
    'month.days':       { pl: '{n} dni z zapisem',              en: '{n} days with data' },

    'score.eyebrow':    { pl: 'Ranking produktywności',         en: 'Productivity score' },
    'score.great':      { pl: 'Świetny dzień',                  en: 'Great day' },
    'score.veryGood':   { pl: 'Bardzo dobry',                   en: 'Very good' },
    'score.solid':      { pl: 'Solidny',                        en: 'Solid' },
    'score.scattered':  { pl: 'Rozproszony',                    en: 'Scattered' },
    'score.easy':       { pl: 'Dzień na luzie',                 en: 'Easy day' },
    'score.fromWindows':{ pl: 'na podstawie aktywności okien',  en: 'based on window activity' },
    'score.fromManual': { pl: 'na podstawie ręcznych sesji - uruchom agenta, aby liczyć dokładniej',
                          en: 'based on manual sessions - run the agent for a sharper picture' },
    'score.offline':    { pl: 'Offline {pct}% ({time}) - poza wynikiem',
                          en: 'Offline {pct}% ({time}) - outside the score' },
    'score.focus':      { pl: 'Skupienie',                      en: 'Focus' },
    'score.focusHint':  { pl: 'praca wobec rozrywki',           en: 'work against recreation' },
    'score.volume':     { pl: 'Wolumen',                        en: 'Volume' },
    'score.volumeHint': { pl: '{done} z celu {goal}',           en: '{done} of the {goal} goal' },
    'score.streak':     { pl: 'Ciągłość',                       en: 'Continuity' },
    'score.streakHint': { pl: 'średni blok {time}',             en: 'average block {time}' },
    'score.noBlocks':   { pl: 'brak bloków pracy',              en: 'no work blocks' },

    'kind.work':        { pl: 'Praca',                          en: 'Work' },
    'kind.chill':       { pl: 'Rozrywka',                       en: 'Recreation' },
    'kind.neutral':     { pl: 'Neutralne',                      en: 'Neutral' },
    'kind.offline':     { pl: 'Offline',                        en: 'Offline' },
    'kind.unassigned':  { pl: 'Nieprzypisane',                  en: 'Unassigned' },
    'kind.noActivity':  { pl: 'Bez aktywności',                 en: 'No activity' },
    'kind.offlineWhy':  { pl: 'brak ruchu myszy i klawiatury',  en: 'no mouse or keyboard input' },

    'drill.title':      { pl: 'Szczegóły kategorii',            en: 'Category detail' },
    'drill.hint':       { pl: 'co, gdzie i ile',                en: 'what, where and how much' },
    'drill.aria':       { pl: 'Wybór kategorii',                en: 'Category picker' },
    'drill.empty':      { pl: 'Brak danych o oknach. Uruchom <b>agent.cmd</b>, aby CHRONOS widział, w czym faktycznie spędzasz czas.',
                          en: 'No window data yet. Run <b>agent.cmd</b> so CHRONOS can see where the time actually goes.' },
    'drill.share':      { pl: '{pct}% zarejestrowanego czasu',  en: '{pct}% of recorded time' },
    'drill.more':       { pl: '+ {n} więcej',                   en: '+ {n} more' },

    'split.title':      { pl: 'Rozkład czasu',                  en: 'Time split' },
    'split.measured':   { pl: 'zmierzone',                      en: 'measured' },
    'split.noData':     { pl: 'Brak danych dla tego dnia',      en: 'No data for this day' },
    'hours.title':      { pl: 'Aktywność godzinowa',            en: 'Hourly activity' },
    'hours.aria':       { pl: 'Wykres aktywności w godzinach',  en: 'Activity by hour chart' },
    'log.title':        { pl: 'Dziennik sesji',                 en: 'Session log' },
    'log.empty':        { pl: 'Brak sesji tego dnia.',          en: 'No sessions on this day.' },
    'log.count':        { pl: '{n} sesji',                      en: '{n} sessions' },
    'log.live':         { pl: 'Sesja w toku',                   en: 'Session in progress' },
    'log.delete':       { pl: 'Usuń sesję',                     en: 'Delete session' },
    'log.now':          { pl: 'teraz',                          en: 'now' },
    'log.inProgress':   { pl: ' · w toku',                      en: ' · in progress' },
    'cat.deleted':      { pl: 'Usunięta kategoria',             en: 'Deleted category' },
    'cat.editOne':      { pl: 'Edytuj kategorię {name}',        en: 'Edit category {name}' },
    'dial.hintNoCat':   { pl: 'Dodaj kategorię, aby zacząć',    en: 'Add a category to begin' },
    'mini.expand':      { pl: 'Powiększ',                       en: 'Expand' },
    'hours.none':       { pl: 'brak aktywności',                en: 'no activity' },
    'month.share':      { pl: '{pct}% miesiąca',                en: '{pct}% of the month' },
    'grace.why':        { pl: 'krótkie wejście - poniżej progu {time} na dobę',
                          en: 'quick visit - under the {time} daily threshold' },

    'foot.export':      { pl: 'Eksport JSON',                   en: 'Export JSON' },
    'foot.import':      { pl: 'Import',                         en: 'Import' },
    'foot.reset':       { pl: 'Wyczyść dane',                   en: 'Clear data' },
    'foot.importAria':  { pl: 'Plik JSON do importu',           en: 'JSON file to import' },
    'foot.note':        { pl: 'Dane zapisywane lokalnie w tej przeglądarce',
                          en: 'Data stored locally in this browser' },
    'foot.lang':        { pl: 'Język',                          en: 'Language' },

    'cat.setup':        { pl: 'Konfiguracja',                   en: 'Setup' },
    'cat.new':          { pl: 'Nowa kategoria',                 en: 'New category' },
    'cat.edit':         { pl: 'Edytuj kategorię',               en: 'Edit category' },
    'cat.nameLabel':    { pl: 'Nazwa',                          en: 'Name' },
    'cat.namePh':       { pl: 'np. Deep Work',                  en: 'e.g. Deep Work' },
    'cat.previewName':  { pl: 'Nazwa kategorii',                en: 'Category name' },
    'cat.recordedToday':{ pl: '{time} dzisiaj',                 en: '{time} today' },
    'cat.color':        { pl: 'Kolor akcentu',                  en: 'Accent colour' },
    'cat.kind':         { pl: 'Typ czasu',                      en: 'Time type' },
    'cat.kindAria':     { pl: 'Typ kategorii',                  en: 'Category type' },
    'cat.kindHint':     { pl: 'Decyduje, jak ta kategoria wpływa na ranking produktywności.',
                          en: 'Decides how this category affects the productivity score.' },
    'cat.rules':        { pl: 'Reguły auto-przypisania',        en: 'Auto-assign rules' },
    'cat.rulesHint':    { pl: 'Fragmenty nazwy procesu lub tytułu okna, po przecinku. Gdy agent jest uruchomiony, a przełącznik <b>AUTO</b> włączony, czas trafia tu automatycznie.',
                          en: 'Fragments of a process name or window title, comma separated. With the agent running and <b>AUTO</b> on, time lands here by itself.' },
    'cat.logo':         { pl: 'Logo',                           en: 'Logo' },
    'cat.tabMono':      { pl: 'Monogram',                       en: 'Monogram' },
    'cat.tabIcon':      { pl: 'Ikona',                          en: 'Icon' },
    'cat.iconAria':     { pl: 'Wybór ikony',                    en: 'Icon picker' },
    'cat.iconHint':     { pl: 'Ikona przejmuje kolor akcentu kategorii.',
                          en: 'The icon takes the category accent colour.' },
    'cat.tabFile':      { pl: 'Plik',                           en: 'File' },
    'cat.monoHint':     { pl: 'Dwie pierwsze litery nazwy na tle koloru akcentu.',
                          en: 'First two letters of the name on the accent colour.' },
    'cat.fileAria':     { pl: 'Plik graficzny logo',            en: 'Logo image file' },
    'cat.drop':         { pl: '<b>Wybierz plik</b> lub upuść tutaj',
                          en: '<b>Choose a file</b> or drop it here' },
    'cat.dropHint':     { pl: 'PNG, JPG, SVG - skalowane do 128 px',
                          en: 'PNG, JPG, SVG - scaled to 128 px' },
    'cat.changeImage':  { pl: 'Kliknij, aby zmienić',           en: 'Click to change' },
    'cat.delete':       { pl: 'Usuń kategorię',                 en: 'Delete category' },
    'common.cancel':    { pl: 'Anuluj',                         en: 'Cancel' },
    'common.save':      { pl: 'Zapisz',                         en: 'Save' },

    'seed.work':        { pl: 'Praca',                          en: 'Work' },
    'seed.chill':       { pl: 'Chill',                          en: 'Chill' },

    'toast.cleared':      { pl: 'Dane wyczyszczone',            en: 'Data cleared' },
    'toast.staleTab':     { pl: 'Inna karta CHRONOS ma nowsze dane - ta ich nie nadpisuje',
                            en: 'Another CHRONOS tab holds newer data - this one will not overwrite it' },
    'toast.noStorage':    { pl: 'Nie można zapisać danych lokalnie - sesja tymczasowa',
                            en: 'Local storage unavailable - this session is temporary' },
    'toast.switched':     { pl: 'Przełączono na: {name}',       en: 'Switched to: {name}' },
    'toast.addCatFirst':  { pl: 'Najpierw dodaj kategorię',     en: 'Add a category first' },
    'toast.saved':        { pl: 'Zapisano {time} - {name}',     en: 'Saved {time} - {name}' },
    'toast.tooShort':     { pl: 'Sesja za krótka, pominięto',   en: 'Session too short, skipped' },
    'toast.discarded':    { pl: 'Sesja odrzucona',              en: 'Session discarded' },
    'toast.targetHit':    { pl: 'Cel {min} min osiągnięty',     en: 'Target of {min} min reached' },
    'toast.offlineCut':   { pl: 'Offline - pomiar wstrzymany, odjęto {time}',
                            en: 'Offline - timer paused, {time} subtracted' },
    'toast.back':         { pl: 'Powrót - pomiar wznowiony',    en: 'Back - timer resumed' },
    'toast.agentOn':      { pl: 'Agent podłączony - widzi aktywne okno',
                            en: 'Agent connected - it can see the active window' },
    'toast.agentOff':     { pl: 'Agent rozłączony',             en: 'Agent disconnected' },
    'toast.autoSwitch':   { pl: 'Auto: {from}{name}',           en: 'Auto: {from}{name}' },
    'toast.miniNeeds':    { pl: 'Mini-okno wymaga Chrome, Edge lub Opery (Document PiP)',
                            en: 'The mini window needs Chrome, Edge or Opera (Document PiP)' },
    'toast.miniFailed':   { pl: 'Nie udało się otworzyć mini-okna',
                            en: 'Could not open the mini window' },
    'toast.sessionGone':  { pl: 'Usunięto sesję {time}',        en: 'Session of {time} removed' },
    'toast.sessionBack':  { pl: 'Przywrócono sesję',            en: 'Session restored' },
    'toast.fileTooBig':   { pl: 'Plik za duży (max 6 MB)',      en: 'File too large (6 MB max)' },
    'toast.imageFailed':  { pl: 'Nie udało się wczytać obrazu', en: 'Could not load the image' },
    'toast.catUpdated':   { pl: 'Zaktualizowano: {name}',       en: 'Updated: {name}' },
    'toast.catAdded':     { pl: 'Dodano kategorię: {name}',     en: 'Category added: {name}' },
    'toast.catDeleted':   { pl: 'Usunięto: {name}',             en: 'Deleted: {name}' },
    'toast.exported':     { pl: 'Wyeksportowano dane',          en: 'Data exported' },
    'toast.imported':     { pl: 'Zaimportowano dane',           en: 'Data imported' },
    'toast.badJson':      { pl: 'Nieprawidłowy plik JSON',      en: 'Invalid JSON file' },
    'toast.resumed':      { pl: 'Wznowiono sesję: {name} · {time}',
                            en: 'Session resumed: {name} · {time}' },
    'toast.waiting':      { pl: 'Sesja {name} ({time}) czeka wstrzymana - kliknij, aby wznowić',
                            en: 'Session {name} ({time}) is on hold - click to resume' },
    'toast.loadFailed':   { pl: 'Nie udało się wczytać zapisu - oryginał zachowany w chronos.v1.uszkodzone',
                            en: 'Could not read the save - the original is kept in chronos.v1.uszkodzone' },
    'toast.autoOn':       { pl: 'Auto-przypisanie włączone - kategoria pójdzie za aktywnym oknem',
                            en: 'Auto-assign on - the category follows the active window' },
    'toast.autoOff':      { pl: 'Auto-przypisanie wyłączone',   en: 'Auto-assign off' },
    'toast.undo':         { pl: 'Cofnij',                       en: 'Undo' },

    'confirm.deleteCat':  { pl: 'Usunąć kategorię „{name}”?',   en: 'Delete the category “{name}”?' },
    'confirm.keepsSessions': { pl: '\n\nZapisane sesje ({n}) pozostaną w statystykach jako archiwalne.',
                               en: '\n\nIts saved sessions ({n}) stay in the statistics as archived.' },
    'confirm.import':     { pl: 'Zastąpić bieżące dane zaimportowanymi?\n\nKategorie: {cats}, sesje: {sessions}',
                            en: 'Replace current data with the imported file?\n\nCategories: {cats}, sessions: {sessions}' },
    'confirm.reset':      { pl: 'Usunąć wszystkie dane?\n\nKategorie: {cats}, zapisane sesje: {sessions}\n\nTej operacji nie da się cofnąć - zrób najpierw eksport, jeśli chcesz zachować historię.',
                            en: 'Delete all data?\n\nCategories: {cats}, saved sessions: {sessions}\n\nThis cannot be undone - export first if you want to keep the history.' },

    'lang.kicker':      { pl: 'Wybór języka',                   en: 'Choose language' },
    'lang.title':       { pl: 'Język / Language',               en: 'Language / Język' },
    'lang.body':        { pl: 'Możesz to zmienić w każdej chwili - na dole okna statystyk.',
                          en: 'You can change this any time - at the bottom of the statistics window.' },
    'lang.pl':          { pl: 'Polski',                         en: 'Polski' },
    'lang.en':          { pl: 'English',                        en: 'English' },
    'lang.privacy':     { pl: 'Wszystko zostaje na tym komputerze. CHRONOS nie ma konta, serwera ani wysyłki - Twoja historia leży w tej przeglądarce i nigdzie indziej.',
                          en: 'Everything stays on this computer. CHRONOS has no account, no server and no upload - your history lives in this browser and nowhere else.' }
  };

  // Polskie nazwy z classify.js trafiają do dziennika bez zmian,
  // tłumaczone są dopiero przy wyświetlaniu.
  var LABELS = {
    'Wiersz poleceń':     'Command Prompt',
    'Eksplorator plików': 'File Explorer',
    'Wyszukiwanie':       'Search',
    'Ustawienia':         'Settings',
    'Pulpit':             'Desktop',
    'Ekran blokady':      'Lock screen',
    'Menedżer zadań':     'Task Manager',
    'Aplikacja':          'App',
    'Nieznana aplikacja': 'Unknown app',
    'Poczta':             'Mail',
    'Wideokonferencja':   'Video call',
    'Oferty pracy':       'Job boards',
    'Memy':               'Memes',
    'Portal':             'News portal',
    'Zakupy':             'Shopping',
    'Dla dorosłych':      'Adult',
    'Bukmacher':          'Betting',
    'Sport':              'Sports',
    'Bez aktywności':     'No activity'
  };
  var LABELS_PL = {};
  for (var lk in LABELS) {
    if (Object.prototype.hasOwnProperty.call(LABELS, lk)) LABELS_PL[LABELS[lk]] = lk;
  }
  var OTHER_SUFFIX = / (?:\u2014|-) (inne|other)$/;

  var lang = FALLBACK;

  function normalize(code) {
    var c = String(code || '').toLowerCase();
    if (c.indexOf('pl') === 0) return 'pl';
    if (c.indexOf('en') === 0) return 'en';
    return null;
  }

  // null = język jeszcze nie wybrany
  function stored() {
    try { return normalize(localStorage.getItem(KEY)); }
    catch (e) { return null; }
  }

  // z ustawień przeglądarki, tylko jako domyślne zaznaczenie
  function guess() {
    var nav = global.navigator || {};
    var list = nav.languages || [nav.language || ''];
    for (var i = 0; i < list.length; i++) {
      var hit = normalize(list[i]);
      if (hit) return hit;
    }
    return FALLBACK;
  }

  function t(key, vars) {
    var entry = DICT[key];
    if (!entry) return key;
    var s = entry[lang] != null ? entry[lang] : entry[FALLBACK];
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] != null ? String(vars[name]) : m;
    });
  }

  // data-i18n -> textContent, data-i18n-html -> innerHTML (<b>, <br>),
  // data-i18n-attr="atrybut:klucz, atrybut:klucz"
  function apply(root) {
    var doc = (root && root.ownerDocument) || global.document;
    var scope = root || doc;
    if (!scope || !scope.querySelectorAll) return;

    var i, nodes;

    nodes = scope.querySelectorAll('[data-i18n]');
    for (i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));

    nodes = scope.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < nodes.length; i++) nodes[i].innerHTML = t(nodes[i].getAttribute('data-i18n-html'));

    nodes = scope.querySelectorAll('[data-i18n-attr]');
    for (i = 0; i < nodes.length; i++) {
      var pairs = nodes[i].getAttribute('data-i18n-attr').split(',');
      for (var j = 0; j < pairs.length; j++) {
        var bits = pairs[j].split(':');
        if (bits.length === 2) nodes[i].setAttribute(bits[0].trim(), t(bits[1].trim()));
      }
    }

    if (doc.documentElement) doc.documentElement.lang = lang;
    var title = doc.querySelector('title');
    if (title) title.textContent = t('app.title');
  }

  function label(name) {
    var s = String(name == null ? '' : name);
    var map = lang === 'en' ? LABELS : LABELS_PL;
    if (Object.prototype.hasOwnProperty.call(map, s)) return map[s];
    if (OTHER_SUFFIX.test(s)) return s.replace(OTHER_SUFFIX, lang === 'en' ? ' - other' : ' - inne');
    return s;
  }

  function set(code, persist) {
    var next = normalize(code) || FALLBACK;
    lang = next;
    if (persist !== false) {
      try { localStorage.setItem(KEY, next); } catch (e) {}
    }
    apply();
    return next;
  }

  lang = stored() || guess();

  global.CHRONOS_I18N = {
    t: t,
    label: label,
    apply: apply,
    set: set,
    stored: stored,
    guess: guess,
    get: function () { return lang; },
    locale: function () { return LOCALES[lang] || LOCALES[FALLBACK]; },
    DICT: DICT
  };
})(window);
