"""
CHRONOS — jeden proces, cala aplikacja.

Robi trzy rzeczy naraz:
  1. serwuje pliki aplikacji na http://127.0.0.1:8899
  2. wystawia pod /agent/now aktywne okno i czas bezczynnosci
  3. otwiera okno aplikacji (przegladarka w trybie --app: bez kart i paska adresu)

Zamkniecie okna aplikacji konczy caly proces — nie zostaje nic w tle.

Wlasny katalog profilu (.chronos-profile) sprawia, ze:
  - okno jest osobna instancja, wiec jego zamkniecie da sie wykryc,
  - dane aplikacji sa trwale i niezalezne od Twojej codziennej przegladarki.

Uruchamiane przez CHRONOS.vbs (cicho) albo recznie:  python chronos.py
"""

import json
import os
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8899
HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(HERE, ".chronos-profile")
LOG = os.path.join(HERE, "chronos.log")
URL = "http://%s:%d/index.html" % (HOST, PORT)

# odczyt aktywnego okna zyje w agent.py — tu tylko go uzywamy
try:
    import agent as winagent
except Exception:
    winagent = None


def log(msg):
    line = time.strftime("%H:%M:%S") + "  " + str(msg)
    print(line)
    try:
        with open(LOG, "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except Exception:
        pass


# ─────────────────────────── serwer ───────────────────────────


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        SimpleHTTPRequestHandler.__init__(self, *a, directory=HERE, **kw)

    def _json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()          # Cache-Control dokladany nizej, dla wszystkiego
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")

        if path == "/agent/now":
            if not winagent:
                self._json({"ok": False, "error": "agent niedostepny"}, 503)
                return
            try:
                title, app = winagent.foreground_window()
                try:
                    # po jednym oknie z kazdego monitora - Meet potrafi lecec
                    # na drugim ekranie, kiedy pracujesz na pierwszym
                    shots = winagent.screens()
                except Exception:
                    shots = []
                self._json({
                    "ok": True,
                    "title": title,
                    "app": app,
                    "screens": shots,
                    "idle": round(winagent.idle_seconds(), 1),
                })
            except Exception as err:
                self._json({"ok": False, "error": str(err)}, 500)
            return

        if path == "/agent/health":
            self._json({"ok": True, "agent": bool(winagent)})
            return

        SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        # aplikacja lokalna: zawsze swieze pliki, zero mieszania wersji
        self.send_header("Cache-Control", "no-store, must-revalidate")
        SimpleHTTPRequestHandler.end_headers(self)

    def log_message(self, fmt, *args):
        pass


# ─────────────────────────── przegladarka ───────────────────────────

BROWSERS = [
    ("Chrome", [
        r"%ProgramFiles%\Google\Chrome\Application\chrome.exe",
        r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe",
        r"%LocalAppData%\Google\Chrome\Application\chrome.exe",
    ]),
    ("Edge", [
        r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe",
        r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe",
    ]),
    ("Brave", [
        r"%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe",
        r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe",
    ]),
    ("Opera", [
        r"%LocalAppData%\Programs\Opera\opera.exe",
        r"%ProgramFiles%\Opera\opera.exe",
    ]),
    ("Vivaldi", [
        r"%LocalAppData%\Vivaldi\Application\vivaldi.exe",
    ]),
]


def find_browser():
    for name, paths in BROWSERS:
        for raw in paths:
            path = os.path.expandvars(raw)
            if os.path.isfile(path):
                return name, path
    return None, None


def launch_window():
    """Otwiera okno aplikacji i zwraca proces (albo None)."""
    name, exe = find_browser()
    if not exe:
        log("Nie znaleziono przegladarki na Chromium — otwieram domyslna.")
        import webbrowser
        webbrowser.open(URL)
        return None

    args = [
        exe,
        "--app=" + URL,
        "--user-data-dir=" + PROFILE,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-features=Translate,MediaRouter",
        # caly ekran od startu; rozmiar nizej to tylko zapas na wypadek,
        # gdyby przegladarka zignorowala maksymalizacje
        "--start-maximized",
        "--window-size=1280,860",
    ]
    log("Okno aplikacji: %s" % name)
    return subprocess.Popen(args)


# ─────────────────────────── start ───────────────────────────


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    os.chdir(HERE)

    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as err:
        log("Port %d zajety (%s) — CHRONOS juz dziala. Otwieram istniejace okno." % (PORT, err))
        launch_window()
        return 0

    threading.Thread(target=server.serve_forever, daemon=True).start()
    log("Serwer: %s" % URL)
    log("Agent: %s" % ("aktywny" if winagent else "NIEDOSTEPNY (agent.py nie wczytany)"))

    proc = launch_window()

    try:
        if proc is not None:
            proc.wait()          # zamkniecie okna aplikacji konczy program
            log("Okno zamkniete — koncze.")
        else:
            # brak wlasnego okna: dzialamy, dopoki uzytkownik nie zamknie konsoli
            while True:
                time.sleep(3600)
    except KeyboardInterrupt:
        log("Przerwane z klawiatury.")
    finally:
        server.shutdown()
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
