#!/bin/bash
# ==============================================================================
# NOGA ROMA — INSTALLATORE AUTOMATICO APP NATIVA macOS (1-CLICK)
# ==============================================================================

clear
echo "========================================================================"
echo "  NOGA ROMA — INSTALLAZIONE APPLICAZIONE DESKTOP NATIVA macOS"
echo "========================================================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="$DIR/NOGA Gestionale.app"
DEST_APPLICATIONS="/Applications/NOGA Gestionale.app"
DEST_DESKTOP="$HOME/Desktop/NOGA Gestionale.app"

if [ ! -d "$SOURCE_APP" ]; then
    echo "[!] Rigenerazione pacchetto NOGA Gestionale.app..."
    if command -v python3 >/dev/null 2>&1; then
        python3 "$DIR/crea_app_mac.py"
    fi
fi

echo "[1/4] Configurazione permessi POSIX e rimozione quarantena Apple Gatekeeper..."
chmod -R +x "$SOURCE_APP/Contents/MacOS" 2>/dev/null || true
xattr -cr "$SOURCE_APP" 2>/dev/null || true

# Se Xcode Command Line Tools sono presenti, pre-compila il binario nativo Cocoa/WebKit dentro il bundle
if xcode-select -p >/dev/null 2>&1 && [ -x "/usr/bin/clang" ]; then
    echo "[2/4] Compilazione finestra nativa macOS (Cocoa + WebKit)..."
    /usr/bin/clang -O2 -fobjc-arc -framework Cocoa -framework WebKit \
        "$SOURCE_APP/Contents/MacOS/noga_native_macos.m" \
        -o "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
    chmod +x "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
else
    echo "[2/4] Configurazione motore nativo Apple Cocoa/WebKit integrato..."
fi

echo "[3/4] Installazione di 'NOGA Gestionale.app' in /Applications e sulla Scrivania..."
rm -rf "$DEST_APPLICATIONS" 2>/dev/null || true
if cp -R "$SOURCE_APP" "$DEST_APPLICATIONS" 2>/dev/null; then
    chmod -R +x "$DEST_APPLICATIONS/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_APPLICATIONS" 2>/dev/null || true
    INSTALLED_APP="$DEST_APPLICATIONS"
    echo "      -> Installata con successo in: /Applications/NOGA Gestionale.app"
else
    INSTALLED_APP="$SOURCE_APP"
fi

if [ -d "$HOME/Desktop" ]; then
    rm -rf "$DEST_DESKTOP" 2>/dev/null || true
    cp -R "$SOURCE_APP" "$DEST_DESKTOP" 2>/dev/null || true
    chmod -R +x "$DEST_DESKTOP/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_DESKTOP" 2>/dev/null || true
    echo "      -> Copia rapida creata sulla Scrivania (Desktop)"
fi

echo "[4/4] Avvio immediato di NOGA Gestionale..."
open "$INSTALLED_APP"

echo ""
echo "========================================================================"
echo "  INSTALLAZIONE COMPLETATA!"
echo "  Ora puoi aprire 'NOGA Gestionale' dal Launchpad, dalla cartella"
echo "  Applicazioni o trascinarla nel Dock del tuo Mac."
echo "========================================================================"
sleep 2
exit 0
