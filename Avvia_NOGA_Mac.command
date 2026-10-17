#!/bin/bash
# ==============================================================================
# NOGA ROMA - Avvio Rapido & Auto-Update App Nativa da Finder (macOS)
# ==============================================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
APP_BUNDLE="$DIR/NOGA Gestionale.app"

# Se la cartella è collegata a GitHub, scarica eventuali aggiornamenti senza toccare i dati utente
if [ -d "$DIR/.git" ] && command -v git >/dev/null 2>&1; then
    cd "$DIR" && git pull --ff-only >/dev/null 2>&1 || true
fi

chmod -R +x "$APP_BUNDLE/Contents/MacOS" 2>/dev/null || true
xattr -cr "$APP_BUNDLE" 2>/dev/null || true
/usr/bin/codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || true

open "$APP_BUNDLE" || "$APP_BUNDLE/Contents/MacOS/NOGA_Launcher" &
exit 0
