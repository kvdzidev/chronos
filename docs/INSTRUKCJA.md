# CHRONOS - instrukcja obsługi

[English version](USER_GUIDE.md) · [← README](../README.pl.md)

Ta instrukcja prowadzi od zera do codziennego używania: instalacja, pierwsze
uruchomienie, mierzenie czasu, automatyczne śledzenie okien, raporty i kopie
zapasowe. Na końcu jest sekcja z rozwiązywaniem problemów.

## Spis treści

1. [Wymagania](#1-wymagania)
2. [Instalacja](#2-instalacja)
3. [Pierwsze uruchomienie](#3-pierwsze-uruchomienie)
4. [Interfejs w skrócie](#4-interfejs-w-skrócie)
5. [Mierzenie czasu](#5-mierzenie-czasu)
6. [Kategorie](#6-kategorie)
7. [Automatyczne śledzenie okien (agent)](#7-automatyczne-śledzenie-okien-agent)
8. [Mini-nakładka](#8-mini-nakładka)
9. [Statystyki i ranking](#9-statystyki-i-ranking)
10. [Kopie zapasowe, import, czyszczenie](#10-kopie-zapasowe-import-czyszczenie)
11. [Zmiana języka](#11-zmiana-języka)
12. [Skróty klawiszowe](#12-skróty-klawiszowe)
13. [Rozwiązywanie problemów](#13-rozwiązywanie-problemów)
14. [Aktualizacja i odinstalowanie](#14-aktualizacja-i-odinstalowanie)

---

## 1. Wymagania

| Co | Wersja | Uwagi |
|---|---|---|
| System | Windows 10/11 | macOS i Linux działają w trybie ręcznym (bez agenta okien) |
| Python | 3.8 lub nowszy | tylko biblioteka standardowa, nic nie doinstalowujesz |
| Przeglądarka | Chrome, Edge, Brave, Opera lub Vivaldi | potrzebna do okna aplikacji i mini-nakładki |

Sprawdź, czy masz Pythona - otwórz **Wiersz poleceń** (`Win+R` → `cmd`) i wpisz:

```
python --version
```

Jeśli zobaczysz `Python 3.x.x` - wszystko gra. Jeśli nie:

1. Pobierz instalator z <https://www.python.org/downloads/>.
2. W pierwszym oknie instalatora **zaznacz „Add python.exe to PATH”**.
3. Kliknij *Install Now*, a po instalacji otwórz nowe okno `cmd` i sprawdź ponownie.

## 2. Instalacja

**Opcja A - przez Git:**

```
git clone https://github.com/kvdzidev/chronos.git
```

**Opcja B - bez Gita:** na stronie repozytorium kliknij **Code → Download ZIP**
i rozpakuj archiwum w wybranym miejscu, np. `C:\Programy\chronos`.

> Wybierz miejsce na stałe. Twoja historia trafia do podfolderu
> `.chronos-profile` obok aplikacji - przeniesienie folderu przenosi też dane.

**Skrót na pulpicie (Windows, opcjonalnie):** w folderze aplikacji kliknij
dwukrotnie **`create-shortcut.cmd`**. Na pulpicie pojawi się ikona **CHRONOS**.

## 3. Pierwsze uruchomienie

**Windows:** kliknij dwukrotnie skrót **CHRONOS** na pulpicie albo plik
**`CHRONOS.vbs`** w folderze aplikacji.

**macOS / Linux:** w terminalu, w folderze aplikacji:

```
python3 chronos.py
```

Co się dzieje:

1. Startuje lokalny serwer na `http://127.0.0.1:8899` (dostępny tylko z Twojego komputera).
2. Otwiera się zmaksymalizowane okno aplikacji - bez kart i paska adresu.
3. CHRONOS pyta o język. Wybierz **Polski** albo **English**.

![Wybór języka](screenshots/language.png)

Na start dostajesz dwie kategorie: **Praca** i **Chill**. Żadnych przykładowych
danych - wszystko, co zobaczysz w statystykach, zostanie naprawdę zmierzone.

**Zamknięcie okna aplikacji kończy cały program** - nic nie zostaje w tle.

## 4. Interfejs w skrócie

![Główne okno](screenshots/main.png)

| Obszar | Co zawiera |
|---|---|
| **Lewa kolumna** | lista kategorii z czasem z dzisiaj, przycisk *Nowa kategoria* |
| **Górny pasek** | status (Gotowy / Pomiar / Wstrzymane), status agenta, przycisk *Mini*, data i zegar |
| **Pasek „Aktywne okno”** | widoczny, gdy działa agent: proces, tytuł okna, drugi monitor, przypisana kategoria, przełącznik **AUTO** |
| **Tarcza** | czas bieżącej sesji; kliknięcie = start / pauza |
| **Dół** | cel sesji (∞ / 25 / 50 / 90 min), *Start/Pauza*, *Zapisz sesję*, **×** odrzuć |
| **Prawa kolumna** | podsumowanie dnia: suma, liczba sesji, podział na kategorie, pasek 00-24, ostatnie sesje |

## 5. Mierzenie czasu

### Podstawowy cykl

1. **Wybierz kategorię** w lewej kolumnie (lub klawiszem `1`-`9`).
2. **Kliknij tarczę** albo naciśnij `Spacja` - status zmienia się na *Pomiar*.
3. **Pauza:** ponownie kliknij tarczę / `Spacja`. Czas pauzy się nie liczy.
4. **Zakończ:** *Zapisz sesję* lub `Enter`. Sesja trafia do historii.
5. **Odrzuć:** przycisk **×** - sesja znika bez zapisu.

Sesje krótsze niż 1 sekunda nie są zapisywane.

### Cel sesji

Przyciski **∞ / 25m / 50m / 90m** ustawiają cel. Łuk na tarczy pokazuje postęp,
a po osiągnięciu celu pojawia się komunikat i tarcza mignie. Pomiar trwa dalej -
cel niczego nie przerywa. Przy **∞** łuk zatacza koło co minutę.

### Zmiana kategorii w trakcie pomiaru

Kliknięcie innej kategorii **zapisuje bieżącą sesję i od razu startuje nową**
w wybranej kategorii.

### Zamknięcie aplikacji w trakcie pomiaru

Nie musisz niczego klikać przed zamknięciem - stan zapisuje się co kilka sekund
i jeszcze raz przy zamykaniu okna. Zegar **nie biegnie, gdy aplikacja jest
wyłączona**: czas liczy się tylko do ostatniego zapisu.

| Przerwa | Co się dzieje po ponownym otwarciu |
|---|---|
| krótsza niż 5 min (restart, odświeżenie) | sesja wznawia się sama |
| dłuższa | sesja czeka **wstrzymana** - jedno kliknięcie w tarczę ją wznawia |

## 6. Kategorie

### Dodawanie i edycja

- **Nowa:** przycisk *Nowa kategoria* na dole lewej kolumny albo klawisz `N`.
- **Edycja:** najedź na kategorię i kliknij ikonę ołówka.

![Edycja kategorii](screenshots/category.png)

| Pole | Znaczenie |
|---|---|
| **Nazwa** | do 28 znaków |
| **Kolor akcentu** | przejmuje go cała aplikacja, gdy kategoria jest aktywna (tarcza, łuk, przyciski) |
| **Typ czasu** | `Praca`, `Chill` albo `Neutralne` - decyduje, jak kategoria wpływa na ranking |
| **Reguły auto-przypisania** | fragmenty nazwy procesu lub tytułu okna, po przecinku, np. `code.exe, github, figma` |
| **Logo** | *Monogram* (dwie pierwsze litery), *Ikona* (40 ikon) albo *Plik* (PNG/JPG/SVG do 6 MB, przycinany do kwadratu 128 px) |

### Usuwanie

W oknie edycji kliknij *Usuń kategorię* i potwierdź. Zapisane sesje zostają
w statystykach jako „Usunięta kategoria”.

## 7. Automatyczne śledzenie okien (agent)

> Tylko Windows. Bez agenta wszystko inne działa normalnie - po prostu ręcznie.

### Włączenie

Przy starcie przez `CHRONOS.vbs` lub `python chronos.py` **agent działa
automatycznie** - nic nie musisz robić. W górnym pasku pojawia się zielony
status **Monitor**, a pod nim pasek **Aktywne okno**.

(Dla zaawansowanych: `agent.cmd` uruchamia samego agenta na porcie 8900,
jeśli wolisz trzymać go osobno - aplikacja znajdzie go sama.)

### Co agent widzi, a czego nie

| Widzi | Nie widzi |
|---|---|
| tytuł okna na wierzchu (na każdym monitorze) | naciśniętych klawiszy |
| nazwę procesu, np. `Code.exe` | zawartości ekranu ani stron |
| czas od ostatniego ruchu myszy/klawiatury | adresów URL ani historii przeglądarki |

Agent nasłuchuje wyłącznie na `127.0.0.1`, niczego nie zapisuje na dysk i nie
łączy się z internetem.

### Dziennik aktywności (zawsze, gdy agent działa)

Nawet z wyłączonym AUTO CHRONOS zapisuje, w czym spędzasz czas (aplikacja,
serwis, karta), i na tej podstawie liczy ranking oraz *Szczegóły kategorii*
w statystykach. Kolejność przypisania odcinka do kategorii:

1. **Twoja reguła** z pola *Reguły auto-przypisania* - zawsze wygrywa.
2. **Werdykt klasyfikatora** (praca / rozrywka) → pierwsza kategoria tego typu.
3. **Trwająca sesja**, gdy klasyfikator jest neutralny (np. Eksplorator plików w trakcie pracy).
4. W przeciwnym razie → **Nieprzypisane**.

### Przełącznik AUTO

Domyślnie wyłączony. Po włączeniu **trwający pomiar** sam przechodzi do
kategorii pasującej do aktywnego okna, jeśli to okno utrzyma się na wierzchu
przez **5 sekund** (szybki Alt+Tab niczego nie tnie). AUTO nigdy sam nie
startuje pomiaru - decyzja o rozpoczęciu zawsze należy do Ciebie.

### Nieobecność (offline)

- Po **40 s** bez myszy i klawiatury CHRONOS przechodzi w *offline*: pomiar się
  wstrzymuje, a bezczynność jest **odejmowana** od sesji.
- Gdy wrócisz, pomiar wznawia się sam.
- **Spotkania:** gdy na **dowolnym** monitorze widać Google Meet, Zoom, Teams,
  Slack, Webex, Whereby lub Jitsi, próg rośnie do **45 minut** - w rozmowie
  zwykle się słucha i nie rusza myszą.
- Zablokowanie ekranu (`Win+L`) zawsze liczy się jako nieobecność.

### Co liczy się jako praca, a co jako rozrywka

Decyzję podejmuje suma sygnałów, nie pojedyncza reguła:

| Tytuł okna | Werdykt |
|---|---|
| `React useEffect explained - YouTube` | praca |
| `Minecraft speedrun 1.16 WR - YouTube` | rozrywka |
| `ThePrimeagen - Docker in 10 minutes - Twitch` | praca |
| `(3) Messenger`, Discord, Facebook | praca (kanał kontaktu) |
| rolki, shorts, TikTok | neutralne do **3 min dziennie**, potem cały ten czas to rozrywka |
| `Nowa karta` | neutralne |

Jeśli coś jest klasyfikowane nie po Twojej myśli, najprościej dodać **regułę
w kategorii** (np. `facebook` w kategorii typu *Chill*). Zmiany w samym
klasyfikatorze opisuje [CONTRIBUTING.md](../CONTRIBUTING.md).

## 8. Mini-nakładka

Przycisk **Mini** (lub klawisz `M`) otwiera małe okno **zawsze na wierzchu**:

![Mini-nakładka](screenshots/mini.png)

- pokazuje kategorię, czas, przycisk start/pauza, sumę dnia i aktywne okno,
- można je przeciągać i dowolnie zmieniać jego rozmiar,
- `Spacja` działa także tutaj, **Powiększ** zamyka nakładkę i wraca do dużego okna,
- duże okno możesz w tym czasie zminimalizować - pomiar i agent działają z pełną
  dokładnością.

Wymaga przeglądarki opartej na Chromium. Jeśli przycisku *Mini* nie ma, aplikacja
została otwarta bezpośrednio z pliku `index.html` zamiast przez `CHRONOS.vbs`.

## 9. Statystyki i ranking

Otwórz przyciskiem **Pełne statystyki** (prawy górny róg) lub klawiszem `S`.

### Widok dnia (`D`)

![Raport dzienny](screenshots/stats-day-pl.png)

- **KPI:** łączny czas, liczba sesji, średnia sesja, top kategoria.
- **Ranking produktywności 0-100** z podziałem na pracę / rozrywkę / neutralne / offline.
- **Szczegóły kategorii** - kliknij zakładkę, aby zobaczyć aplikacje, serwisy,
  pliki i karty z czasem i procentem.
- **Rozkład czasu** (pierścień), **aktywność godzinowa**, **dziennik sesji**.
- Sesję usuniesz przyciskiem **×** w dzienniku - przez 6 s możesz to **cofnąć**.
- Strzałki `←` `→` przełączają dni.

### Widok miesiąca (`W`)

![Raport miesięczny](screenshots/stats-month.png)

Kalendarz, w którym każdy dzień ma kolorowy wynik, czas pracy i pasek proporcji.
**Kliknięcie dnia otwiera jego pełny raport.** Strzałki `←` `→` przełączają miesiące.

### Jak liczony jest ranking

| Składowa | Zakres | Co mierzy |
|---|---|---|
| **Skupienie** | 0-55 | `praca / (praca + rozrywka)` |
| **Wolumen** | 0-25 | ilość pracy wobec celu 6 h dziennie |
| **Ciągłość** | 0-20 | średnia długość bloku pracy (pełna punktacja od 30 min) |

Czas neutralny i offline nie obniżają wyniku. Progi: `85+` świetny dzień ·
`70+` bardzo dobry · `50+` solidny · `25+` rozproszony · poniżej - dzień na luzie.

Bez agenta ranking liczy się z ręcznych sesji i typów kategorii.

## 10. Kopie zapasowe, import, czyszczenie

Przyciski na dole okna statystyk:

| Przycisk | Działanie |
|---|---|
| **Eksport JSON** | pobiera plik `chronos-RRRR-MM-DD.json` z kategoriami, sesjami i dziennikiem aktywności |
| **Import** | wczytuje taki plik i **zastępuje** bieżące dane (po potwierdzeniu) |
| **Wyczyść dane** | usuwa wszystko i wraca do dwóch kategorii startowych (po potwierdzeniu) |

Dobre praktyki:

- Rób eksport regularnie, np. raz w tygodniu, i trzymaj plik poza folderem aplikacji.
- **Przed wyczyszczeniem danych przeglądarki** albo usunięciem `.chronos-profile`
  zawsze zrób eksport - tam leży cała historia.
- Dziennik aktywności (okna, karty) jest przycinany do 30 dni; zapisane sesje
  zostają bez limitu.

## 11. Zmiana języka

W oknie statystyk, w prawym dolnym rogu, kliknij **PL** lub **EN**. Zmiana działa
natychmiast i nie rusza zapisanych danych.

## 12. Skróty klawiszowe

| Klawisz | Akcja |
|---|---|
| `Spacja` | start / pauza |
| `Enter` | zapisz sesję |
| `1`-`9` | wybór kategorii |
| `N` | nowa kategoria |
| `S` | statystyki (otwórz / zamknij) |
| `D` / `W` | raport dzienny / miesięczny |
| `←` `→` | poprzedni / następny dzień lub miesiąc |
| `M` | mini-nakładka |
| `Esc` | zamknij okno dialogowe |

Skróty nie działają, gdy kursor stoi w polu tekstowym.

## 13. Rozwiązywanie problemów

**Po kliknięciu `CHRONOS.vbs` nic się nie dzieje albo pojawia się „Nie znaleziono Pythona”.**
Python nie jest w `PATH`. Zainstaluj go ponownie z zaznaczonym *Add python.exe to PATH*
(patrz [Wymagania](#1-wymagania)).

**Chcę zobaczyć, co poszło nie tak.**
Uruchom **`start.cmd`** - to samo co `CHRONOS.vbs`, ale z widoczną konsolą.
Log startu trafia też do pliku `chronos.log` w folderze aplikacji.

**Otwiera się zwykła karta przeglądarki zamiast osobnego okna.**
Nie znaleziono przeglądarki na Chromium (Chrome, Edge, Brave, Opera, Vivaldi).
Zainstaluj jedną z nich - CHRONOS wykryje ją sam przy następnym starcie.

**„Port 8899 zajęty”.**
CHRONOS już działa - zamiast drugiej kopii otworzy się okno istniejącej.
Jeśli okna nie widać, zamknij proces `pythonw.exe` w Menedżerze zadań i uruchom ponownie.

**Nie widzę paska „Aktywne okno” / status „Monitor offline”.**
Agent działa tylko na Windows. Upewnij się, że aplikacja została uruchomiona przez
`CHRONOS.vbs` / `chronos.py`, a nie przez otwarcie `index.html` z dysku.

**Brak przycisku *Mini*.**
Mini-nakładka wymaga przeglądarki Chromium i uruchomienia przez serwer
(`CHRONOS.vbs`, `start.cmd` lub `python chronos.py`).

**Komunikat „Inna karta CHRONOS ma nowsze dane”.**
Aplikacja jest otwarta w dwóch oknach. Zamknij jedno - to z komunikatem nie
nadpisze nowszych danych drugiego.

**Komunikat „Nie udało się wczytać zapisu”.**
Zapis był uszkodzony. Oryginał został odłożony w `localStorage` pod kluczem
`chronos.v1.uszkodzone`, a aplikacja wystartowała z pustą bazą. Jeśli masz eksport
JSON - zaimportuj go.

**Ranking pokazuje „na podstawie ręcznych sesji”.**
Tego dnia agent nie zebrał danych o oknach (np. nie działał albo to macOS/Linux).
Wynik liczy się wtedy z typów kategorii.

**Uruchomienie bez okna (np. na serwerze lub do testów).**
`python chronos.py --no-window`, potem otwórz `http://127.0.0.1:8899` w przeglądarce.

## 14. Aktualizacja i odinstalowanie

**Aktualizacja:** zamknij aplikację, a potem `git pull` w folderze aplikacji
(albo pobierz nowy ZIP i skopiuj pliki **nadpisując** stare, ale **zachowując**
folder `.chronos-profile`). Dane migrują się same przy pierwszym starcie.

**Odinstalowanie:** zrób eksport JSON, jeśli chcesz zachować historię, a następnie
usuń folder aplikacji i skrót z pulpitu. CHRONOS nie zostawia nic w rejestrze
ani w innych miejscach systemu.
