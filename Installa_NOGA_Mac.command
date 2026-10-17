#!/bin/bash
# ==============================================================================
# NOGA ROMA — INSTALLATORE & AGGIORNATORE AUTOMATICO macOS (1-CLICK)
# Aggiorna l'app preservando al 100% tutti i contatti, ordini e appuntamenti
# ==============================================================================

clear
echo "========================================================================"
echo "  NOGA ROMA — INSTALLAZIONE / AGGIORNAMENTO APP NATIVA macOS"
echo "========================================================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="$DIR/NOGA Gestionale.app"
DEST_APPLICATIONS="/Applications/NOGA Gestionale.app"
DEST_DESKTOP="$HOME/Desktop/NOGA Gestionale.app"
DATA_DIR="$HOME/Library/Application Support/NOGA_Gestionale"
mkdir -p "$DATA_DIR"

# 1. Aggiornamento automatico da GitHub (se cartella Git)
if [ -d "$DIR/.git" ] && command -v git >/dev/null 2>&1; then
    echo "[1/5] Verifica aggiornamenti automatici da GitHub..."
    cd "$DIR" && git pull --ff-only 2>/dev/null || true
else
    echo "[1/5] Verifica pacchetto applicativo locale..."
fi

echo "      (I tuoi dati in '$DATA_DIR' sono protetti e non verranno toccati)"

echo "[2/5] Rimozione blocco quarantena Gatekeeper (xattr -cr) e permessi POSIX..."
xattr -cr "$DIR" 2>/dev/null || true
chmod -R +x "$SOURCE_APP/Contents/MacOS" 2>/dev/null || true
chmod +x "$DIR/Installa_NOGA_Mac.command" "$DIR/Avvia_NOGA_Mac.command" 2>/dev/null || true

# Compilazione binario nativo Cocoa/WebKit se Command Line Tools sono presenti
if xcode-select -p >/dev/null 2>&1 && [ -x "/usr/bin/clang" ]; then
    echo "[3/5] Compilazione finestra nativa macOS (Cocoa + WebKit)..."
    /usr/bin/clang -O2 -fobjc-arc -framework Cocoa -framework WebKit \
        "$SOURCE_APP/Contents/MacOS/noga_native_macos.m" \
        -o "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
    chmod +x "$SOURCE_APP/Contents/MacOS/NOGA_NativeWindow" 2>/dev/null || true
else
    echo "[3/5] Configurazione motore nativo Apple Cocoa/WebKit integrato..."
fi

echo "[4/5] Applicazione icona 'NA' NOGA ROMA, firma digitale (codesign) e installazione..."
/usr/bin/codesign --force --deep --sign - "$SOURCE_APP" 2>/dev/null || true
xattr -cr "$SOURCE_APP" 2>/dev/null || true

rm -rf "$DEST_APPLICATIONS" 2>/dev/null || true
if cp -R "$SOURCE_APP" "$DEST_APPLICATIONS" 2>/dev/null; then
    chmod -R +x "$DEST_APPLICATIONS/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_APPLICATIONS" 2>/dev/null || true
    /usr/bin/codesign --force --deep --sign - "$DEST_APPLICATIONS" 2>/dev/null || true
    INSTALLED_APP="$DEST_APPLICATIONS"
    echo "      -> Installata/Aggiornata in: /Applications/NOGA Gestionale.app"
else
    INSTALLED_APP="$SOURCE_APP"
fi

if [ -d "$HOME/Desktop" ]; then
    rm -rf "$DEST_DESKTOP" 2>/dev/null || true
    cp -R "$SOURCE_APP" "$DEST_DESKTOP" 2>/dev/null || true
    chmod -R +x "$DEST_DESKTOP/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_DESKTOP" 2>/dev/null || true
    /usr/bin/codesign --force --deep --sign - "$DEST_DESKTOP" 2>/dev/null || true
    echo "      -> Aggiornata copia rapida sulla Scrivania (Desktop)"
fi

# Applica l'icona "NA" NOGA ROMA tramite Cocoa NSWorkspace per aggiornamento visivo istantaneo nel Finder
/usr/bin/osascript -l JavaScript -e '
ObjC.import("Cocoa");
var ws = $.NSWorkspace.sharedWorkspace;
var icns = "'"$SOURCE_APP"'/Contents/Resources/AppIcon.icns";
var img = $.NSImage.alloc.initWithContentsOfFile($(icns));
if (img) {
    ws.setIconForFileOptions(img, $("'"$SOURCE_APP"'"), 0);
    ws.setIconForFileOptions(img, $("'"$DEST_APPLICATIONS"'"), 0);
    ws.setIconForFileOptions(img, $("'"$DEST_DESKTOP"'"), 0);
}
' 2>/dev/null || true

touch "$SOURCE_APP" "$DEST_APPLICATIONS" "$DEST_DESKTOP" 2>/dev/null || true

echo "[5/5] Avvio immediato di NOGA Gestionale..."
open "$INSTALLED_APP" || "$INSTALLED_APP/Contents/MacOS/NOGA_Launcher" &

echo ""
echo "========================================================================"
echo "  INSTALLAZIONE E AGGIORNAMENTO COMPLETATI!"
echo "  Tutti i tuoi inserimenti (contatti, ordini, calendario) sono intatti."
echo "========================================================================"
sleep 2
exit 0
