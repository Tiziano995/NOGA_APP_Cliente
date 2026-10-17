#!/bin/bash
# ==============================================================================
# NOGA ROMA - Avvio Rapido App Nativa da Finder (macOS)
# ==============================================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
APP_BUNDLE="$DIR/NOGA Gestionale.app"

chmod -R +x "$APP_BUNDLE/Contents/MacOS" 2>/dev/null || true
xattr -cr "$APP_BUNDLE" 2>/dev/null || true

open "$APP_BUNDLE"
exit 0
