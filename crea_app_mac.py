#!/usr/bin/env python3
"""
NOGA ROMA - GENERATORE BUNDLE NATIVO macOS (.app)
=================================================
Crea automaticamente l'applicazione desktop nativa per macOS:
  - "NOGA Gestionale.app" (pronta per il Dock e per la cartella /Applications)
  - "Avvia_NOGA_Mac.command" (script rapido doppio-click da Finder)

Caratteristiche architetturali:
  - Zero dipendenze esterne (usa esclusivamente la Python Standard Library:
    os, sys, stat, shutil, plistlib, subprocess).
  - Include nel bundle `Contents/Resources/app` una copia completa dei file del
    gestionale e mantiene il collegamento diretto alla cartella di lavoro locale,
    così l'app funziona sia lasciata nella cartella progetto, sia spostata in
    `/Applications` o trascinata nel Dock del Mac.
  - Avvia silenziosamente `app_server.py` su `127.0.0.1:8080` in background
    e apre una finestra dedicata nativa (`--app=http://127.0.0.1:8080/index.html`)
    senza barra degli indirizzi (o in Safari se non è presente un browser Chromium).
"""

import os
import plistlib
import shutil
import stat
import subprocess
import sys

APP_NAME = "NOGA Gestionale.app"
EXECUTABLE_NAME = "NOGA_Launcher"
BUNDLE_IDENTIFIER = "it.nogaroma.crm.ingrosso"
BUNDLE_VERSION = "3.0.0"
PORT = 8080

FILE_CORE_PROGETTO = [
    "main.py",
    "agenda_funzioni.py",
    "app_server.py",
    "index.html",
    "style.css",
    "app.js",
    "contatti_lead.json",
    "crm_ingrosso.db",
]


def _scrivi_file_unix(percorso, contenuto_testo, eseguibile=False):
    """
    Scrive un file con terminatori di riga rigorosamente Unix (LF, '\\n')
    e imposta i permessi di esecuzione POSIX (chmod 755) se richiesto.
    """
    contenuto_lf = contenuto_testo.replace("\r\n", "\n").replace("\r", "\n")
    with open(percorso, "wb") as f:
        f.write(contenuto_lf.encode("utf-8"))

    if eseguibile:
        permessi = (
            stat.S_IRWXU
            | stat.S_IRGRP
            | stat.S_IXGRP
            | stat.S_IROTH
            | stat.S_IXOTH
        )
        os.chmod(percorso, permessi)


def genera_script_launcher_macos(project_dir_assoluto):
    """
    Genera lo script Bash nativo macOS inserito in:
    `NOGA Gestionale.app/Contents/MacOS/NOGA_Launcher`
    """
    return f"""#!/bin/bash
# ==============================================================================
# NOGA ROMA - macOS Native App Launcher
# Avvia silenziosamente il server SQLite locale su 127.0.0.1:{PORT}
# e apre la finestra dedicata del Gestionale B2B.
# ==============================================================================

export LANG="it_IT.UTF-8"
export LC_ALL="it_IT.UTF-8"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

MACOS_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENTS_DIR="$(cd "$MACOS_DIR/.." && pwd)"
BUNDLE_APP_DIR="$CONTENTS_DIR/Resources/app"
PARENT_PROJECT_DIR="$(cd "$CONTENTS_DIR/../.." && pwd)"
CONFIGURED_PROJECT_DIR="{project_dir_assoluto}"

# Determina la cartella di lavoro contenente app_server.py e crm_ingrosso.db:
# 1. Cartella padre del bundle .app (se l'app si trova dentro la cartella progetto)
# 2. Percorso progetto originario sul Mac
# 3. Copia autonoma interna al bundle (Contents/Resources/app) se spostata in /Applications
if [ -f "$PARENT_PROJECT_DIR/app_server.py" ]; then
    WORK_DIR="$PARENT_PROJECT_DIR"
elif [ -f "$CONFIGURED_PROJECT_DIR/app_server.py" ]; then
    WORK_DIR="$CONFIGURED_PROJECT_DIR"
else
    WORK_DIR="$BUNDLE_APP_DIR"
fi

cd "$WORK_DIR" || exit 1

# Individua l'interprete Python 3 sul Mac
PYTHON_BIN=""
for candidate in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "/usr/bin/python3" "$(command -v python3)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
        PYTHON_BIN="$candidate"
        break
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    osascript -e 'display alert "Python 3 non trovato" message "Per eseguire NOGA Gestionale su macOS è necessario Python 3 (/usr/bin/python3 o Homebrew)." as critical'
    exit 1
fi

URL_APP="http://127.0.0.1:{PORT}/index.html"
URL_HEALTH="http://127.0.0.1:{PORT}/api/statistiche"
LOG_FILE="/tmp/noga_roma_gestionale.log"

# Verifica se il server NOGA ROMA è già attivo sulla porta {PORT}
if ! curl -s --max-time 1 "$URL_HEALTH" >/dev/null 2>&1; then
    nohup "$PYTHON_BIN" "$WORK_DIR/app_server.py" >"$LOG_FILE" 2>&1 &
    SERVER_PID=$!

    # Attendi fino a 5 secondi che il server SQLite risponda
    for _ in {{1..25}}; do
        if curl -s --max-time 1 "$URL_HEALTH" >/dev/null 2>&1; then
            break
        fi
        sleep 0.2
    done
fi

# Apertura finestra dedicata nativa su macOS (senza barra indirizzi se Chrome/Brave/Edge è presente, altrimenti Safari/default)
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="$URL_APP" --window-size=1440,920
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -na "Brave Browser" --args --app="$URL_APP" --window-size=1440,920
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args --app="$URL_APP" --window-size=1440,920
else
    open "$URL_APP"
fi

exit 0
"""


def genera_script_command_finder():
    """
    Genera `Avvia_NOGA_Mac.command` per l'avvio rapido con doppio click da Finder.
    """
    return f"""#!/bin/bash
# ==============================================================================
# NOGA ROMA - Avvio Rapido da Finder (macOS)
# ==============================================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -x "$DIR/{APP_NAME}/Contents/MacOS/{EXECUTABLE_NAME}" ]; then
    "$DIR/{APP_NAME}/Contents/MacOS/{EXECUTABLE_NAME}"
else
    cd "$DIR" || exit 1
    nohup python3 app_server.py >/tmp/noga_roma_gestionale.log 2>&1 &
    sleep 1
    open "http://127.0.0.1:{PORT}/index.html"
fi
"""


def crea_bundle_app_macos(base_dir=None):
    """
    Costruisce la cartella `NOGA Gestionale.app` completa di `Contents/Info.plist`,
    `Contents/MacOS/NOGA_Launcher`, `Contents/PkgInfo` e `Contents/Resources/app`.
    """
    if base_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    app_path = os.path.join(base_dir, APP_NAME)
    contents_path = os.path.join(app_path, "Contents")
    macos_path = os.path.join(contents_path, "MacOS")
    resources_path = os.path.join(contents_path, "Resources")
    embedded_app_path = os.path.join(resources_path, "app")

    os.makedirs(macos_path, exist_ok=True)
    os.makedirs(embedded_app_path, exist_ok=True)

    # 1. Generazione Info.plist standard Apple
    info_plist_data = {
        "CFBundleName": "NOGA Gestionale",
        "CFBundleDisplayName": "NOGA Gestionale",
        "CFBundleIdentifier": BUNDLE_IDENTIFIER,
        "CFBundleVersion": BUNDLE_VERSION,
        "CFBundleShortVersionString": "3.0",
        "CFBundlePackageType": "APPL",
        "CFBundleSignature": "????",
        "CFBundleExecutable": EXECUTABLE_NAME,
        "CFBundleInfoDictionaryVersion": "6.0",
        "LSMinimumSystemVersion": "11.0",
        "NSHighResolutionCapable": True,
        "LSApplicationCategoryType": "public.app-category.business",
        "NSHumanReadableCopyright": "NOGA ROMA — Direzione Commerciale B2B & Outreach",
    }

    plist_file = os.path.join(contents_path, "Info.plist")
    with open(plist_file, "wb") as fp:
        plistlib.dump(info_plist_data, fp)

    # 2. File PkgInfo
    pkginfo_file = os.path.join(contents_path, "PkgInfo")
    _scrivi_file_unix(pkginfo_file, "APPL????", eseguibile=False)

    # 3. Script eseguibile principale in Contents/MacOS/NOGA_Launcher
    launcher_path = os.path.join(macos_path, EXECUTABLE_NAME)
    script_launcher = genera_script_launcher_macos(base_dir.replace("\\", "/"))
    _scrivi_file_unix(launcher_path, script_launcher, eseguibile=True)

    # 4. Copia dei file core in Contents/Resources/app per rendere il .app autonomo
    for nome_file in FILE_CORE_PROGETTO:
        sorgente = os.path.join(base_dir, nome_file)
        if os.path.exists(sorgente):
            destinazione = os.path.join(embedded_app_path, nome_file)
            shutil.copy2(sorgente, destinazione)

    # 5. Creazione di Avvia_NOGA_Mac.command nella cartella principale
    command_path = os.path.join(base_dir, "Avvia_NOGA_Mac.command")
    _scrivi_file_unix(command_path, genera_script_command_finder(), eseguibile=True)

    # 6. Se eseguito direttamente su macOS (darwin), rimuove la quarantena Gatekeeper
    if sys.platform == "darwin":
        try:
            subprocess.run(["chmod", "-R", "+x", macos_path], check=False)
            subprocess.run(["chmod", "+x", command_path], check=False)
            subprocess.run(["xattr", "-cr", app_path], check=False)
        except Exception:
            pass

    return {
        "app_path": app_path,
        "launcher_path": launcher_path,
        "plist_path": plist_file,
        "command_path": command_path,
    }


if __name__ == "__main__":
    risultato = crea_bundle_app_macos()
    print("=" * 72)
    print("  NOGA ROMA | PACCHETTO NATIVO macOS GENERATO CON SUCCESSO")
    print("=" * 72)
    print(f"  Bundle App macOS : {risultato['app_path']}")
    print(f"  Info.plist       : {risultato['plist_path']}")
    print(f"  Launcher         : {risultato['launcher_path']}")
    print(f"  Finder Command   : {risultato['command_path']}")
    print("-" * 72)
    print("  ISTRUZIONI PER IL MAC DEL COMMITTENTE:")
    print("  1. Trascina 'NOGA Gestionale.app' direttamente nel Dock di macOS")
    print("     oppure nella cartella /Applicazioni.")
    print("  2. Clicca sull'icona nel Dock per avviare il server locale privato")
    print("     (127.0.0.1:8080) e aprire la finestra nativa del gestionale.")
    print("=" * 72)
