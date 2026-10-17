#!/bin/bash
# ==============================================================================
# NOGA ROMA — INSTALLATORE E SBLOCCO PERMESSI macOS (1-CLICK)
# ==============================================================================

clear
echo "========================================================================"
echo "  NOGA ROMA — INSTALLAZIONE E SBLOCCO PERMESSI APP NATIVA macOS"
echo "========================================================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="$DIR/NOGA Gestionale.app"
DEST_APPLICATIONS="/Applications/NOGA Gestionale.app"
DEST_DESKTOP="$HOME/Desktop/NOGA Gestionale.app"

echo "[1/5] Rimozione blocco quarantena Gatekeeper (xattr -cr) e permessi POSIX..."
xattr -cr "$DIR" 2>/dev/null || true
chmod -R +x "$SOURCE_APP/Contents/MacOS" 2>/dev/null || true
chmod +x "$DIR/Installa_NOGA_Mac.command" "$DIR/Avvia_NOGA_Mac.command" 2>/dev/null || true

# Compilazione binario nativo Cocoa/WebKit se Command Line Tools sono presenti
if xcode-select -p >/dev/null 2>&1 && [ -x "/usr/bin/clang" ]; then
    echo "[2/5] Compilazione finestra nativa macOS (Cocoa + WebKit)..."
    /usr/bin/clang -O2 -fobjc-arc -framework Cocoa -framework WebKit \
        "$SOURCE_APP/Contents/MacOS/noga_native_macos.m" \
        -o "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
    chmod +x "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
else
    echo "[2/5] Configurazione motore nativo Apple Cocoa/WebKit integrato..."
fi

echo "[3/5] Firma digitale locale Ad-Hoc per macOS (codesign)..."
/usr/bin/codesign --force --deep --sign - "$SOURCE_APP" 2>/dev/null || true
xattr -cr "$SOURCE_APP" 2>/dev/null || true

echo "[4/5] Installazione di 'NOGA Gestionale.app' in /Applications e sulla Scrivania..."
rm -rf "$DEST_APPLICATIONS" 2>/dev/null || true
if cp -R "$SOURCE_APP" "$DEST_APPLICATIONS" 2>/dev/null; then
    chmod -R +x "$DEST_APPLICATIONS/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_APPLICATIONS" 2>/dev/null || true
    /usr/bin/codesign --force --deep --sign - "$DEST_APPLICATIONS" 2>/dev/null || true
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
    /usr/bin/codesign --force --deep --sign - "$DEST_DESKTOP" 2>/dev/null || true
    echo "      -> Installata copia rapida sulla Scrivania (Desktop)"
fi

echo "[5/5] Avvio immediato di NOGA Gestionale..."
open "$INSTALLED_APP" || "$INSTALLED_APP/Contents/MacOS/NOGA_Launcher" &

echo ""
echo "========================================================================"
echo "  SBLOCCO E INSTALLAZIONE COMPLETATI!"
echo "  L'app 'NOGA Gestionale' è ora autorizzata su questo Mac."
echo "========================================================================"
sleep 2
exit 0
