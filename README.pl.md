[English](README.md) · **Polski**

# CHRONOS — tracker czasu

Ciemny, „instrumentalny" tracker czasu: kategorie z własną ikoną, duży klikalny
timer i pełne statystyki dnia. Opcjonalny agent lokalny czyta aktywne okno na
każdym monitorze, sam rozpoznaje kartę przeglądarki i przypisuje czas do
kategorii — a na koniec dnia wystawia ranking produktywności 0–100.

Bez zależności, bez builda, bez konta. Czysty HTML/CSS/JS + jeden skrypt
Pythona na bibliotece standardowej.

---

## Twoje dane zostają u Ciebie

To ważniejsze od każdej funkcji, więc stoi na początku.

- **Nic nie jest wysyłane.** CHRONOS nie ma konta, serwera ani telemetrii.
  Agent nasłuchuje wyłącznie na pętli zwrotnej, więc z innego komputera jest
  niewidoczny. Nawet fonty leżą lokalnie (`fonts/`) — aplikacja nie robi ani
  jednego zapytania poza własny komputer i wygląda tak samo bez internetu.
- **Historia leży w przeglądarce**, w `localStorage`, wewnątrz katalogu
  `.chronos-profile` obok aplikacji. Nigdy nie jest zapisywana do pliku
  projektu.
- **`.chronos-profile/` jest w `.gitignore`.** Kto sklonuje to repozytorium,
  dostaje pusty tracker i własną bazę. Wypychasz kod, nigdy godziny. To samo
  dotyczy eksportów `chronos-backup-*.json` i pliku `chronos.log`.
- **Dwie instalacje się nie mieszają.** Aplikacja chodzi we własnym profilu
  przeglądarki, osobnym od codziennego, więc jej dane są niezależne od reszty
  tego, co robisz w sieci.

Kopię historii bierzesz sam: **Eksport JSON** na dole okna statystyk.

## Język

Pierwsze uruchomienie zadaje jedno pytanie — **Polski czy English** — zanim
cokolwiek innego powstanie. Dzięki temu kategorie startowe i format daty od
razu są w wybranym języku. Zmiana w każdej chwili: przełącznik **PL / EN** na
dole okna statystyk. Działa od razu i nie rusza zebranych danych.

Wybór ma własny klucz (`chronos.lang`), więc wyczyszczenie historii go nie
kasuje.

## Uruchomienie

**Dwuklik w `CHRONOS.lnk` na pulpicie** (albo `CHRONOS.vbs` w tym folderze).
Tyle. Otwiera się **zmaksymalizowane** okno aplikacji bez pasków przeglądarki,
a w tle startuje serwer i agent czytający aktywne okno. **Zamknięcie okna
kończy wszystko** — nic nie zostaje w tle. Na szerokich monitorach układ
rośnie razem z oknem: większa tarcza, szersze kolumny.

| Plik | Kiedy |
|---|---|
| `CHRONOS.vbs` | normalne uruchomienie, bez konsoli |
| `start.cmd` | to samo, ale z widoczną konsolą — gdy coś nie działa |
| `agent.cmd` | tylko sam agent, gdy chcesz go trzymać osobno |
| `chronos.log` | zapis startu, przydatny przy diagnozie |

Aplikacja działa w osobnym profilu przeglądarki (`.chronos-profile`), więc:

- ma własne, trwałe dane — niezależne od Twojej codziennej przeglądarki,
- okno da się wykryć, dlatego jego zamknięcie potrafi zatrzymać serwer.

Wszystko idzie z jednego procesu `chronos.py`: pliki aplikacji, endpoint
`/agent/now` z aktywnym oknem i otwarcie okna. Odpowiedzi mają
`Cache-Control: no-store`, więc po edycji plików nigdy nie dostaniesz
mieszanki starej i nowej wersji.

Aplikacja startuje pusta, z dwiema kategoriami: **Praca** i **Chill**.
Żadnych zmyślonych sesji — wszystko w statystykach jest faktycznie zmierzone.

## Timer

- Klik w tarczę = start / pauza, ponowny klik wznawia.
- **Zapisz sesję** kończy pomiar, **×** odrzuca. Czas pauzy nie jest wliczany.
- Cel sesji: ∞ / 25 / 50 / 90 min. Przy ∞ łuk odmierza bieżącą minutę.
- Zmiana kategorii w trakcie pomiaru zapisuje bieżącą sesję i startuje nową.

### Sesja zapisuje się sama

Nie musisz niczego klikać przed zamknięciem apki — stan idzie na dysk co
kilka sekund, a przy zamykaniu okna dodatkowo w całości. Po ponownym
uruchomieniu wszystko jest na miejscu: kategorie, historia, dziennik okien
i sesja, która trwała.

Kluczowa zasada: **zegar nie chodzi, gdy apka jest wyłączona.** Czas liczy się
najwyżej do ostatniego zapisu, nigdy „do teraz" — inaczej zamknięcie apki
wieczorem dopisałoby osiem godzin pracy w nocy. Dotyczy to obu wypadków:
grzecznego zamknięcia okna i twardego ubicia procesu.

Po otwarciu:

| Przerwa | Co się dzieje |
|---|---|
| krótsza niż 5 min | sesja **wznawia się sama** (restart apki, odświeżenie) |
| dłuższa | sesja czeka **wstrzymana**, z komunikatem — wznawiasz jednym kliknięciem |

## Mini-nakładka

Przycisk **Mini** (albo klawisz `M`) otwiera małe okno, które **trzyma się nad
wszystkimi aplikacjami**. Można je przeciągać po ekranie i dowolnie zmieniać
rozmiar — od kafelka po wąski pasek. Dużą przeglądarkę wolno wtedy
zminimalizować.

Nakładka pokazuje kategorię, czas lecący w górę, przycisk start/pauzy, sumę
dnia oraz to, w czym akurat jesteś według agenta (albo ostrzeżenie o offline).
Przycisk **Powiększ** zamyka ją i wraca do pełnego okna. Spacja działa też tutaj.

To nie jest zwykłe okienko przeglądarki, tylko **Document Picture-in-Picture** —
prawdziwe okno systemowe. Dwie konsekwencje:

- Wymaga przeglądarki na Chromium (Chrome, Edge, Opera, Brave) i uruchomienia
  przez `start.cmd`. Przy otwarciu `index.html` z dysku przycisk się nie pojawi.
- Okno PiP jest z definicji widoczne, więc przeglądarka **nie dławi jego
  timerów**. Dopóki nakładka jest otwarta, pomiar i agent chodzą z pełną
  rozdzielczością 1,5 s, nawet gdy główne okno jest zminimalizowane. Bez
  nakładki, przy zminimalizowanej przeglądarce, system po kilku minutach
  przycina timery do ~1/min i dziennik aktywności robi się zgrubny.

## Kategorie

Trzy warianty logo: **monogram**, **ikona** (40 rysowanych kreską) albo
**własny plik** graficzny (kadrowany do kwadratu, skalowany do 128 px).
Kolor akcentu przejmuje cała aplikacja — tarcza, łuk, poświata, przyciski.

Ikony są rysowane tą samą włosową kreską co reszta interfejsu i dziedziczą
kolor akcentu kategorii, więc domyślnie są zielone, a po zmianie koloru —
w jego kolorze. To wektory, nie emoji: identyczne na każdym komputerze, bez
cudzego kroju i cudzej palety.

Każda kategoria ma **typ czasu**: `Praca`, `Chill` albo `Neutralne`. Typ
decyduje, jak kategoria wpływa na ranking produktywności.

Pole **Reguły auto-przypisania** to fragmenty nazwy procesu lub tytułu okna
po przecinku (np. `code.exe, github, figma`). Twoja reguła zawsze wygrywa
z automatem.

### Co trafia do której kategorii

Kolejność jest jednoznaczna i celowo w tej kolejności:

1. **Twoja reguła** — zawsze pierwsza.
2. **Werdykt klasyfikatora** — jeśli ma zdanie. Gra czy gameplay
   na YouTube trafiają do Chillu **nawet w trakcie ręcznie odpalonej sesji
   „Praca"**. Deklaracja, że pracujesz, nie zamienia gry w pracę.
3. **Trwająca sesja** — dopiero gdy klasyfikator jest neutralny. Eksplorator
   plików w środku pracy zostaje policzony jako praca, bo kontekst sesji to
   jedyna informacja, jaką mamy.
4. Nic z powyższych → **Nieprzypisane**, z własną zakładką w statystykach.

## Agent lokalny (opcjonalny)

`agent.cmd` uruchamia mały serwer na `127.0.0.1:8900`, który oddaje trzy rzeczy:
tytuł aktywnego okna, nazwę procesu i czas bezczynności. Aplikacja odpytuje go
co 1,5 s i pokazuje wynik w pasku **Aktywne okno**.

Odczytuje tytuł okna wiodącego na **każdym** monitorze, nie tylko na tym
aktywnym — inaczej spotkanie na drugim ekranie byłoby dla niego niewidzialne.

**Czego agent nie robi:** nie czyta klawiszy, nie robi zrzutów ekranu, nie
zagląda w treść stron, nie zapisuje niczego na dysk i nie wysyła nic do sieci.
Nasłuchuje tylko na pętli zwrotnej i działa dokładnie tak długo, jak długo
trzymasz otwarte jego okno konsoli. Bez agenta cała reszta aplikacji działa
normalnie — tylko ręcznie.

### Rozpoznawanie karty przeglądarki

Windows nie udostępnia adresu URL, ale tytuł okna przeglądarki **jest** tytułem
aktywnej karty. `classify.js` sprowadza go do czystej nazwy: obcina sufiksy
(`- Google Chrome`, `— Mozilla Firefox`, `- Personal - Microsoft Edge`),
licznik powiadomień `(3)` i dopiski `and 2 more pages`.

### Co się liczy jako rozrywka

| Rzecz | Werdykt |
|---|---|
| YouTube, Twitch, Kick | **rozrywka** — chyba że karta brzmi jak research (patrz niżej) |
| gry: Among Us, CS2, Aim Lab, League of Legends, VALORANT i reszta listy | **rozrywka**, zawsze |
| **Messenger, Facebook, Discord** | **praca** — to kanał kontaktu, nie zwiedzanie |
| rolki, shorty, TikTok | rozrywka **dopiero powyżej 3 minut łącznie w ciągu doby** |

### Komunikatory to praca

Messenger, Facebook i Discord liczą się jako praca, bo tak wygląda ich
faktyczne użycie: kontakt z klientem, nie przeglądanie. Waga jest celowo
niska (3), więc to **słaby** sygnał — konkretny tytuł rozrywkowy nadal go
przebije, bo w sumowaniu wygrywa mocniejsza strona.

Wpis Messengera stoi w `SITES` **przed** Facebookiem, bo „Facebook Messenger"
zawiera oba słowa, a pętla kończy się na pierwszym trafieniu.

> Jeśli u Ciebie Facebook to jednak zwiedzanie, zmiana to jedno słowo
> w `classify.js`: `k: 'work'` → `k: 'chill'`.

#### Próg trzech minut na krótkie formaty

Rolka bywa skutkiem szukania czegoś do pracy, a nie zwiedzania. Dlatego
Instagram, TikTok i karty z „shorts" czy „reels" są oznaczane osobną flagą
i **poniżej 3 minut łącznie w ciągu doby liczą się jako neutralne**. Gdy suma
przekroczy próg, do rozrywki wchodzi **cały** ten czas, także te pierwsze
minuty — nie tylko nadwyżka.

Próg liczy się przy **odczycie** statystyk, nie przy zapisie. Trzy skutki:
wynik zawsze odpowiada aktualnej sumie dnia, działa wstecz na już zebranej
historii i sam się poprawia w chwili, gdy kolejna minuta przechyli szalę.
Licznik zeruje się o północy.

### Jak zapada decyzja praca / chill

Żadna pojedyncza reguła nie przesądza. Sygnały sumują się w dwa wyniki i wygrywa
mocniejszy — dlatego YouTube potrafi być jednym i drugim:

| Tytuł okna | Punkty | Werdykt |
|---|---|---|
| `React useEffect explained — YouTube` | praca 5 : chill 2 | **praca** |
| `Minecraft speedrun 1.16 WR — YouTube` | praca 0 : chill 10 | **chill** |
| `Excel tabela przestawna kurs — YouTube` | praca 4 : chill 2 | **praca** |
| `shroud playing VALORANT — Twitch` | praca 0 : chill 8 | **chill** |
| `ThePrimeagen — Docker w 10 minut — Twitch` | praca 4 : chill 3 | **praca** |
| `Jak zrobić naleśniki — YouTube` | praca 1 : chill 2 | **chill** |
| `xQc — Kick` | praca 0 : chill 3 | **chill** |
| `(3) Messenger` | praca 3 : chill 0 | **praca** |
| `Nowa karta` | 0 : 0 | **neutralne** |

Nazwa gry bije słowo „poradnik", a konkretna technologia bije samą obecność
YouTube'a. Remis to zawsze „neutralne" — przy braku sygnałów CHRONOS nie zgaduje.

Listy sygnałów w `classify.js` to zwykłe tablice — dopisanie własnej strony,
gry czy programu to jedna linia:

```js
{ m: ['mojafirma.pl'], n: 'Intranet', k: 'work', w: 5 },
```

Dopasowanie idzie po **całych wyrazach**, nie po fragmentach — inaczej `dota`
łapałoby się w „dotacji", a `mem` w „pamięci". Gdy potrzebujesz polskiej
odmiany, dopisz gwiazdkę: `'podatk*'` złapie *podatek, podatku, podatkowy*,
ale nie wejdzie w środek innego słowa.

> Prawdziwe uruchomienie od razu wyłapało dwie takie pułapki: `montaż` jako
> sygnał montażu wideo robił z „Montażu klimatyzacji" rozrywkę, a spotkania
> w Google Meet nie miały żadnego sygnału. Jeśli zobaczysz podobny błąd —
> to jedna linia w tym pliku.

### Offline po 40 sekundach

Brak ruchu myszy i klawiatury dłuższy niż **40 s** przełącza CHRONOS w tryb
offline. Nie 15: przeczytanie akapitu, zerknięcie w notatki albo namysł nad
zdaniem to wciąż praca, a nie nieobecność. Bezczynność zostaje **wycięta z trwającej sesji** (odejmowana od
zmierzonego czasu, nie tylko wstrzymana), a pomiar wznawia się sam, gdy wrócisz.
Offline liczy się osobno i nie wpływa na ranking — ani na plus, ani na minus.

> Wykrywanie opiera się na aktywności myszy i klawiatury oraz ekranie blokady,
> nie na analizie obrazu. Film oglądany bez dotykania myszy zostanie po 40 s
> uznany za offline.

#### Wyjątek: spotkanie

Na spotkaniu się słucha. Mysz stoi godzinę, a Ty jesteś — więc te 40 sekund
byłoby po prostu błędem pomiaru. Gdy na którymkolwiek ekranie widać
**Google Meet, Zoom, Slack, Teams, Webex, Whereby albo Jitsi**, próg rośnie
z 40 sekund do **45 minut**. Pasek „Aktywne okno" mówi wtedy wprost:
*„Google Meet — słucham, offline nie liczy"*.

Próg jest, a nie znika zupełnie, i to celowo: wyjście od komputera z otwartym
Meetem też musi w końcu trafić do offline'u, inaczej zapomniana rozmowa
dopisałaby pół dnia pracy. Ekran blokady omija ten wyjątek — `lockapp.exe`
to nie spotkanie, więc wracają zwykłe 40 sekund.

Rozpoznawanie idzie po nazwie procesu (`zoom.exe`, `slack.exe`, `teams.exe`)
albo po tytule karty. Karta Meeta to dosłownie „Meet — kod-spotkania", dlatego
wzorzec jest zaczepiony o początek tytułu: samo słowo „meet" łapałoby też
„Meet the team".

### Dwa monitory

Jedno okno na wierzchu to za mało, gdy ekrany są dwa: Meet potrafi lecieć
na drugim monitorze, kiedy pracujesz na pierwszym. Agent oddaje więc pole
`screens` — **po jednym oknie z każdego ekranu**, tym, które faktycznie na nim
widać. Windows nie ma na to jednego wywołania, więc agent przechodzi okna
w kolejności Z (od wierzchu w dół) i bierze pierwsze sensowne dla każdego
monitora, pomijając okna zminimalizowane, ukryte przez DWM, paski narzędzi
i okna pulpitu.

Czas nadal ma **jednego właściciela — okno na wierzchu**. Doba ma 24 godziny
i nie da się jej policzyć dwa razy, więc drugi ekran nigdy nie zabiera czasu
pierwszemu. Rozstrzyga za to dwie rzeczy:

- **spotkanie na dowolnym ekranie** znosi offline (opisane wyżej),
- gdy okno na wierzchu **nic nie znaczy** — Eksplorator, pulpit, Messenger —
  a obok leci Twitch, to jednak rozrywka. Dziennik zapisuje wtedy powód
  *„drugi ekran: Twitch"*, żeby nic nie działo się po cichu.

W pasku „Aktywne okno" widać kafelek z numerem ekranu i tym, co na nim leci,
pokolorowany według werdyktu. Starszy agent bez pola `screens` działa dalej —
CHRONOS schodzi wtedy do pojedynczego okna na wierzchu.

### Przełącznik AUTO

Domyślnie wyłączony. Włączony sprawia, że **trwający pomiar** sam przechodzi na
kategorię pasującą do aktywnego okna. Zmiana wymaga 5 sekund w nowym oknie —
krótki alt-tab nie potnie sesji na kawałki. AUTO nigdy nie startuje pomiaru
samo; decyzja o rozpoczęciu zawsze należy do Ciebie.

## Statystyki

**Prawy panel** na żywo: suma dnia, liczba sesji, najdłuższa sesja, podział
procentowy, pasek aktywności 00–24 i ostatnie sesje.

Okno statystyk ma dwa zakresy, przełączane u góry (`D` — dzień, `W` — widok
miesięczny; strzałki `←` `→` przesuwają odpowiednio o dzień albo o miesiąc).

### Miesiąc

Kalendarz całego miesiąca: każdy dzień to kafelek z **rankingiem** (kolor
i liczba), czasem pracy i paskiem proporcji praca / rozrywka / neutralne /
offline. **Kliknięcie dnia wchodzi w jego pełny raport.** Nad kalendarzem
sumy miesiąca: zarejestrowany czas, praca, średni ranking i najlepszy dzień;
pod nim podział miesiąca na typy i kategorie z procentami.

### Dzień

- **Ranking produktywności 0–100** z podziałem na pracę / rozrywkę / neutralne
  / **offline** — procenty liczone od całego zarejestrowanego czasu, więc
  sumują się do 100 i widać wprost, ile dnia zeszło na bezczynność
- **Szczegóły kategorii** — kliknij kategorię, aby rozłożyć ją na czynniki:
  każda aplikacja i serwis z czasem **i procentem** (np. `Visual Studio Code
  53%`, `Excel 16%`), a pod spodem konkretne pliki, projekty i karty
  przeglądarki, też z procentem (`app.js - timer 25%`,
  `main.tsx - sklep-online 5%`). Osobne zakładki na **Offline**
  i **Nieprzypisane**, każda z własnym udziałem w dobie.
- pierścień rozkładu czasu, wykres aktywności godzinowej, dziennik sesji
- nawigacja po dniach wstecz (strzałki lub `←` / `→`)

### Algorytm rankingu

Wynik to suma trzech składowych, każda pokazana wprost w interfejsie — żadnej
magii, zawsze widać, skąd wzięła się liczba:

| Składowa | Zakres | Co mierzy | Wzór |
|---|---|---|---|
| **Skupienie** | 0–55 | czym wypełniasz czas | `55 × praca / (praca + rozrywka)` |
| **Wolumen** | 0–25 | czy pracy było dość | `25 × min(1, praca / 6h)` |
| **Ciągłość** | 0–20 | czy nie w strzępach | `20 × min(1, średni blok / 30 min)` |

Bloki pracy sklejane są, gdy przerwa jest krótsza niż 2 minuty — dzięki temu
zerknięcie w dokumentację nie rozbija godziny pracy na dwadzieścia kawałków.
Czas neutralny nie wchodzi do mianownika „Skupienia": przeglądanie plików ani
nie nagradza, ani nie karze. Offline jest pomijany w całości.

Progi: `85+` świetny dzień · `70+` bardzo dobry · `50+` solidny ·
`25+` rozproszony · niżej — dzień na luzie.

Bez agenta ranking liczy się z ręcznych sesji i typu kategorii, więc działa od
pierwszego dnia — tylko mniej dokładnie, co interfejs otwarcie sygnalizuje.

## Skróty klawiszowe

| Klawisz | Działanie |
|---|---|
| `Spacja` | start / pauza |
| `Enter` | zapisz sesję |
| `1`–`9` | wybór kategorii |
| `N` | nowa kategoria |
| `S` | statystyki |
| `D` / `W` | zakres: dzień / miesiąc |
| `M` | mini-nakładka |
| `Esc` | zamknij okno |
| `←` `→` | poprzedni / następny dzień |

## Dane

Wszystko leży lokalnie w `localStorage` (klucz `chronos.v1`). Dziennik
aktywności jest przycinany do 30 dni. W oknie statystyk są **Eksport JSON**,
**Import** i **Wyczyść dane**.

> Wyczyszczenie danych witryny w przeglądarce kasuje historię — przed taką
> operacją zrób eksport.

### Migracje zapisu

Zmiana reguł nie może zostawiać starej historii w sprzeczności z tym, co
aplikacja mówi dzisiaj. Zapis nosi więc numer migracji (`m`), a każda
przeróbka leci **dokładnie raz**, przy pierwszym uruchomieniu po aktualizacji:

- emoji w logo kategorii zamieniane są na najbliższą ikonę wektorową,
- odcinki Messengera, Facebooka i Discorda oznaczone wcześniej jako rozrywka
  przechodzą do pracy — razem z przypisaniem do kategorii typu „praca".

Ruszane są **wyłącznie** odcinki oznaczone jako rozrywka. To, co już było
pracą albo neutralne, zostaje nietknięte, a późniejsze ręczne poprawki nie
są cofane przy kolejnym starcie. Zapisane ręcznie sesje nie są zmieniane
w ogóle.

Dwa zabezpieczenia po tym, jak podczas testów sam skasowałem sobie dane:

- **Błąd odczytu nigdy nie kasuje historii.** Gdy zapis okaże się uszkodzony,
  oryginał ląduje w kluczu `chronos.v1.uszkodzone`, a aplikacja startuje pusta
  z komunikatem — dane zostają do odzyskania.
- **Numer wersji zapisu (`rev`).** Każdy zapis podbija licznik. Jeśli druga
  otwarta karta ma nowsze dane, ta pierwsza ich nie nadpisze przy zamykaniu,
  tylko powie o tym w komunikacie.

## Pliki

```
CHRONOS.vbs  — uruchomienie jednym kliknięciem
chronos.py   — serwer + agent + okno aplikacji w jednym procesie
chronos.ico  — ikona skrótu
fonts/       — Inter i JetBrains Mono lokalnie (latin + latin-ext, OFL)
index.html   — struktura i okna dialogowe
styles.css   — design system (tokeny, typografia, komponenty)
app.js       — stan, pomiar, dziennik aktywności, ranking, statystyki
classify.js  — rozpoznawanie aplikacji i kart + decyzja praca/chill
i18n.js      — słownik polski i angielski
icons.js     — zestaw ikon kategorii
rain.js      — deszcz znaków w tle (duże okno i nakładka)
agent.py     — agent czytający aktywne okno (biblioteka standardowa)
start.cmd    — uruchomienie z konsolą (diagnostyka)
agent.cmd    — uruchomienie agenta
```

## Design

Zielono-czarna baza (`#040806`), dyscyplina cienkich linii zamiast obramowanych
kart, jeden akcent w jadeicie (`#3ddc84`), wersaliki 10 px jako etykiety i cyfry
w JetBrains Mono z tabelarycznymi cyframi (nie skaczą przy odliczaniu).

### Deszcz znaków

W tle pada ściana kanji: czoło każdej strugi prawie białe, ogon gaśnie
w jadeicie. Rysuje to `rain.js` na zwykłym `<canvas>`, osobnym dla każdego
okna — mini-nakładka jest prawdziwym oknem systemowym z własnym `document`,
więc dostaje własne płótno.

Trzy decyzje, dzięki którym da się na to patrzeć przez cały dzień pracy:

- **Deszcz omija to, co się czyta.** Dwie maski naraz (`mask-composite:
  intersect`) wycinają dziurę na tarczę i wygaszają brzegi, a szyna kategorii
  i panel statystyk są nieprzezroczyste. Zostaje pierścień znaków wokół
  zegara — tło, a nie tapeta pod tekstem.
- **Kosztuje mało.** ~18 klatek na sekundę zamiast 60, a gdy okno traci
  fokus — ~7: deszcz dalej pada, ale nie bierze procesora spod pracy. Pętla
  stoi na `requestAnimationFrame`, więc przy zminimalizowanym oknie
  przeglądarka zatrzymuje ją sama. Płótno liczone jest maksymalnie w 1.5×
  gęstości piksela — tło przygaszone maską nie potrzebuje więcej.
- **Da się wyłączyć ruch.** `prefers-reduced-motion` zostawia jedną statyczną
  klatkę zamiast animacji.

Powierzchnie są zielono-czarne, a nie neutralnie czarne, i to nie jest
ozdobnik: panel w chłodnej szarości nad ciepłym zielonym deszczem wyglądałby
jak naklejony na tapetę.

### Budżet procesora

Aplikacja wisi na ekranie cały dzień, więc każdy cykl ma uzasadnienie:

- łuk i cyfry tarczy odświeżają się co 250 ms, ale panel dnia, szyna
  kategorii i otwarte statystyki są przebudowywane **raz na sekundę** —
  częściej i tak nie mają czego pokazać,
- ukryte okno nie maluje nic; zostaje sama logika celu sesji, żeby
  powiadomienie nie przepadło,
- mini-nakładka porównuje klatkę ze stemplem stanu i wychodzi natychmiast,
  gdy nic się nie zmieniło — okno PiP nie jest dławione przez przeglądarkę,
  więc bez tego liczyłaby klasyfikator co pół sekundy przez cały dzień,
- deszcz znaków zwalnia bez fokusu (opisane wyżej). Każdy tekst ma
zdefiniowane obcinanie — nawet 200-znakowy tytuł karty nie rozpycha układu.
Interfejs respektuje `prefers-reduced-motion`.
