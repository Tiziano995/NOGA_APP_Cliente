#!/bin/bash
# ==============================================================================
# NOGA ROMA - Avvio Rapido da Finder (macOS)
# ==============================================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -x "$DIR/NOGA Gestionale.app/Contents/MacOS/NOGA_Launcher" ]; then
    "$DIR/NOGA Gestionale.app/Contents/MacOS/NOGA_Launcher"
else
    cd "$DIR" || exit 1
    nohup python3 app_server.py >/tmp/noga_roma_gestionale.log 2>&1 &
    sleep 1
    open "http://127.0.0.1:8080/index.html"
fi
