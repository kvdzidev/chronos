"""
CHRONOS — agent lokalny (Windows)

Odczytuje AKTYWNE OKNO (tytul + nazwa procesu), okno wiodace na KAZDYM
monitorze oraz czas bezczynnosci i wystawia to jako JSON pod
http://127.0.0.1:8900/now

Zakres danych, ktore agent widzi i oddaje:
  - tytul okna na wierzchu           (np. "app.js - timer - Visual Studio Code")
  - nazwa pliku wykonywalnego        (np. "Code.exe")
  - to samo dla kazdego ekranu z osobna (pole "screens")
  - sekundy od ostatniego ruchu myszy/klawisza

Przy dwoch monitorach jedno okno na wierzchu to za malo: Meet potrafi lecec
na drugim ekranie, kiedy pracujesz na pierwszym. Dlatego agent oddaje po
jednym oknie z kazdego monitora - tym, ktore na nim faktycznie widac.

Czego agent NIE robi: nie czyta klawiszy, nie robi zrzutow ekranu, nie zaglada
do tresci okien, nie zapisuje historii na dysk i nie wysyla niczego do sieci.
Nasluchuje wylacznie na petli zwrotnej (127.0.0.1), wiec jest widoczny tylko
z tego komputera. Dziala tak dlugo, jak dlugo to okno konsoli jest otwarte.

Uruchomienie:  agent.cmd   (albo:  python agent.py)
Zatrzymanie:   Ctrl+C lub zamkniecie okna konsoli
Wymagania:     Python 3.8+ , wylacznie biblioteka standardowa
"""

import ctypes
import ctypes.wintypes as wt
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8900

# ─────────────────────────── Windows API ───────────────────────────

user32 = ctypes.WinDLL("user32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

PROCESS_QUERY_LIMITED_INFORMATION = 0x1000

user32.GetForegroundWindow.restype = wt.HWND
user32.GetWindowTextLengthW.argtypes = [wt.HWND]
user32.GetWindowTextW.argtypes = [wt.HWND, wt.LPWSTR, ctypes.c_int]
user32.GetClassNameW.argtypes = [wt.HWND, wt.LPWSTR, ctypes.c_int]
user32.GetWindowLongW.restype = wt.LONG
# UWAGA: bez restype ctypes zwrocilby c_int i uciol uchwyt na 64 bitach
user32.MonitorFromWindow.restype = wt.HANDLE
user32.MonitorFromWindow.argtypes = [wt.HWND, wt.DWORD]
kernel32.GetTickCount64.restype = ctypes.c_ulonglong
kernel32.OpenProcess.restype = wt.HANDLE
kernel32.QueryFullProcessImageNameW.argtypes = [
    wt.HANDLE, wt.DWORD, wt.LPWSTR, ctypes.POINTER(wt.DWORD)
]

try:
    dwmapi = ctypes.WinDLL("dwmapi")
except Exception:
    dwmapi = None

GWL_EXSTYLE = -20
WS_EX_TOOLWINDOW = 0x00000080
DWMWA_CLOAKED = 14
MONITOR_DEFAULTTONEAREST = 2
MONITORINFOF_PRIMARY = 1

# okna pulpitu i powloki - widoczne zawsze, a nie znacza nic
SKIP_CLASSES = frozenset((
    "Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd",
    "Windows.UI.Core.CoreWindow", "ApplicationManager_DesktopShellWindow",
    "ForegroundStaging", "MultitaskingViewFrame", "XamlExplorerHostIslandWindow",
))

WNDENUMPROC = ctypes.WINFUNCTYPE(wt.BOOL, wt.HWND, wt.LPARAM)
MONITORENUMPROC = ctypes.WINFUNCTYPE(
    wt.BOOL, wt.HANDLE, wt.HDC, ctypes.POINTER(wt.RECT), wt.LPARAM
)


class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", wt.UINT), ("dwTime", wt.DWORD)]


class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", wt.DWORD),
        ("rcMonitor", wt.RECT),
        ("rcWork", wt.RECT),
        ("dwFlags", wt.DWORD),
    ]


# --------------------- pojedyncze okno ---------------------


def window_title(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buf = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buf, length + 1)
    return buf.value


def window_app(hwnd):
    pid = wt.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
    if not handle:
        return ""
    try:
        size = wt.DWORD(1024)
        buf = ctypes.create_unicode_buffer(size.value)
        if kernel32.QueryFullProcessImageNameW(handle, 0, buf, ctypes.byref(size)):
            return os.path.basename(buf.value)
    finally:
        kernel32.CloseHandle(handle)
    return ""


def window_class(hwnd):
    buf = ctypes.create_unicode_buffer(96)
    user32.GetClassNameW(hwnd, buf, 96)
    return buf.value


def window_cloaked(hwnd):
    """Okno "ukryte" przez DWM: zamkniete aplikacje UWP zostaja widoczne dla
    IsWindowVisible, choc na ekranie nie ma po nich sladu."""
    if not dwmapi:
        return False
    val = wt.DWORD(0)
    try:
        ok = dwmapi.DwmGetWindowAttribute(
            wt.HWND(hwnd), wt.DWORD(DWMWA_CLOAKED),
            ctypes.byref(val), ctypes.sizeof(val)
        )
        return ok == 0 and bool(val.value)
    except Exception:
        return False


def foreground_window():
    """Tytul i proces okna na wierzchu. Puste wartosci, gdy brak dostepu."""
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return "", ""
    return window_title(hwnd), window_app(hwnd)


# --------------------- monitory ---------------------


def monitor_map():
    """HMONITOR -> (numer ekranu, czy glowny).

    Numerujemy od lewej do prawej wedlug polozenia, wiec numer ekranu nie
    skacze miedzy odpytaniami ani po przelogowaniu."""
    found = []

    def cb(hmon, hdc, rect, lparam):
        info = MONITORINFO()
        info.cbSize = ctypes.sizeof(MONITORINFO)
        primary = False
        left, top = 0, 0
        if user32.GetMonitorInfoW(hmon, ctypes.byref(info)):
            primary = bool(info.dwFlags & MONITORINFOF_PRIMARY)
            left, top = info.rcMonitor.left, info.rcMonitor.top
        found.append((left, top, int(hmon), primary))
        return True

    try:
        user32.EnumDisplayMonitors(None, None, MONITORENUMPROC(cb), 0)
    except Exception:
        return {}

    found.sort(key=lambda m: (m[0], m[1]))
    return dict((h, (i, prim)) for i, (_, _, h, prim) in enumerate(found))


def screens(limit=6):
    """Po jednym oknie z kazdego monitora - tym, ktore na nim widac.

    EnumWindows chodzi po oknach w kolejnosci Z, od wierzchu w dol, wiec
    pierwsze przyjete okno przypisane do danego ekranu jest tym wiodacym."""
    fg = int(user32.GetForegroundWindow() or 0)
    mons = monitor_map()
    total = max(1, len(mons))
    taken = {}
    out = []

    def cb(hwnd, lparam):
        if len(out) >= min(total, limit):
            return False                       # mamy komplet - dosc chodzenia
        if not user32.IsWindowVisible(hwnd) or user32.IsIconic(hwnd):
            return True
        if user32.GetWindowLongW(hwnd, GWL_EXSTYLE) & WS_EX_TOOLWINDOW:
            return True
        if window_class(hwnd) in SKIP_CLASSES or window_cloaked(hwnd):
            return True

        title = window_title(hwnd)
        if not title.strip():
            return True

        rect = wt.RECT()
        if not user32.GetWindowRect(hwnd, ctypes.byref(rect)):
            return True
        # paski, wysepki i inne drobiazgi to nie jest "to, co widac na ekranie"
        if (rect.right - rect.left) < 260 or (rect.bottom - rect.top) < 180:
            return True

        key = int(user32.MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) or 0)
        if key in taken:
            return True
        taken[key] = True

        index, primary = mons.get(key, (len(mons) + len(out), False))
        out.append({
            "screen": index,
            "primary": primary,
            "fg": int(hwnd) == fg,
            "title": title,
            "app": window_app(hwnd),
        })
        return True

    try:
        user32.EnumWindows(WNDENUMPROC(cb), 0)
    except Exception:
        return []

    out.sort(key=lambda s: s["screen"])
    return out


def idle_seconds():
    """Sekundy od ostatniej aktywnosci myszy lub klawiatury."""
    info = LASTINPUTINFO()
    info.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if not user32.GetLastInputInfo(ctypes.byref(info)):
        return 0.0
    return max(0.0, (kernel32.GetTickCount64() - info.dwTime) / 1000.0)


# ─────────────────────────── serwer HTTP ───────────────────────────


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        # tylko odczyt, tylko petla zwrotna — pozwalamy stronie CHRONOS pytac
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")

        if path in ("", "/now"):
            title, app = foreground_window()
            try:
                shots = screens()
            except Exception:
                shots = []
            self._send({
                "ok": True,
                "title": title,
                "app": app,
                "screens": shots,
                "idle": round(idle_seconds(), 1),
                "ts": int(kernel32.GetTickCount64()),
            })
        elif path == "/health":
            self._send({"ok": True, "agent": "chronos", "version": 1})
        else:
            self._send({"ok": False, "error": "not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, fmt, *args):
        pass  # cisza — jedno zapytanie na sekunde zalaloby konsole


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    if not sys.platform.startswith("win"):
        print("Agent dziala wylacznie na Windows.")
        return 1

    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as err:
        print("Nie mozna zajac portu %d: %s" % (PORT, err))
        print("Prawdopodobnie agent juz dziala w innym oknie.")
        return 1

    title, app = foreground_window()
    print("")
    print("  CHRONOS — agent lokalny")
    print("  ----------------------------------------------")
    print("  Nasluch  : http://%s:%d/now" % (HOST, PORT))
    print("  Widzi    : okno wiodace KAZDEGO monitora, nazwe procesu, bezczynnosc")
    print("  Monitory : %d" % max(1, len(monitor_map())))
    print("  Nie widzi: klawiszy, ekranu, tresci okien")
    print("  Test     : %s | %s" % (app or "-", (title or "-")[:48]))
    print("")
    print("  Wlacz przelacznik AUTO w CHRONOS, aby przypisywac czas regulami.")
    print("  Zatrzymanie: Ctrl+C")
    print("")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Agent zatrzymany.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
