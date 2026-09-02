/* ══════════════════════════════════════════════════════════════
   CHRONOS — klasyfikator aktywności

   Zamienia surowe "chrome.exe" + "(2) React useEffect - YouTube - Google
   Chrome" na sensowną informację: jaka aplikacja, jaka karta, jaki serwis
   i czy to praca, czy chill.

   Zasada: nic nie decyduje pojedyncza reguła. Sygnały sumują się w dwa
   wyniki (praca / chill) i wygrywa mocniejszy. Dzięki temu:
     "React tutorial - YouTube"      → PRACA   (react 3 + tutorial 2 > youtube 2)
     "Minecraft speedrun - YouTube"  → CHILL   (youtube 2 + minecraft 5 > 0)
     "Excel formuły kurs - YouTube"  → PRACA   (excel 3 + kurs 2 > youtube 2)

   Listy niżej są celowo zwykłymi tablicami — dopisanie własnej strony,
   gry czy programu to jedna linia.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ─────────────── przeglądarki: jak obciąć sufiks tytułu ─────────────── */

  var BROWSERS = [
    { exe: 'chrome.exe',    name: 'Chrome' },
    { exe: 'msedge.exe',    name: 'Edge' },
    { exe: 'firefox.exe',   name: 'Firefox' },
    { exe: 'brave.exe',     name: 'Brave' },
    { exe: 'opera.exe',     name: 'Opera' },
    { exe: 'opera_gx.exe',  name: 'Opera GX' },
    { exe: 'vivaldi.exe',   name: 'Vivaldi' },
    { exe: 'arc.exe',       name: 'Arc' },
    { exe: 'zen.exe',       name: 'Zen' },
    { exe: 'librewolf.exe', name: 'LibreWolf' },
    { exe: 'iexplore.exe',  name: 'Internet Explorer' }
  ];

  // sufiksy doklejane przez przeglądarki do tytułu karty
  var BROWSER_SUFFIX = new RegExp(
    '\\s*[-—–|]\\s*(' +
    'Google Chrome|Chrome|Microsoft\\s*Edge|Mozilla Firefox|Firefox|' +
    'Brave|Opera GX|Opera|Vivaldi|Arc|Zen Browser|LibreWolf|Internet Explorer' +
    ')\\s*$', 'i'
  );
  var EDGE_PROFILE = /\s*[-—–]\s*(Osobiste|Personal|Praca|Work|Profil\s*\d+|Profile\s*\d+)\s*$/i;
  var MORE_PAGES = /\s+(and|i)\s+\d+\s+(more pages?|innych stron|inne strony)\s*$/i;
  var NOTIF_COUNT = /^\s*\(\d+\+?\)\s*/;
  var AUDIO_MARK = /^\s*[▶🔊🔇]\s*/;

  /* ─────────────── aplikacje ─────────────── */
  /* waga 5-6 = sygnał mocny, przebija wszystko z tytułu */

  var APPS = [
    // programowanie i narzędzia
    { m: 'code.exe',       n: 'Visual Studio Code', k: 'work',  w: 6 },
    { m: 'code - insiders', n: 'VS Code Insiders',  k: 'work',  w: 6 },
    { m: 'cursor.exe',     n: 'Cursor',             k: 'work',  w: 6 },
    { m: 'devenv.exe',     n: 'Visual Studio',      k: 'work',  w: 6 },
    { m: 'idea64.exe',     n: 'IntelliJ IDEA',      k: 'work',  w: 6 },
    { m: 'pycharm64.exe',  n: 'PyCharm',            k: 'work',  w: 6 },
    { m: 'webstorm64.exe', n: 'WebStorm',           k: 'work',  w: 6 },
    { m: 'rider64.exe',    n: 'Rider',              k: 'work',  w: 6 },
    { m: 'sublime_text',   n: 'Sublime Text',       k: 'work',  w: 6 },
    { m: 'windowsterminal', n: 'Terminal',          k: 'work',  w: 5 },
    { m: 'powershell.exe', n: 'PowerShell',         k: 'work',  w: 5 },
    { m: 'pwsh.exe',       n: 'PowerShell',         k: 'work',  w: 5 },
    { m: 'cmd.exe',        n: 'Wiersz poleceń',     k: 'work',  w: 5 },
    { m: 'mintty.exe',     n: 'Git Bash',           k: 'work',  w: 5 },
    { m: 'postman.exe',    n: 'Postman',            k: 'work',  w: 6 },
    { m: 'dbeaver.exe',    n: 'DBeaver',            k: 'work',  w: 6 },
    { m: 'ssms.exe',       n: 'SQL Server Mgmt',    k: 'work',  w: 6 },
    { m: 'docker desktop', n: 'Docker Desktop',     k: 'work',  w: 5 },
    { m: 'githubdesktop',  n: 'GitHub Desktop',     k: 'work',  w: 6 },
    { m: 'sourcetree',     n: 'Sourcetree',         k: 'work',  w: 6 },

    // biuro i dokumenty
    { m: 'winword.exe',    n: 'Word',               k: 'work',  w: 5 },
    { m: 'excel.exe',      n: 'Excel',              k: 'work',  w: 5 },
    { m: 'powerpnt.exe',   n: 'PowerPoint',         k: 'work',  w: 5 },
    { m: 'outlook.exe',    n: 'Outlook',            k: 'work',  w: 4 },
    { m: 'onenote',        n: 'OneNote',            k: 'work',  w: 4 },
    { m: 'acrobat',        n: 'Acrobat',            k: 'work',  w: 4 },
    { m: 'acrord32',       n: 'Acrobat Reader',     k: 'work',  w: 4 },
    { m: 'soffice',        n: 'LibreOffice',        k: 'work',  w: 5 },
    { m: 'notion.exe',     n: 'Notion',             k: 'work',  w: 5 },
    { m: 'obsidian.exe',   n: 'Obsidian',           k: 'work',  w: 5 },
    { m: 'todoist',        n: 'Todoist',            k: 'work',  w: 4 },

    // komunikacja (praca, ale słabszy sygnał)
    { m: 'teams.exe',      n: 'Microsoft Teams',    k: 'work',  w: 4 },
    { m: 'ms-teams.exe',   n: 'Microsoft Teams',    k: 'work',  w: 4 },
    { m: 'slack.exe',      n: 'Slack',              k: 'work',  w: 4 },
    { m: 'zoom.exe',       n: 'Zoom',               k: 'work',  w: 4 },
    { m: 'webex',          n: 'Webex',              k: 'work',  w: 4 },
    { m: 'thunderbird',    n: 'Thunderbird',        k: 'work',  w: 4 },

    // projektowanie i wideo
    { m: 'figma.exe',      n: 'Figma',              k: 'work',  w: 6 },
    { m: 'photoshop.exe',  n: 'Photoshop',          k: 'work',  w: 5 },
    { m: 'illustrator.exe', n: 'Illustrator',       k: 'work',  w: 5 },
    { m: 'afterfx.exe',    n: 'After Effects',      k: 'work',  w: 5 },
    { m: 'adobe premiere', n: 'Premiere Pro',       k: 'work',  w: 5 },
    { m: 'resolve.exe',    n: 'DaVinci Resolve',    k: 'work',  w: 5 },
    { m: 'blender.exe',    n: 'Blender',            k: 'work',  w: 5 },
    { m: 'unity.exe',      n: 'Unity',              k: 'work',  w: 5 },
    { m: 'unrealeditor',   n: 'Unreal Editor',      k: 'work',  w: 5 },
    { m: 'obs64.exe',      n: 'OBS Studio',         k: 'work',  w: 4 },

    // rozrywka
    { m: 'steam.exe',          n: 'Steam',            k: 'chill', w: 6 },
    { m: 'steamwebhelper',     n: 'Steam',            k: 'chill', w: 6 },
    { m: 'epicgameslauncher',  n: 'Epic Games',       k: 'chill', w: 6 },
    { m: 'battle.net',         n: 'Battle.net',       k: 'chill', w: 6 },
    { m: 'riotclient',         n: 'Riot Client',      k: 'chill', w: 6 },
    { m: 'leagueclient',       n: 'League of Legends', k: 'chill', w: 6 },
    { m: 'league of legends',  n: 'League of Legends', k: 'chill', w: 6 },
    { m: 'valorant',           n: 'VALORANT',         k: 'chill', w: 6 },
    { m: 'cs2.exe',            n: 'Counter-Strike 2', k: 'chill', w: 6 },
    { m: 'aimlab',             n: 'Aim Lab',          k: 'chill', w: 6 },
    { m: 'aim lab',            n: 'Aim Lab',          k: 'chill', w: 6 },
    { m: 'among us',           n: 'Among Us',         k: 'chill', w: 6 },
    { m: 'amongus',            n: 'Among Us',         k: 'chill', w: 6 },
    { m: 'dota2.exe',          n: 'Dota 2',           k: 'chill', w: 6 },
    { m: 'gta5.exe',           n: 'GTA V',            k: 'chill', w: 6 },
    { m: 'minecraft',          n: 'Minecraft',        k: 'chill', w: 6 },
    { m: 'javaw.exe',          n: 'Minecraft (Java)', k: 'chill', w: 4 },
    { m: 'robloxplayer',       n: 'Roblox',           k: 'chill', w: 6 },
    { m: 'fortniteclient',     n: 'Fortnite',         k: 'chill', w: 6 },
    { m: 'discord.exe',        n: 'Discord',          k: 'work',  w: 3 },
    { m: 'spotify.exe',        n: 'Spotify',          k: 'chill', w: 3 },
    { m: 'vlc.exe',            n: 'VLC',              k: 'chill', w: 4 },
    { m: 'mpc-hc',             n: 'MPC-HC',          k: 'chill', w: 4 },
    { m: 'netflix.exe',        n: 'Netflix',          k: 'chill', w: 6 },
    { m: 'telegram.exe',       n: 'Telegram',         k: 'chill', w: 3 },
    { m: 'whatsapp.exe',       n: 'WhatsApp',         k: 'chill', w: 3 },

    // neutralne — system, nie liczymy tego ani na plus, ani na minus
    { m: 'explorer.exe',       n: 'Eksplorator plików', k: 'neutral', w: 3 },
    { m: 'searchhost',         n: 'Wyszukiwanie',       k: 'neutral', w: 3 },
    { m: 'systemsettings',     n: 'Ustawienia',         k: 'neutral', w: 3 },
    { m: 'shellexperiencehost', n: 'Pulpit',            k: 'neutral', w: 3 },
    { m: 'lockapp.exe',        n: 'Ekran blokady',      k: 'neutral', w: 5 },
    { m: 'taskmgr.exe',        n: 'Menedżer zadań',     k: 'neutral', w: 3 },
    { m: 'applicationframehost', n: 'Aplikacja',        k: 'neutral', w: 1 }
  ];

  /* ─────────────── serwisy w przeglądarce ─────────────── */
  /* w = jak mocny to sygnał. YouTube celowo słaby (2) — bywa i pracą, i chillem */

  var SITES = [
    // praca / narzędzia
    { m: ['github'],                    n: 'GitHub',          k: 'work',  w: 5 },
    { m: ['gitlab'],                    n: 'GitLab',          k: 'work',  w: 5 },
    { m: ['stack overflow', 'stackoverflow'], n: 'Stack Overflow', k: 'work', w: 5 },
    { m: ['mdn web docs', 'developer.mozilla'], n: 'MDN',     k: 'work',  w: 5 },
    { m: ['jira', 'atlassian'],         n: 'Jira',            k: 'work',  w: 5 },
    { m: ['confluence'],                n: 'Confluence',      k: 'work',  w: 5 },
    { m: ['linear.app', '· linear'],    n: 'Linear',          k: 'work',  w: 5 },
    { m: ['asana'],                     n: 'Asana',           k: 'work',  w: 5 },
    { m: ['trello'],                    n: 'Trello',          k: 'work',  w: 4 },
    { m: ['notion'],                    n: 'Notion',          k: 'work',  w: 4 },
    { m: ['figma'],                     n: 'Figma',           k: 'work',  w: 5 },
    { m: ['google docs', 'dokumenty google'], n: 'Google Docs', k: 'work', w: 4 },
    { m: ['google sheets', 'arkusze google'], n: 'Google Sheets', k: 'work', w: 4 },
    { m: ['google slides', 'prezentacje google'], n: 'Google Slides', k: 'work', w: 4 },
    { m: ['google drive', 'dysk google'], n: 'Google Drive',  k: 'work',  w: 3 },
    { m: ['gmail', 'poczta'],           n: 'Poczta',          k: 'work',  w: 3 },
    { m: ['outlook'],                   n: 'Outlook',         k: 'work',  w: 3 },
    { m: ['overleaf'],                  n: 'Overleaf',        k: 'work',  w: 5 },
    // spotkania online — wyszly z prawdziwego uzycia, wczesniej bez sygnalu
    { m: ['meet.google', 'google meet', /^meet\s*($|[—–|-])/], n: 'Google Meet', k: 'work', w: 5 },
    { m: ['zoom.us', 'zoom meeting', /^zoom\s*($|[—–|-])/],
                                        n: 'Zoom',            k: 'work',  w: 5 },
    { m: ['teams.microsoft', 'microsoft teams'], n: 'Teams',   k: 'work',  w: 5 },
    { m: ['whereby', 'jitsi', 'webex'], n: 'Wideokonferencja', k: 'work',  w: 5 },
    { m: ['slack.com', /^slack\s*($|[—–|-])/, /[—–|-]\s*slack\s*$/],
                                        n: 'Slack',           k: 'work',  w: 4 },
    { m: ['chatgpt', 'openai'],         n: 'ChatGPT',         k: 'work',  w: 3 },
    { m: ['claude.ai', 'claude'],       n: 'Claude',          k: 'work',  w: 3 },
    { m: ['perplexity'],                n: 'Perplexity',      k: 'work',  w: 3 },
    { m: ['vercel'],                    n: 'Vercel',          k: 'work',  w: 5 },
    { m: ['netlify'],                   n: 'Netlify',         k: 'work',  w: 5 },
    { m: ['aws console', 'amazon web services'], n: 'AWS',    k: 'work',  w: 5 },
    { m: ['azure portal'],              n: 'Azure',           k: 'work',  w: 5 },
    { m: ['cloudflare'],                n: 'Cloudflare',      k: 'work',  w: 5 },
    { m: ['npm', 'npmjs'],              n: 'npm',             k: 'work',  w: 4 },
    { m: ['pypi'],                      n: 'PyPI',            k: 'work',  w: 4 },
    { m: ['localhost', '127.0.0.1'],    n: 'localhost',       k: 'work',  w: 5 },
    { m: ['kaggle'],                    n: 'Kaggle',          k: 'work',  w: 5 },
    { m: ['coursera'],                  n: 'Coursera',        k: 'work',  w: 5 },
    { m: ['udemy'],                     n: 'Udemy',           k: 'work',  w: 5 },
    { m: ['linkedin'],                  n: 'LinkedIn',        k: 'work',  w: 3 },
    { m: ['pracuj.pl', 'nofluffjobs', 'justjoin'], n: 'Oferty pracy', k: 'work', w: 4 },

    // rozrywka
    // YouTube celowo slaby (2): dopiero konkretny temat z WORK_WORDS przewazy
    // go na prace. Samo "tutorial" nie wystarcza — patrz nizej.
    { m: ['youtube'],                   n: 'YouTube',         k: 'chill', w: 2 },
    { m: ['twitch'],                    n: 'Twitch',          k: 'chill', w: 3 },
    { m: ['kick.com', '- kick', '| kick'], n: 'Kick',         k: 'chill', w: 3 },
    { m: ['netflix'],                   n: 'Netflix',         k: 'chill', w: 6 },
    { m: ['hbo max', 'max.com'],        n: 'HBO Max',         k: 'chill', w: 6 },
    { m: ['disney+', 'disneyplus'],     n: 'Disney+',         k: 'chill', w: 6 },
    { m: ['player.pl', 'cda.pl', 'vod.pl'], n: 'VOD',         k: 'chill', w: 6 },
    { m: ['filmweb', 'imdb'],           n: 'Filmweb / IMDb',  k: 'chill', w: 4 },
    /* Komunikatory to u tego uzytkownika kanal kontaktu z klientem, a nie
       rozrywka — stad 'work'. Waga celowo niska (3): to slaby sygnal, wiec
       konkretny tytul rozrywkowy nadal go przebije. Messenger musi stac
       PRZED Facebookiem, bo "Facebook Messenger" zawiera oba slowa,
       a petla nizej konczy sie na pierwszym trafieniu. */
    { m: ['messenger'],                 n: 'Messenger',       k: 'work',  w: 3 },
    { m: ['discord'],                   n: 'Discord',         k: 'work',  w: 3 },
    /* short: true = krotki format. Rolka bywa tez skutkiem szukania czegos
       do pracy, wiec liczy sie dopiero po przekroczeniu dziennego progu
       (SHORT_GRACE w app.js) — sam klasyfikator tylko to oznacza. */
    { m: ['tiktok'],                    n: 'TikTok',          k: 'chill', w: 6, short: true },
    { m: ['instagram'],                 n: 'Instagram',       k: 'chill', w: 5, short: true },
    { m: ['facebook'],                  n: 'Facebook',        k: 'work',  w: 3 },
    { m: ['twitter', 'x.com'],          n: 'X / Twitter',     k: 'chill', w: 4 },
    { m: ['reddit'],                    n: 'Reddit',          k: 'chill', w: 3 },
    { m: ['wykop'],                     n: 'Wykop',           k: 'chill', w: 5 },
    { m: ['kwejk', 'demotywatory', '9gag'], n: 'Memy',        k: 'chill', w: 6 },
    { m: ['onet', 'wp.pl', 'interia', 'o2.pl'], n: 'Portal',  k: 'chill', w: 4 },
    { m: ['allegro', 'olx', 'aliexpress', 'temu'], n: 'Zakupy', k: 'chill', w: 5 },
    { m: ['spotify'],                   n: 'Spotify',         k: 'chill', w: 3 },
    { m: ['steam'],                     n: 'Steam',           k: 'chill', w: 5 },
    { m: ['pornhub', 'xvideos', 'xnxx', 'onlyfans'], n: 'Dla dorosłych', k: 'chill', w: 6 },
    { m: ['betclic', 'sts.pl', 'fortuna', 'kasyno'], n: 'Bukmacher', k: 'chill', w: 6 },
    { m: ['flashscore', 'sport.pl', 'przegladsportowy'], n: 'Sport', k: 'chill', w: 4 }
  ];

  /* ─────────────── słowa kluczowe w tytule ─────────────── */

  // sygnały, że to jednak research do pracy (nawet na YouTube)
  var WORK_WORDS = [
    // profesjonalny kontekst — samo w sobie znaczy "praca"
    { m: ['dokumentacj*', 'documentation', ' docs', 'webinar*', 'konferencj*',
          'wykład*', 'lecture', 'szkoleni*', 'certyfikat*', 'onboarding'], w: 3 },
    // instruktaż jest generyczny: "jak zrobić naleśniki" to nie praca.
    // Wzmacnia temat, ale sam nie przeważa.
    { m: ['tutorial', 'kurs', 'kursy', 'course', 'poradnik*', 'jak zrobić', 'how to',
          'crash course', 'deep dive', 'explained'], w: 1 },
    { m: ['javascript', 'typescript', 'python', 'java ', 'c++', 'c#', 'rust ',
          'golang', ' php', 'sql ', 'react', 'vue', 'angular', 'svelte',
          'node.js', 'nodejs', 'django', 'flask', 'laravel', '.net'], w: 4 },
    { m: ['docker', 'kubernetes', 'devops', 'ci/cd', 'terraform', 'linux',
          'nginx', 'api ', 'rest api', 'graphql', 'backend', 'frontend',
          'algorytm*', 'algorithm', 'baza danych', 'database'], w: 4 },
    { m: ['excel', 'formuł*', 'tabela przestawna', 'power bi', 'analityk*',
          'analytics', 'marketing', 'seo', 'copywriting', 'faktur*',
          'księgow*', 'podatk*', 'budżet*', 'biznesplan'], w: 3 },
    { m: ['figma', 'ui design', 'ux ', 'design system', 'prototyp'], w: 3 },
    { m: ['prac*', 'projekt*', 'klient*', 'ofert*', 'raport*', 'prezentacj*',
          'spotkani*', 'meeting', 'deadline'], w: 2 }
  ];

  // sygnały rozrywki — gry i "głupotki" biją research
  var CHILL_WORDS = [
    { m: ['minecraft', 'fortnite', 'valorant', 'league of legends', ' lol ',
          'counter-strike', 'cs2', 'cs:go', 'gta', 'fifa', 'ea fc',
          'call of duty', 'warzone', 'apex legends', 'overwatch', 'dota',
          'world of warcraft', 'elden ring', 'roblox', 'among us',
          'rocket league', 'the witcher', 'wiedźmin', 'cyberpunk',
          'aim lab', 'aimlab', 'aimlabs'], w: 5 },
    { m: ['gameplay', 'speedrun', 'letsplay', "let's play", 'walkthrough',
          'no commentary', 'montaż wideo', 'highlights', 'funny moments'], w: 4 },
    { m: ['vlog', 'podcast #', 'reakcj*', 'reaction', 'prank', 'challenge',
          'mem', 'memy', 'śmiesz*', 'najlepsze wpadki', 'compilation',
          'tiktok', 'shorts', 'trailer', 'zwiastun*', 'odcinek', 'odcinka', 'sezon*',
          'serial*', 'film cały', 'cały film'], w: 4 },
    { m: ['muzyk*', 'music', 'official video', 'teledysk*', 'lyrics',
          'koncert', 'mix ', 'playlist'], w: 3 },
    { m: ['mecz*', 'transmisj*', 'liga mistrzów', 'ekstraklasa', 'nba', 'ufc'], w: 4 }
  ];

  /* ─────────────── spotkania online ───────────────
     Osobna lista, bo spotkanie rzadzi sie inna zasada niz reszta: podczas
     rozmowy zwykle sie SLUCHA. Mysz stoi, klawiatura milczy, a Ty jestes.
     app.js czyta to i nie wysyla Cie w takiej chwili na offline. */

  var MEETING_APPS = [
    { m: 'zoom.exe',     n: 'Zoom' },
    { m: 'cpthost.exe',  n: 'Zoom' },          // okno samego spotkania Zoom
    { m: 'slack.exe',    n: 'Slack' },
    { m: 'teams.exe',    n: 'Microsoft Teams' },
    { m: 'ms-teams.exe', n: 'Microsoft Teams' },
    { m: 'webex',        n: 'Webex' }
  ];

  var MEETING_SITES = [
    { m: ['meet.google', 'google meet', /^meet\s*($|[—–|-])/], n: 'Google Meet' },
    { m: ['zoom.us', 'zoom meeting', 'zoom workplace', /^zoom\s*($|[—–|-])/], n: 'Zoom' },
    { m: ['teams.microsoft', 'microsoft teams'],         n: 'Microsoft Teams' },
    { m: ['whereby', 'jitsi', 'webex', 'discord.com/channels'], n: 'Wideokonferencja' },
    { m: ['slack.com', /^slack\s*($|[—–|-])/, /[—–|-]\s*slack\s*$/], n: 'Slack' }
  ];

  /* ─────────────── krotkie formaty ───────────────
     Rolka albo short bywa tez zwyklym szukaniem czegos do pracy. Tutaj
     tylko je ZNACZYMY; o tym, czy sie licza, decyduje dzienny prog w app.js. */

  var SHORT_WORDS = ['#shorts', 'shorts', 'reels', 'rolki', 'rolka', 'youtube shorts'];

  /* ─────────────── logika ─────────────── */

  function norm(s) {
    return String(s || '').replace(/\u200B/g, '').replace(/\s+/g, ' ').trim();
  }

  /* Dopasowanie po CALYCH wyrazach, nie po fragmentach.
     Bez tego 'dota' lapie sie w "dotacja", a 'mem' w "pamiec".
     Wzorce ze znakami specjalnymi ('c++', 'cs:go', 'wp.pl') zostaja
     przy zwyklym szukaniu fragmentu — tam granice wyrazu nie maja sensu. */
  var WORDS_ONLY = /^[a-z0-9ąćęłńóśźż ]+$/;

  function makeHay(text) {
    var raw = String(text || '').toLowerCase();
    var words = ' ' + raw.replace(/[^a-z0-9ąćęłńóśźż]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    return { raw: raw, words: words };
  }

  function hasSignal(hay, pattern) {
    /* Wyrazenie regularne — gdy liczy sie ksztalt calego tytulu, a nie samo
       wystapienie slowa. Karta Google Meet to doslownie "Meet — kod-spotkania",
       a zwykle 'meet' zlapaloby tez "Meet the team". */
    if (pattern instanceof RegExp) return pattern.test(hay.raw);

    var p = String(pattern).toLowerCase().trim();
    if (!p) return false;

    // 'podatk*' = wyraz zaczynajacy sie od rdzenia — polska odmiana bez
    // ryzyka, ze 'dota' zlapie sie w srodku "dotacji"
    if (p.charAt(p.length - 1) === '*') {
      var stem = p.slice(0, -1).trim();
      return stem.length > 2 && hay.words.indexOf(' ' + stem) !== -1;
    }

    if (WORDS_ONLY.test(p)) return hay.words.indexOf(' ' + p + ' ') !== -1;
    return hay.raw.indexOf(p) !== -1;
  }

  function findBrowser(exe) {
    var e = String(exe || '').toLowerCase();
    for (var i = 0; i < BROWSERS.length; i++) {
      if (e.indexOf(BROWSERS[i].exe) !== -1) return BROWSERS[i];
    }
    return null;
  }

  /* zdejmuje z tytułu wszystko, co dokleiła przeglądarka */
  function cleanTab(title) {
    var t = norm(title);
    t = t.replace(NOTIF_COUNT, '').replace(AUDIO_MARK, '');
    var prev = null;
    // sufiksy potrafią się nakładać: "Tytuł and 2 more pages - Personal - Edge"
    while (t !== prev) {
      prev = t;
      t = t.replace(BROWSER_SUFFIX, '');
      t = t.replace(EDGE_PROFILE, '');
      t = t.replace(MORE_PAGES, '');
      t = t.trim();
    }
    return t;
  }

  /* Czy to okno rozmowy? Nazwa spotkania albo null. */
  function meetingOf(exe, title) {
    var app = String(exe || '').toLowerCase();
    for (var i = 0; i < MEETING_APPS.length; i++) {
      if (app.indexOf(MEETING_APPS[i].m) !== -1) return MEETING_APPS[i].n;
    }
    if (!findBrowser(app)) return null;
    var hay = makeHay(cleanTab(title));
    for (var j = 0; j < MEETING_SITES.length; j++) {
      var words = MEETING_SITES[j].m;
      for (var k = 0; k < words.length; k++) {
        if (hasSignal(hay, words[k])) return MEETING_SITES[j].n;
      }
    }
    return null;
  }

  function scanList(list, hay, out) {
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      var words = entry.m;
      for (var j = 0; j < words.length; j++) {
        if (hasSignal(hay, words[j])) {
          out.push({ w: entry.w, label: words[j] });
          break;               // jedna kategoria słów punktuje raz
        }
      }
    }
  }

  function sum(hits, cap) {
    var total = 0;
    for (var i = 0; i < hits.length; i++) total += hits[i].w;
    return cap ? Math.min(total, cap) : total;
  }

  /**
   * @param {string} exe   nazwa procesu, np. "chrome.exe"
   * @param {string} title tytuł okna
   * @returns {{app,appName,isBrowser,tab,site,group,kind,why,work,chill}}
   */
  function classify(exe, title) {
    var app = norm(exe);
    var rawTitle = norm(title);
    var browser = findBrowser(app);
    var tab = browser ? cleanTab(rawTitle) : rawTitle;
    var hay = makeHay(tab + ' ' + app);
    /* Serwisy skanujemy po SAMEJ karcie. Doklejone "chrome.exe" psuloby
       wzorce zaczepione o koniec tytulu, np. "#dev (Firma) - Slack". */
    var hayTab = makeHay(tab);

    var work = 0, chill = 0, why = '', appName = app || 'Nieznana aplikacja';
    var site = null, kind = 'neutral';
    var shortForm = false;      // rolka / short — o progu decyduje app.js

    // 1. aplikacja
    var appLower = app.toLowerCase();
    for (var i = 0; i < APPS.length; i++) {
      if (appLower.indexOf(APPS[i].m) !== -1) {
        appName = APPS[i].n;
        if (APPS[i].k === 'work') { work += APPS[i].w; why = 'aplikacja: ' + appName; }
        else if (APPS[i].k === 'chill') { chill += APPS[i].w; why = 'aplikacja: ' + appName; }
        else { kind = 'neutral'; why = 'system: ' + appName; }
        break;
      }
    }
    if (browser) appName = browser.name;

    // 2. serwis w karcie przeglądarki
    if (browser) {
      for (var s = 0; s < SITES.length; s++) {
        var words = SITES[s].m, hit = false;
        for (var q = 0; q < words.length; q++) {
          if (hasSignal(hayTab, words[q])) { hit = true; break; }
        }
        if (hit) {
          site = SITES[s].n;
          if (SITES[s].k === 'work') work += SITES[s].w;
          else chill += SITES[s].w;
          if (SITES[s].short) shortForm = true;
          why = 'serwis: ' + site;
          break;
        }
      }
    }

    // 3. słowa w tytule — tu rozstrzyga się "research czy głupotki"
    var wHits = [], cHits = [];
    scanList(WORK_WORDS, hay, wHits);
    scanList(CHILL_WORDS, hay, cHits);
    var wBoost = sum(wHits, 6), cBoost = sum(cHits, 8);
    work += wBoost;
    chill += cBoost;

    if (wBoost > 0 && wBoost >= cBoost && site) why = 'research: ' + site;
    else if (cBoost > 0 && cBoost > wBoost) why = 'rozrywka: ' + (site || appName);

    for (var sw = 0; sw < SHORT_WORDS.length && !shortForm; sw++) {
      if (hasSignal(hay, SHORT_WORDS[sw])) shortForm = true;
    }

    // 4. werdykt
    if (work === 0 && chill === 0) kind = 'neutral';
    else if (work > chill) kind = 'work';
    else if (chill > work) kind = 'chill';
    else kind = 'neutral';                    // remis = nie zgadujemy

    if (!why) why = kind === 'neutral' ? 'brak sygnałów' : appName;

    return {
      app: app,
      appName: appName,
      isBrowser: !!browser,
      tab: tab,
      site: site,
      group: browser ? (site || (browser.name + ' — inne')) : appName,
      kind: kind,
      work: work,
      chill: chill,
      why: why,
      meeting: meetingOf(app, rawTitle),   // nazwa spotkania albo null
      short: shortForm && kind === 'chill' // rolka do rozliczenia progiem dnia
    };
  }

  global.CHRONOS_CLASSIFY = {
    classify: classify,
    cleanTab: cleanTab,
    meeting: meetingOf,
    APPS: APPS,
    SITES: SITES,
    MEETING_APPS: MEETING_APPS,
    MEETING_SITES: MEETING_SITES
  };
})(window);
