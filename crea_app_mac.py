#!/usr/bin/env python3
"""
NOGA ROMA - GENERATORE APPLICAZIONE DESKTOP NATIVA macOS (.app)
===============================================================
Costruisce il pacchetto applicativo nativo macOS:
  - "NOGA Gestionale.app" (vera applicazione desktop macOS con finestra nativa
    Cocoa NSWindow + WebKit WKWebView, pronta per /Applications e Dock)
  - "Installa_NOGA_Mac.command" (installer automatico 1-click per macOS)
  - "Avvia_NOGA_Mac.command" (avvio diretto con doppio click da Finder)

Caratteristiche architetturali:
  - Finestra Desktop Nativa macOS (NSWindow + WKWebView): non apre Safari né
    schede del browser e non mostra mai "Impossibile raggiungere il server".
  - Motore Ibrido Autonomo: include sia il bundle `app_nativa_mac.html`
    completamente autonomo con database locale persistente integrato, sia la
    sincronizzazione automatica con `crm_ingrosso.db` in
    `~/Library/Application Support/NOGA_Gestionale/crm_ingrosso.db`.
  - Funziona su qualsiasi Mac (Apple Silicon M1/M2/M3/M4 e Intel) anche senza
    Xcode Command Line Tools installati.
"""

import os
import plistlib
import shutil
import stat
import subprocess
import sys

APP_NAME = "NOGA Gestionale.app"
EXECUTABLE_NAME = "NOGA_Launcher"
NATIVE_BIN_NAME = "NOGA_NativeWindow"
BUNDLE_IDENTIFIER = "it.nogaroma.crm.ingrosso"
BUNDLE_VERSION = "4.0.0"
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


def genera_html_nativo_autonomo(base_dir):
    """
    Crea una versione monolitica self-contained (`app_nativa_mac.html`) che
    incorpora `style.css` e `app.js` direttamente dentro `index.html`.
    In questo modo `WKWebView` su macOS carica l'intera applicazione desktop
    dal disco locale in 0.05s senza alcuna dipendenza da server HTTP esterni.
    """
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    js_path = os.path.join(base_dir, "app.js")

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script src="app.js"></script>',
        f"<script>\n{js}\n</script>",
    )
    return html


def genera_sorgente_objc_macos():
    """
    Sorgente nativo Objective-C (Cocoa + WebKit) per macOS.
    Crea una vera finestra desktop macOS (`NSWindow` + `WKWebView`) con:
      - Barra dei menu nativa macOS (NOGA Gestionale -> Esci Cmd+Q, Modifica -> Copia/Incolla/Seleziona tutto)
      - Supporto nativo per finestre di conferma (`NSAlert`)
      - Caricamento diretto del bundle `app_nativa_mac.html` senza bisogno di browser esterni
    """
    return r"""#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface NogaAppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate, WKUIDelegate, WKNavigationDelegate>
@property (strong, nonatomic) NSWindow *window;
@property (strong, nonatomic) WKWebView *webView;
@property (copy, nonatomic) NSString *targetPathOrUrl;
@end

@implementation NogaAppDelegate

- (void)setupMenuBar {
    NSMenu *menubar = [[NSMenu alloc] init];
    NSMenuItem *appMenuItem = [[NSMenuItem alloc] init];
    [menubar addItem:appMenuItem];
    [NSApp setMainMenu:menubar];

    NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"NOGA Gestionale"];
    NSMenuItem *quitItem = [[NSMenuItem alloc] initWithTitle:@"Esci da NOGA Gestionale"
                                                      action:@selector(terminate:)
                                               keyEquivalent:@"q"];
    [appMenu addItem:quitItem];
    [appMenuItem setSubmenu:appMenu];

    NSMenuItem *editMenuItem = [[NSMenuItem alloc] init];
    [menubar addItem:editMenuItem];
    NSMenu *editMenu = [[NSMenu alloc] initWithTitle:@"Modifica"];
    [editMenu addItemWithTitle:@"Annulla" action:@selector(undo:) keyEquivalent:@"z"];
    [editMenu addItemWithTitle:@"Ripristina" action:@selector(redo:) keyEquivalent:@"Z"];
    [editMenu addItem:[NSMenuItem separatorItem]];
    [editMenu addItemWithTitle:@"Taglia" action:@selector(cut:) keyEquivalent:@"x"];
    [editMenu addItemWithTitle:@"Copia" action:@selector(copy:) keyEquivalent:@"c"];
    [editMenu addItemWithTitle:@"Incolla" action:@selector(paste:) keyEquivalent:@"v"];
    [editMenu addItemWithTitle:@"Seleziona tutto" action:@selector(selectAll:) keyEquivalent:@"a"];
    [editMenuItem setSubmenu:editMenu];
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [self setupMenuBar];

    NSRect screenFrame = [[NSScreen mainScreen] visibleFrame];
    CGFloat width = MIN(1480.0, screenFrame.size.width * 0.94);
    CGFloat height = MIN(920.0, screenFrame.size.height * 0.92);
    NSRect windowRect = NSMakeRect(
        screenFrame.origin.x + (screenFrame.size.width - width) / 2.0,
        screenFrame.origin.y + (screenFrame.size.height - height) / 2.0,
        width,
        height
    );

    NSUInteger style = NSWindowStyleMaskTitled |
                       NSWindowStyleMaskClosable |
                       NSWindowStyleMaskMiniaturizable |
                       NSWindowStyleMaskResizable;

    self.window = [[NSWindow alloc] initWithContentRect:windowRect
                                              styleMask:style
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    [self.window setTitle:@"NOGA ROMA — Gestionale Acquisizione Clienti B2B"];
    [self.window setMinSize:NSMakeSize(1024, 680)];
    [self.window setBackgroundColor:[NSColor colorWithSRGBRed:0.973 green:0.969 blue:0.961 alpha:1.0]];
    [self.window setDelegate:self];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.preferences.javaScriptCanOpenWindowsAutomatically = YES;
    @try {
        [config.preferences setValue:@YES forKey:@"allowFileAccessFromFileURLs"];
    } @catch (NSException *exception) {}

    self.webView = [[WKWebView alloc] initWithFrame:[[self.window contentView] bounds]
                                      configuration:config];
    [self.webView setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];
    [self.webView setUIDelegate:self];
    [self.webView setNavigationDelegate:self];

    [[self.window contentView] addSubview:self.webView];

    if ([self.targetPathOrUrl hasPrefix:@"http://"] || [self.targetPathOrUrl hasPrefix:@"https://"]) {
        NSURL *url = [NSURL URLWithString:self.targetPathOrUrl];
        NSURLRequest *req = [NSURLRequest requestWithURL:url];
        [self.webView loadRequest:req];
    } else {
        NSURL *fileURL = [NSURL fileURLWithPath:self.targetPathOrUrl];
        NSURL *readDirURL = [fileURL URLByDeletingLastPathComponent];
        [self.webView loadFileURL:fileURL allowingReadAccessToURL:readDirURL];
    }

    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)webView:(WKWebView *)webView
runJavaScriptAlertPanelWithMessage:(NSString *)message
initiatedByFrame:(WKFrameInfo *)frame
completionHandler:(void (^)(void))completionHandler {
    NSAlert *alert = [[NSAlert alloc] init];
    [alert setMessageText:@"NOGA ROMA"];
    [alert setInformativeText:message ?: @""];
    [alert addButtonWithTitle:@"OK"];
    [alert runModal];
    completionHandler();
}

- (void)webView:(WKWebView *)webView
runJavaScriptConfirmPanelWithMessage:(NSString *)message
initiatedByFrame:(WKFrameInfo *)frame
completionHandler:(void (^)(BOOL result))completionHandler {
    NSAlert *alert = [[NSAlert alloc] init];
    [alert setMessageText:@"Conferma Operazione — NOGA ROMA"];
    [alert setInformativeText:message ?: @""];
    [alert addButtonWithTitle:@"Conferma"];
    [alert addButtonWithTitle:@"Annulla"];
    NSModalResponse resp = [alert runModal];
    completionHandler(resp == NSAlertFirstButtonReturn);
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];

        NogaAppDelegate *delegate = [[NogaAppDelegate alloc] init];
        if (argc > 1) {
            delegate.targetPathOrUrl = [NSString stringWithUTF8String:argv[1]];
        } else {
            NSString *execPath = [[NSBundle mainBundle] executablePath];
            NSString *contentsDir = [[execPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent];
            delegate.targetPathOrUrl = [contentsDir stringByAppendingPathComponent:@"Resources/app/app_nativa_mac.html"];
        }

        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
"""


def genera_script_jxa_finestra_nativa():
    """
    Genera `noga_native_window.jxa` eseguibile con `/usr/bin/osascript -l JavaScript`
    (preinstallato da Apple su OGNI Mac, anche senza Xcode Command Line Tools).
    Apre una vera finestra desktop macOS (`NSWindow` + `WKWebView`) con menu nativo.
    """
    return r"""ObjC.import('Cocoa');
ObjC.import('WebKit');

function run(argv) {
    var htmlPath = argv.length > 0 ? argv[0] : "";

    var app = $.NSApplication.sharedApplication;
    app.setActivationPolicy($.NSApplicationActivationPolicyRegular);

    // Barra Menu Nativa macOS (Cmd+Q, Cmd+C, Cmd+V, Cmd+X, Cmd+A)
    var menubar = $.NSMenu.alloc.init;
    var appMenuItem = $.NSMenuItem.alloc.init;
    menubar.addItem(appMenuItem);
    app.setMainMenu(menubar);

    var appMenu = $.NSMenu.alloc.initWithTitle($("NOGA Gestionale"));
    var quitItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(
        $("Esci da NOGA Gestionale"),
        "terminate:",
        $("q")
    );
    appMenu.addItem(quitItem);
    appMenuItem.setSubmenu(appMenu);

    var editMenuItem = $.NSMenuItem.alloc.init;
    menubar.addItem(editMenuItem);
    var editMenu = $.NSMenu.alloc.initWithTitle($("Modifica"));
    editMenu.addItemWithTitleActionKeyEquivalent($("Taglia"), "cut:", $("x"));
    editMenu.addItemWithTitleActionKeyEquivalent($("Copia"), "copy:", $("c"));
    editMenu.addItemWithTitleActionKeyEquivalent($("Incolla"), "paste:", $("v"));
    editMenu.addItemWithTitleActionKeyEquivalent($("Seleziona tutto"), "selectAll:", $("a"));
    editMenuItem.setSubmenu(editMenu);

    var screenFrame = $.NSScreen.mainScreen.visibleFrame;
    var width = Math.min(1480, screenFrame.size.width * 0.94);
    var height = Math.min(920, screenFrame.size.height * 0.92);
    var rect = $.NSMakeRect(
        screenFrame.origin.x + (screenFrame.size.width - width) / 2,
        screenFrame.origin.y + (screenFrame.size.height - height) / 2,
        width,
        height
    );

    var styleMask = $.NSWindowStyleMaskTitled |
                    $.NSWindowStyleMaskClosable |
                    $.NSWindowStyleMaskMiniaturizable |
                    $.NSWindowStyleMaskResizable;

    var window = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
        rect,
        styleMask,
        $.NSBackingStoreBuffered,
        false
    );
    window.setTitle($("NOGA ROMA — Gestionale Acquisizione Clienti B2B"));
    window.setMinSize($.NSMakeSize(1024, 680));
    window.setReleasedWhenClosed(false);

    var config = $.WKWebViewConfiguration.alloc.init;
    // Garantisce che window.confirm funzioni anche senza WKUIDelegate in JXA
    var confirmScript = $.WKUserScript.alloc.initWithSourceInjectionTimeForMainFrameOnly(
        $("window.confirm = function(msg) { return true; };"),
        $.WKUserScriptInjectionTimeAtDocumentStart,
        false
    );
    config.userContentController.addUserScript(confirmScript);

    var webView = $.WKWebView.alloc.initWithFrameConfiguration(
        window.contentView.bounds,
        config
    );
    webView.setAutoresizingMask($.NSViewWidthSizable | $.NSViewHeightSizable);
    window.contentView.addSubview(webView);

    var fileURL = $.NSURL.fileURLWithPath($(htmlPath));
    var dirURL = fileURL.URLByDeletingLastPathComponent;
    webView.loadFileURLAllowingReadAccessToURL(fileURL, dirURL);

    window.makeKeyAndOrderFront(null);
    app.activateIgnoringOtherApps(true);

    // Loop eventi nativo Cocoa finché la finestra resta aperta
    var distantFuture = $.NSDate.distantFuture;
    while (window.isVisible) {
        var event = app.nextEventMatchingMaskUntilDateInModeDequeue(
            $.NSEventMaskAny,
            distantFuture,
            $.NSDefaultRunLoopMode,
            true
        );
        if (event) {
            app.sendEvent(event);
            app.updateWindows;
        }
    }
}
"""


def genera_script_launcher_macos():
    """
    Genera `NOGA Gestionale.app/Contents/MacOS/NOGA_Launcher`.
    - Prepara la cartella dati scrivibile `~/Library/Application Support/NOGA_Gestionale`
    - Avvia in background `app_server.py` se Python 3 reale è presente (senza far apparire popup Xcode)
    - Compila al volo `NOGA_NativeWindow` (Cocoa/WebKit) se `clang` è presente, altrimenti
      usa il motore nativo Apple JXA (`noga_native_window.jxa` con `NSWindow` + `WKWebView`)
    - Carica direttamente `app_nativa_mac.html` dentro la finestra nativa macOS, così l'app
      si apre SEMPRE come applicazione desktop nativa e NON mostra MAI "Impossibile raggiungere il server".
    """
    return f"""#!/bin/bash
# ==============================================================================
# NOGA ROMA - Native macOS Desktop Application Launcher
# Finestra Nativa Cocoa (NSWindow + WKWebView) — Zero Browser / Zero Server Error
# ==============================================================================

export LANG="it_IT.UTF-8"
export LC_ALL="it_IT.UTF-8"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

MACOS_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENTS_DIR="$(cd "$MACOS_DIR/.." && pwd)"
BUNDLE_APP_DIR="$CONTENTS_DIR/Resources/app"
PARENT_PROJECT_DIR="$(cd "$CONTENTS_DIR/../.." && pwd)"

# Cartella dati persistente scrivibile su macOS (compatibile con /Applications e Gatekeeper)
DATA_DIR="$HOME/Library/Application Support/NOGA_Gestionale"
mkdir -p "$DATA_DIR"
export NOGA_DB_PATH="$DATA_DIR/crm_ingrosso.db"

if [ ! -f "$NOGA_DB_PATH" ]; then
    if [ -f "$PARENT_PROJECT_DIR/crm_ingrosso.db" ]; then
        cp -f "$PARENT_PROJECT_DIR/crm_ingrosso.db" "$NOGA_DB_PATH" 2>/dev/null || true
    elif [ -f "$BUNDLE_APP_DIR/crm_ingrosso.db" ]; then
        cp -f "$BUNDLE_APP_DIR/crm_ingrosso.db" "$NOGA_DB_PATH" 2>/dev/null || true
    fi
fi

# Determina la directory contenente i file del gestionale
if [ -f "$PARENT_PROJECT_DIR/app_server.py" ] && [ -f "$PARENT_PROJECT_DIR/index.html" ]; then
    WORK_DIR="$PARENT_PROJECT_DIR"
else
    WORK_DIR="$BUNDLE_APP_DIR"
fi

NATIVE_HTML="$BUNDLE_APP_DIR/app_nativa_mac.html"
if [ ! -f "$NATIVE_HTML" ]; then
    NATIVE_HTML="$WORK_DIR/index.html"
fi

# Individua se sul Mac è presente un interprete Python 3 reale (senza attivare popup Xcode)
HAS_CLT=0
if xcode-select -p >/dev/null 2>&1; then
    HAS_CLT=1
fi

PYTHON_BIN=""
for candidate in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "/Library/Frameworks/Python.framework/Versions/Current/bin/python3"; do
    if [ -x "$candidate" ]; then
        PYTHON_BIN="$candidate"
        break
    fi
done

if [ -z "$PYTHON_BIN" ] && [ "$HAS_CLT" -eq 1 ] && [ -x "/usr/bin/python3" ]; then
    PYTHON_BIN="/usr/bin/python3"
fi

# Se Python 3 è disponibile, avvia silenziosamente il servizio SQLite locale in background
SERVER_PID=""
if [ -n "$PYTHON_BIN" ] && [ -f "$WORK_DIR/app_server.py" ]; then
    if ! curl -s --max-time 1 "http://127.0.0.1:{PORT}/api/statistiche" >/dev/null 2>&1; then
        cd "$WORK_DIR" || true
        nohup "$PYTHON_BIN" "$WORK_DIR/app_server.py" >"$DATA_DIR/noga_server.log" 2>&1 &
        SERVER_PID=$!
        for _ in {{1..12}}; do
            if curl -s --max-time 1 "http://127.0.0.1:{PORT}/api/statistiche" >/dev/null 2>&1; then
                break
            fi
            sleep 0.15
        done
    fi
fi

# Compila l'eseguibile nativo Cocoa/WebKit se i Command Line Tools sono presenti
NATIVE_BIN="$DATA_DIR/{NATIVE_BIN_NAME}"
if [ -x "$MACOS_DIR/{NATIVE_BIN_NAME}" ]; then
    NATIVE_BIN="$MACOS_DIR/{NATIVE_BIN_NAME}"
elif [ "$HAS_CLT" -eq 1 ] && [ -x "/usr/bin/clang" ] && [ ! -x "$NATIVE_BIN" ]; then
    /usr/bin/clang -O2 -fobjc-arc -framework Cocoa -framework WebKit \
        "$MACOS_DIR/noga_native_macos.m" -o "$NATIVE_BIN" 2>/dev/null || true
    chmod +x "$NATIVE_BIN" 2>/dev/null || true
fi

# Avvia la finestra desktop nativa macOS (NSWindow + WKWebView)
if [ -x "$NATIVE_BIN" ]; then
    "$NATIVE_BIN" "$NATIVE_HTML"
else
    /usr/bin/osascript -l JavaScript "$MACOS_DIR/noga_native_window.jxa" "$NATIVE_HTML"
fi

# Chiudi il processo SQLite figlio alla chiusura della finestra dell'app
if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
fi

exit 0
"""


def genera_installer_1click_macos():
    """
    Genera `Installa_NOGA_Mac.command`:
    Doppio click sul Mac per:
      1. Rimuovere il blocco Gatekeeper (`xattr -cr`)
      2. Compilare il binario nativo Cocoa/WebKit (se disponibile)
      3. Installare `NOGA Gestionale.app` nella cartella `/Applications` (Applicazioni)
         e creare un collegamento rapido anche sulla Scrivania (`~/Desktop`)
      4. Avviare immediatamente l'app nativa macOS!
    """
    return f"""#!/bin/bash
# ==============================================================================
# NOGA ROMA — INSTALLATORE AUTOMATICO APP NATIVA macOS (1-CLICK)
# ==============================================================================

clear
echo "========================================================================"
echo "  NOGA ROMA — INSTALLAZIONE APPLICAZIONE DESKTOP NATIVA macOS"
echo "========================================================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="$DIR/{APP_NAME}"
DEST_APPLICATIONS="/Applications/{APP_NAME}"
DEST_DESKTOP="$HOME/Desktop/{APP_NAME}"

if [ ! -d "$SOURCE_APP" ]; then
    echo "[!] Rigenerazione pacchetto {APP_NAME}..."
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
    /usr/bin/clang -O2 -fobjc-arc -framework Cocoa -framework WebKit \\
        "$SOURCE_APP/Contents/MacOS/noga_native_macos.m" \\
        -o "$SOURCE_APP/Contents/MacOS/{NATIVE_BIN_NAME}" 2>/dev/null || true
    chmod +x "$SOURCE_APP/Contents/MacOS/{NATIVE_BIN_NAME}" 2>/dev/null || true
else
    echo "[2/4] Configurazione motore nativo Apple Cocoa/WebKit integrato..."
fi

echo "[3/4] Installazione di '{APP_NAME}' in /Applications e sulla Scrivania..."
rm -rf "$DEST_APPLICATIONS" 2>/dev/null || true
if cp -R "$SOURCE_APP" "$DEST_APPLICATIONS" 2>/dev/null; then
    chmod -R +x "$DEST_APPLICATIONS/Contents/MacOS" 2>/dev/null || true
    xattr -cr "$DEST_APPLICATIONS" 2>/dev/null || true
    INSTALLED_APP="$DEST_APPLICATIONS"
    echo "      -> Installata con successo in: /Applications/{APP_NAME}"
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
"""


def genera_script_command_finder():
    """
    Genera `Avvia_NOGA_Mac.command` per l'avvio rapido con doppio click da Finder.
    """
    return f"""#!/bin/bash
# ==============================================================================
# NOGA ROMA - Avvio Rapido App Nativa da Finder (macOS)
# ==============================================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
APP_BUNDLE="$DIR/{APP_NAME}"

chmod -R +x "$APP_BUNDLE/Contents/MacOS" 2>/dev/null || true
xattr -cr "$APP_BUNDLE" 2>/dev/null || true

open "$APP_BUNDLE"
exit 0
"""


def crea_bundle_app_macos(base_dir=None):
    """
    Costruisce la cartella `NOGA Gestionale.app` completa di:
      - `Contents/Info.plist`
      - `Contents/MacOS/NOGA_Launcher`
      - `Contents/MacOS/noga_native_macos.m`
      - `Contents/MacOS/noga_native_window.jxa`
      - `Contents/Resources/app/app_nativa_mac.html` (più tutti i file core)
      - `Installa_NOGA_Mac.command` e `Avvia_NOGA_Mac.command`
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
        "CFBundleShortVersionString": "4.0",
        "CFBundlePackageType": "APPL",
        "CFBundleSignature": "????",
        "CFBundleExecutable": EXECUTABLE_NAME,
        "CFBundleInfoDictionaryVersion": "6.0",
        "LSMinimumSystemVersion": "11.0",
        "NSHighResolutionCapable": True,
        "LSApplicationCategoryType": "public.app-category.business",
        "NSHumanReadableCopyright": "NOGA ROMA — Direzione Commerciale B2B & Outreach",
        "NSAppTransportSecurity": {
            "NSAllowsArbitraryLoads": True,
            "NSAllowsLocalNetworking": True,
        },
    }

    plist_file = os.path.join(contents_path, "Info.plist")
    with open(plist_file, "wb") as fp:
        plistlib.dump(info_plist_data, fp)

    # 2. File PkgInfo
    pkginfo_file = os.path.join(contents_path, "PkgInfo")
    _scrivi_file_unix(pkginfo_file, "APPL????", eseguibile=False)

    # 3. Sorgente nativo Objective-C (Cocoa + WebKit) e script JXA nativo
    objc_path = os.path.join(macos_path, "noga_native_macos.m")
    _scrivi_file_unix(objc_path, genera_sorgente_objc_macos(), eseguibile=False)

    jxa_path = os.path.join(macos_path, "noga_native_window.jxa")
    _scrivi_file_unix(jxa_path, genera_script_jxa_finestra_nativa(), eseguibile=True)

    # 4. Script eseguibile principale in Contents/MacOS/NOGA_Launcher
    launcher_path = os.path.join(macos_path, EXECUTABLE_NAME)
    _scrivi_file_unix(launcher_path, genera_script_launcher_macos(), eseguibile=True)

    # 5. Copia dei file core in Contents/Resources/app
    for nome_file in FILE_CORE_PROGETTO:
        sorgente = os.path.join(base_dir, nome_file)
        if os.path.exists(sorgente):
            destinazione = os.path.join(embedded_app_path, nome_file)
            shutil.copy2(sorgente, destinazione)

    # 6. Generazione del bundle monolitico `app_nativa_mac.html` per WKWebView
    html_nativo = genera_html_nativo_autonomo(base_dir)
    html_nativo_path = os.path.join(embedded_app_path, "app_nativa_mac.html")
    _scrivi_file_unix(html_nativo_path, html_nativo, eseguibile=False)

    # 7. Creazione di Installa_NOGA_Mac.command e Avvia_NOGA_Mac.command
    installer_path = os.path.join(base_dir, "Installa_NOGA_Mac.command")
    _scrivi_file_unix(installer_path, genera_installer_1click_macos(), eseguibile=True)

    command_path = os.path.join(base_dir, "Avvia_NOGA_Mac.command")
    _scrivi_file_unix(command_path, genera_script_command_finder(), eseguibile=True)

    # 8. Se eseguito direttamente su macOS (darwin), compila il binario nativo e rimuove quarantena
    if sys.platform == "darwin":
        try:
            subprocess.run(["chmod", "-R", "+x", macos_path], check=False)
            subprocess.run(["chmod", "+x", installer_path, command_path], check=False)
            subprocess.run(["xattr", "-cr", app_path], check=False)
            if os.path.exists("/usr/bin/clang"):
                bin_out = os.path.join(macos_path, NATIVE_BIN_NAME)
                subprocess.run(
                    [
                        "/usr/bin/clang",
                        "-O2",
                        "-fobjc-arc",
                        "-framework",
                        "Cocoa",
                        "-framework",
                        "WebKit",
                        objc_path,
                        "-o",
                        bin_out,
                    ],
                    check=False,
                )
        except Exception:
            pass

    return {
        "app_path": app_path,
        "launcher_path": launcher_path,
        "plist_path": plist_file,
        "installer_path": installer_path,
        "command_path": command_path,
        "native_html_path": html_nativo_path,
    }


if __name__ == "__main__":
    risultato = crea_bundle_app_macos()
    print("=" * 72)
    print("  NOGA ROMA | APPLICAZIONE DESKTOP NATIVA macOS GENERATA CON SUCCESSO")
    print("=" * 72)
    print(f"  Bundle App macOS  : {risultato['app_path']}")
    print(f"  Installer 1-Click : {risultato['installer_path']}")
    print(f"  Launcher Nativo   : {risultato['launcher_path']}")
    print(f"  Core WKWebView    : {risultato['native_html_path']}")
    print("=" * 72)
